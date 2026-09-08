import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import {
  MOONWITNESS_STABLE_REPOSITORY_BASE,
  MoonWitnessAssetProvider,
  ROCKSOUL_ASSETS_SYNC,
} from "@rocksoul/ui"
import "@rocksoul/ui/styles.css"
import { PlatformApp } from "./platform-app"
import "./platform.css"

const assetCommit = ROCKSOUL_ASSETS_SYNC.acceptedMainCommit
const assetBase = `${MOONWITNESS_STABLE_REPOSITORY_BASE}/moonwitness`

declare const __ROCKSOUL_UI_PIN__: string

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MoonWitnessAssetProvider baseUrl={assetBase}>
      <PlatformApp assetCommit={assetCommit} uiCommit={__ROCKSOUL_UI_PIN__} />
    </MoonWitnessAssetProvider>
  </StrictMode>,
)
