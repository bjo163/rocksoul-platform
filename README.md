<div align="center">

<img src="https://raw.githubusercontent.com/bjo163/rocksoul-assets/main/moonwitness/brand/logo-horizontal.svg" alt="MoonWitness" width="420" />

# ROCKSOUL PLATFORM

## **THE ADMINISTRATION / IAM LAYER**

### **OPERATE THE PRODUCT. GOVERN ACCESS. KEEP THE SYSTEM HEALTHY.**

Internal administration and identity/authorization authority for the **MoonWitness × Rocksoul** ecosystem: accounts, users, organizations, roles, permissions, authorization, moderation authority, settings, service health, system configuration, and admin audit.

</div>

---

> **PLATFORM governs identity, access, and product operations. CRAYON consumes identity while operating research workflows. COMMUNITY owns participation and public profiles. The intelligence repositories own research truth.**

## Authority boundary

```text
PLATFORM
= ACCOUNT · USER · ORGANIZATION · ROLE · PERMISSION
  AUTHORIZATION · MODERATION AUTHORITY · SYSTEM CONFIG · ADMIN AUDIT

COMMUNITY
= PUBLIC PROFILE · THREAD · COMMENT · DISCUSSION · PROPOSAL · PARTICIPATION

CRAYON
= authenticated operator consumer
```

Existing Community or Crayon sign-in/session implementations are compatibility surfaces; they do not redefine IAM authority. A local identity provider may remain available while consumers integrate Platform-owned identity contracts.

## Machine-readable ecosystem contract

The canonical repository/domain/product binding is versioned at:

```text
contracts/rocksoul.ecosystem.v1.json
```

Normal Platform CI validates that file locally and does **not** require other repositories. A separate scheduled/manual integration workflow, `.github/workflows/ecosystem-certification.yml`, reads current `main` branches and checks cross-repository compatibility.

```text
STORY        → rocksoul-mftl        → mftl:
EVENT        → rocksoul-legend      → legend:
PERSON       → rocksoul-superhero   → superhero:
TEXT         → rocksoul-rgbl        → rgbl:
LAW          → rocksoul-aws         → aws:
PERSPECTIVE  → rocksoul-jizz        → jizz:
RELATIONSHIP → rocksoul-correlation → correlation:

DESIGN       → rocksoul-assets
UI           → rocksoul-ui
PUBLIC       → rocksoul-web
COMMUNITY    → rocksoul-community
ADMIN / IAM  → rocksoul-platform
OPERATIONS   → rocksoul-crayon
```

Repository names and semantic domain names are deliberately distinct. In particular `RGBL` is the repository/product identity while `TEXT` is its semantic domain, and `AWS` is the repository/product identity while `LAW` is its semantic domain.

## Canonical branch rule

`main` is the ecosystem source of truth. Canonical foreign references resolve against the owning repository's `main`; a `dev`-only target is development/pending promotion, not canonical.

## Platform vs Console

| | `rocksoul-platform` | `rocksoul-crayon` |
|---|---|---|
| Primary role | administration / IAM authority | research/operator console |
| Users / roles | canonical authority | consumes authorization context |
| Moderation | authority and admin operations | research review workflow |
| Research domains | references only | operates across all six research domains + relationships |
| Canonical research | never owns | never silently owns |

## Application implementation

The administration surface is a React 19 + Vite consumer of a pinned commit of `@rocksoul/ui`. Platform navigation is intentionally narrower than the shared Crayon/workspace shell:

| Route | Platform responsibility |
|---|---|
| `/` | administration dashboard |
| `/users` | users, invitations, and role posture |
| `/authorization` | capability and permission boundaries |
| `/moderation` | moderation authority and queue actions |
| `/service-status` | delivery dependency and backend integration status |
| `/audit` | operational audit trail |
| `/settings` | product/system configuration |
| `/system-states` | shared recovery-state reference |

`/cases` remains a compatibility entry to Platform moderation review. Research workspace routes such as `/work/kanban`, `/work/calendar`, `/chat`, and `/ai` intentionally resolve to the Platform boundary/404 view because those workflows belong to `rocksoul-crayon`.

### Runtime data boundary

The UI currently ships with explicit browser-persisted fixture state for admin interactions. This is deliberate: there is no live, Platform-owned IAM data service connected to this Vercel application yet. The frontend does not pretend that Crayon or Community authentication is the canonical Platform backend.

A production IAM backend must preserve the same authority model and persist:

- ACCOUNT / USER / ORGANIZATION;
- ROLE / PERMISSION / authorization decisions;
- moderation authority;
- system configuration;
- privileged audit events.

### Development

```bash
npm install
npm run dev
npm run ci
```

Normal CI installs the pinned UI Git dependency, runs the ecosystem contract guard, the Platform UI boundary audit, TypeScript strict checking, and the Vite production build.

## Guardrails

- product administration ≠ research adjudication;
- community popularity ≠ research validity;
- authentication compatibility ≠ duplicate IAM authority;
- system configuration may bind repositories, but it does not copy their canonical records;
- cross-repository certification is separate from normal local CI.

<div align="center">

## **GOVERN THE PRODUCT. PRESERVE THE BOUNDARIES.**

`PLATFORM / MoonWitness × Rocksoul`

</div>
