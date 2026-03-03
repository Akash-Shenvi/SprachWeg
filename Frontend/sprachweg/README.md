<p align="center">
  <img src="https://img.shields.io/badge/SprachWeg-Training%20Platform-FF6B35?style=for-the-badge&logoColor=white" alt="SprachWeg" />
</p>

<h1 align="center">🎓 SprachWeg</h1>

<p align="center">
  <strong>A Production-Grade Full-Stack Training Platform for Language &amp; Industrial Skill Development</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Hosting-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
</p>

<p align="center">
  <a href="https://training.sovirtechnologies.in">🌐 Live Demo</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-architecture">🏗️ Architecture</a> •
  <a href="#-api-reference">📡 API Reference</a>
</p>

---

## 📋 Overview

**SprachWeg** (German: *"Language Path"*) is an enterprise-grade training platform built by **SoVir Technologies** that delivers both **language courses** (German, English, Japanese) and **industrial skill training** (PLC, SCADA, Industry 4.0, Drives & Motion, Corporate Training).

The platform features **role-based dashboards** for Students, Trainers, and Administrators — with a secure authentication pipeline, real-time enrollment workflows, and integrated Google Calendar scheduling.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication & Security
- JWT-based session management (30-day expiry)
- Google OAuth 2.0 single sign-on
- OTP email verification via Nodemailer
- Forgot/Reset password flow
- Helmet security headers
- Role-based access control (RBAC)

</td>
<td width="50%">

### 📚 Course Management
- Language courses (German, English, Japanese)
- 5 industrial skill training domains
- Multi-level course structures with exam prep
- Image uploads via Multer
- Database seeding for initial catalog
- Dynamic course detail pages

</td>
</tr>
<tr>
<td width="50%">

### 👥 Role-Based Dashboards
- **Student** — enrolled courses, batch access
- **Trainer** — batch management, attendance, assignments, materials, announcements
- **Admin** — full CRUD, enrollment approval, trainer management, contact messages, booking requests

</td>
<td width="50%">

### 🛠️ Platform Capabilities
- Batch scheduling with Google Calendar
- Enrollment workflows with admin approval
- Assignment submission & tracking
- Attendance management
- Booking/trial request handling
- Contact message management
- Dark/Light theme toggle

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                        │
│  React 19 · Vite 7 · TailwindCSS 4 · Framer Motion     │
│  React Router 7 · Axios · Google OAuth Provider         │
│                                                         │
│  ┌──────────┐ ┌───────────┐ ┌────────────────────────┐  │
│  │ 33+ Pages│ │11 Compnts │ │ AuthContext·ThemeContext│  │
│  └──────────┘ └───────────┘ └────────────────────────┘  │
│                     │ Axios /api/*                       │
├─────────────────────┼───────────────────────────────────┤
│                     ▼                                    │
│                BACKEND (REST API)                        │
│  Express 5 · TypeScript · Helmet · CORS                 │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │13 Controllers│ │ 11 Route     │ │ JWT + Google     │ │
│  │              │ │ Groups       │ │ OAuth Middleware  │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ 19 Mongoose  │ │ Multer File  │ │ Nodemailer Email │ │
│  │ Models       │ │ Uploads      │ │ + GCal Service   │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
│                     │                                    │
├─────────────────────┼───────────────────────────────────┤
│                     ▼                                    │
│  ┌──────────────────────────────────────────────┐       │
│  │           MongoDB (Atlas / Local)             │       │
│  └──────────────────────────────────────────────┘       │
│                                                         │
│  Frontend Hosting: Firebase  ·  Backend: Linux Server   │
└─────────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technologies |
|:---:|---|
| **Frontend** | React 19 · Vite 7 · TypeScript 5.9 · TailwindCSS 4 · Framer Motion · React Router 7 · Axios · Lucide Icons · react-hot-toast |
| **Backend** | Node.js · Express 5 · TypeScript 5.9 · Mongoose 9 · class-validator · Multer · Nodemailer · Helmet · CORS |
| **Auth** | JWT (jsonwebtoken) · bcryptjs · Google OAuth 2.0 (google-auth-library) · OTP Email Verification |
| **Database** | MongoDB (Atlas or Local) |
| **Services** | Google Calendar API · SMTP Email Service (Gmail) |
| **Hosting** | Firebase Hosting (Frontend) · Linux Server (Backend) |
| **DevTools** | nodemon · ts-node · ESLint · Vite HMR |

---

## 📁 Project Structure

```
SprachWeg/
│
├── Backend/
│   ├── src/
│   │   ├── server.ts                 # Entry point
│   │   ├── app.ts                    # Express setup + 14 route mounts
│   │   ├── config/                   # database.ts · env.ts · multer.ts
│   │   ├── controllers/              # 13 controllers (auth, courses, enrollment, dashboard...)
│   │   ├── dtos/                     # Request validation (class-validator)
│   │   ├── middlewares/              # JWT auth guard · role authorization · file upload
│   │   ├── models/                   # 19 Mongoose schemas
│   │   ├── routes/                   # 11 route files
│   │   ├── services/                 # Google Calendar integration
│   │   ├── utils/                    # Email service (OTP, welcome, enrollment confirmations)
│   │   └── seedCourses.ts            # Database seed script
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/sprachweg/
│   ├── src/
│   │   ├── App.tsx                   # Provider stack + 33+ routes
│   │   ├── context/                  # AuthContext · ThemeContext
│   │   ├── components/               # layout/ · ui/ · auth/ · admin/
│   │   ├── pages/                    # Public · Auth · Student · Trainer · Admin (9) · Skill Training (6)
│   │   ├── lib/                      # Axios API client · course data · utilities
│   │   └── types/                    # TypeScript interfaces
│   ├── firebase.json                 # Firebase Hosting config (SPA rewrites)
│   ├── vite.config.ts
│   └── package.json
│
└── .github/workflows/               # CI/CD pipelines
```

---

## 📡 API Reference

| Route Group | Base Path | Key Endpoints |
|---|---|---|
| **Auth** | `/api/auth` | `POST` register · login · verify-otp · resend-otp · forgot-password · reset-password · google — `GET` me — `PUT` profile/complete |
| **Skills** | `/api/skills` | `GET` list — `POST` create — `PUT` update — `DELETE` remove *(admin)* |
| **Languages** | `/api/languages` | Full CRUD for language courses |
| **Language Training** | `/api/language-training` | Enrollment flows for language courses |
| **Language Trainer** | `/api/language-trainer` | Batches · classes · attendance · assignments · materials · announcements |
| **Dashboard** | `/api/dashboard` | `GET` student · trainer |
| **Enrollment** | `/api/enrollment` | `POST` enroll · accept · reject — `GET` pending |
| **Skill Details** | `/api/skill-training-details` | `GET` /:courseId — `POST` / |
| **Contact** | `/api/contact` | `POST` submit — `GET` list *(admin)* |
| **Trial Requests** | `/api/trial-requests` | Booking & trial request management |
| **Uploads** | `/api/uploads` | Static file serving for uploaded assets |

---

## 🗄️ Database Models (19 Schemas)

| Domain | Models |
|---|---|
| **User & Auth** | User (with roles, OTP, Google ID, profile completion virtual) |
| **Courses** | SkillCourse · LanguageCourse · SkillTrainingDetail |
| **Enrollment** | Enrollment · LanguageEnrollment |
| **Batches** | Batch · LanguageBatch |
| **Classes** | ClassSession · LanguageClass · Attendance |
| **Content** | Assignment · Submission · LanguageMaterial |
| **Communication** | Announcement · LanguageAnnouncement |
| **Contact & Trials** | Contact · TrialRequest · Item |

---

## 🔑 Role-Based Access

| Role | Permissions |
|:---:|---|
| **Public** | Landing page · About · Contact · Course pages · Skill training pages · Privacy & Terms |
| **Student** | All public + Student Dashboard · Language Batch Details · Course enrollment |
| **Trainer** | All student + Trainer Dashboard · Batch management · Attendance · Assignments · Materials · Announcements |
| **Admin** | Full access — Admin Dashboard · Course CRUD · Enrollment approval · Trainer management · Contact messages · Booking requests |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v14+ &nbsp;·&nbsp; **npm** &nbsp;·&nbsp; **MongoDB** (local or Atlas)

### Backend

```bash
cd SprachWeg/Backend
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGO_URI=mongodb://localhost:27017/sprachweg
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
EOF

npm run dev          # Start with nodemon (hot-reload)
```

### Frontend

```bash
cd SprachWeg/Frontend/sprachweg
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
EOF

npm run dev          # Start Vite dev server
```

### Production Build & Deploy

```bash
# Backend
cd Backend
npm run build        # Compiles to dist/
npm start            # Runs dist/server.js

# Frontend → Firebase
cd Frontend/sprachweg
npm run build        # Builds to dist/
firebase deploy --only hosting
```

---

## 📊 Project Stats

<table>
<tr>
<td align="center"><strong>19</strong><br/>Database Models</td>
<td align="center"><strong>13</strong><br/>Controllers</td>
<td align="center"><strong>14</strong><br/>API Route Mounts</td>
<td align="center"><strong>33+</strong><br/>Frontend Pages</td>
</tr>
<tr>
<td align="center"><strong>3</strong><br/>User Roles</td>
<td align="center"><strong>3</strong><br/>Languages</td>
<td align="center"><strong>5</strong><br/>Skill Domains</td>
<td align="center"><strong>11</strong><br/>Components</td>
</tr>
</table>

---

## 🔒 Security Features

- 🛡️ **Helmet** — automatic security headers (XSS, content-type sniffing, clickjacking)
- 🔐 **JWT Authentication** — stateless, 30-day token expiry
- 🔑 **bcryptjs** — password hashing with salt rounds
- ✉️ **OTP Verification** — email-based with expiry and rate limiting
- 🚫 **CORS** — whitelisted origins only (`training.sovirtechnologies.in`)
- 👮 **Role Guards** — `protect`, `isAdmin`, `authorize(...roles)` middleware chain

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software owned by **SoVir Technologies**.

---

<p align="center">
  Built with ❤️ by <strong>SoVir Technologies</strong>
  <br/>
  <a href="https://training.sovirtechnologies.in">training.sovirtechnologies.in</a>
</p>
