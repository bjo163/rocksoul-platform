import { readFile } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const [pkgRaw, main, app, workflow, vercel] = await Promise.all([
  readFile(path.join(root, "package.json"), "utf8"),
  readFile(path.join(root, "src", "main.tsx"), "utf8"),
  readFile(path.join(root, "src", "platform-app.tsx"), "utf8"),
  readFile(path.join(root, ".github", "workflows", "validate.yml"), "utf8"),
  readFile(path.join(root, "vercel.json"), "utf8"),
])

const pkg = JSON.parse(pkgRaw)
const failures = []
const uiDependency = pkg.dependencies?.["@rocksoul/ui"] ?? ""

if (!/^github:bjo163\/rocksoul-ui#[0-9a-f]{40}$/.test(uiDependency)) failures.push("@rocksoul/ui must be pinned to an exact commit")
if (pkg.engines?.node !== "24.x") failures.push("Node runtime must stay pinned to 24.x")
if (!main.includes("ROCKSOUL_ASSETS_SYNC.acceptedMainCommit")) failures.push("accepted canonical asset commit")
if (!main.includes("MOONWITNESS_STABLE_REPOSITORY_BASE")) failures.push("shared stable asset resolver")
if (main.includes("raw.githubusercontent.com/bjo163/rocksoul-assets")) failures.push("duplicated raw asset URL")
if (app.includes("ROCKSOUL_UI_PIN")) failures.push("duplicated UI commit literal")
if (!main.includes("MoonWitnessAssetProvider")) failures.push("Rocksoul asset provider")

for (const id of ["users", "authorization", "moderation", "service-status", "audit", "settings", "system-states"]) {
  if (!app.includes('id: "' + id + '"')) failures.push("platform navigation " + id)
}
for (const route of ["/users", "/authorization", "/moderation", "/service-status", "/audit", "/settings", "/system-states"]) {
  if (!app.includes('case "' + route + '"')) failures.push("platform route " + route)
}
for (const forbidden of ["KanbanScreen", "CalendarScreen", "ChatScreen", "AIWorkspaceScreen"]) {
  if (app.includes(forbidden)) failures.push("Crayon workspace leaked into Platform: " + forbidden)
}
for (const proof of ["UsersScreen", "AuthorizationScreen", "ModerationScreen", "ServiceStatusScreen", "AuditScreen", "SettingsScreen", "SystemStatesScreen", "NotFoundScreen"]) {
  if (!app.includes("function " + proof)) failures.push("screen " + proof)
}
if (!app.includes("commandActions={platformCommands}")) failures.push("platform command palette")
if (!app.includes("LOCAL FIXTURE") || !app.includes("NOT CONNECTED")) failures.push("backend boundary disclosure")
if (!workflow.includes("npm install") || !workflow.includes("npm run ci") || !workflow.includes("node-version: 24")) failures.push("full platform CI")
if (!vercel.includes('"destination": "/index.html"')) failures.push("Vercel SPA rewrite")
for (const visual of ["audit-lock","access-request","permission-granted","security-alert","device-trusted","session-expired","access-rejected","moderation-history","identity-bridge"]) {
  if (!app.includes(`assetId="${visual}"`) && !app.includes(`asset="${visual}"`)) failures.push("shared platform visual " + visual)
}
const vite = await readFile(path.join(root, "vite.config.ts"), "utf8")
const html = await readFile(path.join(root, "index.html"), "utf8")
if (!vite.includes("MOONWITNESS_STABLE_REPOSITORY_BASE") || !vite.includes("__ROCKSOUL_UI_PIN__")) failures.push("derived build metadata")
if (html.includes("raw.githubusercontent.com/bjo163/rocksoul-assets")) failures.push("hardcoded HTML asset URL")

if (failures.length) {
  console.error("Platform UI audit failed:")
  failures.forEach((failure) => console.error("- " + failure))
  process.exit(1)
}
console.log("Platform UI audit passed: admin/IAM boundaries, pinned UI/assets, CI, and routes are explicit.")
