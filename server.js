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

// Trust Render's proxy
app.set("trust proxy", 1);

// ===============================
// VIEW ENGINE
// ===============================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===============================
// MIDDLEWARE
// ===============================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// SESSION CONFIGURATION
// ===============================

app.use(
    session({
        store: new SQLiteStore({
            db: "sessions.db",
            dir: "./database"
        }),
        secret:
            process.env.SESSION_SECRET ||
            "development-secret-change-this",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60
        }
    })
);

// ===============================
// HOME ROUTE
// ===============================

app.get("/", (req, res) => {
    res.send("Secure Auth Portal is running!");
});

// ===============================
// REGISTER
// ===============================

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.render("register", {
                error: "All fields are required."
            });
        }

        if (name.trim().length < 3) {
            return res.render("register", {
                error: "Name must be at least 3 characters long."
            });
        }

        if (password.length < 8) {
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

        const hashedPassword = await bcrypt.hash(password, 12);

        db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `).run(
            name.trim(),
            normalizedEmail,
            hashedPassword
        );

        res.redirect("/login");

    } catch (error) {
        console.error("Registration error:", error);

        res.render("register", {
            error: "Something went wrong. Please try again."
        });
    }
});

// ===============================
// LOGIN
// ===============================

app.get("/login", (req, res) => {
    res.render("login");
});

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

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.render("login", {
                error: "Invalid email or password."
            });
        }

        req.session.userId = user.id;

        res.redirect("/dashboard");

    } catch (error) {
        console.error("Login error:", error);

        res.render("login", {
            error: "Something went wrong. Please try again."
        });
    }
});

// ===============================
// PROTECTED DASHBOARD
// ===============================

app.get("/dashboard", (req, res) => {

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
        req.session.destroy(() => {
            res.redirect("/login");
        });

        return;
    }

    // Convert database UTC time to Indian Standard Time
    const createdAtIST = new Date(
        user.created_at + " UTC"
    ).toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    );

    res.render("dashboard", {
        user,
        createdAtIST
    });
});

// ===============================
// LOGOUT
// ===============================

app.get("/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {
            console.error("Logout error:", error);

            return res.status(500).send(
                "Unable to logout."
            );
        }

        res.clearCookie("connect.sid");

        res.redirect("/login");
    });
});

// ===============================
// FORGOT PASSWORD
// ===============================

app.get("/forgot-password", (req, res) => {
    res.render("forgot-password");
});

app.post("/forgot-password", (req, res) => {

    try {
        const { email } = req.body;

        if (!email) {
            return res.render("forgot-password", {
                error: "Email address is required."
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const user = db
            .prepare(
                "SELECT id, email FROM users WHERE email = ?"
            )
            .get(normalizedEmail);

        if (user) {

            // Generate secure random reset token
            const resetToken = crypto
                .randomBytes(32)
                .toString("hex");

            // Token expires after 15 minutes
            const expiresAt =
                Date.now() + 15 * 60 * 1000;

            // Save token in database
            db.prepare(`
                UPDATE users
                SET reset_token = ?,
                    reset_token_expires = ?
                WHERE id = ?
            `).run(
                resetToken,
                expiresAt,
                user.id
            );

            // Use BASE_URL from environment variables
            const baseUrl =
                process.env.BASE_URL ||
                `http://localhost:${PORT}`;

            // Create password reset link
            const resetLink =
                `${baseUrl}/reset-password/${resetToken}`;

            console.log(
                "Password reset link:",
                resetLink
            );
        }

        // Do not reveal whether the email exists
        res.render("forgot-password", {
            success:
                "If an account exists for this email, a password reset link will be generated."
        });

    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );

        res.render("forgot-password", {
            error:
                "Something went wrong. Please try again."
        });
    }
});

// ===============================
// RESET PASSWORD PAGE
// ===============================

app.get("/reset-password/:token", (req, res) => {

    const { token } = req.params;

    const user = db
        .prepare(`
            SELECT id
            FROM users
            WHERE reset_token = ?
            AND reset_token_expires > ?
        `)
        .get(
            token,
            Date.now()
        );

    if (!user) {
        return res.status(400).send(
            "Invalid or expired password reset link."
        );
    }

    res.render("reset-password", {
        token
    });
});

// ===============================
// HANDLE PASSWORD RESET
// ===============================

app.post(
    "/reset-password/:token",
    async (req, res) => {

        try {

            const { token } = req.params;

            const {
                password,
                confirmPassword
            } = req.body;

            if (!password || !confirmPassword) {
                return res.render(
                    "reset-password",
                    {
                        token,
                        error:
                            "Both password fields are required."
                    }
                );
            }

            if (password.length < 8) {
                return res.render(
                    "reset-password",
                    {
                        token,
                        error:
                            "Password must be at least 8 characters long."
                    }
                );
            }

            if (password !== confirmPassword) {
                return res.render(
                    "reset-password",
                    {
                        token,
                        error:
                            "Passwords do not match."
                    }
                );
            }

            const user = db
                .prepare(`
                    SELECT id
                    FROM users
                    WHERE reset_token = ?
                    AND reset_token_expires > ?
                `)
                .get(
                    token,
                    Date.now()
                );

            if (!user) {
                return res.status(400).send(
                    "Invalid or expired password reset link."
                );
            }

            const hashedPassword =
                await bcrypt.hash(password, 12);

            db.prepare(`
                UPDATE users
                SET password = ?,
                    reset_token = NULL,
                    reset_token_expires = NULL
                WHERE id = ?
            `).run(
                hashedPassword,
                user.id
            );

            res.redirect("/login");

        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );

            res.status(500).send(
                "Something went wrong. Please try again."
            );
        }
    }
);

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(
        `Server running at http://localhost:${PORT}`
    );
});