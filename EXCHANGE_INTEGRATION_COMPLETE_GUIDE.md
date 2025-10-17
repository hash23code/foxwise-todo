# Exchange API Integration - Complete Implementation Guide

## Overview

I've implemented a **secure exchange API integration** system that allows users to connect their cryptocurrency exchange accounts (Binance, Coinbase, Kraken, Bybit, OKX, KuCoin) to automatically sync portfolio balances.

## What's Been Implemented

### 1. Database Schema ✅
**File:** `supabase/migrations/add_exchange_connections.sql`
- Stores encrypted API credentials
- Row-level security enabled
- Automatic sync status tracking

### 2. Exchange API Library ✅
**File:** `lib/exchanges/index.ts`
- Support for 6 major exchanges:
  - Binance
  - Coinbase
  - Kraken
  - Bybit
  - OKX
  - KuCoin
- Read-only API access
- Secure API signing

### 3. Database API Functions ✅
**File:** `lib/api/exchange-connections.ts`
- CRUD operations for exchange connections
- Sync status management

### 4. Secure API Endpoints ✅

#### Connect Exchange: `/api/exchange/connect`
- **POST**: Encrypt and store API keys (AES-256-GCM)
- **GET**: List all connections for user
- **DELETE**: Remove connection

#### Sync Portfolio: `/api/exchange/sync`
- **POST**: Decrypt keys, fetch balances, update investments

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM (industry standard)
- **Key Storage**: Environment variable `EXCHANGE_ENCRYPTION_KEY`
- **Per-field encryption**: API key, secret, and passphrase encrypted separately

### API Key Permissions
- **Read-only**: Only balance/account viewing permissions required
- **No trading**: Users should NEVER provide keys with trading permissions

### Row-Level Security (RLS)
- Users can only access their own connections
- Enforced at database level

## Setup Instructions

### Step 1: Generate Encryption Key

Add to your `.env.local` file:

```bash
# Generate a secure 32-byte key (64 hex characters)
# Run this in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
EXCHANGE_ENCRYPTION_KEY=your_64_character_hex_key_here
```

### Step 2: Run Database Migration

```bash
# Apply the migration to create the exchange_connections table
# In Supabase Dashboard: SQL Editor → paste contents of add_exchange_connections.sql → Run
```

### Step 3: Restart Development Server

```bash
npm run dev
```

## UI Integration (To Complete)

The UI needs to be added to the investments page. Here's what needs to be added:

### Required State Variables

```typescript
// Add to investments page
const [exchangeConnections, setExchangeConnections] = useState<any[]>([]);
const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
const [syncing, setSyncing] = useState<string | null>(null); // connectionId being synced
const [exchangeFormData, setExchangeFormData] = useState({
  exchangeName: '',
  apiKey: '',
  apiSecret: '',
  passphrase: '', // Optional, only for some exchanges
  portfolioId: '',
});
```

### Required Functions

```typescript
// Load exchange connections
const loadExchangeConnections = async () => {
  try {
    const response = await fetch('/api/exchange/connect');
    const result = await response.json();
    if (result.success) {
      setExchangeConnections(result.data);
    }
  } catch (error) {
    console.error('Error loading exchange connections:', error);
  }
};

// Connect new exchange
const handleConnectExchange = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await fetch('/api/exchange/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exchangeFormData),
    });

    const result = await response.json();
    if (result.success) {
      alert('Exchange connected successfully!');
      await loadExchangeConnections();
      setIsExchangeModalOpen(false);
      setExchangeFormData({
        exchangeName: '',
        apiKey: '',
        apiSecret: '',
        passphrase: '',
        portfolioId: '',
      });
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error: any) {
    console.error('Error connecting exchange:', error);
    alert('Failed to connect exchange');
  }
};

// Sync portfolio from exchange
const handleSyncExchange = async (connectionId: string) => {
  try {
    setSyncing(connectionId);
    const response = await fetch('/api/exchange/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    });

    const result = await response.json();
    if (result.success) {
      alert(`Synced ${result.data.totalAssets} assets successfully!`);
      await loadInvestments();
      await loadExchangeConnections();
    } else {
      alert(`Sync error: ${result.error}`);
    }
  } catch (error: any) {
    console.error('Error syncing:', error);
    alert('Failed to sync portfolio');
  } finally {
    setSyncing(null);
  }
};

// Delete exchange connection
const handleDeleteExchangeConnection = async (connectionId: string) => {
  if (!confirm('Are you sure you want to disconnect this exchange?')) return;

  try {
    const response = await fetch(`/api/exchange/connect?id=${connectionId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      alert('Exchange disconnected');
      await loadExchangeConnections();
    } else {
      alert('Failed to disconnect exchange');
    }
  } catch (error) {
    console.error('Error deleting connection:', error);
    alert('Failed to disconnect exchange');
  }
};
```

### UI Components to Add

#### 1. Exchange Connections Section (Add after Portfolio Selector)

```tsx
{/* Exchange Connections */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-white flex items-center gap-2">
      <Link className="w-5 h-5 text-green-400" />
      Exchange Connections
    </h2>
    <button
      onClick={() => setIsExchangeModalOpen(true)}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all text-sm"
    >
      <Plus className="w-4 h-4" />
      Connect Exchange
    </button>
  </div>

  {exchangeConnections.length === 0 ? (
    <div className="text-center py-8 text-gray-400">
      <p>No exchange connections yet</p>
      <p className="text-sm text-gray-500 mt-1">Connect an exchange to auto-sync your portfolio</p>
    </div>
  ) : (
    <div className="space-y-3">
      {exchangeConnections.map((conn: any) => (
        <div
          key={conn.id}
          className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${conn.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
            <div>
              <p className="text-white font-medium capitalize">{conn.exchangeName}</p>
              <p className="text-xs text-gray-400">
                {conn.lastSyncAt
                  ? `Last synced: ${format(new Date(conn.lastSyncAt), 'MMM dd, h:mm a')}`
                  : 'Never synced'}
              </p>
              {conn.lastSyncStatus === 'failed' && (
                <p className="text-xs text-red-400">Error: {conn.syncError}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSyncExchange(conn.id)}
              disabled={syncing === conn.id}
              className="flex items-center gap-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing === conn.id ? 'animate-spin' : ''}`} />
              {syncing === conn.id ? 'Syncing...' : 'Sync'}
            </button>
            <button
              onClick={() => handleDeleteExchangeConnection(conn.id)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</motion.div>
```

#### 2. Exchange Connection Modal

```tsx
{/* Exchange Connection Modal */}
{isExchangeModalOpen && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onClick={() => setIsExchangeModalOpen(false)}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Connect Exchange</h2>
        <button
          onClick={() => setIsExchangeModalOpen(false)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-300 text-sm font-medium mb-2">⚠️ Security Notice</p>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Only use <strong>READ-ONLY</strong> API keys</li>
          <li>• Never enable trading or withdrawal permissions</li>
          <li>• Keys are encrypted with AES-256-GCM</li>
        </ul>
      </div>

      <form onSubmit={handleConnectExchange} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Exchange *
          </label>
          <select
            value={exchangeFormData.exchangeName}
            onChange={(e) => setExchangeFormData({ ...exchangeFormData, exchangeName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            required
          >
            <option value="">Select Exchange</option>
            <option value="binance">Binance</option>
            <option value="coinbase">Coinbase</option>
            <option value="kraken">Kraken</option>
            <option value="bybit">Bybit</option>
            <option value="okx">OKX</option>
            <option value="kucoin">KuCoin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            API Key *
          </label>
          <input
            type="password"
            value={exchangeFormData.apiKey}
            onChange={(e) => setExchangeFormData({ ...exchangeFormData, apiKey: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
            placeholder="Enter your API key"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            API Secret *
          </label>
          <input
            type="password"
            value={exchangeFormData.apiSecret}
            onChange={(e) => setExchangeFormData({ ...exchangeFormData, apiSecret: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
            placeholder="Enter your API secret"
            required
          />
        </div>

        {(exchangeFormData.exchangeName === 'okx' || exchangeFormData.exchangeName === 'kucoin') && (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Passphrase * (Required for {exchangeFormData.exchangeName.toUpperCase()})
            </label>
            <input
              type="password"
              value={exchangeFormData.passphrase}
              onChange={(e) => setExchangeFormData({ ...exchangeFormData, passphrase: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
              placeholder="Enter API passphrase"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Link to Portfolio (Optional)
          </label>
          <select
            value={exchangeFormData.portfolioId}
            onChange={(e) => setExchangeFormData({ ...exchangeFormData, portfolioId: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">No Portfolio</option>
            {portfolios.map(portfolio => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setIsExchangeModalOpen(false)}
            className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Connect
          </button>
        </div>
      </form>
    </motion.div>
  </motion.div>
)}
```

## How Users Get API Keys

### Binance
1. Go to Account → API Management
2. Create new API key
3. **Permissions**: Enable "Read" only, disable all others
4. Save API Key and Secret

### Coinbase
1. Go to Settings → API
2. Create new API key
3. **Permissions**: Select "wallet:accounts:read" only
4. Save API Key and Secret

### Kraken
1. Go to Security → API
2. Generate new key
3. **Permissions**: Check "Query Funds" only
4. Save API Key and Secret

### Others (Bybit, OKX, KuCoin)
- Similar process: Create read-only API keys
- OKX and KuCoin require a passphrase

## Testing

1. **Test Connection**:
   ```bash
   curl -X POST http://localhost:3002/api/exchange/connect \
     -H "Content-Type: application/json" \
     -d '{"exchangeName":"binance","apiKey":"test","apiSecret":"test","portfolioId":"uuid"}'
   ```

2. **Test Sync**:
   ```bash
   curl -X POST http://localhost:3002/api/exchange/sync \
     -H "Content-Type: application/json" \
     -d '{"connectionId":"uuid"}'
   ```

## Next Steps

1. Add the UI components to the investments page
2. Test with a real exchange API key (use testnet if available)
3. Consider adding:
   - Auto-sync schedules (hourly/daily)
   - Multi-exchange comparison charts
   - Exchange-specific warnings (API rate limits)

## Troubleshooting

### "Failed to decrypt credentials"
- Check that `EXCHANGE_ENCRYPTION_KEY` is set correctly
- Ensure the key is exactly 64 hex characters

### "Invalid API key" errors
- Verify API key permissions are read-only
- Check if exchange requires IP whitelisting
- Ensure passphrase is correct (for OKX/KuCoin)

### Sync returns no data
- Check if exchange account has any balances
- Verify API key has correct permissions
- Check exchange API status (maintenance, downtime)

## Security Best Practices

1. **Never commit** encryption keys to version control
2. Use **environment variables** for all secrets
3. Regularly **rotate** API keys
4. Monitor for **suspicious activity**
5. Educate users on **read-only** key importance

---

**Status**: Backend complete ✅ | Frontend UI pending ⏳

All the hard work is done! Just add the UI components above to your investments page and you'll have a fully functional, secure exchange integration system.
