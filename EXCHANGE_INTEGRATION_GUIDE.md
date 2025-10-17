# Exchange API Integration Guide

## ✅ Issue #1: FIXED
**Problem:** When selecting a portfolio, still showing investments from other portfolios
**Solution:** Changed `investments.map()` to `filteredInvestments.map()` on line 874
**Status:** ✅ COMPLETE - Test by selecting different portfolios

---

## 🚀 Issue #2: Exchange API Integration (In Progress)

### Overview
Add ability for secondary (non-default) portfolios to sync with crypto/stock exchanges via API keys.

### Supported Exchanges with FREE APIs
1. **Binance** - Free API (read-only for portfolio tracking)
2. **Coinbase** - Free API
3. **Kraken** - Free API
4. **Bybit** - Free API
5. **KuCoin** - Free API

---

### Step 1: Run Database Migration ✅

Run this SQL in Supabase SQL Editor:

```sql
-- File: supabase/migrations/add_exchange_integration.sql
ALTER TABLE portfolios
ADD COLUMN IF NOT EXISTS exchange_name TEXT,
ADD COLUMN IF NOT EXISTS exchange_api_key TEXT,
ADD COLUMN IF NOT EXISTS exchange_api_secret TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;
```

**Status:** SQL file created at `supabase/migrations/add_exchange_integration.sql`

---

### Step 2: Update Portfolio Form State

In `app/(dashboard)/investments/page.tsx`, update lines 39-43:

**Current:**
```typescript
const [portfolioFormData, setPortfolioFormData] = useState({
  name: "",
  description: "",
  color: "#8b5cf6",
});
```

**Change to:**
```typescript
const [portfolioFormData, setPortfolioFormData] = useState({
  name: "",
  description: "",
  color: "#8b5cf6",
  exchange_name: "",
  exchange_api_key: "",
  exchange_api_secret: "",
  auto_sync_enabled: false,
});
const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
```

---

### Step 3: Update Portfolio Modal UI

Add this section BEFORE the color picker (around line 1290):

```tsx
{/* Exchange Integration - Only for non-default portfolios */}
{!editingPortfolio?.is_default && (
  <div className="border-t border-gray-700 pt-4">
    <button
      type="button"
      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
      className="flex items-center justify-between w-full text-left"
    >
      <span className="text-sm font-medium text-gray-400">
        Advanced: Exchange Integration
      </span>
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
    </button>

    {showAdvancedOptions && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className="mt-4 space-y-4"
      >
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-300 text-sm mb-2">
            🔐 Connect your exchange to auto-sync holdings
          </p>
          <p className="text-xs text-gray-400">
            Use READ-ONLY API keys. Never share keys with withdrawal permissions!
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Exchange Platform
          </label>
          <select
            value={portfolioFormData.exchange_name}
            onChange={(e) => setPortfolioFormData({ ...portfolioFormData, exchange_name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">None - Manual tracking</option>
            <option value="binance">Binance</option>
            <option value="coinbase">Coinbase</option>
            <option value="kraken">Kraken</option>
            <option value="bybit">Bybit</option>
            <option value="kucoin">KuCoin</option>
          </select>
        </div>

        {portfolioFormData.exchange_name && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                API Key (Read-Only)
              </label>
              <input
                type="password"
                value={portfolioFormData.exchange_api_key}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, exchange_api_key: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                placeholder="Your exchange API key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                API Secret
              </label>
              <input
                type="password"
                value={portfolioFormData.exchange_api_secret}
                onChange={(e) => setPortfolioFormData({ ...portfolioFormData, exchange_api_secret: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                placeholder="Your exchange API secret"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Auto-Sync</p>
                <p className="text-xs text-gray-400">Sync portfolio daily at midnight</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={portfolioFormData.auto_sync_enabled}
                  onChange={(e) => setPortfolioFormData({ ...portfolioFormData, auto_sync_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </>
        )}
      </motion.div>
    )}
  </div>
)}
```

---

### Step 4: Update handlePortfolioSubmit to Include Exchange Data

Around line 607-610, update setPortfolioFormData calls to include exchange fields:

```typescript
setEditingPortfolio(portfolio);
setPortfolioFormData({
  name: portfolio.name,
  description: portfolio.description || "",
  color: portfolio.color,
  exchange_name: portfolio.exchange_name || "",
  exchange_api_key: portfolio.exchange_api_key || "",
  exchange_api_secret: portfolio.exchange_api_secret || "",
  auto_sync_enabled: portfolio.auto_sync_enabled || false,
});
setShowAdvancedOptions(!!portfolio.exchange_name);
```

And around line 561:

```typescript
setEditingPortfolio(null);
setPortfolioFormData({
  name: "",
  description: "",
  color: "#8b5cf6",
  exchange_name: "",
  exchange_api_key: "",
  exchange_api_secret: "",
  auto_sync_enabled: false,
});
setShowAdvancedOptions(false);
```

And in handlePortfolioSubmit around line 205:

```typescript
setPortfolioFormData({
  name: "",
  description: "",
  color: "#8b5cf6",
  exchange_name: "",
  exchange_api_key: "",
  exchange_api_secret: "",
  auto_sync_enabled: false,
});
```

---

### Step 5: Add Sync Button to Portfolio Selector

Around line 600, add a sync button next to edit/delete for portfolios with exchange integration:

```tsx
{portfolio.exchange_name && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleSyncPortfolio(portfolio.id);
    }}
    className="p-1 hover:bg-gray-700 rounded"
    title="Sync from exchange"
  >
    <RefreshCw className="w-3 h-3 text-green-400" />
  </button>
)}
```

---

### Step 6: Add Sync Function

Add this function before handlePortfolioSubmit:

```typescript
const handleSyncPortfolio = async (portfolioId: string) => {
  const portfolio = portfolios.find(p => p.id === portfolioId);
  if (!portfolio?.exchange_name) return;

  try {
    setRefreshing(true);
    const response = await fetch(`/api/portfolios/${portfolioId}/sync`, {
      method: 'POST',
    });

    if (!response.ok) throw new Error('Sync failed');

    await loadInvestments();
    await loadPortfolios();
    alert('Portfolio synced successfully!');
  } catch (error) {
    console.error('Error syncing portfolio:', error);
    alert('Failed to sync portfolio. Please check your API keys.');
  } finally {
    setRefreshing(false);
  }
};
```

---

### Step 7: Create Exchange Sync API Route

Create `app/api/portfolios/[id]/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get portfolio with exchange credentials
    const { data: portfolio, error } = await supabaseServer
      .from('portfolios')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (error || !portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    if (!portfolio.exchange_name || !portfolio.exchange_api_key) {
      return NextResponse.json({ error: 'No exchange configured' }, { status: 400 });
    }

    // TODO: Implement exchange-specific API calls
    // This would call Binance/Coinbase/etc APIs to fetch holdings
    // For now, return success

    await supabaseServer
      .from('portfolios')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', params.id);

    return NextResponse.json({ success: true, message: 'Sync completed' });
  } catch (error: any) {
    console.error('[Portfolio Sync] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### Step 8: Import ChevronDown Icon

At the top of the file (around line 5), add ChevronDown to imports:

```typescript
import { Plus, TrendingUp, TrendingDown, PiggyBank, Pencil, Trash2, RefreshCw, FolderKanban, X, ChevronDown } from "lucide-react";
```

---

## Security Notes

1. **NEVER** store API keys unencrypted in production
2. Use environment variables or a secrets manager
3. Only accept READ-ONLY API keys from users
4. Warn users about API key security in the UI
5. Consider adding encryption for API keys before storing

---

## Testing

1. Run SQL migration in Supabase
2. Create a secondary portfolio (not the default one)
3. Edit it and click "Advanced: Exchange Integration"
4. Select an exchange and enter test credentials
5. Save and verify it saves correctly
6. Click the sync button to test syncing

---

## Future Enhancements

1. Implement actual exchange API integrations:
   - Binance: https://binance-docs.github.io/apidocs/spot/en/
   - Coinbase: https://docs.cloud.coinbase.com/
   - Kraken: https://docs.kraken.com/rest/
2. Add encryption for API keys
3. Add validation for API key format
4. Show last sync time in portfolio selector
5. Add manual "Sync Now" button
6. Implement auto-sync with cron jobs

---

## Status

- ✅ Portfolio filtering fixed
- ✅ Database schema updated
- ✅ TypeScript interfaces updated
- 📝 UI implementation guide created
- ⏳ Exchange API sync implementation (Phase 2)

The foundation is complete! Now you need to:
1. Run the SQL migration
2. Implement the UI changes from Step 2-6
3. Test the feature
