<div align="center">

<img src="https://raw.githubusercontent.com/bjo163/rocksoul-assets/main/moonwitness/brand/logo-horizontal.svg" alt="MoonWitness" width="420" />

# ROCKSOUL PLATFORM

## **THE ADMINISTRATION LAYER**

### **OPERATE THE PRODUCT. GOVERN ACCESS. KEEP THE SYSTEM HEALTHY.**

Internal administration and product-operations surface for the **MoonWitness × Rocksoul** ecosystem: users, authorization, moderation operations, settings, service health, and governed operational workflows.

![Role](https://img.shields.io/badge/role-PLATFORM-6F6F6F)
![Design](https://img.shields.io/badge/design-rocksoul--assets-B43A32)
![UI](https://img.shields.io/badge/UI-%40rocksoul%2Fui-3178C6)
![Boundary](https://img.shields.io/badge/platform-%E2%89%A0%20research%20canon-111111)

[Design Source](https://github.com/bjo163/rocksoul-assets) · [UI System](https://github.com/bjo163/rocksoul-ui) · [Community](https://github.com/bjo163/rocksoul-community) · [Console](https://github.com/bjo163/rocksoul-crayon)

</div>

---

> **PLATFORM governs product operations. CRAYON operates research workflows. The intelligence repositories own research truth.**

## Product role

```mermaid
flowchart LR
    A["ROCKSOUL-ASSETS\nvisual source"] --> U["ROCKSOUL-UI"]
    U --> P["ROCKSOUL-PLATFORM"]
    P --> IAM["USERS + AUTHORIZATION"]
    P --> MOD["MODERATION OPERATIONS"]
    P --> CFG["SETTINGS + CONFIGURATION"]
    P --> OPS["SERVICE / PRODUCT HEALTH"]
```

The canonical baseline is `rocksoul-assets` screen **15 — Platform Admin**, extended by v2 authorization, settings, dashboard, notification, and system-state surfaces.

## Platform surfaces

```text
ADMIN DASHBOARD
USERS + ROLES
AUTHORIZATION
MODERATION OPERATIONS
SETTINGS
SERVICE STATUS
NOTIFICATIONS
AUDIT / OPERATIONAL LOGS
SYSTEM STATES
```

## Platform vs Console

| | `rocksoul-platform` | `rocksoul-crayon` |
|---|---|---|
| Primary role | product administration | research/operator console |
| Users / roles | owns operational UX | consumes authorization context |
| Moderation | community/product operations | research review workflow |
| Research domains | references only | operates across all five |
| Canonical research | never owns | never silently owns |

## Ecosystem contract

```text
ASSETS      → visual truth
UI          → reusable implementation grammar
WEB         → public observatory
COMMUNITY   → participation
PLATFORM    → administration
CRAYON      → research operations

MFTL        → STORY
LEGEND      → EVENT
SUPERHERO   → PERSON
RGBL        → TEXT
AWS         → LAW
```

## Visual contract

- platform/admin surfaces use the clean, dense operational treatment defined in assets;
- use `@rocksoul/ui` shared shell, status, tables, forms, authorization, and system states;
- do not introduce a parallel navigation or token system;
- status must never be color-only;
- destructive and privileged operations require explicit affordances and auditability;
- product administration ≠ research adjudication.

---

<div align="center">

<img src="https://raw.githubusercontent.com/bjo163/rocksoul-assets/main/moonwitness/brand/rocksoul-lockup.svg" alt="MoonWitness Rocksoul" width="520" />

## **GOVERN THE PRODUCT. PRESERVE THE BOUNDARIES.**

`PLATFORM / MoonWitness × Rocksoul`

</div>
