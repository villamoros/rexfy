# Rexfy — Tech Lead Blueprint

## 1) Recommended stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- Zustand only if local global state is needed

### Backend
- Python
- FastAPI
- SQLAlchemy 2.x
- PostgreSQL
- Redis
- Celery or RQ
- Pydantic

### Infra / platform
- S3-compatible object storage
- email / push provider
- observability stack
- CI/CD pipeline
- containerized deployment

## 2) Repository structure

```text
rexfy/
  apps/
    web/
    api/
    worker/
  packages/
    ui/
    shared/
  infra/
  docs/
  tests/
```

### Backend module structure

```text
api/
  app/
    main.py
    core/
    domain/
    application/
    infrastructure/
    presentation/
```

## 3) Suggested bounded contexts in code

- identity
- organizations
- materials
- listings
- search
- offers
- chat
- transactions
- logistics
- trust
- notifications
- dashboard
- admin
- documents

## 4) Database schema starter

### Core tables
- users
- companies
- company_users
- roles
- material_categories
- materials
- listings
- listing_images
- offers
- chat_threads
- chat_messages
- transactions
- shipments
- transport_quotes
- reviews
- trust_scores
- disputes
- documents
- notifications
- subscriptions
- audit_logs
- esg_reports

### Design notes
- use UUID primary keys
- timestamps on every business table
- soft delete where auditability matters
- status fields as enums or constrained strings
- store immutable transaction history as append-only events where useful

## 5) API surface

### Public / authenticated endpoints
- POST /auth/register
- POST /auth/login
- GET /me
- POST /companies
- GET /companies/{id}

### Marketplace
- GET /materials
- GET /listings
- POST /listings
- PATCH /listings/{id}
- POST /listings/{id}/publish
- POST /listings/{id}/archive

### Offers / negotiation
- POST /offers
- GET /offers
- POST /offers/{id}/counter
- POST /offers/{id}/accept

### Chat
- GET /threads
- POST /threads
- GET /threads/{id}/messages
- POST /threads/{id}/messages

### Logistics
- POST /logistics/quotes
- GET /logistics/quotes
- POST /shipments
- PATCH /shipments/{id}

### Admin / trust
- GET /admin/disputes
- PATCH /admin/disputes/{id}
- GET /admin/listings
- PATCH /admin/listings/{id}/review

## 6) Workflow design

### Async jobs
Use background workers for:
- image processing
- document validation
- notification fan-out
- report generation
- index updates
- reputation updates
- ESG report generation

### Idempotency
Critical actions should be idempotent:
- publish listing
- accept offer
- create shipment
- record payment
- resolve dispute

## 7) Testing strategy

### Unit
- domain rules
- validation
- pricing / scoring logic

### Integration
- repository layer
- API endpoints
- notification jobs

### E2E
- publication flow
- search → offer → chat → logistics
- buyer purchase workflow
- admin dispute workflow

### Regression / smoke
- dashboard metrics
- login
- role access
- file upload
- mobile critical flows

## 8) Frontend implementation guidance

### UX implications from the product docs
- mobile-first publication flow
- quick search and filters
- visible trust signals
- clear CTA hierarchy
- fast loading cards and dashboards
- optimistic UI for chat / offer flows where safe
- persistent draft saving in long forms

## 9) Implementation phases

### Phase 0 — foundation
- auth
- company model
- roles / permissions
- base UI system
- database migrations
- audit log
- file storage

### Phase 1 — liquidity
- listings
- search
- publication wizard
- chat
- offers

### Phase 2 — operations
- logistics
- trust score
- reviews
- admin moderation
- dashboards

### Phase 3 — monetizable intelligence
- ESG
- pricing indices
- benchmarks
- forecasting
- advanced analytics

## 10) Architecture guardrails

- keep modules isolated
- avoid premature microservices
- avoid business logic in route handlers
- keep side effects in application services / workers
- centralize domain events
- document every major decision with ADRs
- enforce type-safe contracts between frontend and backend
