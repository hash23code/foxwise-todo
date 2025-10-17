# Portfolio Feature Implementation Guide

## ✅ Completed Work

### 1. Database Schema
- ✅ Created `portfolios` table with color-coding support
- ✅ Added `portfolio_id` foreign key to investments table
- ✅ Set up Row Level Security policies
- ✅ Auto-migration creates "Main Portfolio" for existing users
- **File**: `supabase/migrations/add_portfolios.sql`

### 2. API Layer
- ✅ Created complete CRUD API for portfolios
- ✅ Added `getInvestmentsByPortfolio()` function
- ✅ Updated Investment interface to include `portfolio_id`
- **Files**:
  - `lib/api/portfolios.ts` (NEW)
  - `lib/api/investments.ts` (UPDATED)
  - `lib/database.types.ts` (UPDATED)

### 3. Investment Page Core Logic
- ✅ Added portfolio state management
- ✅ Implemented portfolio filtering logic
- ✅ Updated form handlers to include portfolio_id
- ✅ Modified calculations to work per-portfolio
- ✅ Created portfolio growth comparison data
- ✅ Added portfolio management functions (create/update/delete)
- **File**: `app/(dashboard)/investments/page.tsx` (PARTIALLY UPDATED)

## 🔧 TO DO: Apply Database Migration

**Before using the portfolio feature**, run this SQL in your Supabase dashboard:

```bash
# Via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of: supabase/migrations/add_portfolios.sql
3. Run the SQL

# Or via CLI (if you have Supabase CLI installed):
supabase db push
```

## 📋 TODO: UI Components Needed

The core logic is done, but you need to add these UI elements to `app/(dashboard)/investments/page.tsx`:

### 1. Portfolio Selector (After the header, before summary cards)

Add this section around line 548 (after the header div closes):

```tsx
{/* Portfolio Selector & Management */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700"
>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-white flex items-center gap-2">
      <FolderKanban className="w-5 h-5 text-indigo-400" />
      Portfolios
    </h2>
    <button
      onClick={() => {
        setEditingPortfolio(null);
        setPortfolioFormData({ name: "", description: "", color: "#8b5cf6" });
        setIsPortfolioModalOpen(true);
      }}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all text-sm"
    >
      <Plus className="w-4 h-4" />
      New Portfolio
    </button>
  </div>

  <div className="flex flex-wrap gap-2">
    {portfolios.map(portfolio => {
      const isSelected = selectedPortfolioIds.includes(portfolio.id);
      const stats = getPortfolioStats(portfolio.id);

      return (
        <div
          key={portfolio.id}
          className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all border-2 ${
            isSelected
              ? 'border-indigo-500 bg-indigo-500/20'
              : 'border-gray-700 bg-gray-800 hover:border-gray-600'
          }`}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: portfolio.color }}
          />
          <div
            onClick={() => {
              setSelectedPortfolioIds(prev =>
                prev.includes(portfolio.id)
                  ? prev.filter(id => id !== portfolio.id)
                  : [...prev, portfolio.id]
              );
            }}
            className="flex-1"
          >
            <p className="text-white font-medium text-sm">{portfolio.name}</p>
            <p className="text-xs text-gray-400">${stats.value.toFixed(2)}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingPortfolio(portfolio);
                setPortfolioFormData({
                  name: portfolio.name,
                  description: portfolio.description || "",
                  color: portfolio.color,
                });
                setIsPortfolioModalOpen(true);
              }}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <Pencil className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePortfolio(portfolio.id);
              }}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>
      );
    })}
  </div>
</motion.div>
```

### 2. Update Portfolio Growth Chart (Around line 675)

Replace the single `<Line>` element with dynamic lines for each selected portfolio:

```tsx
{/* Replace the single Line with this: */}
{selectedPortfolioIds.map((portfolioId, index) => {
  const portfolio = portfolios.find(p => p.id === portfolioId);
  if (!portfolio) return null;

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
  const color = colors[index % colors.length];

  return (
    <Line
      key={portfolioId}
      type="monotone"
      dataKey={portfolio.name}
      stroke={color}
      strokeWidth={3}
      dot={{ fill: color, r: 5 }}
      activeDot={{ r: 7 }}
      name={portfolio.name}
    />
  );
})}
```

### 3. Portfolio Modal (Add before the closing `</div>` at the end, around line 1050)

```tsx
{/* Portfolio Management Modal */}
{isPortfolioModalOpen && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onClick={() => setIsPortfolioModalOpen(false)}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-2xl font-bold text-white mb-6">
        {editingPortfolio ? "Edit Portfolio" : "New Portfolio"}
      </h2>
      <form onSubmit={handlePortfolioSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Portfolio Name
          </label>
          <input
            type="text"
            value={portfolioFormData.name}
            onChange={(e) => setPortfolioFormData({ ...portfolioFormData, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            placeholder="e.g., Crypto Portfolio, Stocks, Retirement"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={portfolioFormData.description}
            onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            placeholder="Brief description of this portfolio"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316'].map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setPortfolioFormData({ ...portfolioFormData, color })}
                className={`w-10 h-10 rounded-lg transition-all ${
                  portfolioFormData.color === color ? 'ring-2 ring-white scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => setIsPortfolioModalOpen(false)}
            className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            {editingPortfolio ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </motion.div>
  </motion.div>
)}
```

### 4. Add Portfolio Selector to Investment Form (Around line 955, in the investment modal)

Add this before the "Amount Invested" field:

```tsx
<div>
  <label className="block text-sm font-medium text-gray-400 mb-2">
    Portfolio
  </label>
  <select
    value={formData.portfolio_id}
    onChange={(e) => setFormData({ ...formData, portfolio_id: e.target.value })}
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
```

## 🎯 How It Works

1. **Multiple Portfolios**: Users can create unlimited portfolios (e.g., "Crypto", "Stocks", "Retirement")
2. **Portfolio Comparison**: Select multiple portfolios to compare their growth in the chart
3. **Color Coding**: Each portfolio has a custom color for easy identification
4. **Filtering**: Summary stats update based on selected portfolios
5. **Investment Assignment**: Each investment can be assigned to a portfolio

## 🚀 Next Steps

1. Run the database migration
2. Add the 4 UI components listed above
3. Test creating portfolios
4. Test adding investments to portfolios
5. Test the comparison feature

The core logic is complete - just add the UI components and you're done!
