import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import {
  MoonWitnessAssetProvider,
  ROCKSOUL_ASSETS_SYNC,
} from "@rocksoul/ui"
import "@rocksoul/ui/styles.css"
import { PlatformApp, ROCKSOUL_UI_PIN } from "./platform-app"
import "./platform.css"

const assetCommit = ROCKSOUL_ASSETS_SYNC.acceptedMainCommit
const assetBase =
  "https://raw.githubusercontent.com/bjo163/rocksoul-assets/" +
  assetCommit +
  "/moonwitness"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MoonWitnessAssetProvider baseUrl={assetBase}>
      <PlatformApp assetCommit={assetCommit} uiCommit={ROCKSOUL_UI_PIN} />
    </MoonWitnessAssetProvider>
  </StrictMode>,
)
