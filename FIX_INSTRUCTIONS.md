# Portfolio Fix Instructions

## Problem Identified
RLS (Row Level Security) is still **ENABLED** on the portfolios table, blocking all portfolio creation. This is why you see "Failed to save portfolio" errors.

Error: `new row violates row-level security policy for table "portfolios"`

---

## Solution - Choose ONE option:

### ⚡ OPTION 1: Quick Fix with Service Role Key (Recommended)

**Fastest method - takes 2 minutes:**

1. Get your Supabase Service Role Key:
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
   - Scroll to "Project API keys"
   - Copy the **service_role** key (the long one, NOT the anon key)

2. Add it to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your_key_here
   ```

3. Run the fix script:
   ```bash
   node scripts/fix-portfolios-with-service-key.js
   ```

4. Refresh your investments page - portfolios should now work! ✅

---

### 🗄️ OPTION 2: Manual SQL Fix (If you don't want to use service key)

**Takes 3 minutes:**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT

2. Click **SQL Editor** in the left sidebar

3. Open the file `ULTIMATE_FIX.sql` from your project

4. Copy the ENTIRE contents of that file

5. Paste into the SQL Editor

6. Click **RUN** button (bottom right)

7. Check the Results panel - you should see:
   ```
   Portfolios created: 1
   Investments linked: 3
   ```

8. Refresh your investments page - portfolios should now work! ✅

---

## Verification

After running either option, run this to verify:

```bash
node scripts/admin-check.js
```

You should see:
```
✅ Found 1 portfolio(s):
  - Main Portfolio (ID: ...)
```

---

## Why This Happened

- Your app uses **Clerk authentication** (user IDs like `user_33vzjdFZIcUKh8AnZnK7xZamLMA`)
- Supabase RLS policies expect **Supabase auth** (checking `auth.uid()`)
- Since `auth.uid()` is NULL for Clerk users, RLS blocks everything
- Solution: **Disable RLS** since you handle auth in your API layer

---

## Need Help?

If you still see errors after following these steps, check that:
1. The SQL actually ran (check for success message)
2. You refreshed the page (Ctrl+F5 / Cmd+Shift+R)
3. The dev server is running (`npm run dev`)

Current status: Your investments page at http://localhost:3001/investments should work after the fix! 🎉
