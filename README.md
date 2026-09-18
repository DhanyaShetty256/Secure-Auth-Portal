# Secure Auth Portal

A secure user authentication system with database integration, session management, password reset, protected routes, and a RESTful API.

Developed as part of the **YR NOVATECH Full Stack Development Internship – Task 4: Authentication & Database Integration**.

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

### Database

- SQLite database
- Better-SQLite3
- Persistent user records
- Unique email addresses
- Password reset token storage
- Account creation timestamps
- SQLite-based session storage

### Validation & Error Handling

- Required field validation
- Name validation
- Email format validation
- Password length validation
- Password confirmation validation
- Duplicate email handling
- Invalid login handling
- Invalid reset token handling
- Expired reset token handling
- Server-side error handling

### REST API

- RESTful API using Express.js
- JSON request and response handling
- Get all users
- Get user by ID
- Create user
- Update user
- Delete user
- CRUD operations
- API input validation
- Appropriate HTTP status codes
- JSON error responses

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
- Node.js crypto
- dotenv

### Frontend

- HTML
- CSS
- JavaScript
- EJS

### Development Tools

- Git
- GitHub
- PowerShell
- VS Code

## 📁 Project Structure

```text
Secure-Auth-Portal/
│
├── database/
│   ├── db.js
│   ├── auth.db
│   └── sessions.db
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

Database files and environment variables should not be committed to GitHub.

🔐 Authentication Flow
1. User Registration

The user provides:

Name
Email
Password

The server validates the submitted information.

The email address is normalized to lowercase.

The password is securely hashed using bcryptjs before being stored in the SQLite database.

Duplicate email addresses are rejected.

2. User Login

The user enters their registered email address and password.

The server:

Normalizes the email address.
Finds the user in the database.
Compares the entered password with the stored bcrypt hash.
Creates a server-side session after successful authentication.
Stores the authenticated user's ID in the session.
Redirects the user to the protected dashboard.

Invalid credentials return a generic:

Invalid email or password.

This avoids revealing whether a particular email address is registered.

3. Session Management

The application uses express-session for authentication sessions.

The session flow is:

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

The session cookie uses security settings including:

httpOnly: true
sameSite: lax
secure: true in production

The session also has a defined expiration period.

4. Protected Routes

The dashboard is protected and requires an authenticated session.

/dashboard
      ↓
Is user logged in?
   ↙       ↘
 No         Yes
 ↓           ↓
Login     Dashboard

If a user attempts to access the dashboard without an active session, they are redirected to the login page.

5. Logout

When the user logs out:

The current session is destroyed.
The session cookie is cleared.
The user is redirected to the login page.

This prevents continued access through the previous authentication session.

🔑 Password Reset Flow

The application provides a password recovery process.

The user enters their email address on the Forgot Password page.

If the account exists:

A cryptographically secure reset token is generated.
The token is stored in the database.
An expiration timestamp is assigned.
A password reset link is generated.
The reset link is made available for the password-reset process.

The reset token is valid only for a limited period.

The application provides a generic response so that it does not reveal whether an email address is registered.

After a successful password reset:

The new password is hashed using bcrypt.
The reset token is removed.
The reset-token expiration value is removed.
The user can log in using the new password.

During local development, the generated reset link is displayed in the server console for testing.

🛡️ Security Measures
Password Hashing

Passwords are never stored as plain text.

Passwords are hashed using bcryptjs before being stored in the database.

Secure Reset Tokens

Password reset tokens are generated using Node.js cryptographic functions.

Token Expiration

Reset tokens have a limited validity period.

Expired or invalid tokens cannot be used to reset a password.

HTTP-Only Session Cookies

The authentication session cookie uses:

httpOnly: true

This prevents client-side JavaScript from directly accessing the session cookie.

SameSite Cookie Protection

The session cookie uses:

sameSite: lax

to provide additional protection for authentication sessions.

Secure Cookies in Production

The session cookie uses:

secure: true

when the application is running in production over HTTPS.

Environment Variables

Sensitive configuration such as the session secret is stored using environment variables.

Example:

SESSION_SECRET=your-secure-session-secret

The .env file is excluded from Git using .gitignore.

Input Validation

The application validates:

Required fields
Name length
Email format
Password length
Password confirmation
Duplicate email registration
Reset token validity
Generic Authentication Errors

The login system uses a general error message:

Invalid email or password.

This helps avoid exposing whether an account exists.

Protected Routes

Authentication is checked before allowing access to protected pages such as the dashboard.

🗄️ Database

The project uses SQLite with Better-SQLite3.

The main database file is:

database/auth.db

The database is automatically created when the application starts.

Users Table
Field	Type	Description
id	INTEGER	Unique user ID
name	TEXT	User's full name
email	TEXT	Unique email address
password	TEXT	Bcrypt password hash
reset_token	TEXT	Password reset token
reset_token_expires	INTEGER	Reset token expiration timestamp
created_at	DATETIME	Account creation date
Session Database

Authentication sessions are stored separately using SQLite through connect-sqlite3.

The session database is:

database/sessions.db

🌐 REST API

The project also provides a RESTful API for user management.

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

These endpoints provide complete CRUD operations:

Create → POST
Read   → GET
Update → PUT
Delete → DELETE
API Security

Sensitive database fields are not returned through the REST API.

The following fields are excluded from API responses:

password
reset_token
reset_token_expires

Only safe information such as ID, name, email, and account creation date is returned.

Detailed API information is available in:

API-DOCUMENTATION.md

📊 HTTP Status Codes
Status Code	Meaning
200	Request successful
201	Resource successfully created
400	Invalid request or validation error
404	User or API endpoint not found
409	Duplicate email conflict
500	Internal server error

📌 Main Web Routes
Method	Route	Description
GET	/	Application status
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
Password validation
Successful login
Invalid login
Session creation
Protected dashboard access
Logout
Session destruction
Forgot password
Password reset
Invalid reset token
Password confirmation validation
Login after password reset

The REST API was tested for:

GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id

CRUD operations were tested using the local Express server and PowerShell.

📚 API Documentation

Detailed REST API documentation is available in:

API-DOCUMENTATION.md

It includes:

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

The objective of this project is to demonstrate the implementation of a complete authentication system using Node.js, Express.js, and a real SQLite database.

The project demonstrates:

User registration
User authentication
Authorization
Session management
Password security
Password reset
Protected resources
Input validation
Error handling
Database integration
RESTful API design
CRUD operations
JSON responses

🌐 Deployment

The application is deployed as a Node.js web service.

Live application:

https://secure-auth-portal-rx0x.onrender.com

The deployment provides a public URL for accessing the application.

👩‍💻 Author

Dhanya Shetty

BCA Final-Year Student
Full Stack Development Intern

🔗 GitHub Repository

https://github.com/DhanyaShetty256/Secure-Auth-Portal

📄 Internship Task

Organization: YR NOVATECH

Task: Task 4 – Authentication & Database Integration

Domain: Full Stack Development