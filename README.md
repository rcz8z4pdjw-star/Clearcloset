# Ascent Capital Partners — Next Gen Platform

> **"Preparing heirs to be wise stewards."**

An invite-only education, mentorship, and stewardship practice platform for children of client families ages 10–35.

## Overview

The Next Gen Platform provides a comprehensive learning and development environment for next-generation family members. Key features include:

- **Learning Hub**: Age-appropriate educational tracks covering wealth foundations, investing, career planning, and more
- **Mentorship System**: One-on-one mentorship with session scheduling, notes, and action plans
- **IC Practicum**: Practice portfolio management with trade request/approval workflows
- **Community & Cohorts**: Age-banded cohorts with discussion forums and events
- **Philanthropic Leadership**: Giving strategy development and grant tracking
- **Family Governance**: Governance education and simulation exercises
- **Admin CMS**: Full content management with approval workflows

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Auth0 (with dev auth fallback)
- **File Storage**: MinIO (S3-compatible)
- **Email**: Resend

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- (Optional) MinIO for file uploads
- (Optional) Auth0 account for production auth

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url>
cd ascent-capital-nextgen

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

Key environment variables:

```env
# Database (required)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ascent_nextgen?schema=public"

# Dev Auth (enabled by default for local development)
USE_DEV_AUTH="true"
DEV_AUTH_SECRET="dev-secret-change-in-production"

# Auth0 (optional - for production)
AUTH0_SECRET="your-auth0-secret"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

With dev auth enabled (default), use these email addresses to log in as different roles:

| Role | Email | Age Band |
|------|-------|----------|
| Admin | admin@ascent.dev | N/A |
| Compliance | compliance@ascent.dev | N/A |
| Program Director | director@ascent.dev | N/A |
| CIO | cio@ascent.dev | N/A |
| Mentor 1 | mentor1@ascent.dev | N/A |
| Mentor 2 | mentor2@ascent.dev | N/A |
| Parent (Wellington) | parent1@ascent.dev | N/A |
| Parent (Chen) | parent2@ascent.dev | N/A |
| Member (Junior) | member.junior@ascent.dev | 10-12 (Age 11) |
| Member (Teen) | member.teen@ascent.dev | 13-15 (Age 14) |
| Member (Launch) | member.launch@ascent.dev | 16-22 (Age 19) |
| Member (Practicum) | member.practicum@ascent.dev | 23-30 (Age 26) |
| Member (Leadership) | member.leadership@ascent.dev | 25-35 (Age 30) |

To log in: Navigate to `/login` and enter one of the emails above.

## Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data script
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── (auth)/        # Auth pages (login, invite)
│   │   ├── (dashboard)/   # Protected dashboard pages
│   │   ├── (marketing)/   # Public marketing pages
│   │   ├── admin/         # Admin CMS pages
│   │   └── api/           # API routes
│   ├── components/        # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── layout/        # Layout components
│   │   └── ...            # Feature components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── styles/            # Global styles
├── tests/                 # Test files
├── .env.example           # Environment template
└── package.json
```

## Key Features

### Age Bands

Members are automatically assigned to age bands based on their date of birth:

- **Junior Foundations** (10-12): Basic wealth concepts
- **Teen Skills** (13-15): Practical financial literacy
- **Launch** (16-22): Career and independence prep
- **Stewardship Practicum** (23-30): Hands-on investment experience
- **Leadership** (25-35): Advanced stewardship

Administrators can override age bands when needed.

### RBAC Roles

| Role | Permissions |
|------|-------------|
| MEMBER | Access learning, submit work, participate in community |
| PARENT | View household progress (privacy-limited), see milestones |
| MENTOR | View mentees, provide feedback, score submissions |
| CIO | Approve trades, review memos, portfolio oversight |
| PROGRAM_DIRECTOR | Manage cohorts, events, mentor assignments |
| ADMIN | Full system access, user management, CMS |
| COMPLIANCE | Audit logs, exports, content moderation |

### Content Workflow

Content follows an approval workflow:

```
DRAFT → IN_REVIEW → APPROVED → PUBLISHED
```

### Parent Privacy

By default, parents can see:
- Progress percentage and milestones
- Badges earned
- Upcoming events

Parents cannot see:
- Private reflections and journal entries
- Detailed mentor session notes
- Personal submissions (unless shared)

Members can explicitly share content with parents.

## Running Tests

```bash
# Run all tests
npm test

# Run tests once
npm run test:run
```

The test suite includes:
- RBAC permission checks
- Trade approval workflow integration test
- Audit logging verification

## Database Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes (dev only)
npm run db:push

# Create migration
npm run db:migrate

# Reset and reseed database
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

## Production Deployment

### 1. Environment Configuration

Set production environment variables:

```env
USE_DEV_AUTH="false"
DATABASE_URL="your-production-database-url"
AUTH0_SECRET="generate-a-secure-secret"
AUTH0_BASE_URL="https://your-domain.com"
AUTH0_ISSUER_BASE_URL="https://your-tenant.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"
```

### 2. Auth0 Setup

1. Create an Auth0 application (Regular Web Application)
2. Configure allowed callback URLs: `https://your-domain.com/api/auth/callback`
3. Configure allowed logout URLs: `https://your-domain.com`
4. Enable the roles/permissions needed in Auth0

### 3. Database Migration

```bash
npx prisma migrate deploy
```

### 4. Build and Deploy

```bash
npm run build
npm start
```

## What's Simplified vs Production

### Simplified for Demo

- **Dev Auth**: Simple email-based auth for testing (bypass Auth0)
- **File Storage**: Local file system fallback (MinIO recommended for production)
- **Email**: Console logging fallback (Resend for production)
- **Session Timeout**: Basic implementation (enhance with proper session management)
- **Portfolio Prices**: Static prices (integrate market data API for production)

### Production Recommendations

1. **Authentication**: Use Auth0 with proper RBAC configuration
2. **File Storage**: Use MinIO/S3 with signed URLs
3. **Email**: Configure Resend with proper templates
4. **Database**: Use connection pooling (PgBouncer)
5. **Caching**: Add Redis for session and data caching
6. **CDN**: Use CDN for static assets
7. **Monitoring**: Add error tracking (Sentry) and analytics
8. **Security**: Enable rate limiting, CORS, CSP headers

## API Routes

### Authentication
- `GET/POST /api/auth/[...auth0]` - Auth0 handlers
- `POST /api/auth/dev-login` - Dev auth login

### Users & Invites
- `GET /api/users` - List users (admin)
- `POST /api/invites` - Create invite
- `POST /api/invites/request` - Request invite (public)

### Learning
- `GET /api/learning/tracks` - List tracks
- `GET /api/learning/progress` - User progress
- `POST /api/learning/complete-lesson` - Mark lesson complete

### Mentorship
- `GET /api/mentorship/sessions` - List sessions
- `POST /api/mentorship/sessions` - Create session
- `PATCH /api/mentorship/sessions/[id]` - Update session

### Portfolio (IC Practicum)
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/trades` - Submit trade request
- `POST /api/portfolio/trades/[id]/approve` - Approve trade (CIO)
- `POST /api/portfolio/trades/[id]/execute` - Execute trade

### Content (Admin)
- `GET /api/content` - List content
- `POST /api/content` - Create content
- `PATCH /api/content/[id]/status` - Update status

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications` - Mark as read

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Submit PR for review

## License

Proprietary - Ascent Capital Partners

---

Built with Next.js, Prisma, and Tailwind CSS.
