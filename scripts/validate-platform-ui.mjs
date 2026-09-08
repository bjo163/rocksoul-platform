import { readFile } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const [pkgRaw, main, app, runtime, runtimeConfigRaw, workflow, vercel, readme] = await Promise.all([
  readFile(path.join(root, "package.json"), "utf8"),
  readFile(path.join(root, "src", "main.tsx"), "utf8"),
  readFile(path.join(root, "src", "platform-app.tsx"), "utf8"),
  readFile(path.join(root, "src", "runtime.ts"), "utf8"),
  readFile(path.join(root, "public", "runtime-config.json"), "utf8"),
  readFile(path.join(root, ".github", "workflows", "validate.yml"), "utf8"),
  readFile(path.join(root, "vercel.json"), "utf8"),
  readFile(path.join(root, "README.md"), "utf8"),
])

const pkg = JSON.parse(pkgRaw)
const runtimeConfig = JSON.parse(runtimeConfigRaw)
const failures = []
const uiDependency = pkg.dependencies?.["@rocksoul/ui"] ?? ""

if (!/^github:bjo163\/rocksoul-ui#[0-9a-f]{40}$/.test(uiDependency)) failures.push("@rocksoul/ui exact commit pin")
if (pkg.engines?.node !== "24.x") failures.push("Node 24 pin")
if (!pkg.dependencies?.["@neondatabase/auth"] || !pkg.dependencies?.["@neondatabase/auth-ui"]) failures.push("Managed Better Auth dependencies")

if (!main.includes("ROCKSOUL_ASSETS_SYNC.acceptedMainCommit")) failures.push("accepted canonical asset commit")
if (!main.includes("MoonWitnessAssetProvider")) failures.push("asset provider")
if (!app.includes("platformAdminContract") || !app.includes("platformAdminResources") || !app.includes("platformAdminCommandActions")) failures.push("shared Platform Admin contract")
if (!app.includes("PlatformRoleMatrix") || !app.includes("PlatformBackendBoundary") || !app.includes("PlatformServiceRegistry") || !app.includes("PlatformAdminVisual")) failures.push("shared Platform Admin components")
if (!app.includes("NeonAuthUIProvider") || !app.includes("AuthView")) failures.push("Managed Better Auth UI")
if (!app.includes("platformAdminContract.navigation.find")) failures.push("contract-driven routing")
if (!runtime.includes("platformRpc") || !runtime.includes('"Accept-Profile"') || !runtime.includes('"Content-Profile"')) failures.push("Data API RPC client")

for (const forbidden of [
  "localStorage",
  "initialUsers",
  "initialAudit",
  "LOCAL FIXTURE",
  "browser-persisted fixture",
  "admin@moonwitness.local",
  "Rocksoul Admin",
]) {
  if (app.includes(forbidden) || runtime.includes(forbidden) || readme.includes(forbidden)) failures.push("forbidden fixture marker: " + forbidden)
}

if (runtimeConfig.schemaVersion !== 1) failures.push("runtime config schema")
if (runtimeConfig.security?.mode !== "jwt-rls-rpc" || runtimeConfig.security?.anonymousAccess !== false) failures.push("runtime security mode")
for (const endpoint of [runtimeConfig.auth?.baseUrl, runtimeConfig.dataApi?.baseUrl]) {
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) failures.push("HTTPS runtime endpoint")
}
for (const secretKey of ["DATABASE_URL", "password", "secret", "token"]) {
  if (runtimeConfigRaw.toLowerCase().includes(secretKey.toLowerCase())) failures.push("runtime config contains secret-like key: " + secretKey)
}

if (!workflow.includes("npm install") || !workflow.includes("npm run ci") || !workflow.includes("node-version: 24")) failures.push("full platform CI")
if (!vercel.includes('"destination": "/index.html"')) failures.push("Vercel SPA rewrite")

if (failures.length) {
  console.error("Platform closure audit failed:")
  failures.forEach((failure) => console.error("- " + failure))
  process.exit(1)
}
console.log("Platform closure audit passed: contract-driven UI, Managed Better Auth, JWT/RLS RPC data plane, and no local authority fixtures.")
