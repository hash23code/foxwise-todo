// Free price fetching APIs for stocks and crypto

export interface PriceData {
  symbol: string;
  currentPrice: number;
  change24h?: number;
  source: 'coingecko' | 'alphavantage' | 'finnhub' | 'unknown';
}

// CoinGecko API - Free, no API key needed
// Mapping common crypto symbols to CoinGecko IDs
const CRYPTO_IDS: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'USDC': 'usd-coin',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'TRX': 'tron',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LTC': 'litecoin',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'ALGO': 'algorand',
};

export async function getCryptoPrice(symbol: string): Promise<PriceData | null> {
  try {
    const cryptoId = CRYPTO_IDS[symbol.toUpperCase()];
    if (!cryptoId) {
      console.error(`Cryptocurrency ${symbol} not found in mapping`);
      return null;
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );

    if (!response.ok) {
      throw new Error('Failed to fetch crypto price');
    }

    const data = await response.json();
    const priceInfo = data[cryptoId];

    if (!priceInfo) {
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      currentPrice: priceInfo.usd,
      change24h: priceInfo.usd_24h_change,
      source: 'coingecko'
    };
  } catch (error) {
    console.error(`Error fetching crypto price for ${symbol}:`, error);
    return null;
  }
}

// Alpha Vantage API - Free tier (5 API calls per minute, 500 per day)
// Get your free API key from: https://www.alphavantage.co/support/#api-key
export async function getStockPrice(symbol: string, apiKey?: string): Promise<PriceData | null> {
  // If no API key provided, try Finnhub as fallback
  if (!apiKey) {
    return getStockPriceFinnhub(symbol);
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch stock price');
    }

    const data = await response.json();
    const quote = data['Global Quote'];

    if (!quote || !quote['05. price']) {
      console.error('Invalid response from Alpha Vantage');
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      currentPrice: parseFloat(quote['05. price']),
      change24h: parseFloat(quote['09. change']),
      source: 'alphavantage'
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return null;
  }
}

// Finnhub API - Free tier (60 API calls per minute)
// Get your free API key from: https://finnhub.io/register
async function getStockPriceFinnhub(symbol: string, apiKey?: string): Promise<PriceData | null> {
  if (!apiKey) {
    console.warn('No Finnhub API key provided. Stock prices unavailable.');
    return null;
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch stock price from Finnhub');
    }

    const data = await response.json();

    if (!data.c) {
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      currentPrice: data.c, // Current price
      change24h: data.d, // Change
      source: 'finnhub'
    };
  } catch (error) {
    console.error(`Error fetching stock price from Finnhub for ${symbol}:`, error);
    return null;
  }
}

// Main function to get price for any investment type
export async function getInvestmentPrice(
  symbol: string,
  type: string,
  stockApiKey?: string
): Promise<PriceData | null> {
  const upperSymbol = symbol.toUpperCase();

  // Determine if it's crypto or stock based on type or symbol
  if (type.toLowerCase().includes('crypto') || type.toLowerCase().includes('bitcoin') ||
      type.toLowerCase().includes('ethereum') || CRYPTO_IDS[upperSymbol]) {
    return getCryptoPrice(upperSymbol);
  } else {
    // Assume it's a stock
    return getStockPrice(upperSymbol, stockApiKey);
  }
}

// Batch fetch multiple prices
export async function batchGetPrices(
  investments: Array<{ symbol: string; type: string }>,
  stockApiKey?: string
): Promise<Map<string, PriceData>> {
  const priceMap = new Map<string, PriceData>();

  // Fetch all prices in parallel
  const pricePromises = investments.map(inv =>
    getInvestmentPrice(inv.symbol, inv.type, stockApiKey)
  );

  const results = await Promise.all(pricePromises);

  results.forEach((priceData, index) => {
    if (priceData) {
      priceMap.set(investments[index].symbol.toUpperCase(), priceData);
    }
  });

  return priceMap;
}
