import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MoonWitnessAssetProvider, ROCKSOUL_ASSETS_SYNC } from "@rocksoul/ui"
import "@rocksoul/ui/styles.css"
import "@neondatabase/auth-ui/css"
import "./platform.css"
import { PlatformApp } from "./platform-app"

const assetBase =
  "https://raw.githubusercontent.com/bjo163/rocksoul-assets/" +
  ROCKSOUL_ASSETS_SYNC.acceptedMainCommit +
  "/moonwitness"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MoonWitnessAssetProvider baseUrl={assetBase}>
      <PlatformApp />
    </MoonWitnessAssetProvider>
  </StrictMode>,
)
