import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  ApplicationActionsProvider,
  ApplicationShell,
  AuditEventRow,
  Badge,
  Button,
  Input,
  MetricTile,
  MoonWitnessPersonaAvatar,
  PlatformAdminVisual,
  PlatformBackendBoundary,
  PlatformRoleMatrix,
  PlatformServiceRegistry,
  ROCKSOUL_ASSETS_SYNC,
  StatePanel,
  SubmissionCard,
  Switch,
  platformAdminCommandActions,
  platformAdminContract,
  platformAdminPermissions,
  platformAdminResources,
  type AppNotification,
  type ApplicationActions,
  type PlatformAdminRoleId,
  type PlatformAdminScreenId,
  type PlatformRuntimeState,
  type PlatformServiceRuntime,
} from "@rocksoul/ui"
import { AuthView, NeonAuthUIProvider } from "@neondatabase/auth-ui"
import packageMetadata from "../package.json"
import {
  createPlatformAuthClient,
  loadRuntimeConfig,
  platformRpc,
  probe,
  type PlatformAuthClient,
  type PlatformRuntimeConfig,
  type PlatformSession,
} from "./runtime"

type PlatformUserState = "active" | "invited" | "suspended"
type ModerationState = "unverified" | "in-review" | "needs-context" | "verified" | "rejected"

interface PlatformActor {
  id: string
  authUserId: string
  name: string
  email: string
  state: PlatformUserState
  roles: PlatformAdminRoleId[]
}

interface PlatformUser {
  id: string
  authUserId: string
  name: string
  email: string
  state: PlatformUserState
  roles: PlatformAdminRoleId[]
  createdAt: string
}

interface ModerationItem {
  id: string
  sourceType: string
  sourceReference: string
  title: string
  summary?: string | null
  state: ModerationState
  payload: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface AuditEvent {
  id: string
  actorId?: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  result: string
  traceId: string
  metadata: Record<string, unknown>
  createdAt: string
}

interface BootstrapData {
  actor: PlatformActor
  organization: {
    id: string
    slug: string
    name: string
  }
  users: PlatformUser[]
  moderation: ModerationItem[]
  settings: Record<string, unknown>
  audit: AuditEvent[]
}

interface SessionState {
  user: PlatformSession["user"]
  accessToken: string
}

function normalizePath(pathname: string) {
  if (pathname.startsWith("/auth")) return "/"
  if (pathname === "/") return pathname
  return pathname.replace(/\/+$/, "") || "/"
}

function currentRole(actor: PlatformActor): PlatformAdminRoleId | undefined {
  return actor.roles.find((role) => platformAdminContract.roles.some((item) => item.id === role))
}

function canOperate(actor: PlatformActor) {
  return actor.state === "active" && actor.roles.length > 0
}

function canAdmin(actor: PlatformActor) {
  return actor.state === "active" && actor.roles.includes("admin")
}

function canModerate(actor: PlatformActor) {
  return actor.state === "active" && (actor.roles.includes("admin") || actor.roles.includes("moderator"))
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function userForAudit(event: AuditEvent, users: PlatformUser[]) {
  if (!event.actorId) return "system"
  return users.find((user) => user.authUserId === event.actorId)?.name ?? event.actorId
}

function roleLabel(actor: PlatformActor) {
  return currentRole(actor) ?? "access pending"
}

function permissionsFor(actor: PlatformActor) {
  return canOperate(actor) ? platformAdminPermissions : ["authenticated"]
}

function settingString(settings: Record<string, unknown>, key: string, fallback: string) {
  const value = settings[key]
  return typeof value === "string" ? value : fallback
}

function settingBoolean(settings: Record<string, unknown>, key: string, fallback: boolean) {
  const value = settings[key]
  return typeof value === "boolean" ? value : fallback
}

function useServiceHealth(config: PlatformRuntimeConfig, dataPlaneState: PlatformRuntimeState) {
  const [services, setServices] = useState<PlatformServiceRuntime[]>([])
  const uiDependency = packageMetadata.dependencies["@rocksoul/ui"] ?? ""
  const uiCommit = uiDependency.split("#")[1] ?? "main"

  const refresh = useCallback(async () => {
    const assetsUrl =
      "https://raw.githubusercontent.com/bjo163/rocksoul-assets/" +
      ROCKSOUL_ASSETS_SYNC.acceptedMainCommit +
      "/moonwitness/ui/v2/platform-admin.json"
    const uiUrl =
      "https://raw.githubusercontent.com/bjo163/rocksoul-ui/" +
      uiCommit +
      "/package.json"

    const [assets, ui, platform] = await Promise.all([
      probe(assetsUrl),
      probe(uiUrl),
      probe("/runtime-config.json"),
    ])

    setServices([
      { id: "assets", state: assets, detail: "Canonical Platform visual contract / accepted main." },
      { id: "ui", state: ui, detail: "Pinned @rocksoul/ui implementation." },
      { id: "platform", state: platform, detail: window.location.host },
      {
        id: "iam-api",
        state: dataPlaneState,
        detail: config.database.projectId + " / " + config.database.region,
      },
    ])
  }, [config, dataPlaneState, uiCommit])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { services, refresh }
}

function VisualContract({ screen }: { screen: PlatformAdminScreenId }) {
  return (
    <details className="platform-visual-contract">
      <summary>
        <span>CANONICAL VISUAL / {platformAdminContract.navigation.find((item) => item.id === screen)?.screen}</span>
        <strong>View Rocksoul asset</strong>
      </summary>
      <div className="platform-visual-frame">
        <PlatformAdminVisual
          screen={screen}
          alt={platformAdminContract.navigation.find((item) => item.id === screen)?.label + " canonical Platform Admin visual"}
        />
      </div>
    </details>
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

function PlatformFrame({
  active,
  actor,
  backendState,
  notifications,
  children,
}: {
  active: PlatformAdminScreenId
  actor: PlatformActor
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
  children: ReactNode
}) {
  const nav = platformAdminContract.navigation.find((item) => item.id === active)
  return (
    <ApplicationShell
      activeResource={active}
      breadcrumbs={[
        { label: "PLATFORM", href: "/" },
        { label: nav?.group ?? "SYSTEM" },
        { label: nav?.label ?? active },
      ]}
      backendState={backendState}
      user={{ name: actor.name, role: roleLabel(actor) }}
      permissions={permissionsFor(actor)}
      resources={platformAdminResources}
      notifications={notifications}
      commandActions={platformAdminCommandActions}
    >
      <div className="platform-page">
        {children}
        <VisualContract screen={active} />
      </div>
    </ApplicationShell>
  )
}

function AccessPending({ actor }: { actor: PlatformActor }) {
  return (
    <div className="platform-stack">
      <PlatformBackendBoundary
        state="connected"
        detail="Authentication is valid and the Platform data plane is online. This account has no operational role yet."
      />
      <StatePanel
        state="forbidden"
        requiredPermission="platform:role"
        currentRole={roleLabel(actor)}
      />
    </div>
  )
}

function DashboardScreen({
  actor,
  data,
  services,
  backendState,
  notifications,
}: {
  actor: PlatformActor
  data: BootstrapData
  services: PlatformServiceRuntime[]
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
}) {
  const privileged = data.users.filter((user) => user.roles.includes("admin") || user.roles.includes("moderator")).length
  const unresolved = data.moderation.filter((item) => item.state === "unverified" || item.state === "needs-context" || item.state === "in-review").length

  return (
    <PlatformFrame active="dashboard" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="ADMIN / IAM / OPERATIONS"
        title="Govern the product."
        copy="Live identity, moderation, configuration, and service posture. Research truth remains outside Platform."
      />

      {!canOperate(actor) ? <AccessPending actor={actor} /> : (
        <>
          <div className="platform-metrics">
            <MetricTile label="Platform identities" value={String(data.users.length)} context="Server-authoritative directory" />
            <MetricTile label="Privileged roles" value={String(privileged)} context="Admin + moderator" tone={privileged ? "warning" : "neutral"} />
            <MetricTile label="Moderation attention" value={String(unresolved)} context="Open / needs context / in review" tone={unresolved ? "warning" : "good"} />
            <MetricTile label="Audit events" value={String(data.audit.length)} context="Latest server traces loaded" />
          </div>

          <div className="platform-grid platform-grid-two">
            <section className="platform-card">
              <div className="platform-card-head">
                <div>
                  <p className="platform-kicker">Authority boundary</p>
                  <h2>Administration without research ownership.</h2>
                </div>
                <Badge variant="verified">SERVER AUTHORITY</Badge>
              </div>
              <div className="platform-list">
                <div className="platform-row"><span>ACCOUNT / USER / ROLE</span><strong>PLATFORM</strong></div>
                <div className="platform-row"><span>PARTICIPATION</span><strong>COMMUNITY</strong></div>
                <div className="platform-row"><span>RESEARCH WORKSPACE</span><strong>CRAYON</strong></div>
                <div className="platform-row"><span>CANONICAL RESEARCH</span><strong>OWNER REPOS</strong></div>
              </div>
            </section>

            <PlatformServiceRegistry runtime={services} />
          </div>
        </>
      )}
    </PlatformFrame>
  )
}

function UserRow({
  user,
  actor,
  busy,
  onRole,
  onState,
}: {
  user: PlatformUser
  actor: PlatformActor
  busy: string | null
  onRole: (id: string, role: PlatformAdminRoleId | "none") => Promise<void>
  onState: (id: string, state: PlatformUserState) => Promise<void>
}) {
  const current = user.roles[0] ?? "none"
  const [draft, setDraft] = useState<PlatformAdminRoleId | "none">(current)

  useEffect(() => setDraft(current), [current])

  return (
    <article className="platform-user-row">
      <MoonWitnessPersonaAvatar
        persona={current === "admin" ? "admin" : current === "moderator" ? "moderator" : "researcher"}
        alt=""
        className="platform-avatar"
      />
      <div className="platform-user-copy">
        <strong>{user.name}</strong>
        <span>{user.email}</span>
        <code>{user.authUserId}</code>
      </div>
      <div className="platform-role-control">
        <label>
          <span>Platform role</span>
          <select
            value={draft}
            disabled={!canAdmin(actor) || busy === user.id}
            onChange={(event) => setDraft(event.currentTarget.value as PlatformAdminRoleId | "none")}
          >
            <option value="none">No role</option>
            {platformAdminContract.roles.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
          </select>
        </label>
        <Button
          size="sm"
          variant="secondary"
          loading={busy === user.id}
          disabled={!canAdmin(actor) || draft === current}
          onClick={() => void onRole(user.id, draft)}
        >
          Save role
        </Button>
      </div>
      <div className="platform-user-state">
        <Badge variant={user.state === "active" ? "verified" : user.state === "suspended" ? "prohibited" : "info"}>
          {user.state}
        </Badge>
        <Button
          size="sm"
          variant={user.state === "suspended" ? "secondary" : "danger"}
          disabled={!canAdmin(actor) || busy === user.id || user.id === actor.id}
          onClick={() => void onState(user.id, user.state === "suspended" ? "active" : "suspended")}
        >
          {user.state === "suspended" ? "Activate" : "Suspend"}
        </Button>
      </div>
    </article>
  )
}

function UsersScreen({
  actor,
  data,
  backendState,
  notifications,
  busy,
  onRole,
  onState,
}: {
  actor: PlatformActor
  data: BootstrapData
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
  busy: string | null
  onRole: (id: string, role: PlatformAdminRoleId | "none") => Promise<void>
  onState: (id: string, state: PlatformUserState) => Promise<void>
}) {
  return (
    <PlatformFrame active="users" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="ACCOUNT / USER / ROLE"
        title="Users & roles."
        copy="Accounts originate in Managed Better Auth. Platform assigns operational access without inventing a second identity provider."
        action={<Badge variant={canAdmin(actor) ? "verified" : "info"}>{canAdmin(actor) ? "ADMIN WRITE" : "READ ONLY"}</Badge>}
      />

      {!canOperate(actor) ? <AccessPending actor={actor} /> : (
        <>
          <section className="platform-card">
            <div className="platform-card-head">
              <div>
                <p className="platform-kicker">Onboarding model</p>
                <h2>Identity first. Privilege second.</h2>
              </div>
              <Badge variant="supported">NEON AUTH</Badge>
            </div>
            <p className="platform-copy">
              New accounts register through the authentication surface and enter this directory without a Platform role.
              An existing Platform admin may then grant Admin, Moderator, or Researcher access. No browser-side invitation record is created.
            </p>
          </section>

          <section className="platform-card platform-card-spaced">
            <div className="platform-card-head">
              <div><p className="platform-kicker">Directory</p><h2>{data.users.length} authenticated profiles</h2></div>
              <Badge variant="neutral">RPC / LIVE</Badge>
            </div>
            <div className="platform-user-list">
              {data.users.length ? data.users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  actor={actor}
                  busy={busy}
                  onRole={onRole}
                  onState={onState}
                />
              )) : <StatePanel state="empty" />}
            </div>
          </section>
        </>
      )}
    </PlatformFrame>
  )
}

function AuthorizationScreen({
  actor,
  backendState,
  notifications,
}: {
  actor: PlatformActor
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
}) {
  return (
    <PlatformFrame active="authorization" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="ROLE / CAPABILITY / BOUNDARY"
        title="Authorization."
        copy="The capability matrix comes from rocksoul-ui's canonical Platform contract; database mutations apply the stricter server-side role checks."
      />
      {!canOperate(actor) ? <AccessPending actor={actor} /> : (
        <section className="platform-card">
          <div className="platform-card-head">
            <div><p className="platform-kicker">Canonical matrix</p><h2>Who may operate what.</h2></div>
            <Badge variant="verified">CONTRACT DRIVEN</Badge>
          </div>
          <PlatformRoleMatrix currentRole={currentRole(actor)} />
        </section>
      )}
    </PlatformFrame>
  )
}

function ModerationScreen({
  actor,
  data,
  backendState,
  notifications,
  busy,
  onModerate,
}: {
  actor: PlatformActor
  data: BootstrapData
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
  busy: string | null
  onModerate: (id: string, state: ModerationState) => Promise<void>
}) {
  return (
    <PlatformFrame active="moderation" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="MODERATION / AUTHORITY"
        title="Moderation operations."
        copy="Participation state may change here; canonical research records do not."
        action={<Badge variant={canModerate(actor) ? "verified" : "restricted"}>{canModerate(actor) ? "WRITE ENABLED" : "READ RESTRICTED"}</Badge>}
      />

      {!canModerate(actor) ? (
        <StatePanel state="forbidden" requiredPermission="moderation:read" currentRole={roleLabel(actor)} />
      ) : data.moderation.length ? (
        <div className="platform-card-grid">
          {data.moderation.map((item) => (
            <SubmissionCard
              key={item.id}
              id={item.id}
              state={item.state}
              title={item.title}
              body={item.summary ?? "No summary supplied."}
              canonicalEvidence={false}
              source={item.sourceType + " / " + item.sourceReference}
              reviewer={actor.name}
              reviewActions={
                <div className="platform-action-row">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy === item.id}
                    onClick={() => void onModerate(item.id, "needs-context")}
                  >
                    Request context
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy === item.id}
                    onClick={() => void onModerate(item.id, "verified")}
                  >
                    Verify participation
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={busy === item.id}
                    onClick={() => void onModerate(item.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <StatePanel state="empty" />
      )}
    </PlatformFrame>
  )
}

function ServiceStatusScreen({
  actor,
  backendState,
  notifications,
  services,
  onRefresh,
}: {
  actor: PlatformActor
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
  services: PlatformServiceRuntime[]
  onRefresh: () => Promise<void>
}) {
  return (
    <PlatformFrame active="service-status" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="DEPENDENCY / HEALTH"
        title="Service status."
        copy="Health is probed from deployed endpoints and accepted source refs, never baked as a green fixture."
        action={<Button variant="secondary" onClick={() => void onRefresh()}>Probe services</Button>}
      />
      {!canOperate(actor) ? <AccessPending actor={actor} /> : <PlatformServiceRegistry runtime={services} />}
    </PlatformFrame>
  )
}

function AuditScreen({
  actor,
  data,
  backendState,
  notifications,
}: {
  actor: PlatformActor
  data: BootstrapData
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
}) {
  return (
    <PlatformFrame active="audit" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="TRACE / ACTOR / RESULT"
        title="Audit log."
        copy="Privileged state changes receive server-generated trace IDs. Empty means no audited mutation exists yet."
      />
      {!canOperate(actor) ? <AccessPending actor={actor} /> : (
        <section className="platform-card platform-audit">
          <div className="platform-card-head">
            <div><p className="platform-kicker">Latest server events</p><h2>{data.audit.length} traces loaded</h2></div>
            <Badge variant="verified">SERVER GENERATED</Badge>
          </div>
          {data.audit.length ? data.audit.map((event) => (
            <AuditEventRow
              key={event.id}
              timestamp={formatTime(event.createdAt)}
              actor={userForAudit(event, data.users)}
              action={event.action}
              resource={(event.resourceType + " / " + (event.resourceId ?? "—"))}
              result={event.result}
              traceId={event.traceId}
            />
          )) : <StatePanel state="empty" />}
        </section>
      )}
    </PlatformFrame>
  )
}

function SettingsScreen({
  actor,
  data,
  backendState,
  notifications,
  busy,
  onSetting,
}: {
  actor: PlatformActor
  data: BootstrapData
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
  busy: string | null
  onSetting: (key: string, value: unknown) => Promise<void>
}) {
  const [organizationName, setOrganizationName] = useState(
    settingString(data.settings, "organizationName", data.organization.name),
  )
  const invitationsEnabled = settingBoolean(data.settings, "invitationsEnabled", true)
  const maintenanceMode = settingBoolean(data.settings, "maintenanceMode", false)

  useEffect(() => {
    setOrganizationName(settingString(data.settings, "organizationName", data.organization.name))
  }, [data.organization.name, data.settings])

  return (
    <PlatformFrame active="settings" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="PRODUCT / CONFIGURATION"
        title="Settings."
        copy="Operational configuration is stored in Postgres and every write is audited."
        action={<Badge variant={canAdmin(actor) ? "verified" : "info"}>{canAdmin(actor) ? "ADMIN WRITE" : "READ ONLY"}</Badge>}
      />
      {!canOperate(actor) ? <AccessPending actor={actor} /> : (
        <div className="platform-grid platform-grid-two">
          <section className="platform-card">
            <p className="platform-kicker">Organization</p>
            <h2>Product identity.</h2>
            <div className="platform-form">
              <Input
                label="Organization name"
                value={organizationName}
                disabled={!canAdmin(actor)}
                onChange={(event) => setOrganizationName(event.currentTarget.value)}
              />
              <Button
                loading={busy === "organizationName"}
                disabled={!canAdmin(actor) || !organizationName.trim()}
                onClick={() => void onSetting("organizationName", organizationName.trim())}
              >
                Save organization
              </Button>
            </div>
          </section>

          <section className="platform-card">
            <p className="platform-kicker">Operational controls</p>
            <h2>Fail-safe switches.</h2>
            <div className="platform-switches">
              <Switch
                label="Account onboarding"
                description="Controls whether Platform considers new account onboarding open."
                checked={invitationsEnabled}
                disabled={!canAdmin(actor) || busy === "invitationsEnabled"}
                onChange={(event) => void onSetting("invitationsEnabled", event.currentTarget.checked)}
              />
              <Switch
                label="Maintenance mode"
                description="Marks Platform operations as intentionally constrained."
                checked={maintenanceMode}
                disabled={!canAdmin(actor) || busy === "maintenanceMode"}
                onChange={(event) => void onSetting("maintenanceMode", event.currentTarget.checked)}
              />
            </div>
          </section>
        </div>
      )}
    </PlatformFrame>
  )
}

function SystemStatesScreen({
  actor,
  backendState,
  notifications,
  onRetry,
}: {
  actor: PlatformActor
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
  onRetry: () => Promise<void>
}) {
  return (
    <PlatformFrame active="system-states" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="RECOVERY / LANGUAGE"
        title="System states."
        copy="Loading, empty, error, offline, forbidden, and unconfigured states share the same recovery grammar."
      />
      <div className="platform-state-grid">
        <StatePanel state="loading" />
        <StatePanel state="empty" />
        <StatePanel state="error" traceId="RUNTIME TRACE" onRetry={onRetry} />
        <StatePanel state="offline" lastKnownState="Server state is never synthesized locally." onRetry={onRetry} />
        <StatePanel state="forbidden" requiredPermission="platform:role" currentRole={roleLabel(actor)} />
        <PlatformBackendBoundary state="unconfigured" detail="Used when deployment configuration is absent or invalid. Mutations stay unavailable." />
      </div>
    </PlatformFrame>
  )
}

function NotFoundScreen({
  actor,
  backendState,
  notifications,
}: {
  actor: PlatformActor
  backendState: "online" | "degraded" | "offline"
  notifications: AppNotification[]
}) {
  return (
    <PlatformFrame active="dashboard" actor={actor} backendState={backendState} notifications={notifications}>
      <PageHeading
        eyebrow="BOUNDARY / NOT FOUND"
        title="Not a Platform route."
        copy="Research workspace routes belong to Crayon. Use the contract-driven Platform navigation to continue."
        action={<Button onClick={() => { window.location.href = "/" }}>Dashboard</Button>}
      />
      <section className="platform-card">
        <Badge variant="prohibited">404 / BOUNDARY</Badge>
        <p className="platform-copy">No fallback screen or hidden workspace has been mounted at this path.</p>
      </section>
    </PlatformFrame>
  )
}

function AuthGate({ config }: { config: PlatformRuntimeConfig }) {
  const authPath = window.location.pathname.startsWith("/auth/")
    ? window.location.pathname.split("/").filter(Boolean).pop() ?? "sign-in"
    : "sign-in"

  return (
    <main className="platform-auth-shell">
      <section className="platform-auth-copy">
        <p className="platform-kicker">MOONWITNESS × ROCKSOUL</p>
        <h1>Platform authority starts with verified identity.</h1>
        <p>
          Sign in or create an account through Managed Better Auth. Authentication alone grants no Platform role;
          operational access is promoted separately and audited.
        </p>
        <div className="platform-auth-posture">
          <Badge variant="supported">MANAGED BETTER AUTH</Badge>
          <Badge variant="verified">EMAIL VERIFIED</Badge>
          <Badge variant="neutral">JWT / RLS / RPC</Badge>
        </div>
        <dl className="platform-runtime-meta">
          <div><dt>Region</dt><dd>{config.database.region}</dd></div>
          <div><dt>Database branch</dt><dd>{config.database.branch}</dd></div>
          <div><dt>Anonymous table access</dt><dd>disabled</dd></div>
        </dl>
      </section>
      <section className="platform-auth-card" aria-label="Authentication">
        <AuthView path={authPath} />
      </section>
      <div className="platform-auth-visual" aria-hidden="true">
        <PlatformAdminVisual screen="authorization" alt="" />
      </div>
    </main>
  )
}

function RuntimeFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="platform-fail-closed">
      <div className="platform-fail-card">
        <Badge variant="prohibited">FAIL CLOSED</Badge>
        <h1>Platform runtime is unavailable.</h1>
        <p>{message}</p>
        <Button variant="danger" onClick={onRetry}>Reload configuration</Button>
      </div>
      <PlatformAdminVisual screen="system-states" alt="Platform fail-closed visual contract" />
    </main>
  )
}

function AuthenticatedPlatform({
  config,
  authClient,
}: {
  config: PlatformRuntimeConfig
  authClient: PlatformAuthClient
}) {
  const [session, setSession] = useState<SessionState | null | undefined>(undefined)
  const [data, setData] = useState<BootstrapData | null>(null)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const refreshSession = useCallback(async () => {
    const result = await authClient.getSession()
    const envelope = result.data as unknown as PlatformSession | null
    if (envelope?.session?.access_token && envelope.user) {
      setSession({ user: envelope.user, accessToken: envelope.session.access_token })
      return
    }
    setSession(null)
    setData(null)
  }, [authClient])

  useEffect(() => {
    void refreshSession()

    const refreshAfterNavigation = () => void refreshSession()
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshSession()
    }

    window.addEventListener("popstate", refreshAfterNavigation)
    window.addEventListener("focus", refreshAfterNavigation)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      window.removeEventListener("popstate", refreshAfterNavigation)
      window.removeEventListener("focus", refreshAfterNavigation)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [refreshSession])

  const refresh = useCallback(async () => {
    if (!session) return
    try {
      setBootstrapError(null)
      const next = await platformRpc<BootstrapData>(config, session.accessToken, "bootstrap")
      setData(next)
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Platform bootstrap failed.")
    }
  }, [config, session])

  useEffect(() => {
    if (session) void refresh()
  }, [refresh, session])

  const dataPlaneState: PlatformRuntimeState = bootstrapError ? "degraded" : data ? "connected" : "unconfigured"
  const { services, refresh: refreshServices } = useServiceHealth(config, dataPlaneState)
  const backendState = dataPlaneState === "connected" ? "online" : dataPlaneState === "offline" ? "offline" : "degraded"

  const mutate = useCallback(async (
    key: string,
    functionName: string,
    args: Record<string, unknown>,
    success: string,
  ) => {
    if (!session) return
    setBusy(key)
    try {
      await platformRpc(config, session.accessToken, functionName, args)
      setNotice(success)
      await refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Operation failed.")
    } finally {
      setBusy(null)
    }
  }, [config, refresh, session])

  const signOut = useCallback(async () => {
    await authClient.signOut()
    setSession(null)
    setData(null)
    window.history.replaceState({}, "", "/")
  }, [authClient])

  const actions = useMemo<ApplicationActions>(() => ({
    onSignOut: signOut,
    onMarkAllNotificationsRead: () => setNotice("Notification state is derived from current server posture."),
    onRetry: async () => {
      await refresh()
      await refreshServices()
    },
    onClearFilters: refresh,
    onRequestAccess: ({ permission }) => setNotice("Access request noted locally for " + permission + ". Role changes require an administrator."),
  }), [refresh, refreshServices, signOut])

  if (session === undefined) {
    return (
      <div className="platform-boot">
        <StatePanel state="loading" />
      </div>
    )
  }

  if (!session) return <AuthGate config={config} />

  if (bootstrapError && !data) {
    return (
      <main className="platform-fail-closed">
        <div className="platform-fail-card">
          <Badge variant="prohibited">DATA PLANE DEGRADED</Badge>
          <h1>Authenticated, but Platform data could not be loaded.</h1>
          <p>{bootstrapError}</p>
          <div className="platform-action-row">
            <Button variant="danger" onClick={() => void refresh()}>Retry data plane</Button>
            <Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>
          </div>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <div className="platform-boot">
        <StatePanel state="loading" />
      </div>
    )
  }

  const actor = data.actor
  const notifications: AppNotification[] = [
    ...(actor.roles.length === 0 ? [{
      id: "access-pending",
      title: "Platform role required",
      body: "Authentication succeeded, but this account has no Platform operational role.",
      state: "unread",
      variant: "review",
    } as const] : []),
    ...(data.moderation.length ? [{
      id: "moderation-live",
      title: "Moderation queue available",
      body: data.moderation.length + " server-backed moderation item(s) are loaded.",
      state: "unread",
      variant: "case-update",
    } as const] : []),
    {
      id: "authority-boundary",
      title: "Server authority active",
      body: "Mutations are JWT-authenticated, role-gated, and audited in Postgres.",
      state: "read",
      variant: "system",
    } as const,
  ]

  const path = normalizePath(window.location.pathname)
  const route = platformAdminContract.navigation.find((item) => item.path === path)
  const screenId = route?.id as PlatformAdminScreenId | undefined

  const onRole = (id: string, role: PlatformAdminRoleId | "none") =>
    mutate(id, "set_user_role", { target_user_id: id, next_role: role }, "Platform role updated.")

  const onState = (id: string, state: PlatformUserState) =>
    mutate(id, "set_user_state", { target_user_id: id, next_state: state }, "User state updated.")

  const onModerate = (id: string, state: ModerationState) =>
    mutate(id, "moderate", { target_item_id: id, next_state: state }, "Moderation state updated.")

  const onSetting = (key: string, value: unknown) =>
    mutate(key, "update_setting", { setting_key: key, setting_value: value }, "Platform setting updated.")

  let screen: ReactNode
  switch (screenId) {
    case "dashboard":
      screen = <DashboardScreen actor={actor} data={data} services={services} backendState={backendState} notifications={notifications} />
      break
    case "users":
      screen = <UsersScreen actor={actor} data={data} backendState={backendState} notifications={notifications} busy={busy} onRole={onRole} onState={onState} />
      break
    case "authorization":
      screen = <AuthorizationScreen actor={actor} backendState={backendState} notifications={notifications} />
      break
    case "moderation":
      screen = <ModerationScreen actor={actor} data={data} backendState={backendState} notifications={notifications} busy={busy} onModerate={onModerate} />
      break
    case "service-status":
      screen = <ServiceStatusScreen actor={actor} backendState={backendState} notifications={notifications} services={services} onRefresh={refreshServices} />
      break
    case "audit":
      screen = <AuditScreen actor={actor} data={data} backendState={backendState} notifications={notifications} />
      break
    case "settings":
      screen = <SettingsScreen actor={actor} data={data} backendState={backendState} notifications={notifications} busy={busy} onSetting={onSetting} />
      break
    case "system-states":
      screen = <SystemStatesScreen actor={actor} backendState={backendState} notifications={notifications} onRetry={refresh} />
      break
    default:
      screen = <NotFoundScreen actor={actor} backendState={backendState} notifications={notifications} />
  }

  return (
    <ApplicationActionsProvider actions={actions}>
      {screen}
      {notice ? (
        <aside className="platform-feedback" role="status" aria-live="polite">
          <Badge variant="info">Platform</Badge>
          <p>{notice}</p>
          <Button size="sm" variant="ghost" onClick={() => setNotice(null)}>Dismiss</Button>
        </aside>
      ) : null}
    </ApplicationActionsProvider>
  )
}

export function PlatformApp() {
  const [reloadKey, setReloadKey] = useState(0)
  const [config, setConfig] = useState<PlatformRuntimeConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [authClient, setAuthClient] = useState<PlatformAuthClient | null>(null)

  useEffect(() => {
    let active = true
    setConfig(null)
    setConfigError(null)
    void loadRuntimeConfig()
      .then((next) => {
        if (!active) return
        setConfig(next)
        setAuthClient(() => createPlatformAuthClient(next))
      })
      .catch((error) => {
        if (!active) return
        setConfigError(error instanceof Error ? error.message : "Runtime configuration failed.")
      })
    return () => { active = false }
  }, [reloadKey])

  if (configError) {
    return <RuntimeFailure message={configError} onRetry={() => setReloadKey((value) => value + 1)} />
  }

  if (!config || !authClient) {
    return (
      <div className="platform-boot">
        <StatePanel state="loading" />
      </div>
    )
  }

  const navigate = (href: string) => {
    window.history.pushState({}, "", href)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  const replace = (href: string) => {
    window.history.replaceState({}, "", href)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo="/"
      emailOTP
      navigate={navigate}
      replace={replace}
      onSessionChange={() => window.dispatchEvent(new PopStateEvent("popstate"))}
    >
      <AuthenticatedPlatform config={config} authClient={authClient} />
    </NeonAuthUIProvider>
  )
}
