import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  AIWorkspaceScreen,
  ApplicationActionsProvider,
  ApplicationStatesScreen,
  AuthorizationScreen,
  Badge,
  Button,
  CalendarScreen,
  ChatScreen,
  DashboardScreen,
  KanbanScreen,
  MOONWITNESS_STABLE_REPOSITORY_BASE,
  MoonWitnessAssetProvider,
  PlatformScreen,
  ProfileSettingsScreen,
  ResourcesScreen,
  type ApplicationActions,
} from "@rocksoul/ui"
import "@rocksoul/ui/styles.css"
import "./platform.css"

const ROCKSOUL_ASSET_BASE = `${MOONWITNESS_STABLE_REPOSITORY_BASE}/moonwitness`

function normalizePath(pathname: string) {
  if (pathname === "/") return pathname
  return pathname.replace(/\/+$/, "") || "/"
}

function PlatformApp() {
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 4200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const notify = (message: string) => setNotice(message)

  const actions: ApplicationActions = {
    onMarkAllNotificationsRead: () => notify("Notifications marked as read."),
    onSignOut: () => notify("Sign-out action is wired for backend integration."),
    onChatSend: ({ channel }) => notify("Message queued for " + channel + "."),
    onAIAsk: ({ caseId }) => notify("AI request prepared with context " + caseId + "."),
    onSaveProfile: ({ displayName }) => notify("Profile saved for " + displayName + "."),
    onSignOutOtherSessions: () => notify("Other sessions sign-out requested."),
    onAddIntegration: () => notify("Integration flow opened."),
    onRequestAccess: ({ permission }) => notify("Access request prepared for " + permission + "."),
    onKanbanMove: ({ itemId, to }) => notify(itemId + " moved to " + to + "."),
    onCalendarEventSelect: ({ title }) => notify("Selected: " + title + "."),
    onRepositorySyncAll: () => notify("Repository synchronization requested."),
    onRepositoryInspect: (repo) => notify("Inspecting " + repo + "."),
    onModerationSelectAll: () => notify("Moderation queue selected."),
    onModerationRequestContext: (submissionId) =>
      notify("Context requested for " + submissionId + "."),
    onModerationReject: (submissionId) => notify(submissionId + " marked for rejection."),
    onModerationBulkRequestContext: () => notify("Bulk context request prepared."),
    onModerationReturnSelected: () => notify("Selected submissions returned to queue."),
    onPageChange: (page) => notify("Page " + page + " requested."),
    onRetry: (scope) => notify("Retry requested for " + scope + "."),
    onClearFilters: () => notify("Filters cleared."),
    onCommunitySubmit: ({ mode }) => notify("Community " + mode + " submission prepared."),
    onAuthSubmit: ({ email }) => notify("Authentication flow prepared for " + email + "."),
    onAuthProvider: () => notify("Identity-provider flow prepared."),
    onPlatformAction: ({ action, resource }) =>
      notify(action.replaceAll("-", " ") + " · " + resource),
  }

  const path = normalizePath(window.location.pathname)

  let screen
  switch (path) {
    case "/":
    case "/dashboard":
      screen = <DashboardScreen />
      break
    case "/cases":
      screen = <PlatformScreen actions={actions} />
      break
    case "/work/kanban":
      screen = <KanbanScreen actions={actions} />
      break
    case "/work/calendar":
      screen = <CalendarScreen actions={actions} />
      break
    case "/chat":
      screen = <ChatScreen actions={actions} />
      break
    case "/ai":
      screen = <AIWorkspaceScreen actions={actions} />
      break
    case "/resources":
      screen = <ResourcesScreen />
      break
    case "/profile":
    case "/settings":
      screen = <ProfileSettingsScreen actions={actions} />
      break
    case "/authorization":
      screen = <AuthorizationScreen actions={actions} />
      break
    case "/system-states":
      screen = <ApplicationStatesScreen />
      break
    default:
      screen = <DashboardScreen />
      break
  }

  return (
    <MoonWitnessAssetProvider baseUrl={ROCKSOUL_ASSET_BASE}>
      <ApplicationActionsProvider actions={actions}>
        {screen}
        {notice ? (
          <aside className="platform-feedback" role="status" aria-live="polite">
            <Badge variant="info">Platform UI</Badge>
            <p>{notice}</p>
            <Button size="sm" variant="ghost" onClick={() => setNotice(null)}>
              Dismiss
            </Button>
          </aside>
        ) : null}
      </ApplicationActionsProvider>
    </MoonWitnessAssetProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlatformApp />
  </StrictMode>,
)
