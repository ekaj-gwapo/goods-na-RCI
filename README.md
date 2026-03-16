# Transaction Management System

A simple two-user transaction management system with data entry and viewing roles, now powered by **Supabase**.

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
> [!IMPORTANT]
> The `SUPABASE_SERVICE_ROLE_KEY` is required for seeding data and bypassing Row-Level Security (RLS) in administrative scripts.

### 3. Database Schema Setup
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).
2. Copy the content of `scripts/migrate-to-supabase.sql`.
3. Paste and **Run** it to create the required tables and indexes.

### 4. Verify & Seed Data
Run these commands to verify your setup and create demo users/transactions:

```bash
# Verify connection and tables
npm run db:verify

# Seed demo users (entry@demo.com, viewer@demo.com)
npm run db:seed

# Seed dummy transactions
npm run db:seed-tx
```

### 5. Start Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` and login!

## 🔐 Demo Credentials

**Data Entry User:**
- Email: `entry@demo.com`
- Password: `Demo123456!`

**Viewer User:**
- Email: `viewer@demo.com`
- Password: `Demo123456!`

## ✨ Features

- **Entry User Dashboard** - Input transaction data with responsive forms.
- **Viewer Dashboard** - Batch transactions, print reports, and advanced filtering.
- **Batch Management** - Group transactions into printable batches with undo capability.
- **Supabase Integration** - Real-time capable, secure PostgreSQL backend.
- **Role-Based Access** - Secure separation between data entry and oversight.

## 📂 Project Structure

```
├── app/
│   ├── auth/login/page.tsx        # Login interface
│   ├── api/
│   │   ├── auth/                  # Auth endpoints
│   │   ├── transactions/          # Transaction CRUD
│   │   ├── batches/               # Batch management
│   │   └── viewer-assignments/    # Access mapping
│   ├── entry-dashboard/           # Data entry interface
│   └── viewer-dashboard/          # Data viewing interface
├── lib/
│   └── supabase.ts                # Supabase client configuration
├── scripts/
│   ├── migrate-to-supabase.sql    # Database schema
│   ├── verify-supabase.js         # Setup verification
│   ├── seed-supabase.js           # Demo user seeding
│   └── seed-transactions.js       # Dummy data seeding
└── .env                           # Local configuration (Git ignored)
```

## 🛠️ Troubleshooting

**"401 Unauthorized" during login?**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your `.env`.
- Check if you've run the SQL migration script in the Supabase Dashboard.

**Database tables not found?**
- Run `npm run db:verify` to see which tables are missing.

**Want to reset everything?**
- In Supabase SQL Editor, drop the tables and run the migration script again, then re-seed.
