# BillingFlow — Complete Project Guide

> **For any AI assistant, developer, or contributor reading this:** This document explains the entire project architecture, every feature, and the current state of all optimizations. Read this before making any changes.

---

## 📋 Project Overview

**BillingFlow** is a multi-tenant SaaS billing & invoicing platform. It allows businesses (organizations) to:
- Create and manage clients
- Generate and send professional invoices
- Record payments and track revenue
- Create legally-binding agreements with digital signatures and geo-location
- Customize invoice and email templates
- Manage subscriptions (Free / Growth / Enterprise)

**Stack:**
| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 8 |
| Backend | Hono (Node.js via `@hono/node-server`) |
| Database | PostgreSQL (via `pg` adapter, Cloudflare D1-compatible API) |
| File Storage | Supabase Storage (R2-compatible adapter) |
| Auth | JWT (HS256, via `hono/jwt`) |
| PDF Generation | PDFKit |
| Email | Nodemailer (SMTP) |
| Payments | Stripe (with mock mode for development) |
| Routing (Frontend) | React Router DOM v6 |

---

## 🗂️ Directory Structure

```
billing-flow/
├── frontend/               # React SPA
│   ├── src/
│   │   ├── App.tsx         # Root router with lazy-loaded routes
│   │   ├── main.tsx        # React entry point
│   │   ├── index.css       # Global CSS variables and utility classes
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # JWT auth state, apiFetch (with 30s GET cache), login/logout
│   │   │   └── ThemeContext.tsx   # Light/dark theme toggle
│   │   ├── components/
│   │   │   ├── Sidebar.tsx              # Desktop navigation sidebar
│   │   │   ├── MobileHeader.tsx         # Top bar on mobile
│   │   │   ├── MobileBottomNav.tsx      # Bottom nav bar on mobile
│   │   │   ├── EmailVerificationBanner.tsx  # Top banner if email not verified
│   │   │   ├── EmailVerificationModal.tsx   # Modal to enter verification code
│   │   │   ├── BillingFlowLogo.tsx      # Logo SVG component
│   │   │   ├── VerifiedBadge.tsx        # Green tick badge
│   │   │   └── skeletons/               # Loading skeleton components
│   │   │       ├── DashboardSkeleton.tsx
│   │   │       ├── TableSkeleton.tsx
│   │   │       ├── SettingsSkeleton.tsx
│   │   │       ├── AgreementSkeleton.tsx
│   │   │       └── Skeleton.tsx
│   │   ├── views/                       # Page-level components (all lazy-loaded)
│   │   │   ├── Dashboard.tsx            # Financial dashboard with charts
│   │   │   ├── Clients.tsx              # Client CRUD management
│   │   │   ├── Invoices.tsx             # Invoice list, pay, download, send
│   │   │   ├── InvoiceEdit.tsx          # Create/edit invoice form
│   │   │   ├── Agreements.tsx           # Legal agreements list
│   │   │   ├── AgreementCreate.tsx      # Create agreement (public + auth)
│   │   │   ├── AgreementVerify.tsx      # Public hash verification page
│   │   │   ├── Billing.tsx              # Subscription/billing page + mock checkout
│   │   │   ├── Settings.tsx             # Org settings, SMTP, logo, profile
│   │   │   ├── BillDesign.tsx           # Invoice template selector
│   │   │   ├── EmailDesign.tsx          # Email template selector
│   │   │   ├── TemplateBuilder.tsx      # Drag-drop custom template builder
│   │   │   ├── Admin.tsx                # Superadmin control panel
│   │   │   ├── LandingPage.tsx          # Public marketing landing page
│   │   │   ├── Login.tsx                # Login + register forms
│   │   │   ├── ApiDocs.tsx              # REST API documentation viewer
│   │   │   └── LegalTerms.tsx           # Terms of service / Privacy policy
│   │   └── utils/
│   │       ├── i18n.ts                  # Currency formatting, CURRENCIES constant
│   │       └── whatsappService.ts       # WhatsApp share link generator
│   ├── vite.config.ts      # Vite build config with vendor chunk splitting
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts        # ALL API routes (1400+ lines, single file)
│   │   ├── adapters.ts     # D1DatabaseAdapter (pg pool), R2ToSupabaseStorageAdapter
│   │   ├── dev.ts          # Local dev server entry (dotenv + http server)
│   │   └── services/
│   │       ├── pdfService.ts         # Invoice PDF generation (PDFKit)
│   │       ├── agreementPdfService.ts # Agreement PDF generation (PDFKit)
│   │       └── emailService.ts       # Send reminder emails via Nodemailer
│   │   └── templates/agreements/    # JSON agreement templates
│   ├── schema.sql          # SQLite/D1 schema
│   ├── postgres_schema.sql # PostgreSQL schema
│   └── package.json
│
├── PROJECT_GUIDE.md        # ← YOU ARE HERE
└── vercel.json             # Vercel deployment config
```

---

## 🗄️ Database Schema

### Tables

#### `organizations`
The top-level tenant entity.
```sql
id, name, slug, subscription_status, subscription_plan,
logo_url, invoice_template, email_template, address, tax_id, phone,
smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
stripe_customer_id, stripe_subscription_id,
payment_qr_link, created_at, updated_at
```

#### `users`
Users belong to an organization.
```sql
id, organization_id, name, email, password_hash, role,
is_verified, verification_code, created_at, updated_at
```
- `role`: `admin` | `superadmin`
- Default superadmin: `admin@billingflow.com` / `adminpassword`

#### `clients`
```sql
id, organization_id, name, email, company_name, tax_id, address, phone, created_at, updated_at
```

#### `invoices`
```sql
id, organization_id, client_id, invoice_number, status,
issue_date, due_date, tax_rate, discount, currency, notes, created_at, updated_at
```
- `status`: `draft` | `sent` | `paid` | `overdue`

#### `invoice_items`
```sql
id, invoice_id, description, quantity, unit_price
```

#### `payments`
```sql
id, organization_id, invoice_id, amount, payment_method, payment_date, notes
```

#### `agreements`
```sql
id, organization_id, agreement_number, linked_invoice_number, agreement_type, title,
first_party_name, first_party_contact, first_party_address, signatory_designation,
second_party_name, second_party_contact, second_party_address,
witness1_name, witness1_contact, witness2_name, witness2_contact,
payment_terms, total_amount, currency, validity_period,
terms_content, language, stamp_duty_amount, state_jurisdiction,
signer_photo_url, document_attachment_url, geo_lat, geo_lng, geo_address,
digital_hash (SHA-256, UNIQUE), status, created_at
```

#### `email_logs`
```sql
id, organization_id, invoice_id, to_email, subject, body, created_at
```

#### `custom_templates`
```sql
id, organization_id, name, status (draft|published), config (JSON), created_at, updated_at
```

---

## 🔌 API Routes Reference

### Public (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check, triggers DB migration once |
| POST | `/api/auth/register` | Register new org + admin user |
| POST | `/api/auth/login` | Login → JWT + user + org |
| GET | `/api/agreements/templates` | List agreement JSON templates |
| POST | `/api/agreements/public` | Create agreement without auth |
| GET | `/api/agreements/:id` | Get agreement by ID |
| GET | `/api/agreements/verify/:hash` | Verify agreement by SHA-256 hash |
| GET | `/api/agreements/:id/pdf` | Download agreement PDF |
| GET | `/uploads/:key` | Serve uploaded files |

### Protected (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user + org |
| POST | `/api/auth/send-verification` | Send email code |
| POST | `/api/auth/verify-email` | Verify with code |
| CRUD | `/api/clients` `/api/clients/:id` | Client management |
| CRUD | `/api/invoices` `/api/invoices/:id` | Invoice management |
| GET | `/api/invoices/:id/pdf` | Invoice PDF download |
| POST | `/api/invoices/:id/reminder` | Send payment reminder |
| POST | `/api/invoices/:id/pay` | Mark invoice paid |
| **GET** | **`/api/analytics/dashboard`** | **Dashboard metrics (OPTIMIZED: parallel queries)** |
| GET | `/api/agreements` | List org agreements (paginated) |
| POST | `/api/agreements` | Create agreement |
| DELETE | `/api/agreements/:id` | Delete agreement |
| PUT | `/api/organization/profile` | Update org profile |
| PUT | `/api/organization/template` | Set invoice template |
| PUT | `/api/organization/email-template` | Set email template |
| PUT | `/api/organization/smtp` | SMTP settings |
| POST | `/api/organization/smtp/test` | Test SMTP |
| POST | `/api/organization/logo` | Upload logo |
| CRUD | `/api/organization/templates` | Custom template management |
| POST | `/api/billing/checkout` | Stripe checkout (or mock) |
| POST | `/api/billing/portal` | Stripe billing portal (or mock) |
| POST | `/api/billing/mock-checkout-complete` | Simulate plan upgrade |

### Superadmin only
`/api/admin/stats`, `/api/admin/organizations`, `/api/admin/users`, `/api/admin/invoices`, `/api/admin/payments` — full CRUD for all tenants.

---

## 🔐 Authentication Flow

1. Register → org + user created → JWT returned
2. Frontend stores JWT in `localStorage['token']`
3. On app load, `AuthContext` calls `/api/auth/me` to restore session
4. `apiFetch()` appends `Authorization: Bearer <token>` to all requests
5. On 401/403, auto-logout triggered
6. `_migrationDone` flag ensures schema migrations only run **once per process**

---

## ⚡ Performance Optimizations (Completed)

### Backend — `backend/src/index.ts`

| Issue | Root Cause | Fix Applied |
|-------|-----------|-------------|
| **Migrations on every request** | `seedSuperAdmin()` ran on every authenticated API call, executing ~10 `ALTER TABLE` statements | Added `let _migrationDone = false` flag — runs only once per server process |
| **N+1 query for outstanding** | Dashboard looped through each unpaid invoice and fetched items separately | Replaced with single SQL JOIN: `invoices JOIN invoice_items GROUP BY invoice_id` |
| **Sequential dashboard queries** | 10+ `await` statements in sequence — each waited for the previous | All independent queries wrapped in `Promise.all()` — run concurrently |
| **Sequential 6-month graph** | `for` loop with 6 sequential `await` DB queries | All 6 queries spread into `Promise.all()` — run concurrently |

**Dashboard endpoint before:** ~10-15 sequential DB round trips = 5-10 seconds on cold DB  
**Dashboard endpoint after:** 1 parallel batch of 14 queries = time of slowest single query

### Frontend — `frontend/src/`

| Issue | Root Cause | Fix Applied |
|-------|-----------|-------------|
| **Re-fetch on every navigation** | `apiFetch()` always hit the API | Added 30-second TTL in-memory cache in `AuthContext.tsx` for GET requests |
| **Cache invalidation** | Stale data after mutations | Cache cleared on any POST/PUT/DELETE request and on logout |
| **Large JS bundle** | All vendor code in one chunk | `vite.config.ts`: `manualChunks` splits react/lucide/confetti into separate browser-cached files |

### Already Existing (preserved, not changed)
- `React.lazy()` for all page routes → code splitting per page ✅
- Skeleton loaders for all pages → instant perceived feedback ✅
- Paginated agreements API (limit 50) ✅

---

## 🚀 Running Locally (Termux / Ubuntu)

> **Note:** Do NOT run `git push` or automated build/deploy — manual workflow only.

### Backend
```bash
cd /root/billing-flow/backend
npm install

# Create .env file:
# DATABASE_URL=postgresql://user:pass@localhost:5432/billingflow
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-key
# JWT_SECRET=your-secret
# STRIPE_MOCK=true
# PORT=3000

npm run dev   # starts on http://localhost:3000
```

### Frontend
```bash
cd /root/billing-flow/frontend
npm install

# Create .env:
# VITE_API_URL=http://localhost:3000

npm run dev        # dev server on http://localhost:5173
npm run build      # production build to frontend/dist/
```

---

## 📝 Completed Features

- [x] Multi-tenant organization system
- [x] JWT authentication with session restore
- [x] Client management (CRUD)
- [x] Invoice management (CRUD + status transitions)
- [x] PDF generation for invoices (13 built-in templates + custom)
- [x] Payment recording and tracking
- [x] Email reminder system (Nodemailer + SMTP)
- [x] Financial dashboard with charts
- [x] Legal agreements system with SHA-256 verification
- [x] Agreement PDF generation (bilingual EN/HI)
- [x] Custom template builder (drag-drop)
- [x] Stripe billing integration (mock + real)
- [x] Superadmin control panel
- [x] Logo upload (Supabase Storage)
- [x] SMTP configuration per organization
- [x] Mobile responsive UI (sidebar + bottom nav)
- [x] Dark theme UI with CSS variables
- [x] WhatsApp share for invoices and agreements
- [x] React lazy loading for all page routes
- [x] Skeleton loaders for all pages
- [x] **[OPTIMIZED]** DB migration runs once per process (not per request)
- [x] **[OPTIMIZED]** Dashboard uses `Promise.all()` — all queries run in parallel
- [x] **[OPTIMIZED]** Outstanding amount computed in single JOIN query (no N+1)
- [x] **[OPTIMIZED]** Frontend GET responses cached 30s (TTL cache in AuthContext)
- [x] **[OPTIMIZED]** Vite build with vendor chunk splitting for better browser caching
- [x] **[DOCUMENTED]** PROJECT_GUIDE.md created for AI/developer onboarding

## 🛠️ Known Issues / TODO

- [ ] JWT tokens have no expiry — add `exp` claim for security
- [ ] CORS is open (`origin: '*'`) — restrict to frontend domain in production
- [ ] Universal test codes `123456`/`849201` — remove for production
- [ ] `index.ts` is 1400+ lines — consider splitting into controller files
- [ ] No rate limiting on login/register
- [ ] Password reset flow not implemented

---

## 🎨 Templates

### Invoice Templates (13 built-in)
`modern_purple`, `minimalist_dark`, `retro_bold`, `corporate_crimson`, `emerald_clean`, `ocean_breeze`, `monochrome_luxury`, `golden_elegance`, `sidebar_mono`, `clean_purple_pro`, `orange_accent`, `navy_geometric`, `teal_corporate`

### Email Templates (12 built-in)
`professional`, `modern_dark`, `vibrant_purple`, `ocean_wave`, `corporate_red`, `emerald_green`, `sunset_orange`, `midnight_blue`, `rose_gold`, `forest_sage`, `neon_cyber`, `golden_luxury`

---

## 🏗️ Subscription Plans

| Plan | Price | Notes |
|------|-------|-------|
| Free | $0 | Basic invoicing |
| Growth | $49/mo | Advanced features |
| Enterprise | $199/mo | Full features + admin |

Stripe is in **mock mode** by default (`STRIPE_MOCK=true`).
