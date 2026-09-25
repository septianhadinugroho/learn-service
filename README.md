# 🚀 Express.js Auth & User Management Boilerplate (REST API)

A robust, production-ready backend authentication and user management boilerplate built with **Express.js**, **TypeScript**, **Prisma ORM**, and **MySQL (Aiven Cloud)**. It features full authentication flows including JWT token handling, Google OAuth 2.0, multi-step email verification via OTP, password recovery, and secure profile management.

---

## ✨ Features

- **Authentication System**
  - Email & Password registration with 6-digit OTP email verification.
  - JWT (JSON Web Token) based authentication with middleware route protection.
  - Google OAuth 2.0 integration via ID Token verification (`google-auth-library`).

- **Security & Best Practices**
  - Password hashing using `bcrypt`.
  - Secure multi-step Forgot Password flow via OTP.
  - Two-step email change verification with pending OTP validation.
  - Rate limiting using `express-rate-limit` to prevent brute-force attacks.
  - Dynamic CORS policy configuration for Vercel deployment preview/production environments.

- **Database & ORM**
  - MySQL database hosted on **Aiven Cloud** (SSL encrypted).
  - **Prisma ORM** for fully typed database queries and schema management.

- **Modular Email Dispatcher**
  - Centralized **Nodemailer** integration in `src/config/mailer.ts` supporting custom HTML email templates.

---

## 🛠️ Tech Stack

| Category       | Technology                              |
|-----------------|------------------------------------------|
| Runtime         | Node.js                                  |
| Framework       | Express.js                               |
| Language        | TypeScript                               |
| Database        | MySQL (Aiven Free Tier)                  |
| ORM             | Prisma ORM                               |
| Authentication  | JWT, Google OAuth 2.0                    |
| Email Service   | Nodemailer (SMTP / Gmail App Password)   |
| Deployment      | Vercel (Serverless Functions)            |

---

## 📁 Folder Structure

```
learn-ex/
├── prisma/
│   └── schema.prisma           # Prisma DB schema definitions
├── src/
│   ├── config/
│   │   ├── db.ts               # Prisma Client instance
│   │   └── mailer.ts           # Nodemailer transporter & email templates
│   ├── controllers/
│   │   └── authController.ts   # Core business logic for authentication
│   ├── middlewares/
│   │   ├── authMiddleware.ts   # JWT verification middleware
│   │   └── rateLimiter.ts      # Request rate limiting middleware
│   ├── routes/
│   │   └── authRoutes.ts       # Express router endpoints
│   └── app.ts                  # Main Express application entry point
├── .env                        # Local environment variables
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── vercel.json                 # Vercel serverless deployment config
```

---

## 🔑 Environment Variables (`.env`)

Create a `.env` file in the root directory of the backend and populate it with the following configuration:

```env
PORT=5000
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<dbname>?ssl-mode=REQUIRED"
JWT_SECRET="your_jwt_secret_key"
CLIENT_ORIGIN="http://localhost:3000,https://your-frontend-domain.vercel.app"
APP_NAME="Auth Engine"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

---

## 📑 API Endpoints Reference

### 1. Public Authentication Routes

| Method | Endpoint                    | Description                                       |
|--------|------------------------------|----------------------------------------------------|
| POST   | `/api/auth/register`        | Register a new user & trigger registration OTP    |
| POST   | `/api/auth/verify-otp`      | Verify registration email using 6-digit OTP        |
| POST   | `/api/auth/resend-otp`      | Resend verification OTP to user email              |
| POST   | `/api/auth/login`           | Authenticate user with credentials and return JWT  |
| POST   | `/api/auth/google`          | Authenticate/Register via Google OAuth ID Token    |

### 2. Password Recovery Routes

| Method | Endpoint                       | Description                                  |
|--------|----------------------------------|-----------------------------------------------|
| POST   | `/api/auth/forgot-password`    | Request password reset OTP via email          |
| POST   | `/api/auth/reset-password`     | Verify reset OTP and commit new password      |

### 3. Protected Routes (Requires `Authorization: Bearer <token>`)

| Method | Endpoint                          | Description                                    |
|--------|-------------------------------------|--------------------------------------------------|
| PUT    | `/api/auth/profile`               | Update profile details (Name/Email)             |
| PUT    | `/api/auth/verify-new-email`      | Confirm OTP sent to new email address           |
| PUT    | `/api/auth/change-password`       | Change account password                         |
| DELETE | `/api/auth/account`               | Permanently delete user account and data        |

---

## 🚦 Local Getting Started

**1. Clone Repository & Install Dependencies**

```bash
git clone <repository-backend-url>
cd learn-ex
npm install
```

**2. Database Setup**

```bash
npx prisma generate
npx prisma db push
```

**3. Start Development Server**

```bash
npm run dev
```

**4. Build for Production**

```bash
npm run build
npm start
```