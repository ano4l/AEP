# 🗄️ Complete Database Setup Instructions

Follow these steps **IN ORDER** to set up your AceTech database in Supabase.

---

## 📋 Prerequisites

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `dovactdvpymurystuurc`
3. Open **SQL Editor** (left sidebar)

---

## 🚀 Step-by-Step Execution

### **STEP 1: Clean Slate** 
📄 File: `STEP_1_DROP_EVERYTHING.sql`

1. Click **"New query"** in SQL Editor
2. Copy the **entire contents** of `STEP_1_DROP_EVERYTHING.sql`
3. Paste into the SQL Editor
4. Click **"Run"** (or press F5)
5. Wait for: `All tables, policies, and types dropped successfully!`

**What this does:** Removes all existing tables, policies, and types to start fresh.

---

### **STEP 2: Create Schema**
📄 File: `STEP_2_CREATE_SCHEMA.sql`

1. Click **"New query"** in SQL Editor
2. Copy the **entire contents** of `STEP_2_CREATE_SCHEMA.sql`
3. Paste into the SQL Editor
4. Click **"Run"** (or press F5)
5. Wait for: `All tables and indexes created successfully!`
6. You should see a list of all created tables

**What this does:** Creates all database tables, types, and indexes.

---

### **STEP 3: Setup Security**
📄 File: `STEP_3_SETUP_RLS.sql`

1. Click **"New query"** in SQL Editor
2. Copy the **entire contents** of `STEP_3_SETUP_RLS.sql`
3. Paste into the SQL Editor
4. Click **"Run"** (or press F5)
5. Wait for: `RLS policies created successfully!`

**What this does:** Enables Row Level Security (RLS) and creates access policies.

---

### **STEP 4: Create Admin User**
📄 File: `STEP_4_CREATE_ADMIN.sql`

1. Click **"New query"** in SQL Editor
2. Copy the **entire contents** of `STEP_4_CREATE_ADMIN.sql`
3. Paste into the SQL Editor
4. Click **"Run"** (or press F5)
5. Wait for: `Users created successfully!`
6. You should see the admin and employee users listed

**What this does:** Creates default admin and employee accounts for testing.

---

## ✅ Verification

After completing all 4 steps, verify everything is working:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see: `AuditLog`, `CashRequisition`, `LeaveBalance`, `LeaveRequest`, `Notification`, `Task`, `User`, etc.

### Check Users Exist
```sql
SELECT id, email, name, role 
FROM "User" 
ORDER BY role;
```

You should see:
- `admin@acetech.com` (ADMIN)
- `john.doe@acetech.com` (EMPLOYEE)

---

## 🔐 Login Credentials

After setup, you can log in with:

**Admin Account:**
- Email: `admin@acetech.com`
- Password: `admin123`

**Employee Account:**
- Email: `john.doe@acetech.com`
- Password: `password123`

---

## 🎯 Next Steps

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Open your app:**
   ```
   http://localhost:3000
   ```

3. **Try logging in** with the admin credentials

4. **If login works:** ✅ Database setup complete!

---

## 🐛 Troubleshooting

### Error: "policy already exists"
- Run `STEP_1_DROP_EVERYTHING.sql` again to clean up
- Then re-run steps 2, 3, and 4

### Error: "table already exists"
- Run `STEP_1_DROP_EVERYTHING.sql` to drop all tables
- Then re-run steps 2, 3, and 4

### Error: "column does not exist"
- Make sure you ran `STEP_2_CREATE_SCHEMA.sql` completely
- Check that all column names use quotes (e.g., `"preparedById"`)

### Login still fails
- Verify users exist: `SELECT * FROM "User";`
- Check RLS is disabled on User table: `STEP_3_SETUP_RLS.sql` should have this
- Restart your dev server

---

## 📝 Important Notes

- **User table has RLS DISABLED** to prevent infinite recursion during login
- All other tables have RLS ENABLED for security
- Column names are case-sensitive and use quotes (e.g., `"preparedById"`)
- Passwords are bcrypt hashed
- Admin user has full access to all features

---

## 🎉 Success!

Once all 4 steps complete successfully, your database is ready and you should be able to log in to your application!
