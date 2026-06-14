# 🏥 ReferralCare — Medical Referral System

Full-stack Patient Referral Management System built with:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Axios
- **Backend**: Node.js + Express.js
- **Database**: MySQL

---

## 📁 Project Structure

```
med-referral/
├── frontend/          ← React + Vite app
│   ├── src/
│   │   ├── pages/     ← Login, Register, Dashboard, Patients, etc.
│   │   ├── context/   ← Auth, Toast, Notification, Theme contexts
│   │   ├── lib/api.ts ← Axios API client
│   │   └── routes/    ← Protected routing
│   ├── .env           ← Frontend env vars
│   └── package.json
│
└── backend/           ← Node.js + Express API
    ├── routes/        ← auth, patients, doctors, etc.
    ├── middleware/    ← JWT authentication
    ├── config/
    │   ├── db.js      ← MySQL pool connection
    │   └── schema.sql ← Database schema + seed data
    ├── server.js      ← Express app entry point
    ├── .env           ← Backend env vars
    └── package.json
```

---

## ⚙️ Prerequisites

Make sure these are installed on your machine:
- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL](https://dev.mysql.com/downloads/) v8.0 or higher
- npm v9 or higher

---

## 🗄️ Step 1 — Set Up MySQL Database

1. Open MySQL Workbench or terminal and log in:
   ```bash
   mysql -u root -p
   ```

2. Run the schema file to create the database and seed data:
   ```bash
   mysql -u root -p < backend/config/schema.sql
   ```
   This creates:
   - Database `med_referral`
   - All tables: users, departments, doctors, patients, referrals, appointments, notifications
   - Sample data: admin user, 8 departments, 6 doctors, 5 patients

3. Confirm by running:
   ```sql
   USE med_referral;
   SHOW TABLES;
   ```

---

## 🔧 Step 2 — Configure Backend

1. Open `backend/.env` and update your MySQL credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_actual_mysql_password   ← CHANGE THIS
   DB_NAME=med_referral
   JWT_SECRET=change_this_to_a_long_random_string
   JWT_EXPIRES_IN=7d
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```
   You should see:
   ```
   🚀 Med Referral API Server running at http://localhost:5000
   📊 Health check: http://localhost:5000/api/health
   ```

4. Test the health endpoint in your browser or terminal:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## 💻 Step 3 — Configure & Run Frontend

1. The `frontend/.env` should already have:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   App runs at: **http://localhost:5173**

---

## 🔑 Default Login Credentials

| Role  | Email                      | Password  |
|-------|----------------------------|-----------|
| Admin | admin@referralcare.com     | password  |

> The seed data uses `password` as the bcrypt hash for the admin user (seeded with `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`).
> You can register new accounts via the **Sign Up** page.

---

## 🌐 API Endpoints

| Method | Endpoint                      | Description            |
|--------|-------------------------------|------------------------|
| POST   | /api/auth/register            | Create account         |
| POST   | /api/auth/login               | Sign in                |
| GET    | /api/auth/me                  | Get current user       |
| PUT    | /api/auth/profile             | Update profile         |
| GET    | /api/patients                 | List patients          |
| POST   | /api/patients                 | Add patient            |
| PUT    | /api/patients/:id             | Update patient         |
| DELETE | /api/patients/:id             | Delete patient         |
| GET    | /api/doctors                  | List doctors           |
| POST   | /api/doctors                  | Add doctor             |
| GET    | /api/departments              | List departments       |
| POST   | /api/departments              | Add department         |
| GET    | /api/referrals                | List referrals         |
| POST   | /api/referrals                | Create referral        |
| GET    | /api/appointments             | List appointments      |
| POST   | /api/appointments             | Book appointment       |
| GET    | /api/notifications            | Get notifications      |

---

## 🐛 Troubleshooting

**"Access denied for user root"**
→ Update `DB_PASSWORD` in `backend/.env` with your actual MySQL root password.

**"Unknown database med_referral"**
→ Run the schema file: `mysql -u root -p < backend/config/schema.sql`

**Frontend shows blank page / network error**
→ Make sure the backend is running on port 5000 before starting the frontend.

**Port already in use**
→ Change `PORT=5001` in `backend/.env` and `VITE_API_URL=http://localhost:5001/api` in `frontend/.env`.

**CORS errors in browser console**
→ The backend already allows `http://localhost:5173`. If you changed Vite's port, update the CORS origins in `backend/server.js`.
