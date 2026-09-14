# Secure Auth Portal

A complete user authentication system developed as part of the **YR NOVATECH Full Stack Development Internship – Task 3**.

The project provides secure user registration, login, logout, password reset, session management, form validation, error handling, and protected routes using **Node.js, Express.js, SQLite, and EJS**.

---

## 🚀 Features

- User registration / sign-up
- User login
- User logout
- Password hashing
- Password reset functionality
- Secure password reset tokens
- Password reset token expiration
- Session management
- Protected dashboard route
- Form validation
- Duplicate email detection
- Login error handling
- Registration error handling
- Password reset validation
- SQLite database
- Responsive authentication interface
- Environment variable support
- Secure session cookies with HTTP-only protection

---

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js

### Database
- SQLite
- Better-SQLite3

### Authentication & Security
- bcryptjs
- express-session
- connect-sqlite3
- crypto

### Frontend
- HTML
- CSS
- JavaScript
- EJS

### Other Tools
- dotenv
- Git
- GitHub

---

## 📁 Project Structure

```text
Secure-Auth-Portal/
│
├── database/
│   └── db.js
│
├── public/
│   └── style.css
│
├── views/
│   ├── register.ejs
│   ├── login.ejs
│   ├── dashboard.ejs
│   ├── forgot-password.ejs
│   └── reset-password.ejs
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── server.js

```

Database files and environment variables are excluded from GitHub using .gitignore.

## 🔐 Authentication Flow
1. User Registration

The user provides:

Name
Email
Password

The server validates the submitted information.

The password is securely hashed using bcrypt before being stored in the database.

The user's email is normalized to lowercase to prevent duplicate accounts caused by different email capitalization.

2. User Login

The user enters their registered email and password.

The server:

Finds the user in the database.
Compares the entered password with the stored bcrypt hash.
Creates a server-side session after successful authentication.
Stores the user's ID in the session.
Redirects the authenticated user to the protected dashboard.

Invalid credentials return a general error message without revealing whether the email exists.

3. Session Management

The application uses Express Session for authentication sessions.

After successful login:


User Login
     ↓
Credentials Verified
     ↓
Session Created
     ↓
User ID Stored in Session
     ↓
Protected Dashboard Access


Sessions are stored using SQLite through connect-sqlite3.

The session cookie is configured with:

httpOnly: true
Session expiration using maxAge
4. Protected Routes

The dashboard is a protected route.

A user can access the dashboard only when a valid session exists.

/dashboard
     ↓
Is user logged in?
   ↙       ↘
 No         Yes
 ↓           ↓
Login     Dashboard

If the user is not authenticated, they are redirected to the login page.

5. Logout

When the user logs out:

The current session is destroyed.
The session cookie is cleared.
The user is redirected to the login page.

This prevents the previous authenticated session from being reused.

6. Password Reset

The application provides a password recovery process.

The user enters their registered email address on the Forgot Password page.

If an account exists:

A cryptographically secure reset token is generated.
The token is stored in the database.
An expiration time is assigned.
A password reset link is generated.
The token is valid for a limited period.

The application does not reveal whether a particular email address is registered.

The user can then create a new password using the reset link.

After a successful password reset:

The new password is hashed using bcrypt.
The reset token is removed.
The token expiration value is removed.
The user can log in using the new password.


## 🛡️ Security Measures

The application implements several security practices.

Password Hashing

Passwords are never stored as plain text.

Passwords are hashed using:

bcrypt

with a secure hashing cost factor.

Secure Reset Tokens

Password reset tokens are generated using Node.js cryptographic random bytes.

This makes the reset tokens difficult to guess.

Token Expiration

Password reset tokens automatically expire after a limited period.

Expired or invalid tokens cannot be used to change the password.

HTTP-Only Session Cookies

The authentication session cookie uses:

httpOnly: true

This helps prevent client-side JavaScript from directly accessing the session cookie.

Environment Variables

Sensitive configuration such as the session secret is stored in an environment file:

.env

The .env file is excluded from Git using .gitignore.

Input Validation

The application validates:

Required fields
Name length
Password length
Email input
Password confirmation
Duplicate email registration
Protected Routes

Authentication is checked before allowing access to protected pages such as the dashboard.

Generic Authentication Errors

The login system uses:

Invalid email or password.

instead of revealing whether a specific email account exists.

This helps reduce user-account enumeration.

## 🗄️ Database

The project uses SQLite as its real database.

The main users table stores:

User ID
Name
Email
Hashed password
Password reset token
Password reset token expiration
Account creation date

The database is created automatically when the application starts.

## ⚙️ Installation
1. Clone the Repository
git clone https://github.com/DhanyaShetty256/Secure-Auth-Portal.git
2. Open the Project
cd Secure-Auth-Portal
3. Install Dependencies
npm install
4. Create Environment File

Create a .env file in the project root:

SESSION_SECRET=your-secure-session-secret

Do not upload the .env file to GitHub.

5. Start the Application
npm start

The application will run at:

http://localhost:3000

## 🧪 Testing

The following authentication scenarios were tested:

User registration
Duplicate email registration
Password length validation
Successful login
Invalid login
Protected dashboard access
Logout
Forgot password
Password reset
Invalid reset token
Expired reset token
Password confirmation validation
Login after password reset
Session-based authentication


## 📌 Main Routes
Method	Route	Description
GET	/	Home
GET	/register	Registration page
POST	/register	Create account
GET	/login	Login page
POST	/login	Authenticate user
GET	/dashboard	Protected dashboard
GET	/logout	Logout user
GET	/forgot-password	Password recovery page
POST	/forgot-password	Generate reset token
GET	/reset-password/:token	Reset password page
POST	/reset-password/:token	Update password

## 🎯 Project Objective

The objective of this project is to demonstrate the implementation of a complete authentication system using a backend framework and a real database.

The project focuses on authentication, authorization, session handling, password security, validation, error handling, and protected resources.

## 👩‍💻 Author

Dhanya Shetty

BCA Student
Full Stack Development Intern

## 📄 Internship Task

Organization: YR NOVATECH

Task: Task 3 – User Authentication System

Domain: Full Stack Development

## 🔗 GitHub Repository

https://github.com/DhanyaShetty256/Secure-Auth-Portal
