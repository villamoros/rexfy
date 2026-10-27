# Rexfy — Product Owner / Project Manager Pack

## 1) Product summary

Rexfy is a B2B marketplace for recyclable industrial materials. The platform connects:
- Generators of recyclable residue
- Buyers / processors / recyclers
- Transporters
- Admin / trust & safety operators

The MVP focuses on liquidity, trust, and operational closure:
- publish material
- discover material
- negotiate in chat
- coordinate logistics
- track transactions
- manage trust signals
- moderate disputes

## 2) Product thesis

Rexfy is not a generic marketplace. It is a vertical industrial commerce platform with three strong initial markets:
- Paper / cardboard
- Plastics
- Metals

The "other recyclables" group exists, but it should remain secondary in the first release because it is more heterogeneous and harder to standardize commercially.

## 3) Strategic outcomes

### North Star
Toneladas reutilizadas transacted through the platform.

### Business metrics
- GMV per month
- number of active companies
- listings published per month
- response time to leads
- successful transaction rate
- repeat purchase rate
- logistics attach rate
- dispute rate
- retention by role

### Product metrics by role
- Generator: time to first qualified buyer
- Buyer: time to secure supply
- Transporter: response time + trip completion rate
- Admin: dispute resolution time

## 4) Scope recommendation

### MVP
Must ship now:
- authentication / company onboarding
- role-based access
- marketplace search & filters
- publication wizard for generators
- buyer workspace / purchases
- B2B chat and formal quote flow
- logistics request and tracking
- trust profile / company reputation
- dashboard by role
- admin panel

### Phase 2
- recurring supply contracts
- logistics optimization
- ESG / compliance reports
- richer notifications
- advanced filters / saved searches
- searchable history and benchmarking

### Phase 3
- market intelligence
- price indices
- predictive demand
- advanced ESG analytics
- recommendation engine
- automation around supply matching

## 5) Priority matrix

| Priority | Epic | Reason |
|---|---|---|
| P0 | Identity, company onboarding, role access | Without this there is no trust layer |
| P0 | Marketplace + publication wizard | Core liquidity engine |
| P0 | Chat + formal quotation | Core negotiation flow |
| P0 | Logistics request + status | Core operational closure |
| P0 | Trust profile + reviews | Core B2B confidence mechanism |
| P1 | Dashboard by role | Operational value and retention |
| P1 | Admin panel | Trust & safety + moderation |
| P2 | ESG reports | Monetizable enterprise layer |
| P2 | Intelligence / analytics | Higher-value later-stage monetization |

## 6) Product assumptions and decisions

### Assumption A
Users will behave differently by role, so the UX and KPIs must be role-specific.

### Assumption B
Mobile-first behavior matters especially for generators and transporters operating in plants or on the road.

### Assumption C
Trust is a product feature, not an admin side task.

### Decision recommendation
Use a modular monolith for the MVP so the team can move fast without paying the complexity tax of microservices too early.

## 7) Acceptance criteria for PM/PO

A release is successful only if:
- a generator can publish a material from mobile
- a buyer can discover and contact that listing
- a quote can be exchanged formally in chat
- logistics can be attached to the transaction
- the admin can moderate disputes and publications
- the role dashboard shows the relevant KPIs

## 8) Risks

- Low liquidity in first months
- Users bypassing the platform after first contact
- Inconsistent material descriptions
- Logistics edge cases
- Poor data quality
- Low trust in first-time users

## 9) What the PM should keep steering

- category prioritization
- go-to-market by city and vertical
- feature sequencing
- KPI definition
- monetization rules
- operational support model

---

# Appendix — Product to architecture traceability

The architecture must support the product flows already represented in the MVP modules:
- personas
- journey map
- design system
- roadmap
- prototype
- marketplace
- publication flow
- purchases
- chat
- trust profile
- logistics
- admin
- dashboards
