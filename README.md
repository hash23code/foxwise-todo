# Budget Tracker

A modern, feature-rich budget tracking application built with Next.js 14, featuring a beautiful dark UI with smooth animations, comprehensive financial tracking, and secure authentication.

## Features

- **Modern Dark UI** - Beautiful gradient-based dark theme with smooth animations using Framer Motion
- **Secure Authentication** - User authentication powered by Clerk
- **Dashboard** - Comprehensive overview with animated charts showing budget distribution, income vs expenses, and investment growth
- **Budget Management** - Create, edit, and track budgets by category with visual progress indicators
- **Income/Outcome Tracking** - Manage and categorize income and expenses with detailed transaction views
- **Transaction History** - View all transactions with advanced filtering and search capabilities
- **Investment Tracking** - Monitor your investment portfolio with gain/loss calculations
- **Settings** - Customize preferences including currency, language, and notifications
- **Real-time Charts** - Interactive charts using Recharts with gradient colors and animations
- **Database Integration** - Supabase for data persistence and management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Date Utilities**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Clerk account ([clerk.com](https://clerk.com))
- A Supabase account ([supabase.com](https://supabase.com))

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd budget_tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Clerk Authentication

1. Create a new application at [clerk.com](https://clerk.com)
2. Get your API keys from the Clerk dashboard
3. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

4. Add your Clerk keys to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 4. Set up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Project Settings > API
3. Add your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the database schema:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `supabase_schema.sql`
   - Click "Run" to create all tables and policies

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
budget_tracker/
├── app/
│   ├── (dashboard)/          # Dashboard layout group
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── budget/           # Budget management page
│   │   ├── income-outcome/   # Income/Outcome page
│   │   ├── transactions/     # Transactions page
│   │   ├── investments/      # Investments page
│   │   ├── settings/         # Settings page
│   │   └── layout.tsx        # Dashboard layout
│   ├── sign-in/              # Sign-in page
│   ├── sign-up/              # Sign-up page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page (redirects to dashboard)
├── components/
│   ├── charts/               # Chart components
│   │   ├── BudgetChart.tsx
│   │   ├── IncomeExpenseChart.tsx
│   │   └── InvestmentsChart.tsx
│   ├── Sidebar.tsx           # Navigation sidebar
│   └── StatCard.tsx          # Stat card component
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── database.types.ts     # Database TypeScript types
├── middleware.ts             # Clerk authentication middleware
├── supabase_schema.sql       # Database schema
└── package.json
```

## Database Schema

The application uses three main tables:

- **budgets** - Stores budget categories and limits
- **transactions** - Stores income and expense transactions
- **investments** - Stores investment portfolio data

All tables include Row Level Security (RLS) policies for data protection.

## Features in Detail

### Dashboard
- Overview of total balance, monthly income, monthly expenses, and investments
- Visual charts showing budget distribution, income vs expenses trend, and investment growth
- Recent transactions list

### Budget Management
- Create and manage budget categories
- Set monthly or yearly budget limits
- Visual progress bars showing spending vs budget
- Edit and delete budgets

### Income/Outcome
- Add income and expense transactions
- Filter by type (all, income, expense)
- View total income, expenses, and balance
- Detailed transaction information with dates

### Transactions
- Comprehensive transaction history
- Search by description or category
- Filter by transaction type
- Sort by date or amount
- Summary statistics

### Investments
- Track investment portfolio
- Calculate gains/losses automatically
- View return percentages
- Monitor total portfolio value
- Add, edit, and delete investments

### Settings
- Profile management
- Currency and language preferences
- Notification settings (email, push, budget alerts, transaction alerts)
- Theme customization

## Customization

### Adding New Categories

You can customize budget and transaction categories by modifying the form validation or adding predefined options in the respective pages.

### Changing Colors

The application uses Tailwind CSS. You can customize colors in `tailwind.config.ts` or directly in component files using Tailwind's utility classes.

### Modifying Charts

Chart components are located in `components/charts/`. You can customize:
- Colors and gradients
- Animation duration
- Data format
- Chart types

## Deployment

### Deploy to Vercel

The easiest way to deploy is using Vercel:

```bash
npm install -g vercel
vercel
```

Make sure to add all environment variables in the Vercel dashboard.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with by Claude Code
