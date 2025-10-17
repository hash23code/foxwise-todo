# Portfolio Feature Migration

This migration adds portfolio support to the investments feature.

## What's Added:
1. **Portfolios table** - Create and manage multiple investment portfolios
2. **portfolio_id field** - Added to investments table to link investments to portfolios
3. **Default portfolio** - Automatically created for existing users with investments

## To Apply This Migration:

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add_portfolios.sql`
4. Click "Run"

### Option 2: Via Supabase CLI (if installed)
```bash
supabase db push
```

## What Happens After Migration:
- A "Main Portfolio" will be created for each user who has existing investments
- All existing investments will be assigned to their user's default portfolio
- Users can create additional portfolios and move investments between them
- Deleting a portfolio sets investments' portfolio_id to NULL (they won't be deleted)

## Features:
- Create multiple portfolios to organize investments
- Compare portfolio performance in charts
- Each portfolio has a custom color for easy visualization
- Set a default portfolio for quick access
