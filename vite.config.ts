import { readFileSync } from "node:fs"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { MOONWITNESS_STABLE_REPOSITORY_BASE } from "@rocksoul/ui"

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"))
const uiDependency = String(pkg.dependencies?.["@rocksoul/ui"] ?? "")
const uiCommit = uiDependency.match(/#([0-9a-f]{40})$/)?.[1]
if (!uiCommit) throw new Error("@rocksoul/ui must be pinned to an immutable commit")

const brandBase = `${MOONWITNESS_STABLE_REPOSITORY_BASE}/moonwitness/brand`
const moonWitnessBrandHtml = (): Plugin => ({
  name: "moonwitness-brand-html",
  transformIndexHtml(html) {
    return html
      .replaceAll("__MW_FAVICON__", `${brandBase}/favicon.svg`)
      .replaceAll("__MW_OG_IMAGE__", `${brandBase}/og-card.svg`)
  },
})

export default defineConfig({
  plugins: [react(), moonWitnessBrandHtml()],
  define: {
    __ROCKSOUL_UI_PIN__: JSON.stringify(uiCommit),
  },
})
