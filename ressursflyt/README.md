# Ressursflyt

Production-oriented MVP for Norwegian municipality/school resource planning.

## Stack

- Next.js App Router + TypeScript
- Prisma + PostgreSQL
- Auth.js (NextAuth) with Prisma adapter
- tRPC + TanStack Query
- next-intl locale segment routing (`/nb`, `/nn`, `/en`)
- Tailwind CSS

## Core features included

- Invite-only access with hashed invite tokens (`sha256`)
- Auth provider setup for Feide, ID-porten, local password, magic link
- Municipality-scoped RBAC (roles + permissions + role-permission assignments)
- Academic year lifecycle (list, lock/unlock, create from previous template)
- Year templating procedure with student trinn rollover, contract/demand/allocation copying
- School overview rollups (Frame vs Demand vs Allocated + capacity mismatch flags)
- Locale routes and translation messages for nb/nn/en

## Required environment variables

See [.env.example](.env.example).

## Local setup

1. Install dependencies

```bash
npm install
```

2. Configure env file

```bash
cp .env.example .env
```

3. Generate Prisma client

```bash
npm run prisma:generate
```

4. Create and run initial migration

```bash
npm run prisma:migrate -- --name init
```

5. Seed demo data

```bash
npm run prisma:seed
```

6. Start dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo credentials

- Email: `admin@example.com`
- Password: `Admin1234!`

## Important paths

- Prisma schema: [prisma/schema.prisma](prisma/schema.prisma)
- Seed script: [prisma/seed.ts](prisma/seed.ts)
- Auth route: [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/%5B...nextauth%5D/route.ts)
- tRPC route: [src/app/api/trpc/[trpc]/route.ts](src/app/api/trpc/%5Btrpc%5D/route.ts)
- i18n messages: [src/i18n/messages/nb.json](src/i18n/messages/nb.json), [src/i18n/messages/nn.json](src/i18n/messages/nn.json), [src/i18n/messages/en.json](src/i18n/messages/en.json)
