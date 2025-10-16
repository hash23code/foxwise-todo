# FoxWise ToDo

A modern, feature-rich todo management application built with Next.js 14, featuring a beautiful dark UI with smooth animations, AI-powered task creation with voice input, comprehensive task organization, and smart reminders.

## Features

- **Modern Dark UI** - Beautiful gradient-based dark theme with smooth animations using Framer Motion
- **Secure Authentication** - User authentication powered by Clerk
- **Dashboard** - Comprehensive overview with animated charts showing task completion, productivity trends, and category distribution
- **Multiple List Categories** - Organize tasks into different lists (Home, Family, Work, Business 01, Business 02, and custom categories)
- **AI-Powered Task Creation** - Add tasks naturally using voice input with AI interpretation
- **Smart Calendar Integration** - Visual calendar with task scheduling and deadline tracking
- **Push Notifications** - Real-time push notifications for task reminders and deadlines
- **Email Reminders** - Configurable email reminders for important tasks and deadlines
- **Task Management** - Create, edit, complete, and organize tasks with priorities and due dates
- **Real-time Charts** - Interactive charts using Recharts showing productivity metrics
- **Database Integration** - Supabase for data persistence and management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase
- **AI**: Google Generative AI (Gemini)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Date Utilities**: date-fns
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Clerk account ([clerk.com](https://clerk.com))
- A Supabase account ([supabase.com](https://supabase.com))
- A Google AI API key ([ai.google.dev](https://ai.google.dev))

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd FoxWise_ToDo
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

### 5. Set up Google AI API

1. Get your API key from [ai.google.dev](https://ai.google.dev)
2. Add it to `.env.local`:

```env
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
FoxWise_ToDo/
├── app/
│   ├── (dashboard)/          # Dashboard layout group
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── tasks/            # Task management page
│   │   ├── calendar/         # Calendar view page
│   │   ├── categories/       # List categories page
│   │   ├── settings/         # Settings page
│   │   └── layout.tsx        # Dashboard layout
│   ├── api/                  # API routes
│   │   ├── tasks/            # Task management endpoints
│   │   ├── reminders/        # Reminder endpoints
│   │   └── ai/               # AI voice processing
│   ├── sign-in/              # Sign-in page
│   ├── sign-up/              # Sign-up page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── charts/               # Chart components
│   ├── TaskModal.tsx         # Add/Edit task modal
│   ├── VoiceInput.tsx        # AI voice input component
│   ├── Sidebar.tsx           # Navigation sidebar
│   └── StatCard.tsx          # Stat card component
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── database.types.ts     # Database TypeScript types
│   └── api/                  # API utilities
├── middleware.ts             # Clerk authentication middleware
├── supabase_schema.sql       # Database schema
└── package.json
```

## Database Schema

The application uses the following main tables:

- **todo_lists** - Stores list categories (Home, Family, Work, Business, etc.)
- **tasks** - Stores all tasks with priorities, deadlines, and completion status
- **task_reminders** - Stores reminder configurations for tasks
- **calendar_notes** - Stores calendar events and notes

All tables include Row Level Security (RLS) policies for data protection.

## Features in Detail

### Dashboard
- Overview of total tasks, completed tasks, pending tasks, and overdue tasks
- Visual charts showing task completion trends, category distribution, and productivity metrics
- Recent tasks list with quick actions

### Task Management
- Create and manage tasks across different list categories
- Set priorities (Low, Medium, High, Urgent)
- Add due dates and deadlines
- Mark tasks as complete
- Add notes and descriptions
- Voice-powered task creation with AI

### List Categories
- Pre-configured categories: Home, Family, Work, Business 01, Business 02
- Create custom categories
- Color-coded organization
- Filter tasks by category
- Category-specific statistics

### Calendar View
- Visual calendar interface
- Task scheduling and deadline visualization
- Drag-and-drop task rescheduling
- Calendar notes and events
- Monthly, weekly, and daily views

### AI Voice Input
- Natural language task creation
- Voice-to-text conversion
- AI interpretation of task details (priority, deadline, category)
- Supports multiple languages

### Reminders
- Push notifications for upcoming deadlines
- Email reminders (customizable timing)
- Recurring reminders for repeated tasks
- Smart reminder scheduling

### Settings
- Profile management
- Notification preferences (push, email)
- Default list category
- Reminder timing configuration
- Theme customization

## Customization

### Adding New List Categories

You can add new list categories directly from the Categories page or by modifying the default categories in the database migration.

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
