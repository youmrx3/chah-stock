# chah-stock

chah-stock is a Supabase-backed inventory and client management app tailored for Algerian currency (DZD). It provides product tracking, client follow-ups, supplier and brand catalogs, custom fields, and export tools for operational reporting.

## Features

- Stock management with quantities, reserved/remaining counts, and price tracking.
- Rich product metadata: brands, origins, categories, suppliers, notes, and images.
- Sub-products for bundles or split stock items.
- Clients and payment tracking with status (pending/partial/completed).
- Custom fields per product to capture extra business attributes.
- Site settings for branding, company details, and thresholds.
- Export tools: Excel (basic and detailed with images), PDF catalog, and DOCX product sheets.
- Admin-only access with Supabase auth and allowlist enforcement.
- Client-facing storefront with catalog browsing, filters, inquiry basket, and quote requests.
- Inquiry tracking for clients and admin review workflow.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui (Radix UI)
- Supabase (auth + Postgres + storage)
- TanStack Query, React Router, Vitest

## Architecture overview

- UI entry: `src/main.tsx` bootstraps the app.
- Routing and auth gate: `src/App.tsx` enforces admin access using Supabase session + allowlist.
- Main dashboard: `src/pages/Index.tsx` aggregates tabs and management panels.
- Data layer: `src/hooks/useStock.ts` handles CRUD, filtering, stats, and Supabase integration.
- Settings + branding: `src/hooks/useSiteSettings.ts` and `src/hooks/useDynamicBranding.ts`.
- Export services: `src/lib/exports.ts` provides Excel, PDF, and DOCX exports.

## Data model (Supabase)

Core tables used by the frontend:

- `stock_items`
- `custom_fields`
- `custom_field_values`
- `product_images`
- `product_sub_products`
- `clients`
- `brands`
- `origins`
- `fournisseurs`
- `categories`
- `payment_tracking`
- `site_settings`
- `shop_customers`
- `shop_inquiries`
- `shop_inquiry_items`
- `shop_favorites`
- `admin_allowlist`

Migrations are stored in `supabase/migrations` and should be applied to keep schema aligned.

## Getting started

### Prerequisites

- Node.js (18+ recommended)

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=admin@example.com,owner@example.com
VITE_REQUIRE_ADMIN_ALLOWLIST=true
```

Notes:

- `VITE_ADMIN_EMAILS` is required for admin access when strict mode is enabled.
- `VITE_REQUIRE_ADMIN_ALLOWLIST` defaults to `true` in production and `false` in development.

### Run locally

```bash
npm run dev
```

### Build and preview

```bash
npm run build
npm run preview
```

### Tests

```bash
npm test
```

## Supabase setup notes

- Configure auth providers and RLS policies in your Supabase project.
- Product and brand images are stored as URLs; use Supabase Storage or a CDN.
- Apply migrations in `supabase/migrations` to match the expected schema.

## Client storefront

Routes:

- `/shop` landing page
- `/shop/catalog` product catalog with search + filters
- `/shop/product/:id` product detail page
- `/shop/cart` inquiry basket
- `/shop/account` client account + inquiry tracking

Inquiry flow:

1. Client selects products.
2. Client sends a request.
3. Admin reviews and confirms pricing.

### Admin review access

Add admin emails to `admin_allowlist` in Supabase:

```sql
insert into public.admin_allowlist (email)
values ('admin@example.com');
```

This unlocks inquiry review in the admin panel.

## Exports

The app can generate:

- Excel (basic) for inventory summaries.
- Excel (detailed) with images and custom fields.
- PDF catalog for clients.
- DOCX product sheets for documentation.

## Weekly Supabase backup (Automated)

This repository includes an automated weekly backup workflow:

- Workflow file: `.github/workflows/weekly-supabase-backup.yml`
- Schedule: every Sunday at 02:00 UTC
- Trigger: scheduled + manual run from GitHub Actions
- Output:
  - Full database dump in PostgreSQL custom format (`.dump`)
  - Schema-only SQL dump (`.sql.gz`)
  - SHA256 checksums (`SHA256SUMS.txt`)

### Configure GitHub Secrets

Required secret:

- `SUPABASE_DB_URL` (transaction/session mode connection string)

Optional secrets for S3 uploads:

- `BACKUP_AWS_ACCESS_KEY_ID`
- `BACKUP_AWS_SECRET_ACCESS_KEY`
- `BACKUP_AWS_REGION`
- `BACKUP_S3_BUCKET`

### Restore from a backup

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="<TARGET_DATABASE_URL>" \
  supabase-weekly-<id>.dump
```

Database backups do not include Supabase Storage objects. Back up buckets separately if needed.

## Security hardening

### Admin access (fail-closed)

Admin UI access requires `VITE_ADMIN_EMAILS` to be configured. If it is missing and strict mode is enabled, all users are blocked from admin access by default.

### Password policy

Admin password updates require:

- At least 12 characters
- One uppercase letter
- One lowercase letter
- One number
- One symbol

### Secrets hygiene

- `.env` and `.env.*` are ignored by git
- Use `.env.example` as a template
- Never commit service role keys or raw database credentials

### Automated security checks

Workflow file: `.github/workflows/security-checks.yml`

- Dependency audit (`npm audit --audit-level=high`)
- Secret scan (gitleaks)
