# Accounting KZ

A modern accounting application built with Hono, Drizzle, PostgreSQL, and React.

## Tech Stack

### Backend

- Hono (Web Framework)
- Drizzle ORM
- PostgreSQL (Database)
- Docker (Database Container)

### Frontend

- React
- TanStack Router
- ShadcN UI Components
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/accounting-kz.git
cd accounting-kz
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the PostgreSQL database:

```bash
docker-compose up -d
```

4. Run database migrations:

```bash
cd packages/backend
pnpm db:generate
pnpm db:push
```

### Development

1. Start the backend development server:

```bash
cd packages/backend
pnpm dev
```

2. Start the frontend development server:

```bash
cd packages/frontend
pnpm dev
```

## Project Structure

```
accounting-kz/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── migrations/
│   │   │   │   ├── schema.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── routes/
│       │   ├── lib/
│       │   └── main.tsx
│       ├── index.html
│       └── package.json
├── docker-compose.yml
└── package.json
```
