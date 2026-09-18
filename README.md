# Secure Auth Portal

A secure user authentication system and RESTful API developed as part of the **YR NOVATECH Full Stack Development Internship – Task 3**.

The project provides user registration, login, logout, password reset, session management, input validation, error handling, protected routes, and a REST API for complete CRUD operations on users.

The application is built using **Node.js, Express.js, SQLite, Better-SQLite3, EJS, and bcryptjs**.

---

## 🚀 Features

### Authentication

- User registration / sign-up
- User login
- User logout
- Password hashing using bcrypt
- Password reset functionality
- Secure password reset tokens
- Password reset token expiration
- Session management
- Protected dashboard route
- Generic authentication error messages
- Duplicate email detection

### REST API

- RESTful API using Express.js
- JSON request and response handling
- Get all users
- Get user by ID
- Create a new user
- Update an existing user
- Delete a user
- Input validation
- Duplicate email handling
- API error handling
- Appropriate HTTP status codes
- SQLite database integration

### Security

- Passwords are never stored as plain text
- Passwords are hashed using bcrypt
- Password hashes are never returned through the API
- Password reset tokens are not exposed through API responses
- Email addresses are normalized to lowercase
- Duplicate email addresses are prevented
- HTTP-only session cookies
- Environment variable support
- Protected routes
- Generic login error messages

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
│   ├── db.js
│   └── auth.db
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
├── API-DOCUMENTATION.md
├── package.json
├── package-lock.json
└── server.js

Database files and environment variables are excluded from GitHub using .gitignore.

🔐 Authentication Flow
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

The authentication flow is:

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
6. Password Reset

The application provides a password recovery process.

The user enters their registered email address on the Forgot Password page.

If an account exists:

A cryptographically secure reset token is generated.
The token is stored in the database.
An expiration time is assigned.
A password reset link is generated.
The token remains valid for a limited period.

The application does not reveal whether a particular email address is registered.

After a successful password reset:

The new password is hashed using bcrypt.
The reset token is removed.
The token expiration value is removed.
The user can log in using the new password.

🌐 REST API

The project also provides a RESTful API for managing users.

All REST API responses are returned in JSON format.

Base URL
http://localhost:3000
API Base Path
/api
REST API Endpoints
Operation	Method	Endpoint	Description
Get all users	GET	/api/users	Returns all users
Get user	GET	/api/users/:id	Returns a user by ID
Create user	POST	/api/users	Creates a new user
Update user	PUT	/api/users/:id	Updates an existing user
Delete user	DELETE	/api/users/:id	Deletes a user

These endpoints provide the required CRUD operations:

Create → POST
Read → GET
Update → PUT
Delete → DELETE
REST API Request Example
Create User
POST /api/users

Content-Type:

application/json

Request body:

{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "TestPassword123"
}

Successful response:

{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "id": 3,
    "name": "Test User",
    "email": "testuser@example.com",
    "created_at": "2026-09-18 12:53:45"
  }
}

The password is not included in the response.

REST API Validation

The API validates:

Required fields
Name length
Email format
Password length
Duplicate email addresses
User ID format
User existence before update or deletion

📊 HTTP Status Codes
Status Code	Meaning
200	Request successful
201	Resource successfully created
400	Invalid request or validation error
404	User or API endpoint not found
409	Duplicate email conflict
500	Internal server error

🗄️ Database

The project uses SQLite as its database.

The main database file is:

database/auth.db

The database is automatically created when the application starts.

Users Table

The users table contains:

Field	Type	Description
id	INTEGER	Unique user ID
name	TEXT	User's full name
email	TEXT	Unique email address
password	TEXT	Hashed password
reset_token	TEXT	Password reset token
reset_token_expires	INTEGER	Reset token expiration time
created_at	DATETIME	Account creation date
API Security

The following database fields are never returned by the REST API:

password
reset_token
reset_token_expires

Only safe user information such as ID, name, email, and account creation date is returned.

🛡️ Security Measures
Password Hashing

Passwords are never stored as plain text.

Passwords are hashed using bcryptjs.

Secure Reset Tokens

Password reset tokens are generated using Node.js cryptographic functions.

Token Expiration

Password reset tokens automatically expire after a limited period.

Expired or invalid tokens cannot be used to change the password.

HTTP-Only Session Cookies

The authentication session cookie uses:

httpOnly: true

This helps prevent client-side JavaScript from directly accessing the session cookie.

Environment Variables

Sensitive configuration such as the session secret is stored in:

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
REST API request data
Protected Routes

Authentication is checked before allowing access to protected pages such as the dashboard.

Generic Authentication Errors

The login system uses a general message such as:

Invalid email or password.

This helps avoid revealing whether a particular email account exists.

⚙️ Installation
1. Clone the Repository
git clone https://github.com/DhanyaShetty256/Secure-Auth-Portal.git
2. Open the Project
cd Secure-Auth-Portal
3. Install Dependencies
npm install
4. Create Environment File

Create a .env file in the project root.

Add:

SESSION_SECRET=your-secure-session-secret

Do not upload the .env file to GitHub.

5. Start the Application
npm start

The application will run at:

http://localhost:3000

🧪 Testing

The authentication system was tested for:

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

The REST API was tested for:

GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id

The CRUD operations were tested using the local Express server and PowerShell.

📌 Main Web Routes
Method	Route	Description
GET	/	Home page
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

📚 API Documentation

Detailed REST API documentation is available in:

API-DOCUMENTATION.md

The documentation includes:

API overview
Base URL
User data model
CRUD endpoints
Request examples
JSON responses
Validation rules
HTTP status codes
Error handling
Database integration
Security information
API testing information

🎯 Project Objective

The objective of this project is to demonstrate the implementation of a complete authentication system and RESTful backend using Node.js, Express.js, and a real SQLite database.

The project demonstrates:

User authentication
Authorization
Session management
Password security
Input validation
Error handling
Protected resources
RESTful API design
CRUD operations
Database integration
JSON responses

👩‍💻 Author

Dhanya Shetty

BCA Final-Year Student

Full Stack Development Intern

📄 Internship Task

Organization: YR NOVATECH

Task: Task 3 – REST API & Backend Development

Domain: Full Stack Development

🔗 GitHub Repository

https://github.com/DhanyaShetty256/Secure-Auth-Portal