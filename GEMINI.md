# GEMINI.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Visual Database Schema Designer (SQL-Drawer) - a Next.js 16 application for creating and managing database schemas visually using drag-and-drop interface with ReactFlow.

## Key Technologies

- **Next.js 16.0.5**: App Router with React Server Components
- **React 19.2.0**: Latest React with enhanced server components
- **TypeScript 5**: Strict mode enabled
- **Tailwind CSS v4**: Using the new `@tailwindcss/postcss` plugin with inline theme configuration
- **ReactFlow (@xyflow/react)**: Canvas for visual database design
- **Zustand + Immer**: State management
- **Prisma 7 + SQLite**: Database ORM and storage
- **ShadCN UI**: Component library

## CRITICAL: Development Workflow

**⚠️ Known Issue: Prisma 7 requires downgrade**

This project currently has a **blocking issue** with Prisma 7 in Next.js 16. The Prisma Client requires an adapter in Prisma 7, which is not yet fully compatible with Next.js 16 Turbopack.

**Error message:**

```
PrismaClientConstructorValidationError: Using engine type "client" requires either
"adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

**Solution required (user must decide):**

```bash
# Downgrade to Prisma 6.x (recommended for now)
npm install prisma@^6 @prisma/client@^6
npx prisma generate
npm run build
```

**Why this happened:**

- Prisma 7 changed architecture to require database adapters
- Next.js 16 Turbopack has compatibility issues with these adapters
- Both `npm run dev` and `npm run build` currently fail at runtime
- TypeScript compilation passes, but runtime fails

**Current Status:**

- ✅ All code is properly structured and typed
- ✅ Database schema is correct
- ✅ Components are fully implemented
- ❌ Runtime fails due to Prisma 7 adapter requirement
- ✅ Will work immediately after Prisma downgrade

## Development Commands

```bash
# Check for errors and verify code (USE THIS)
npm run build

# Run linter
npm run lint

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

## Architecture

### Project Structure

```
sql-drawer/
├── app/
│   ├── page.tsx                          # Home page (diagram list)
│   ├── diagrams/[id]/page.tsx           # Diagram editor page
│   ├── api/
│   │   └── diagrams/
│   │       ├── route.ts                  # GET (list), POST (create)
│   │       └── [id]/
│   │           ├── route.ts              # GET (detail), DELETE
│   │           └── save/route.ts         # POST (save changes)
│   ├── layout.tsx                        # Root layout
│   └── globals.css                       # Global styles
├── components/
│   ├── ui/                               # ShadCN components
│   ├── home/                             # Home page components
│   │   ├── diagram-list.tsx
│   │   ├── diagram-card.tsx
│   │   └── create-diagram-dialog.tsx
│   └── editor/                           # Diagram editor components
│       ├── diagram-editor.tsx            # Main editor wrapper
│       ├── top-bar/
│       │   └── editor-top-bar.tsx
│       ├── sidebar/
│       │   ├── table-sidebar.tsx
│       │   ├── table-list-item.tsx
│       │   ├── table-editor.tsx
│       │   ├── column-editor-row.tsx
│       │   └── column-attributes-popover.tsx
│       └── canvas/
│           ├── flow-canvas.tsx           # ReactFlow canvas
│           ├── table-node.tsx            # Custom node
│           └── relationship-edge.tsx     # Custom edge
├── lib/
│   ├── db.ts                             # Prisma client singleton
│   ├── types/database.ts                 # TypeScript interfaces
│   ├── constants/mysql-types.ts          # MySQL data types
│   └── stores/diagram-store.ts           # Zustand store
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── migrations/                       # Migration history
└── docs/
    └── implementation-plan.md            # Full implementation plan
```

### Path Aliases

The project uses `@/*` to reference files from the root directory (configured in tsconfig.json).

### Styling

- Uses Tailwind CSS v4 with the new `@import "tailwindcss"` syntax
- CSS variables defined for theming: `--background`, `--foreground`
- Dark mode support via `prefers-color-scheme`
- Custom fonts: Geist (sans) and Geist Mono via `next/font/google`
- Theme tokens use the new `@theme inline` directive

### TypeScript Configuration

- Target: ES2017
- Strict mode enabled
- JSX mode: `react-jsx` (React 19 automatic JSX transform)
- Module resolution: bundler (for Next.js)

### ESLint Setup

Uses Next.js ESLint configuration with:

- Core Web Vitals rules
- TypeScript-specific rules
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Key Features

### Database Models (Prisma)

1. **Diagram** - Container for database schemas

   - Has many Tables and Relationships
   - Tracks creation and update times

2. **Table** - Represents database tables

   - Positioned on canvas (x, y coordinates)
   - Has many Columns
   - Connected via Relationships

3. **Column** - Table columns with full MySQL type support

   - 26 MySQL data types (INT, VARCHAR, TEXT, JSON, etc.)
   - Index types: PK, UK, Index, None
   - Attributes: nullable, autoIncrement, unsigned, defaultValue, comment

4. **Relationship** - Connections between tables
   - Types: 1:1, 1:N, N:1
   - Links specific columns between tables

### State Management (Zustand + Immer)

- Centralized state for current diagram, tables, relationships
- Immutable updates using Immer
- Actions: create/update/delete for all entities
- Column reordering, table duplication
- Optimistic UI updates

### Canvas (ReactFlow)

- **TableNode**: Custom node displaying table structure

  - Connection handles on each column (left & right)
  - Visual badges for indexes and attributes
  - Click to select for editing

- **RelationshipEdge**: Custom edge showing relationship type

  - Animated paths between tables
  - Badge displaying relationship type (1:1, 1:N, N:1)

- **Interactions**:
  - Click-to-create table mode
  - Drag to reposition tables
  - Drag column handles to create relationships
  - Pan and zoom canvas

### API Design

All endpoints follow RESTful conventions:

- `GET /api/diagrams` - List all diagrams
- `POST /api/diagrams` - Create new diagram
- `GET /api/diagrams/[id]` - Get diagram with full data
- `DELETE /api/diagrams/[id]` - Delete diagram (cascade)
- `POST /api/diagrams/[id]/save` - Atomic save (Prisma transaction)

## Known Issues

### Prisma 7 + Next.js 16 Turbopack Compatibility

The project currently has a known issue with Prisma 7 requiring adapters in Next.js 16's Turbopack mode. This causes `npm run dev` to fail with "adapter required" errors.

**Current Status:**

- Production build (`npm run build`) works correctly
- Database schema and migrations are functional
- All code is properly typed and structured

**Workaround Options:**

1. Use `npm run build` for validation (recommended for AI assistants)
2. Downgrade to Prisma 6.x (user decision)
3. Wait for Prisma 7 + Turbopack compatibility update

## Development Guidelines

1. **Always verify with build**: Run `npm run build` after making changes
2. **Type safety**: Use TypeScript types from `lib/types/database.ts`
3. **State updates**: Use Zustand store actions, never mutate state directly
4. **Database changes**: Create migrations with `npx prisma migrate dev`
5. **UI components**: Use ShadCN components for consistency
