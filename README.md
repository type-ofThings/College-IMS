# College E-Quiz Management System

A full-stack **Next.js** application for colleges to manage quizzes, student attempts, and real-time analytics — deployable entirely on **Vercel**.

Built with Next.js (App Router), Tailwind CSS, MongoDB, and JWT authentication.

## Features

- **For Teachers:**
  - Create quizzes manually or upload an Excel/CSV file to auto-extract questions.
  - Manage students individually or via bulk Excel (`.xlsx`) upload.
  - Generate dynamic QR codes for students to scan and instantly join a quiz.
  - **Advanced Performance Analytics**: Real-time charts for success rates and attempt distributions.
  - **Global Leaderboards**: Monitor top performers across all departments.

- **For Students:**
  - Login securely using your Branch Enrollment Number.
  - View available quizzes assigned to your department.
  - Attempt quizzes with integrated timers and simple navigation.
  - View your attempt history, scores, and global ranking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| Backend API | Next.js API Routes (App Router) |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Vercel |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

---

## 🚀 How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/equiz
   JWT_SECRET=your_secret_key_here
   BASE_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser: **[http://localhost:3000](http://localhost:3000)**

---

## 🌐 Deploy on Vercel

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add these **Environment Variables** in Vercel:
   - `MONGO_URI` — Your MongoDB Atlas connection string
   - `JWT_SECRET` — A strong secret key for JWT signing
   - `BASE_URL` — Your Vercel production URL (e.g. `https://equiz-portal.vercel.app`)
4. Deploy!

---

## Default Login Flows

**Teacher Registration:**
- Click "Login as Teacher" on the landing page, switch to "Don't have an account? Register", and create a new teacher account associated with a specific department (e.g., CSE).

**Student Login:**
- Once a teacher has added a student to the system (either manually or via Excel upload), the student can log in using:
  - **Enrollment Number:** The student's unique ID.
  - **Password:** The default password is their enrollment number (unless changed).

---

## Project Structure

```
equiz/
├── src/
│   ├── app/
│   │   ├── api/          # Next.js API routes (replaces Express backend)
│   │   │   ├── auth/     # Login & registration
│   │   │   ├── students/ # Student CRUD + bulk upload
│   │   │   ├── quizzes/  # Quiz CRUD + QR code + file upload
│   │   │   └── attempts/ # Submissions, analytics, leaderboard
│   │   ├── dashboard/    # Teacher & Student dashboards
│   │   ├── login/        # Login pages
│   │   └── quiz/         # Quiz attempt page
│   ├── components/       # Shared UI components
│   ├── lib/              # DB connection, auth helpers, API client
│   └── models/           # Mongoose schemas
└── .env.local            # Environment variables (not committed)
```
