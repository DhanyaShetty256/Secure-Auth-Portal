const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const db = require("./database/db");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy when deployed
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
    session({
        store: new SQLiteStore({
            db: "sessions.db",
            dir: path.join(__dirname, "database")
        }),
        secret:
            process.env.SESSION_SECRET ||
            "development-secret-change-this-in-production",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        }
    })
);

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name) {
    return typeof name === "string" && name.trim().length >= 2;
}

function isValidPassword(password) {
    return typeof password === "string" && password.length >= 8;
}

// Remove sensitive fields before sending user data as JSON
function sanitizeUser(user) {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
    };
}

/* =========================================================
   WEB ROUTES - EXISTING AUTHENTICATION SYSTEM
========================================================= */

// Home
app.get("/", (req, res) => {
    res.send("Secure Auth Portal is running!");
});

// Register page
app.get("/register", (req, res) => {
    res.render("register");
});

// Register user
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.render("register", {
                error: "All fields are required."
            });
        }

        if (!isValidName(name)) {
            return res.render("register", {
                error: "Name must contain at least 2 characters."
            });
        }

        if (!isValidEmail(email)) {
            return res.render("register", {
                error: "Please enter a valid email address."
            });
        }

        if (!isValidPassword(password)) {
            return res.render("register", {
                error: "Password must be at least 8 characters long."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(normalizedEmail);

        if (existingUser) {
            return res.render("register", {
                error: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `).run(name.trim(), normalizedEmail, hashedPassword);

        res.redirect("/login");
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).render("register", {
            error: "Something went wrong. Please try again."
        });
    }
});

// Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render("login", {
                error: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = db
            .prepare("SELECT * FROM users WHERE email = ?")
            .get(normalizedEmail);

        if (!user) {
            return res.render("login", {
                error: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.render("login", {
                error: "Invalid email or password."
            });
        }

        req.session.userId = user.id;

        res.redirect("/dashboard");
    } catch (error) {
        console.error("Login error:", error);

        res.status(500).render("login", {
            error: "Something went wrong. Please try again."
        });
    }
});

// Dashboard
app.get("/dashboard", (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect("/login");
        }

        const user = db
            .prepare(`
                SELECT id, name, email, created_at
                FROM users
                WHERE id = ?
            `)
            .get(req.session.userId);

        if (!user) {
            req.session.destroy(() => { });
            return res.redirect("/login");
        }

        const createdAtIST = new Date(user.created_at).toLocaleString(
            "en-IN",
            {
                timeZone: "Asia/Kolkata"
            }
        );

        res.render("dashboard", {
            user,
            createdAtIST
        });
    } catch (error) {
        console.error("Dashboard error:", error);

        res.status(500).send("Something went wrong.");
    }
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);
            return res.status(500).send("Unable to logout.");
        }

        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

// Forgot password page
app.get("/forgot-password", (req, res) => {
    res.render("forgot-password");
});

// Forgot password
app.post("/forgot-password", (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.render("forgot-password", {
                error: "Please enter a valid email address."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(normalizedEmail);

        // Generic response to avoid account enumeration
        if (!user) {
            return res.render("forgot-password", {
                success:
                    "If an account exists for this email, a password reset link has been generated."
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpires = Date.now() + 15 * 60 * 1000;

        db.prepare(`
            UPDATE users
            SET reset_token = ?, reset_token_expires = ?
            WHERE id = ?
        `).run(resetToken, resetTokenExpires, user.id);

        const baseUrl =
            process.env.BASE_URL || `http://localhost:${PORT}`;

        const resetLink = `${baseUrl}/reset-password/${resetToken}`;

        console.log("Password reset link:", resetLink);

        res.render("forgot-password", {
            success:
                "If an account exists for this email, a password reset link has been generated."
        });
    } catch (error) {
        console.error("Forgot password error:", error);

        res.status(500).render("forgot-password", {
            error: "Something went wrong. Please try again."
        });
    }
});

// Reset password page
app.get("/reset-password/:token", (req, res) => {
    try {
        const { token } = req.params;

        const user = db
            .prepare(`
                SELECT id
                FROM users
                WHERE reset_token = ?
                AND reset_token_expires > ?
            `)
            .get(token, Date.now());

        if (!user) {
            return res.status(400).send("Invalid or expired reset token.");
        }

        res.render("reset-password", {
            token
        });
    } catch (error) {
        console.error("Reset password page error:", error);

        res.status(500).send("Something went wrong.");
    }
});

// Reset password
app.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            return res.render("reset-password", {
                token,
                error: "Both password fields are required."
            });
        }

        if (!isValidPassword(password)) {
            return res.render("reset-password", {
                token,
                error: "Password must be at least 8 characters long."
            });
        }

        if (password !== confirmPassword) {
            return res.render("reset-password", {
                token,
                error: "Passwords do not match."
            });
        }

        const user = db
            .prepare(`
                SELECT id
                FROM users
                WHERE reset_token = ?
                AND reset_token_expires > ?
            `)
            .get(token, Date.now());

        if (!user) {
            return res.status(400).send("Invalid or expired reset token.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.prepare(`
            UPDATE users
            SET password = ?,
                reset_token = NULL,
                reset_token_expires = NULL
            WHERE id = ?
        `).run(hashedPassword, user.id);

        res.redirect("/login");
    } catch (error) {
        console.error("Reset password error:", error);

        res.status(500).send("Something went wrong.");
    }
});

/* =========================================================
   REST API - CRUD OPERATIONS
========================================================= */

/*
   GET /api/users
   Get all users
*/
app.get("/api/users", (req, res) => {
    try {
        const users = db
            .prepare(`
                SELECT id, name, email, created_at
                FROM users
                ORDER BY id DESC
            `)
            .all();

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error("GET /api/users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve users."
        });
    }
});

/*
   GET /api/users/:id
   Get one user
*/
app.get("/api/users/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "User ID must be a positive integer."
            });
        }

        const user = db
            .prepare(`
                SELECT id, name, email, created_at
                FROM users
                WHERE id = ?
            `)
            .get(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("GET /api/users/:id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve user."
        });
    }
});

/*
   POST /api/users
   Create a new user
*/
app.post("/api/users", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required."
            });
        }

        if (!isValidName(name)) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 2 characters."
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check duplicate email
        const existingUser = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = db
            .prepare(`
                INSERT INTO users (name, email, password)
                VALUES (?, ?, ?)
            `)
            .run(name.trim(), normalizedEmail, hashedPassword);

        const newUser = db
            .prepare(`
                SELECT id, name, email, created_at
                FROM users
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: "User created successfully.",
            data: newUser
        });
    } catch (error) {
        console.error("POST /api/users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create user."
        });
    }
});

/*
   PUT /api/users/:id
   Update an existing user
*/
app.put("/api/users/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, email, password } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "User ID must be a positive integer."
            });
        }

        // Check if user exists
        const existingUser = db
            .prepare("SELECT * FROM users WHERE id = ?")
            .get(id);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Validate supplied fields
        if (name !== undefined && !isValidName(name)) {
            return res.status(400).json({
                success: false,
                message: "Name must contain at least 2 characters."
            });
        }

        if (email !== undefined && !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        if (password !== undefined && !isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long."
            });
        }

        const updatedName =
            name !== undefined ? name.trim() : existingUser.name;

        const updatedEmail =
            email !== undefined
                ? email.trim().toLowerCase()
                : existingUser.email;

        // Check duplicate email
        if (updatedEmail !== existingUser.email) {
            const duplicateEmail = db
                .prepare(`
                    SELECT id
                    FROM users
                    WHERE email = ?
                    AND id != ?
                `)
                .get(updatedEmail, id);

            if (duplicateEmail) {
                return res.status(409).json({
                    success: false,
                    message: "A user with this email already exists."
                });
            }
        }

        let updatedPassword = existingUser.password;

        if (password !== undefined) {
            updatedPassword = await bcrypt.hash(password, 10);
        }

        db.prepare(`
            UPDATE users
            SET name = ?,
                email = ?,
                password = ?
            WHERE id = ?
        `).run(
            updatedName,
            updatedEmail,
            updatedPassword,
            id
        );

        const updatedUser = db
            .prepare(`
                SELECT id, name, email, created_at
                FROM users
                WHERE id = ?
            `)
            .get(id);

        res.status(200).json({
            success: true,
            message: "User updated successfully.",
            data: updatedUser
        });
    } catch (error) {
        console.error("PUT /api/users/:id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update user."
        });
    }
});

/*
   DELETE /api/users/:id
   Delete a user
*/
app.delete("/api/users/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "User ID must be a positive integer."
            });
        }

        const existingUser = db
            .prepare("SELECT id FROM users WHERE id = ?")
            .get(id);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        db.prepare("DELETE FROM users WHERE id = ?").run(id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully."
        });
    } catch (error) {
        console.error("DELETE /api/users/:id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete user."
        });
    }
});

/* =========================================================
   404 HANDLER FOR API ROUTES
========================================================= */

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
    console.log(`Secure Auth Portal running on http://localhost:${PORT}`);
});