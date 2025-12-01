# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FoxWise ToDo is a feature-rich task management application built with Next.js 14 that combines traditional todo management with AI-powered features, gamification (badges), and advanced planning tools. The app uses Clerk for authentication, Supabase for database operations, and Google Gemini AI for natural language task parsing and chat features.

## Development Commands

### Starting the Development Server
```bash
npm run dev
# Runs on http://localhost:3000
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Testing Cron Jobs (Automated Tasks)
```bash
# Test all cron jobs
npm run test:cron

# Test only report generation
npm run test:cron:reports

# Test only reminder sending
npm run test:cron:reminders
```

## Architecture Overview

### Authentication & Security Model

**Critical Pattern**: This app uses a **hybrid security model** that differs from typical Supabase implementations:

1. **Authentication**: Clerk manages all user authentication (not Supabase Auth)
2. **Database Access**: All database operations use the Supabase Service Role Key, which **bypasses Row Level Security (RLS)**
3. **Security Layer**: Authorization is enforced in Next.js API routes using `auth()` from `@clerk/nextjs/server`
4. **Never Direct Access**: Frontend code NEVER directly accesses Supabase - all database operations go through authenticated API routes

**Pattern in API Routes**:
```typescript
// 1. Force dynamic rendering (required for auth())
export const dynamic = 'force-dynamic';

// 2. Get authenticated user
const { userId } = await auth();
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 3. Create Supabase client (uses Service Role Key)
const supabase = await createClient();

// 4. Filter by user_id to ensure data isolation
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId); // ALWAYS filter by userId
```

**Important**: Always add `.eq('user_id', userId)` to queries to ensure users only access their own data.

### Database Client Pattern

The `lib/supabase.ts` exports two functions:
- `createClient()`: Async function that returns a new Supabase client - use in API routes
- `supabase`: Singleton instance - use sparingly for non-API server-side operations

### Core Database Tables

**Main Tables**:
- `todo_lists`: Task categories/lists (Home, Family, Work, etc.)
- `tasks`: Individual tasks with priorities, due dates, recurring options
- `day_planner`: Hour-by-hour task scheduling for specific dates
- `projects`: Multi-step projects that can be broken down into tasks
- `project_steps`: Individual steps within projects
- `calendar_notes`: User notes attached to calendar dates
- `task_reminders`: Scheduled reminders for tasks
- `user_settings`: User preferences, timezone, language, etc.

**Badge/Gamification Tables**:
- `user_badges`: Earned achievement badges
- `task_completion_times`: Tracks when tasks are completed (for badge logic)

**AI/Premium Tables**:
- `conversations`: Chat history with AI assistant
- `ai_reports`: Generated productivity reports
- `user_memory`: AI context/memory about user preferences
- `subscriptions`: Stripe subscription data (Pro/Premium tiers)

**Important Relationships**:
- Tasks belong to `todo_lists` (via `list_id`)
- Tasks can appear in `day_planner` for specific dates
- Projects contain multiple `project_steps`
- Project steps can be copied to `tasks`

### API Route Organization

API routes follow RESTful conventions with special patterns:

**Standard CRUD Routes**:
- `GET /api/tasks` - List tasks (supports filtering via query params)
- `POST /api/tasks` - Create task
- `PATCH /api/tasks` - Update task
- `DELETE /api/tasks?id=xxx` - Delete task

**AI-Powered Routes**:
- `/api/parse-task` - Parses natural language into structured task data
- `/api/parse-project` - Parses project descriptions into steps
- `/api/ai-planner` - AI-powered day planning suggestions
- `/api/chat` or `/api/conversations` - Conversational AI assistant
- `/api/speech-to-text` - Voice input transcription
- `/api/tts` - Text-to-speech for AI responses

**Badge System Routes**:
- `/api/badges` - Get user badges
- `/api/badges/check-daily` - Trigger daily badge checks
- `/api/task-completion` - Records task completion for badge tracking

**Scheduled/Cron Routes** (require CRON_SECRET):
- `/api/cron/generate-reports` - Generates daily/weekly reports
- `/api/send-reminders` - Sends task reminders

**Subscription Routes**:
- `/api/stripe/create-checkout` - Create Stripe checkout session
- `/api/stripe/webhook` - Handle Stripe webhooks
- `/api/subscription` - Get current subscription status

### Badge System Architecture

The badge system rewards user productivity with achievements. **Critical**: Badge logic is triggered automatically when tasks are marked as `completed` in `/api/tasks` PATCH handler (around line 179).

**Badge Types**:
- `perfect_day`: All scheduled tasks for the day completed
- `flexible`: Unscheduled task completed
- `speed_task`: Task completed ≥15min before allocated time
- `speed_day_*`: Time saved across the day (bronze/silver/gold)
- `after_hours`: Task completed after 8pm
- `exceptional_day_*`: 10-35%+ more tasks than 7-day average
- `exceptional_category`/`exceptional_global`: 20%+ improvement in completion

**How It Works**:
1. When task status changes to `completed`, code in `/api/tasks` route calculates badge eligibility
2. System checks `day_planner` for planned time vs actual completion time
3. Badges are inserted into `user_badges` table
4. Time-based calculations use user's timezone from `user_settings`

**Key Functions** (in `lib/badges.ts`):
- `calculateTimeSaved()`: Compares planned vs actual completion time
- `isAfterHours()`: Checks if completion is after 8pm in user's timezone
- `getExceptionalDayTier()`: Determines bronze/silver/gold tier

### AI Features

**Natural Language Task Parsing**:
- Endpoint: `/api/parse-task`
- Uses: Google Gemini 2.5 Flash
- Features: Detects dates ("tomorrow", "next Monday"), times ("at 2pm"), priorities, categories
- Supports: English and French

**Project Planning**:
- Endpoint: `/api/parse-project` or `/api/ai-project-planner`
- Breaks down project descriptions into actionable steps
- Can estimate time and suggest priorities

**AI Assistant (Foxy)**:
- Conversational AI that helps manage tasks
- Has access to user's task history, preferences, and memory
- Can create tasks, answer questions about productivity
- Premium feature with voice mode support

### Subscription Tiers

**Free Tier**: Basic task management
**Pro Tier** ($4.99/month): Advanced features + some AI
**Premium Tier** ($14.99/month): Full AI features, voice assistant, unlimited reports

Check subscription status in API routes:
```typescript
const { subscription } = await getUserSubscription(userId);
if (!subscription || subscription.tier === 'free') {
  return NextResponse.json({ error: 'Premium feature' }, { status: 403 });
}
```

### Frontend Architecture

**Route Structure**:
- `/` - Landing page
- `/sign-in`, `/sign-up` - Authentication pages (Clerk)
- `/(dashboard)/*` - Protected routes with sidebar layout
  - `/dashboard` - Main dashboard with charts and statistics
  - `/tasks` - Task list view with filtering
  - `/day-planner` - Hour-by-hour schedule view
  - `/calendar` - Calendar view with task deadlines
  - `/projects` - Project management
  - `/routines` - Recurring task templates
  - `/reports` - AI-generated productivity reports
  - `/settings` - User preferences

**Key Components**:
- `Sidebar.tsx`: Main navigation (visible on dashboard routes)
- `AddTaskModal.tsx`: Task creation with AI parsing
- `AIChatModal.tsx`: Chat interface with AI assistant
- `BadgeDisplay.tsx`: Shows earned badges
- `AIPlannerModal.tsx`: AI-powered day planning
- Chart components in `components/charts/`

**Styling**:
- Dark theme with gradient accents (purple/blue/pink)
- Tailwind CSS with custom classes
- Framer Motion for animations

### Important Patterns

**Dynamic Routes**:
All API routes that use `auth()` from Clerk MUST export:
```typescript
export const dynamic = 'force-dynamic';
```
This prevents Next.js from statically generating routes that need authentication.

**Type Safety**:
Database types are auto-generated in `lib/database.types.ts` from the Supabase schema. When database schema changes, regenerate these types.

**Task Completion Flow**:
When marking a task complete, the system:
1. Updates task status to `completed`
2. Records completion time in `task_completion_times`
3. Calculates badge eligibility (perfect_day, speed_task, etc.)
4. Inserts earned badges into `user_badges`
5. Checks for day-level badges (exceptional_day, perfect_day)

**Timezone Handling**:
User timezone is stored in `user_settings.timezone` and used for:
- Badge calculations (especially after_hours badge)
- Date boundaries for "today's tasks"
- Report generation
Always use `getUserTimezone()` from `lib/user-timezone.ts` for time-sensitive operations.

## Environment Variables

Required for all environments:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`: Clerk authentication
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase database
- `GEMINI_API_KEY`: Google AI for task parsing and chat
- `NEXT_PUBLIC_APP_URL`: Application base URL

Required for premium features:
- `OPENAI_API_KEY`: Alternative AI provider
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Payment processing
- `RESEND_API_KEY`: Email notifications
- `CRON_SECRET`: Secure cron job endpoints

See `.env.example` for full list and descriptions.

## Database Schema Location

The complete SQL schema is in `supabase_schema.sql` at the project root. When making database changes:
1. Update the SQL file
2. Run the SQL in Supabase SQL Editor
3. Regenerate types if table structure changed

## Testing Utilities

Scripts in `/scripts/` directory:
- `setup-badges-db.js`: Initialize badge tables
- `grant-me-premium.js`: Grant premium tier to a user (development)
- `check-portfolios.js`: Verify data integrity
- Database migration and RLS management scripts

## Key Implementation Notes

1. **Always filter by user_id**: Every database query must include `.eq('user_id', userId)` to prevent data leakage
2. **Badge logic runs automatically**: Don't manually trigger badge creation - it happens in the task completion flow
3. **Use Service Role Key carefully**: It bypasses RLS, so API route authorization is critical
4. **Timezone matters**: Always use user timezone for date calculations and badge timestamps
5. **AI costs money**: Google Gemini API calls should be monitored in production
6. **Dynamic route export**: Required for all routes using `auth()`
