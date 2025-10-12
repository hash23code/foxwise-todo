# Investment Price Tracking Setup

## Features Added:
- Real-time crypto prices (BTC, ETH, SOL, etc.) using **CoinGecko API** (FREE, no API key needed!)
- Real-time stock prices using **Alpha Vantage** or **Finnhub** (FREE with API key)
- Automatic price updates with "Refresh Prices" button
- Track quantity/units of investments
- Ticker symbol tracking (BTC, AAPL, etc.)

## Step 1: Update Database

Run this SQL in your Supabase SQL Editor:

```sql
-- Add symbol, quantity, and purchase price tracking to investments table

ALTER TABLE investments
ADD COLUMN IF NOT EXISTS symbol VARCHAR(20),
ADD COLUMN IF NOT EXISTS quantity DECIMAL(18, 8),
ADD COLUMN IF NOT EXISTS purchase_price_per_unit DECIMAL(18, 2);

-- Add index on symbol for faster lookups
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);
```

## Step 2: Start Using Real-Time Prices!

### For Cryptocurrency (100% FREE, no API key needed):

1. Click "Add Investment"
2. Fill in the details:
   - **Name:** Bitcoin
   - **Type:** Cryptocurrency
   - **Ticker Symbol:** BTC (supported: BTC, ETH, SOL, AVAX, DOT, MATIC, LINK, UNI, ADA, DOGE, XRP, etc.)
   - **Quantity:** 0.5 (how many coins you own)
   - **Amount Invested:** 30000 (total you paid)
   - **Current Value:** 30000 (initial value, will auto-update)
   - **Purchase Date:** Select date

3. Click "Refresh Prices" button - prices update automatically from CoinGecko!

### For Stocks (requires FREE API key):

#### Option 1: Alpha Vantage (Recommended)
1. Get FREE API key: https://www.alphavantage.co/support/#api-key
2. Add to your `.env.local`:
   ```
   NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_key_here
   ```

#### Option 2: Finnhub
1. Get FREE API key: https://finnhub.io/register
2. Add to your `.env.local`:
   ```
   NEXT_PUBLIC_FINNHUB_API_KEY=your_key_here
   ```

Then add stock investments with symbols like AAPL, TSLA, GOOGL, MSFT, etc.

## Step 3: How It Works

1. Add investments with **ticker symbols** (BTC, AAPL, etc.) and **quantity**
2. Click **"Refresh Prices"** button anytime
3. App fetches real-time prices from APIs
4. Automatically calculates: Current Value = Live Price × Quantity
5. Shows you real gains/losses!

## Supported Cryptocurrencies (FREE):
- BTC (Bitcoin)
- ETH (Ethereum)
- BNB (Binance Coin)
- SOL (Solana)
- XRP (Ripple)
- ADA (Cardano)
- DOGE (Dogecoin)
- DOT (Polkadot)
- MATIC (Polygon)
- AVAX (Avalanche)
- LINK (Chainlink)
- UNI (Uniswap)
- ATOM (Cosmos)
- LTC (Litecoin)
- And many more!

## Example Usage:

**Investment 1:**
- Name: Bitcoin
- Type: Cryptocurrency
- Symbol: BTC
- Quantity: 0.5
- Amount Invested: $30,000
- Current Value: $30,000 (will auto-update to real price)

**Investment 2:**
- Name: Apple Stock
- Type: Stocks
- Symbol: AAPL
- Quantity: 100
- Amount Invested: $15,000
- Current Value: $15,000 (will auto-update if you have API key)

Click "Refresh Prices" and watch your portfolio update in real-time!

## Notes:
- Crypto prices work immediately (no API key needed)
- Stock prices require a FREE API key (see above)
- Prices refresh on demand (click "Refresh Prices" button)
- CoinGecko: Unlimited crypto price requests
- Alpha Vantage: 5 requests/minute, 500/day (free tier)
- Finnhub: 60 requests/minute (free tier)
