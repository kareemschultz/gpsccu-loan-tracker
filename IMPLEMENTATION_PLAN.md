# Guyana Loan Tracker Pro - Multi-User Platform

## Project Overview

**Purpose:** Multi-user loan tracking platform for car loans from Guyanese financial institutions

**Users:** You and co-workers tracking personal vehicle loans
**Lenders Supported:** GPSCCU, GBTI, Republic Bank, Demerara Bank, Citizens Bank, and others

**Current State:** Single-user Vite app on GitHub Pages
**Target State:** Multi-user Next.js 16 + PostgreSQL + Auth + Docker

---

## Your Loan (Reference Data)

| Field | Value |
|-------|-------|
| Vehicle | BMW X1 2019 |
| Lender | GPSCCU |
| Original Amount | $5,000,000 GYD |
| Monthly Payment | $111,222 GYD |
| Interest Rate | 1% monthly (12% annual) |
| Start Date | October 28, 2025 |

---

## Key Features

### Multi-User & Authentication
- Email/password sign-up and sign-in
- Each user manages their own loans privately
- Optional: Google/GitHub OAuth for convenience

### Multi-Lender Support
- **GPSCCU** - Greater Pomeroon-Supenaam Credit Cooperative Union
- **GBTI** - Guyana Bank for Trade and Industry
- **Republic Bank** - Republic Bank Guyana
- **Demerara Bank** - Demerara Bank Limited
- **Citizens Bank** - Citizens Bank Guyana
- **GNCB** - Guyana National Co-operative Bank
- **Custom** - Any other lender

### Core Features (from existing app)
- Dashboard with balance, countdown, progress
- 6-month payment strategy optimization
- Payment tracking with categorized sources
- Scenario comparison with charts
- Financial health scoring
- CSV/PDF export

### Enhanced Charts & Analytics
- Payoff timeline comparisons
- Interest savings projections
- Payment source breakdowns (salary, gratuity, bonus)
- Month-over-month trends
- Correlated data visualization
- Multiple loans comparison (if user has several)

---

## Implementation Plan

### Phase 1: Authentication Setup

**Install NextAuth.js:**
```bash
bun add next-auth @auth/drizzle-adapter bcryptjs
bun add -D @types/bcryptjs
```

**Files to create:**
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/register/page.tsx` - Registration page
- `src/lib/auth.ts` - Auth configuration
- `src/middleware.ts` - Route protection

---

### Phase 2: Database Schema

**Tables:**

```sql
-- Users table
users (
  id, email, password_hash, name,
  created_at, updated_at
)

-- Lenders/Banks reference
lenders (
  id, name, short_name, logo_url,
  default_rate, country
)
-- Seed: GPSCCU, GBTI, Republic Bank, Demerara Bank, etc.

-- User loans (multi-loan per user)
loans (
  id, user_id, lender_id,
  vehicle_description, -- "BMW X1 2019"
  original_amount, current_balance,
  interest_rate, monthly_payment,
  start_date, term_months,
  is_active, created_at
)

-- Financial profiles (per user)
financial_profiles (
  id, user_id,
  monthly_income, emergency_fund,
  investment_portfolio, expected_gratuity,
  next_gratuity_date
)

-- Payments
payments (
  id, loan_id, user_id,
  payment_date, amount,
  payment_type, source, notes
)

-- Scenarios
payment_scenarios (
  id, loan_id, user_id,
  name, extra_amount, frequency,
  projected_payoff, interest_saved
)

-- User settings
user_settings (
  id, user_id,
  theme, currency, date_format
)
```

---

### Phase 3: Install UI Components

```bash
bunx --bun shadcn@latest add button card input select dialog form table tabs progress badge calendar chart checkbox radio-group switch label separator scroll-area dropdown-menu popover tooltip skeleton alert sidebar navigation-menu avatar
```

---

### Phase 4: Auth Pages

**Login Page:** `/login`
- Email + password form
- "Remember me" option
- Link to register

**Register Page:** `/register`
- Name, email, password
- Password confirmation
- Terms acceptance

**Protected Routes:** All dashboard routes require auth

---

### Phase 5: Dashboard Structure

**Layout:** `src/app/(dashboard)/layout.tsx`
- User avatar + name in header
- Logout button
- Sidebar with navigation

**Pages:**

| Route | Purpose |
|-------|---------|
| `/` | Dashboard - Overview of all user's loans |
| `/loans` | Manage loans (add, edit, delete) |
| `/loans/[id]` | Single loan detail view |
| `/planning` | 6-month strategy for selected loan |
| `/scenarios` | Compare strategies |
| `/tracker` | Payment history |
| `/analytics` | Charts and health score |
| `/reports` | Export and summaries |
| `/settings` | Profile, preferences |

---

### Phase 6: Multi-Loan Support

**Loan Selector:** Dropdown in header to switch between loans
**Add Loan Flow:**
1. Select lender from dropdown
2. Enter vehicle description
3. Enter loan details (amount, rate, payment, date)
4. Save and start tracking

**Loan List View:**
- Cards showing each loan's progress
- Quick stats per loan
- Click to view details

---

### Phase 7: Charts & Visualizations

**Dashboard Charts:**
- Combined balance trend (all loans)
- Individual loan progress rings
- Payment countdown widget

**Analytics Charts:**
- Payoff timeline comparison (line)
- Interest paid vs principal (stacked bar)
- Payment sources breakdown (donut)
- Monthly payment trends (area)
- Health score gauge (radial)
- Loan comparison (multi-line)

**Correlation Features:**
- Extra payments vs interest saved
- Income vs debt ratio trends
- Scenario impact visualization

---

### Phase 8: API Routes

```
/api/auth/*         - NextAuth endpoints
/api/users          - User profile
/api/lenders        - Available lenders list
/api/loans          - User's loans CRUD
/api/loans/[id]     - Single loan operations
/api/payments       - Payment history
/api/scenarios      - Strategy management
/api/analytics/*    - Computed analytics
/api/export/*       - CSV/PDF generation
```

---

### Phase 9: Docker Deployment

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://...
      - NEXTAUTH_SECRET=...
      - NEXTAUTH_URL=http://localhost:3000
    depends_on: [db]

  db:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: loan_tracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

**Environment Variables:**
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/loan_tracker
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard
│   │   ├── loans/
│   │   │   ├── page.tsx        # All loans
│   │   │   ├── new/page.tsx    # Add loan
│   │   │   └── [id]/page.tsx   # Loan detail
│   │   ├── planning/page.tsx
│   │   ├── scenarios/page.tsx
│   │   ├── tracker/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── lenders/route.ts
│   │   ├── loans/
│   │   ├── payments/
│   │   ├── scenarios/
│   │   ├── analytics/
│   │   └── export/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── dashboard/
│   ├── loans/
│   ├── planning/
│   ├── scenarios/
│   ├── tracker/
│   ├── analytics/
│   ├── reports/
│   └── shared/
├── lib/
│   ├── auth.ts
│   ├── db/
│   ├── calculations/
│   └── validators.ts
├── middleware.ts               # Auth protection
├── hooks/
└── types/
```

---

## Guyana Lenders Seed Data

```typescript
const lenders = [
  { name: "GPSCCU", short_name: "GPSCCU", default_rate: 12 },
  { name: "Guyana Bank for Trade and Industry", short_name: "GBTI", default_rate: 14 },
  { name: "Republic Bank Guyana", short_name: "Republic", default_rate: 13 },
  { name: "Demerara Bank Limited", short_name: "Demerara", default_rate: 13.5 },
  { name: "Citizens Bank Guyana", short_name: "Citizens", default_rate: 14 },
  { name: "Guyana National Co-operative Bank", short_name: "GNCB", default_rate: 12.5 },
  { name: "Other", short_name: "Other", default_rate: 15 },
];
```

---

## Verification Steps

1. **Auth Flow:** Register new user, login, logout
2. **Protected Routes:** Verify redirect to login when not authenticated
3. **Add Loan:** Create loan with GPSCCU, verify in database
4. **Multi-Loan:** Add second loan with different lender
5. **Payments:** Record payment, verify in history
6. **Charts:** Verify all visualizations render
7. **Export:** Generate CSV and verify data
8. **Docker:** Build and run `docker compose up`
9. **Multi-User:** Test with two different accounts

---

## Summary

This plan transforms the single-user loan tracker into a multi-user platform where you and your co-workers can each:

- Sign up with email/password
- Track multiple car loans from different Guyanese banks
- Use the same powerful analytics and planning tools
- Access from any device via Docker deployment

Ready to implement when approved.
