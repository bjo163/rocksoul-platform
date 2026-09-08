import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ApplicationActionsProvider,
  ApplicationShell,
  AuditEventRow,
  Badge,
  Button,
  Input,
  MetricTile,
  ModerationQueue,
  MoonWitnessPersonaAvatar,
  RepositoryMonitor,
  StatePanel,
  type AppCommandAction,
  type AppNotification,
  type AppResource,
  type ApplicationActions,
} from "@rocksoul/ui"

export const ROCKSOUL_UI_PIN = "e25978b8745046510fc071e9cc05a5d74a1ff650"

const platformPermissions = [
  "authenticated",
  "iam:read",
  "authorization:read",
  "moderation:read",
  "settings:read",
  "service:read",
  "audit:read",
] as const

const platformResources: AppResource[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    group: "System",
    description: "Admin posture, identity operations, and product health.",
    shortcut: "D",
    requiredPermission: "authenticated",
  },
  {
    id: "users",
    label: "Users & Roles",
    href: "/users",
    group: "Resource",
    description: "Platform-owned accounts, invitations, roles, and access posture.",
    shortcut: "U",
    requiredPermission: "iam:read",
  },
  {
    id: "authorization",
    label: "Authorization",
    href: "/authorization",
    group: "Resource",
    description: "Role capability matrix and privileged-operation boundaries.",
    shortcut: "A",
    requiredPermission: "authorization:read",
  },
  {
    id: "moderation",
    label: "Moderation",
    href: "/moderation",
    group: "Resource",
    description: "Community and product moderation authority.",
    shortcut: "M",
    requiredPermission: "moderation:read",
  },
  {
    id: "service-status",
    label: "Service Status",
    href: "/service-status",
    group: "System",
    description: "Dependency posture and backend integration boundary.",
    shortcut: "H",
    requiredPermission: "service:read",
  },
  {
    id: "audit",
    label: "Audit Log",
    href: "/audit",
    group: "System",
    description: "Inspectable operational events and privileged actions.",
    shortcut: "L",
    requiredPermission: "audit:read",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    group: "Account",
    description: "Platform-level product and operational configuration.",
    shortcut: "S",
    requiredPermission: "settings:read",
  },
  {
    id: "system-states",
    label: "System States",
    href: "/system-states",
    group: "System",
    description: "Recovery language for error, empty, loading, offline, and forbidden.",
    shortcut: "X",
    requiredPermission: "service:read",
  },
]

const platformCommands: AppCommandAction[] = [
  { label: "Invite a platform user", href: "/users", shortcut: "U" },
  { label: "Review moderation queue", href: "/moderation", shortcut: "M" },
  { label: "Inspect service status", href: "/service-status", shortcut: "H" },
]

type UserRole = "admin" | "moderator" | "researcher"
type UserState = "active" | "invited" | "suspended"

interface PlatformUser {
  id: string
  name: string
  email: string
  role: UserRole
  state: UserState
}

interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  result: string
  traceId: string
}

interface PlatformSettings {
  organizationName: string
  invitationsEnabled: boolean
  maintenanceMode: boolean
}

const initialUsers: PlatformUser[] = [
  { id: "USR-ADMIN-01", name: "Rocksoul Admin", email: "admin@moonwitness.local", role: "admin", state: "active" },
  { id: "USR-MOD-01", name: "Platform Moderator", email: "moderator@moonwitness.local", role: "moderator", state: "active" },
  { id: "USR-RESEARCH-01", name: "Research Consumer", email: "researcher@moonwitness.local", role: "researcher", state: "invited" },
]

const initialAudit: AuditEvent[] = [
  { id: "A-001", timestamp: "07:19", actor: "system", action: "platform.ui.deployed", resource: "rocksoul-platform", result: "ready", traceId: "PLATFORM-UI-001" },
  { id: "A-002", timestamp: "07:38", actor: "assets-bot", action: "brand.derivatives.generated", resource: "rocksoul-assets", result: "ready", traceId: "ASSETS-OG-001" },
  { id: "A-003", timestamp: "07:49", actor: "ui-ci", action: "asset.freshness.checked", resource: "rocksoul-ui", result: "accepted", traceId: "UI-SYNC-001" },
]

const initialNotifications: AppNotification[] = [
  {
    id: "PLATFORM-MODE-1",
    title: "Local fixture authority is active",
    body: "Admin mutations persist in this browser until a central Platform IAM backend is connected.",
    state: "unread",
    variant: "system",
  },
  {
    id: "PLATFORM-BOUNDARY-1",
    title: "Research workspaces are outside Platform",
    body: "Kanban, Calendar, Chat, and AI remain Crayon responsibilities.",
    state: "read",
    variant: "review",
  },
]

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const saved = window.localStorage.getItem(key)
      return saved ? JSON.parse(saved) as T : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Local persistence is best-effort. The UI stays usable without storage.
    }
  }, [key, value])

  return [value, setValue] as const
}

function PlatformFrame({
  activeResource,
  title,
  section,
  notifications,
  children,
}: {
  activeResource: string
  title: string
  section: string
  notifications: AppNotification[]
  children: ReactNode
}) {
  return (
    <ApplicationShell
      activeResource={activeResource}
      breadcrumbs={[{ label: "PLATFORM", href: "/" }, { label: section }, { label: title }]}
      backendState="degraded"
      user={{ name: "Rocksoul Admin", role: "admin" }}
      permissions={platformPermissions}
      resources={platformResources}
      notifications={notifications}
      commandActions={platformCommands}
    >
      <div className="platform-page">{children}</div>
    </ApplicationShell>
  )
}

function PageHeading({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string
  title: string
  copy: string
  action?: ReactNode
}) {
  return (
    <header className="platform-heading">
      <div>
        <p className="platform-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="platform-subtitle">{copy}</p>
      </div>
      {action ? <div className="platform-heading-action">{action}</div> : null}
    </header>
  )
}

function DashboardScreen({
  notifications,
  users,
  assetCommit,
  uiCommit,
}: {
  notifications: AppNotification[]
  users: PlatformUser[]
  assetCommit: string
  uiCommit: string
}) {
  const active = users.filter((user) => user.state === "active").length
  const privileged = users.filter((user) => user.role === "admin" || user.role === "moderator").length

  return (
    <PlatformFrame activeResource="dashboard" title="Dashboard" section="HOME" notifications={notifications}>
      <PageHeading
        eyebrow="ADMIN / IAM / OPERATIONS"
        title="Govern the product."
        copy="Identity authority, moderation, configuration, and operational health stay separate from research adjudication."
      />
      <div className="platform-metrics">
        <MetricTile label="Platform users" value={String(users.length).padStart(2, "0")} context={String(active) + " active"} />
        <MetricTile label="Privileged roles" value={String(privileged).padStart(2, "0")} context="admin + moderator" tone="warning" />
        <MetricTile label="Backend mode" value="LOCAL" context="browser-persisted fixture" tone="warning" />
        <MetricTile label="Unread" value={String(notifications.filter((item) => item.state === "unread").length)} context="platform notifications" />
      </div>

      <div className="platform-grid platform-grid-two">
        <section className="platform-card">
          <div className="platform-card-head">
            <div>
              <p className="platform-kicker">Authority boundary</p>
              <h2>Platform owns admin/IAM.</h2>
            </div>
            <Badge variant="verified">ENFORCED IN NAV</Badge>
          </div>
          <div className="platform-list">
            <div className="platform-row"><span>ACCOUNT / USER / ROLE</span><strong>PLATFORM</strong></div>
            <div className="platform-row"><span>MODERATION AUTHORITY</span><strong>PLATFORM</strong></div>
            <div className="platform-row"><span>RESEARCH WORKSPACE</span><strong>CRAYON</strong></div>
            <div className="platform-row"><span>CANONICAL RESEARCH</span><strong>OWNER REPOS</strong></div>
          </div>
        </section>

        <section className="platform-card">
          <div className="platform-card-head">
            <div>
              <p className="platform-kicker">Pinned delivery</p>
              <h2>Reproducible UI inputs.</h2>
            </div>
            <Badge variant="info">PINNED</Badge>
          </div>
          <dl className="platform-definition-list">
            <div><dt>@rocksoul/ui</dt><dd>{uiCommit.slice(0, 12)}</dd></div>
            <div><dt>rocksoul-assets accepted main</dt><dd>{assetCommit.slice(0, 12)}</dd></div>
            <div><dt>Runtime</dt><dd>React 19 / Vite 8 / Node 24</dd></div>
            <div><dt>Persistence</dt><dd>Local fixture until IAM API exists</dd></div>
          </dl>
        </section>
      </div>
    </PlatformFrame>
  )
}

function UsersScreen({
  notifications,
  users,
  setUsers,
  record,
}: {
  notifications: AppNotification[]
  users: PlatformUser[]
  setUsers: React.Dispatch<React.SetStateAction<PlatformUser[]>>
  record: (action: string, resource: string, result: string) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const invite = () => {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanName || !cleanEmail.includes("@")) return
    const id = "USR-" + String(Date.now())
    setUsers((current) => [
      ...current,
      { id, name: cleanName, email: cleanEmail, role: "researcher", state: "invited" },
    ])
    record("iam.user.invited", id, "invited")
    setName("")
    setEmail("")
  }

  const toggleUser = (id: string) => {
    setUsers((current) => current.map((user) => {
      if (user.id !== id) return user
      const nextState: UserState = user.state === "suspended" ? "active" : "suspended"
      return { ...user, state: nextState }
    }))
    record("iam.user.state.changed", id, "updated")
  }

  return (
    <PlatformFrame activeResource="users" title="Users & Roles" section="IAM" notifications={notifications}>
      <PageHeading
        eyebrow="ACCOUNT / USER / ROLE"
        title="Users & roles."
        copy="Platform is the authority surface for identity operations. Public profile data remains Community-owned."
      />

      <div className="platform-grid platform-grid-two">
        <section className="platform-card">
          <p className="platform-kicker">Invite user</p>
          <h2>Create a controlled invitation.</h2>
          <div className="platform-form">
            <Input label="Display name" value={name} onChange={(event) => setName(event.currentTarget.value)} placeholder="Name" />
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} placeholder="name@example.com" />
            <Button onClick={invite} disabled={!name.trim() || !email.includes("@")}>Invite researcher</Button>
          </div>
          <p className="platform-note">Fixture mode / invitations persist in this browser and are written to the local audit trail.</p>
        </section>

        <section className="platform-card">
          <p className="platform-kicker">Role posture</p>
          <h2>Privilege stays explicit.</h2>
          <div className="platform-list">
            <div className="platform-row"><span>Admin</span><Badge variant="prohibited">PRIVILEGED</Badge></div>
            <div className="platform-row"><span>Moderator</span><Badge variant="partial">ELEVATED</Badge></div>
            <div className="platform-row"><span>Researcher</span><Badge variant="verified">CONSUMER</Badge></div>
          </div>
        </section>
      </div>

      <section className="platform-card platform-card-spaced">
        <div className="platform-card-head">
          <div><p className="platform-kicker">Directory</p><h2>{users.length} platform identities</h2></div>
          <Badge variant="neutral">LOCAL FIXTURE</Badge>
        </div>
        <div className="platform-user-list">
          {users.map((user) => (
            <article key={user.id} className="platform-user-row">
              <MoonWitnessPersonaAvatar
                persona={user.role === "admin" ? "admin" : user.role === "moderator" ? "moderator" : "researcher"}
                alt=""
                className="platform-avatar"
              />
              <div className="platform-user-copy">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <code>{user.id}</code>
              </div>
              <Badge variant={user.role === "admin" ? "prohibited" : user.role === "moderator" ? "partial" : "verified"}>{user.role}</Badge>
              <Badge variant={user.state === "active" ? "verified" : user.state === "suspended" ? "prohibited" : "info"}>{user.state}</Badge>
              <Button size="sm" variant={user.state === "suspended" ? "secondary" : "ghost"} onClick={() => toggleUser(user.id)}>
                {user.state === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
            </article>
          ))}
        </div>
      </section>
    </PlatformFrame>
  )
}

function AuthorizationScreen({
  notifications,
  record,
}: {
  notifications: AppNotification[]
  record: (action: string, resource: string, result: string) => void
}) {
  const rows = [
    ["Inspect platform users", "ALLOWED", "ALLOWED", "READ ONLY"],
    ["Manage user state", "ALLOWED", "LIMITED", "DENIED"],
    ["Moderate submissions", "ALLOWED", "ALLOWED", "DENIED"],
    ["Change system config", "ALLOWED", "DENIED", "DENIED"],
    ["Publish research conclusion", "DENIED", "DENIED", "DENIED"],
  ]

  return (
    <PlatformFrame activeResource="authorization" title="Authorization" section="IAM" notifications={notifications}>
      <PageHeading
        eyebrow="ROLE / PERMISSION / BOUNDARY"
        title="Authorization."
        copy="Permissions are visible before privileged operations. Platform authority never turns into research adjudication."
        action={<Button variant="secondary" onClick={() => record("authorization.review.requested", "role-matrix", "queued")}>Review matrix</Button>}
      />
      <section className="platform-card platform-card-spaced">
        <div className="platform-table-wrap">
          <table className="platform-table">
            <thead><tr><th>Capability</th><th>Admin</th><th>Moderator</th><th>Researcher</th></tr></thead>
            <tbody>
              {rows.map(([capability, admin, moderator, researcher]) => (
                <tr key={capability}>
                  <th>{capability}</th>
                  {[admin, moderator, researcher].map((value, index) => (
                    <td key={String(index)}>
                      <Badge variant={value === "ALLOWED" ? "verified" : value === "LIMITED" || value === "READ ONLY" ? "partial" : "prohibited"}>{value}</Badge>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="platform-boundary">RULE / Platform can govern who may operate a workflow. It cannot convert a relationship into a research verdict.</p>
      </section>
    </PlatformFrame>
  )
}

function ModerationScreen({
  notifications,
  record,
}: {
  notifications: AppNotification[]
  record: (action: string, resource: string, result: string) => void
}) {
  const [submission, setSubmission] = useStoredState("rocksoul-platform:moderation", {
    id: "SUB-0042-01",
    state: "unverified" as "unverified" | "in-review" | "verified" | "rejected" | "needs-context",
    title: "Possible second trace",
    body: "Community submission references a second trace but provenance is incomplete.",
  })

  return (
    <PlatformFrame activeResource="moderation" title="Moderation" section="OPERATIONS" notifications={notifications}>
      <PageHeading
        eyebrow="MODERATION AUTHORITY"
        title="Moderation operations."
        copy="Community participation remains non-canonical until review. Platform governs moderation actions, not research truth."
      />
      <div className="platform-card platform-card-spaced">
        <ModerationQueue
          submission={submission}
          onSelectAll={() => record("moderation.selection.all", submission.id, "selected")}
          onRequestContext={(id) => {
            setSubmission((current) => ({ ...current, state: "needs-context" }))
            record("moderation.context.requested", id, "needs-context")
          }}
          onReject={(id) => {
            setSubmission((current) => ({ ...current, state: "rejected" }))
            record("moderation.submission.rejected", id, "rejected")
          }}
          onBulkRequestContext={() => {
            setSubmission((current) => ({ ...current, state: "needs-context" }))
            record("moderation.bulk.context", submission.id, "needs-context")
          }}
          onReturnSelected={() => {
            setSubmission((current) => ({ ...current, state: "in-review" }))
            record("moderation.returned", submission.id, "in-review")
          }}
        />
      </div>
    </PlatformFrame>
  )
}

function ServiceStatusScreen({
  notifications,
  record,
  assetCommit,
  uiCommit,
}: {
  notifications: AppNotification[]
  record: (action: string, resource: string, result: string) => void
  assetCommit: string
  uiCommit: string
}) {
  const dependencies = [
    { repo: "rocksoul-assets", status: "online" as const, queue: 0, errors: 0 },
    { repo: "rocksoul-ui", status: "online" as const, queue: 0, errors: 0 },
    { repo: "rocksoul-platform", status: "online" as const, queue: 0, errors: 0 },
  ]

  return (
    <PlatformFrame activeResource="service-status" title="Service Status" section="SYSTEM" notifications={notifications}>
      <PageHeading
        eyebrow="PRODUCT / SERVICE HEALTH"
        title="Service status."
        copy="Build dependencies are pinned and inspectable. Central IAM persistence and telemetry still require a dedicated Platform backend."
      />
      <div className="platform-banner platform-banner-warning">
        <div><p className="platform-kicker">Backend integration</p><strong>NOT CONNECTED</strong></div>
        <p>The shipped UI uses browser-persisted fixture state. No external IAM database or identity provider is falsely presented as production-ready.</p>
        <Badge variant="partial">DEGRADED</Badge>
      </div>
      <section className="platform-card platform-card-spaced">
        <RepositoryMonitor
          repositories={dependencies}
          onSyncAll={() => record("service.dependencies.checked", "platform-build", "ready")}
          onInspect={(repo) => record("service.dependency.inspected", repo, "ready")}
        />
      </section>
      <section className="platform-card platform-card-spaced">
        <p className="platform-kicker">Pinned inputs</p>
        <dl className="platform-definition-list">
          <div><dt>UI commit</dt><dd>{uiCommit}</dd></div>
          <div><dt>Accepted asset main</dt><dd>{assetCommit}</dd></div>
          <div><dt>Platform frontend</dt><dd>Vercel / Vite</dd></div>
          <div><dt>IAM data plane</dt><dd>External dependency not provisioned</dd></div>
        </dl>
      </section>
    </PlatformFrame>
  )
}

function AuditScreen({
  notifications,
  audit,
}: {
  notifications: AppNotification[]
  audit: AuditEvent[]
}) {
  return (
    <PlatformFrame activeResource="audit" title="Audit Log" section="SYSTEM" notifications={notifications}>
      <PageHeading
        eyebrow="ADMIN AUDIT"
        title="Operational log."
        copy="Every local fixture mutation is inspectable here. A production backend must persist the same semantics server-side."
      />
      <section className="platform-card platform-audit">
        {audit.length ? audit.map((event) => (
          <AuditEventRow
            key={event.id}
            timestamp={event.timestamp}
            actor={event.actor}
            action={event.action}
            resource={event.resource}
            result={event.result}
            traceId={event.traceId}
          />
        )) : <StatePanel state="empty" />}
      </section>
    </PlatformFrame>
  )
}

function SettingsScreen({
  notifications,
  settings,
  setSettings,
  record,
}: {
  notifications: AppNotification[]
  settings: PlatformSettings
  setSettings: React.Dispatch<React.SetStateAction<PlatformSettings>>
  record: (action: string, resource: string, result: string) => void
}) {
  const [draftName, setDraftName] = useState(settings.organizationName)

  const save = () => {
    setSettings((current) => ({ ...current, organizationName: draftName.trim() || current.organizationName }))
    record("settings.organization.updated", "platform", "saved")
  }

  return (
    <PlatformFrame activeResource="settings" title="Settings" section="CONFIG" notifications={notifications}>
      <PageHeading
        eyebrow="SYSTEM CONFIG"
        title="Platform settings."
        copy="Configuration controls product operations. It does not copy or mutate canonical research records."
      />
      <div className="platform-grid platform-grid-two">
        <section className="platform-card">
          <p className="platform-kicker">Organization</p>
          <h2>Identity context.</h2>
          <div className="platform-form">
            <Input label="Organization name" value={draftName} onChange={(event) => setDraftName(event.currentTarget.value)} />
            <Button onClick={save}>Save organization</Button>
          </div>
        </section>
        <section className="platform-card">
          <p className="platform-kicker">Operational toggles</p>
          <h2>Explicit system controls.</h2>
          <label className="platform-toggle">
            <input
              type="checkbox"
              checked={settings.invitationsEnabled}
              onChange={(event) => {
                const checked = event.currentTarget.checked
                setSettings((current) => ({ ...current, invitationsEnabled: checked }))
                record("settings.invitations.changed", "platform", checked ? "enabled" : "disabled")
              }}
            />
            <span><strong>Invitations enabled</strong><small>Allow new local fixture invitations.</small></span>
          </label>
          <label className="platform-toggle">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(event) => {
                const checked = event.currentTarget.checked
                setSettings((current) => ({ ...current, maintenanceMode: checked }))
                record("settings.maintenance.changed", "platform", checked ? "enabled" : "disabled")
              }}
            />
            <span><strong>Maintenance mode</strong><small>Operational flag only; no research state is changed.</small></span>
          </label>
        </section>
      </div>
    </PlatformFrame>
  )
}

function SystemStatesScreen({ notifications }: { notifications: AppNotification[] }) {
  return (
    <PlatformFrame activeResource="system-states" title="System States" section="SYSTEM" notifications={notifications}>
      <PageHeading
        eyebrow="RECOVERY LANGUAGE"
        title="System states."
        copy="Error, empty, loading, offline, and forbidden states use the shared Rocksoul UI recovery grammar."
      />
      <div className="platform-state-grid">
        <StatePanel state="error" traceId="PLATFORM-QUERY-001" />
        <StatePanel state="empty" />
        <StatePanel state="loading" />
        <StatePanel state="offline" lastKnownState="Local fixture state remains available." />
        <StatePanel state="forbidden" requiredPermission="settings:write" currentRole="moderator" />
      </div>
    </PlatformFrame>
  )
}

function NotFoundScreen({
  notifications,
  path,
}: {
  notifications: AppNotification[]
  path: string
}) {
  const isConsoleRoute = path.startsWith("/work/") || path === "/chat" || path === "/ai"
  return (
    <PlatformFrame activeResource="dashboard" title="Not Found" section="BOUNDARY" notifications={notifications}>
      <PageHeading
        eyebrow="404 / PLATFORM BOUNDARY"
        title={isConsoleRoute ? "That belongs to Crayon." : "Not a Platform route."}
        copy={isConsoleRoute
          ? "Research workspaces are intentionally not duplicated inside the administration layer."
          : "The requested route is not registered in the Platform administration contract."}
        action={<a className="platform-link-button" href="/">Return to dashboard</a>}
      />
      <section className="platform-card platform-card-spaced">
        <p className="platform-kicker">Requested path</p>
        <code className="platform-path">{path}</code>
      </section>
    </PlatformFrame>
  )
}

export function PlatformApp({
  assetCommit,
  uiCommit,
}: {
  assetCommit: string
  uiCommit: string
}) {
  const [users, setUsers] = useStoredState<PlatformUser[]>("rocksoul-platform:users", initialUsers)
  const [audit, setAudit] = useStoredState<AuditEvent[]>("rocksoul-platform:audit", initialAudit)
  const [notifications, setNotifications] = useStoredState<AppNotification[]>("rocksoul-platform:notifications", initialNotifications)
  const [settings, setSettings] = useStoredState<PlatformSettings>("rocksoul-platform:settings", {
    organizationName: "MoonWitness",
    invitationsEnabled: true,
    maintenanceMode: false,
  })

  const record = (action: string, resource: string, result: string) => {
    const now = new Date()
    const id = "AUD-" + String(now.getTime())
    const timestamp = now.toISOString().slice(11, 16)
    const traceId = "TRACE-" + String(now.getTime())
    setAudit((current) => [
      { id, timestamp, actor: "platform-admin", action, resource, result, traceId },
      ...current,
    ].slice(0, 100))
    setNotifications((current) => [
      {
        id: "N-" + String(now.getTime()),
        title: action.replaceAll(".", " "),
        body: resource + " / " + result,
        state: "unread",
        variant: "system",
      },
      ...current,
    ].slice(0, 20))
  }

  const actions: ApplicationActions = useMemo(() => ({
    onMarkAllNotificationsRead: () => {
      setNotifications((current) => current.map((item) => ({ ...item, state: "read" as const })))
      const now = new Date()
      setAudit((current) => [{
        id: "AUD-" + String(now.getTime()),
        timestamp: now.toISOString().slice(11, 16),
        actor: "platform-admin",
        action: "notifications.marked.read",
        resource: "platform",
        result: "ok",
        traceId: "TRACE-" + String(now.getTime()),
      }, ...current].slice(0, 100))
    },
    onSignOut: () => record("session.signout.requested", "local-fixture", "not-connected"),
    onRequestAccess: ({ permission }) => record("authorization.access.requested", permission, "queued"),
    onRepositorySyncAll: () => record("service.dependencies.checked", "platform-build", "ready"),
    onRepositoryInspect: (repo) => record("service.dependency.inspected", repo, "ready"),
  }), [setNotifications, setAudit])

  const path = window.location.pathname === "/" ? "/" : window.location.pathname.replace(/\/+$/, "")
  let screen: ReactNode

  switch (path) {
    case "/":
    case "/dashboard":
      screen = <DashboardScreen notifications={notifications} users={users} assetCommit={assetCommit} uiCommit={uiCommit} />
      break
    case "/users":
      screen = <UsersScreen notifications={notifications} users={users} setUsers={setUsers} record={record} />
      break
    case "/authorization":
      screen = <AuthorizationScreen notifications={notifications} record={record} />
      break
    case "/moderation":
    case "/cases":
      screen = <ModerationScreen notifications={notifications} record={record} />
      break
    case "/service-status":
      screen = <ServiceStatusScreen notifications={notifications} record={record} assetCommit={assetCommit} uiCommit={uiCommit} />
      break
    case "/audit":
      screen = <AuditScreen notifications={notifications} audit={audit} />
      break
    case "/settings":
    case "/profile":
      screen = <SettingsScreen notifications={notifications} settings={settings} setSettings={setSettings} record={record} />
      break
    case "/system-states":
      screen = <SystemStatesScreen notifications={notifications} />
      break
    default:
      screen = <NotFoundScreen notifications={notifications} path={path} />
      break
  }

  return <ApplicationActionsProvider actions={actions}>{screen}</ApplicationActionsProvider>
}
