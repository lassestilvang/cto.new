Unified Planner – Next.js Daily Task & Calendar

Overview
- Modern professional planner with unified calendar and tasks
- Weekly calendar with drag-and-drop scheduling
- Sidebar task management with categories and overdue highlighting
- Dark-first clean UI, responsive, with shadcn/ui + Tailwind
- State managed with Zustand; server scaffolding for Auth.js, Drizzle ORM, Neon, Upstash Redis

Tech Stack
- Next.js 15 (App Router), TypeScript (strict)
- Tailwind CSS, shadcn/ui components
- Zustand for client state
- dnd-kit for drag-and-drop
- Framer Motion animations
- zod for validation
- date-fns for dates
- Jest unit tests; Playwright E2E
- Auth.js (NextAuth) scaffold with Credentials provider (demo mode)
- Drizzle ORM + Neon (optional, disabled by default)
- Upstash Redis (optional)

Quick Start (Demo mode)
1) Prereqs: Node >= 18.18, pnpm >= 9
2) Install deps
   pnpm install
3) Run dev server
   pnpm dev
4) Open http://localhost:3000

Notes
- Demo mode is enabled by default (USE_DEMO_DATA=true). Data persists in localStorage via Zustand persist.
- A seeded calendar event and example task populate on first run.
- Drag tasks from the sidebar onto a calendar timeslot to schedule. Click a timeslot to quickly add a 1-hour task.
- Conflicts are detected and prevented when scheduling.

Production Setup
1) Create a Neon Postgres database and Upstash Redis
2) Create a NextAuth secret
3) Create an .env file from .env.example and fill values
4) Generate DB migrations and push
   pnpm db:generate
   pnpm db:push
5) Disable demo mode by setting USE_DEMO_DATA=false
6) Build and start
   pnpm build
   pnpm start

Environment Variables (.env)
- DATABASE_URL=postgres://... (Neon)
- NEXTAUTH_SECRET=your-strong-secret
- NEXTAUTH_URL=https://your-deployment-url
- UPSTASH_REDIS_URL=...
- UPSTASH_REDIS_TOKEN=...
- USE_DEMO_DATA=true|false

Auth
- Auth.js (NextAuth) Credentials is configured. In demo mode, any email signs in.
- Login route: /login

Integrations (Scaffold)
- API endpoint: POST /api/integrations/import { provider, tasks: [...] }
- Normalizes tasks from Notion, ClickUp, Linear, Todoist into a common shape.
- Extend server connectors in server/integrations (to be implemented) to fetch from providers using API tokens, then POST to the endpoint or directly map to DB.

Testing
- Unit tests (Jest)
  pnpm test
- E2E (Playwright)
  pnpm e2e

Project Structure (selected)
- app/
  - page.tsx (Planner board: sidebar + weekly calendar)
  - api/
    - auth/[...nextauth]/route.ts (Auth.js)
    - integrations/import/route.ts
- components/
  - calendar/weekly-calendar.tsx
  - sidebar/task-sidebar.tsx
  - ui/* (shadcn/ui primitives)
  - providers/theme-provider.tsx
- lib/
  - store.ts (Zustand store)
  - utils.ts, env.ts, db.ts
- db/
  - schema.ts (Drizzle schema)

Stretch Ideas (not fully implemented)
- Natural language task parsing (suggest plugging in a parser and hooking quick-add)
- Smart suggestions for scheduling based on availability (analyze free blocks via conflictsAt)
- Recurring events/tasks (extend schema with RRULE and generate instances)

Accessibility & Performance
- Keyboard accessible controls
- View Transition API enabled in next.config
- Framer Motion for subtle animations

Deployment
- Vercel recommended. Set environment variables in Vercel dashboard.
- Neon + Upstash managed services work well with Vercel serverless.

License
- MIT
