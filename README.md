<div align="center">

<img src="https://raw.githubusercontent.com/bjo163/rocksoul-assets/main/moonwitness/brand/logo-horizontal.svg" alt="MoonWitness" width="420" />

# ROCKSOUL PLATFORM

## **THE ADMINISTRATION / IAM AUTHORITY**

### **AUTHENTICATE. AUTHORIZE. OPERATE. AUDIT.**

Production administration surface for the **MoonWitness × Rocksoul** ecosystem. Platform owns product identity/authorization posture, moderation authority, configuration, service health, and privileged operational audit. Research truth remains with the owning domain repositories.

</div>

---

> **PLATFORM governs identity and product operations. COMMUNITY owns participation. CRAYON consumes authorization while operating research workflows. Research repositories own canonical research truth.**

## Runtime architecture

\`\`\`text
rocksoul-assets / main
        ↓ canonical V2 visual contracts 28–35
rocksoul-ui / exact commit
        ↓ typed Platform Admin components + contract
rocksoul-platform / React + Vite
        ↓
Managed Better Auth ── JWT ── Neon Data API
                              ↓
                       platform schema
                       RPC-only access
                       role checks
                       audit traces
\`\`\`

The browser never receives a PostgreSQL connection string. The committed runtime configuration contains only public Auth/Data API endpoints and deployment metadata. Authenticated requests carry short-lived JWTs; Postgres access is restricted to explicit \`platform.*\` RPC functions.

## Platform surfaces

Navigation is consumed from \`@rocksoul/ui\`'s \`platformAdminContract\`, not recreated here.

| Surface | Responsibility |
|---|---|
| Dashboard | live IAM / moderation / audit posture |
| Users & Roles | authenticated directory, Platform role and state management |
| Authorization | canonical role-capability matrix |
| Moderation | authoritative moderation queue decisions |
| Service Status | live Assets / UI / Platform / IAM health |
| Audit Log | privileged mutation traceability |
| Settings | product-level operational configuration |
| System States | loading, empty, error, offline, forbidden, unconfigured recovery language |

Each surface can display its matching canonical V2 visual reference from \`rocksoul-assets\` screen 28–35.

## Authentication and bootstrap

Managed Better Auth is enabled on the dedicated Neon project \`rocksoul-platform\`. Production origin \`https://rocksoul-platform.vercel.app\` is trusted. Email/password accounts use email verification; OAuth development providers are not exposed.

A newly authenticated account is synchronized to the operational directory by \`platform.ensure_profile()\`, but receives **no Platform role automatically**. This intentionally prevents "first user wins" privilege escalation.

The first administrator must be promoted deliberately from the Neon control plane/database. After an admin exists, role and state changes happen through Platform and are audited.

## Data authority

The Data API exposes only the \`platform\` schema. Roles \`anonymous\` and \`authenticated\` have no direct table access. The application calls security-definer RPCs that evaluate \`auth.user_id()\`:

- \`platform.ensure_profile()\`
- \`platform.bootstrap()\`
- \`platform.set_user_state(...)\`
- \`platform.set_user_role(...)\`
- \`platform.update_setting(...)\`
- \`platform.moderate(...)\`

Every privileged mutation writes a trace to \`platform.audit\`.

## No fixture authority

There is no browser-persisted user directory, local audit trail, fake repository status, fake admin identity, or fallback mutation store. When Auth/Data API is unavailable, the UI is explicitly degraded/offline and mutations fail closed.

Empty moderation or audit tables render as real empty states. A user without a Platform role sees an access-pending/forbidden state rather than synthetic records.

## Development

\`\`\`bash
npm install
npm run dev
npm run ci
\`\`\`

Local Auth access is disabled on the production Neon branch. Use a dedicated Neon development branch and a development \`runtime-config.json\` for local authentication work rather than weakening production trusted-origin policy.

## Ecosystem authority

\`\`\`text
STORY        → rocksoul-mftl
EVENT        → rocksoul-legend
PERSON       → rocksoul-superhero
TEXT         → rocksoul-rgbl
LAW          → rocksoul-aws
PERSPECTIVE  → rocksoul-jizz
RELATIONSHIP → rocksoul-correlation

DESIGN       → rocksoul-assets
UI           → rocksoul-ui
PUBLIC       → rocksoul-web
COMMUNITY    → rocksoul-community
ADMIN / IAM  → rocksoul-platform
OPERATIONS   → rocksoul-crayon
\`\`\`

<div align="center">

## **GOVERN THE PRODUCT. PRESERVE THE BOUNDARIES.**

\`PLATFORM / MoonWitness × Rocksoul\`

</div>
