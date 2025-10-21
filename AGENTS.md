# AGENTS.md - Coding Guidelines for cto.new

## Commands
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Typecheck**: `pnpm typecheck`
- **Test**: `pnpm test` (Jest, all tests)
- **Single test**: `pnpm test -- path/to/test.ts`
- **E2E tests**: `pnpm e2e`
- **Database**: `pnpm db:generate` (schema), `pnpm db:push` (migrate)

## Architecture
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode, noUncheckedIndexedAccess)
- **Database**: Drizzle ORM + PostgreSQL (Neon)
- **Auth**: NextAuth v5
- **State**: Zustand
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **Calendar**: FullCalendar with drag-and-drop (@dnd-kit)
- **Tables**: users, accounts, sessions, tasks, events

## Code Style
- **Imports**: Use path aliases (@/components, @/lib, @/app, @/db, @/types)
- **Formatting**: ESLint (next/core-web-vitals), auto-format with editor
- **Types**: Strict TypeScript, avoid any, use proper types for JSON fields
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error handling**: Use try/catch in async functions, throw descriptive errors
- **Components**: Functional with hooks, prefer composition over inheritance
- **Tests**: Jest for unit tests (lib/), Playwright for E2E (e2e/)
