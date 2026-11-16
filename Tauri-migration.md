# Tauri migration: survey, findings, and decision

## Status

**Stopped on 2026-11-15 by the owner's decision.** The switch from Electron to
Tauri was surveyed and planned, then halted before any experiment or code change.

- No product code changed. The Electron host is untouched.
- The five proposed spikes (Phase 0) were not run, so nothing here was proven by
  experiment.
- This file is the whole record: the survey findings, the plan that was shelved,
  and what would be worth re-checking if the question comes back.

## Short version

- **Stable Tauri would mean dropping features.** Tauri 2 draws the app in the
  operating system's webview (WKWebView on macOS). On that engine, live pages
  inside the chat, the in-app browser as planned, hidden-window gyms on macOS,
  and the Profiler and Dev Tools settings cannot be kept.
- **A bundled-Chromium Tauri exists only as an alpha.** Tauri 3.0.0-alpha.6
  (2026-11-06) adds a Chromium runtime (CEF) that keeps most of those features.
  Tauri's own guide says "Keep production apps on 2.x", and on Windows that
  runtime "currently runs unsandboxed".
- **With bundled Chromium the usual gains mostly disappear.** One app measured
  about 170 MB added, and memory rises.
- **One feature is unproven on either route:** drawing a guest page inside the
  transcript, which `master-plans/08-inline-artifacts.md` requires.
- **The host code itself is portable.** 78% of the host services already run in
  plain Node with no Electron, so a Node sidecar next to a new shell is low-risk.
- **Any switch replaces the Electron host process.** The root `AGENTS.md` notice
  forbids changing it without double confirmation from a human.

## How the survey was done

Six read-only subagents on Claude Opus each read one slice on 2026-11-15: the
bridge and Electron APIs, the Node host services, embedded web content, gym and
dev tooling, the release pipeline, and current Tauri sources on the web. None
edited a file, built, or launched the app.

Evidence labels in this document:

- **checked**: the orchestrating session re-read the code or the source itself.
- **survey**: a surveyor read it and reported file and line; not re-read.
- **inferred**: a judgement nobody verified.
- **web**: a primary source read on 2026-11-15.

Re-checked by the orchestrator: the 102 IPC channels and 78 `ipcMain` handlers;
`webSecurity: false` and `webviewTag: true` on the main window; the four
Chromium switches for `http://happy-agent`; the packaged debug-switch refusal
and the `--debug` opt-in; the update feed's `per_page=100`; the commit that
added the host notice; the missing files and scripts under "Mismatches"; the
Tauri release versions; and the quoted sentences from Tauri's CEF and migration
pages.

## The shell today

- `packages/happy-desktop-electron` is about 62K lines: main 35K including
  tests (26K without, 78 files), renderer 23K, shared 2.5K, utility 1.2K,
  preload 375. (checked)
- Electron 45, `electron-builder`, `electron-updater`. Bundle id
  `com.slopus.happy`. Deep links `happy://` and `happy-auth://`. (checked)
- It ships on macOS arm64 and x64, Windows x64, and Linux x64 and arm64
  AppImage. (checked)
- Two flavors. **Standard** bundles its renderer and loads it from `file://`.
  **Nightly** (`local-web`) ships no renderer and loads
  `https://local.app.happy.engineering`, which is redeployed several times a
  day. (survey)

## Feature impact by route

| Feature                                                  | Stable Tauri 2 (system webview)                                                   | Tauri 3 alpha with bundled Chromium                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Live pages and URLs inside the chat (plan 08)            | Lost. A native child view cannot scroll with the transcript or sit under a modal. | Unproven. CEF has no `<webview>`; off-screen rendering is untested. |
| Workspace browser profiles with a per-profile proxy      | Custom native code, macOS 14 or later; localhost and WebRTC routing unverified.   | Supported: a request context and proxy per webview.                 |
| Google sign-in with an honest user agent (plan 11)       | Refused in an embedded WKWebView.                                                 | Works, by one app's report.                                         |
| Cookies encrypted at rest (plan 11)                      | Not built in on macOS or Linux.                                                   | Yes, through the OS secret store.                                   |
| Refusing debuggers in installed builds (plan 11)         | Feasible on macOS; uncertain on Windows and Linux.                                | Off by default and under the app's control.                         |
| Artifact sites: own origin, request filtering, streaming | Custom native code; header filtering not possible on WKWebView.                   | Judged feasible; how much Tauri exposes is untested.                |
| The `http://happy-agent` transport                       | No equivalent.                                                                    | Unknown; needed a spike.                                            |
| Hidden-window gyms with video on macOS (plan 10)         | No way to drive or film the app.                                                  | The debugging protocol exists; Playwright attaching is unverified.  |
| Settings → Profiler and Dev Tools                        | Lost on macOS and Linux.                                                          | Kept.                                                               |
| GPT-Live voice                                           | Works on macOS with permission handling; weak on Linux.                           | Kept.                                                               |
| Terminal                                                 | Kept; input-method behaviour needs testing.                                       | Kept.                                                               |
| Minimum macOS                                            | 14 in practice.                                                                   | Unverified.                                                         |
| Download size and memory                                 | Much smaller.                                                                     | Advantage mostly gone.                                              |

Every verdict in the two right-hand columns is inferred or from the web; none
was tested here.

Separately, the move itself would lose embedded-browser logins on either route,
and the renderer's local settings unless they are migrated on first run.

## Findings in detail

### 1. Bridge and Electron APIs

**Contract shape.** `desktopIpc` in `shared/desktopContract.ts:1294-1403`
defines 102 channels (checked): 75 request/response, 4 one-way sends from the
renderer, and 23 host-to-renderer events. `main.ts` registers 78 handlers
(checked). Nothing uses `sendSync`. (survey)

| Group                                           | Request/response | One-way send | Events |
| ----------------------------------------------- | ---------------- | ------------ | ------ |
| Live microphone                                 | 2                | –            | –      |
| Appearance                                      | –                | 1            | –      |
| Browser network and guests                      | 5                | –            | 8      |
| Cloud auth                                      | 4                | –            | 1      |
| Server sign-in and sessions                     | 4                | –            | 1      |
| Happy Cloud (present only with `--happy-cloud`) | 15               | –            | –      |
| External Happy links                            | 1                | –            | 1      |
| Navigation step                                 | –                | –            | 1      |
| Window, Dock, power, zoom                       | 2                | 2            | 3      |
| Media preview                                   | 3                | –            | 1      |
| Directory pick, diagnostics, application menu   | 3                | –            | –      |
| Desktop config                                  | 3                | –            | 1      |
| Daemon                                          | 10               | –            | 1      |
| Debug                                           | 9                | –            | 1      |
| Profiler                                        | 3                | 1            | 2      |
| Onboarding                                      | 6                | –            | 1      |
| Runtime, topology, update                       | 6                | –            | 1      |

A second bridge, `window.happyMediaPreview`, has 2 request/response methods and
1 subscription (`preload.ts:354-365`). (survey)

**Host channels outside the typed contract** (survey):

- `http://happy-agent` over HTTP and WebSocket: `/v0/*`, `/health`, and local
  routes such as `/open-in`, `/file-reveal`, `/attachment*`,
  `/workspace-file-*`, `/html-preview`, `/artifact-site`, `/vault-app`, and
  `/bridge-*` (`happyAgentRendererUtilityServer.ts:32-48`, `243-349`).
- The main-to-utility `parentPort` protocol
  (`happyAgentRendererUtilityContract.ts:31-126`).
- The quit socket and its token file (`desktopQuit.ts`).
- Launch arguments, URL queries (`?desktop=1&mode=local`,
  `?view=media-preview`), and the dev-only `happy-browser-local` meta tag.

**Values the renderer needs before first paint.** Tauri's IPC is asynchronous
and has no Node preload, so each of these needs a new home. (survey)

| Item                                                                 | Where                                      |
| -------------------------------------------------------------------- | ------------------------------------------ |
| `liveWindowId` from a launch argument                                | `preload.ts:73-75`; `main.ts:1224`, `1231` |
| `buildIdentity` JSON from a launch argument                          | `preload.ts:44-52`; `main.ts:1232`         |
| `debugMetricsEnabled`                                                | `preload.ts:70`; `main.ts:1235`            |
| Whether `happyCloud` exists                                          | `preload.ts:79-118`; `main.ts:1236`        |
| `doNotTrack`                                                         | `preload.ts:120`; `main.ts:1237`           |
| `system` (OS version, architecture; needs Node in preload)           | `preload.ts:58-67`                         |
| `attachmentSourcePath(File)` through `webUtils.getPathForFile`       | `preload.ts:123-132`                       |
| Which bridge is exposed, chosen by `--happy-media-preview`           | `preload.ts:373-375`; `main.ts:1465`       |
| Presence of `window.happyDesktop` decides desktop, dev, or cloud web | `renderer.tsx:1355-1357`                   |
| Native background colour and theme applied before the window exists  | `main.ts:1168`, `1780-1782`                |
| Zoom read from `outerWidth` and `visualViewport`                     | `renderer.tsx:1478-1492`                   |

A startup script could inject every static value. `attachmentSourcePath` cannot
be done that way: a system webview does not hand the page a file's path.
(inferred)

**Electron APIs with no direct Tauri equivalent.** Most of the API surface maps
to Tauri's core or an official plugin: IPC, single instance, deep links, menus,
dialogs, theme, zoom, window state, opening external links, Dock badge, and the
accessory activation policy. These do not. (survey for the usage; inferred for
the verdict)

| API                                                                                                                              | Where                                             | Verdict                                                          |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| `app.commandLine.appendSwitch` for the connection limit, secure-origin override, host resolver rules, QUIC, and remote debugging | `main.ts:401-425`                                 | No equivalent on a system webview.                               |
| `session.setProxy`, `session.webRequest`, proxy login, per-session permissions                                                   | `main.ts:775-917`; `happyAgentRendererSession.ts` | No equivalent; per-webview proxy only on macOS 14 or later.      |
| `<webview>` attach hooks, isolated-world scripts, `before-input-event`                                                           | `main.ts:987-1110`, `2280-2312`                   | Custom native code or none.                                      |
| `webContents.debugger` (Chrome DevTools Protocol), `capturePage`                                                                 | `desktopCdpShared.ts`; `desktopSmokeReport.ts`    | None on macOS or Linux.                                          |
| `webUtils.getPathForFile`                                                                                                        | `preload.ts:128`                                  | None; partial through drag-drop events and the dialog plugin.    |
| `safeStorage`                                                                                                                    | `main.ts:501`; `happyCloudVault.ts:19-79`         | Custom code; existing blobs are tied to Electron's Keychain key. |
| `powerMonitor`, `powerSaveBlocker`, Low Power Mode through `koffi`                                                               | `powerSaving.ts:23-78`; `main.ts:2357`            | Custom Rust.                                                     |
| `titleBarOverlay` on Windows; `swipe` and `app-command` window events                                                            | `main.ts:376`, `390`, `1365-1373`                 | Custom Rust.                                                     |
| `app.setName` and `app.setPath("userData")` per checkout                                                                         | `main.ts:209`, `218`                              | Custom; Tauri fixes the identifier at build time.                |
| Frame-level sender checks (`senderFrame === mainFrame`)                                                                          | `main.ts:2255`, `2264`, `2273`, `2297`, `2414`    | Unsure.                                                          |
| `utilityProcess.fork`                                                                                                            | `main.ts:1738`                                    | A sidecar with its own protocol.                                 |

Not used anywhere: tray, notifications, clipboard, crash reporter, global
shortcuts, login items, vibrancy, transparency, `BaseWindow` with
`WebContentsView`. (survey)

**Window model** (survey unless marked):

- One main `BrowserWindow` at a time, shown only when ready, 1100×760 with a
  720×640 minimum (`windowLifecycle.ts:36-67`).
- Main window preferences: `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false`, `webviewTag: true`, `webSecurity: false`
  (`main.ts:1239-1254`, checked). It uses the default session.
- A second single window for media preview, running the same document with
  `?view=media-preview`, navigation-locked (`main.ts:1440-1522`).
- Up to 128 persistent browser profiles (`main.ts:796`), plus in-memory
  partitions for HTML preview and artifacts.
- macOS has a hidden title bar with traffic lights at {14, 13}; Windows a
  coloured overlay; Linux the native frame. The UI uses `-webkit-app-region` in
  about 45 places, which WKWebView ignores.
- Window bounds are saved to JSON with a 250 ms debounce and re-centred when
  fewer than 64 px would be visible (`windowState.ts`).

**Security posture a new shell would have to keep** (survey):

- The renderer never holds the daemon credentials. Main injects random proxy
  credentials only for registered main frames
  (`happyAgentRendererSession.ts:169-229`), and the utility server checks the
  Origin (`happyAgentRendererUtilityServer.ts:261-276`).
- Guest proxy credentials are released only to guests owned by that profile
  (`main.ts:962-985`).
- IPC arguments are validated (`runtimeValidation.ts`,
  `happyAgentIpcValidation.ts`, `desktopConfig.ts:348`).
- Navigation is limited to the exact renderer origin, and every window-open is
  denied and routed by the host (`navigation.ts`; `main.ts:1304-1320`).
- Fuses: `runAsNode` off, cookie encryption on, ASAR integrity, load only from
  ASAR (`package.json:100-107`, checked).
- Packaged builds refuse raw debugging switches (`main.ts:156-166`, checked).

**The utility process** (survey). `utility.ts` runs the `http://happy-agent`
listener, the daemon client, the request handler, WebSocket upgrades for the
terminal and GPT-Live, and Happy Cloud forwarding. It is separate so the TCP
listener stays off main's event loop and can crash and restart on its own. It
talks to main over `parentPort` and to the renderer only over HTTP and
WebSocket.

### 2. Host services (Node)

**Totals** (survey, measured from the import graph). About 17.6K lines are host
services:

- 13.8K (78%) import no `electron` and run unchanged in plain Node.
- 3.3K (19%) receive Electron objects only through injected dependencies.
- 0.3K (2%) is deeply coupled: `happyAgentRendererSession.ts`.

The browser dev mode (`pnpm dev:web`, `browserDevServer.ts`) already runs 8.9K
of those lines with no Electron.

| Module                                                               | Lines | Purpose                                             | Electron coupling                          |
| -------------------------------------------------------------------- | ----- | --------------------------------------------------- | ------------------------------------------ |
| `happyAgentDaemonClient`                                             | 1189  | Typed daemon client over a socket or named pipe     | None                                       |
| `happyAgentProxyHandle`                                              | 810   | The one request handler                             | None                                       |
| `happyAgentHttpProxy`                                                | 344   | Loopback bridge with a capability URL               | None                                       |
| `happyAgentRendererProxy`                                            | 269   | Forward proxy for the virtual origin                | None                                       |
| `happyAgentRendererUtilityProxy`                                     | 325   | Supervises the utility process                      | Type only                                  |
| `happyAgentRendererSession`                                          | 329   | Proxy setup, request gate, proxy login, media gates | **Deep**                                   |
| `utility/*` and its contract                                         | 600   | Isolated transport server                           | `process.parentPort`                       |
| `happyAgentLiveBridge`, live route                                   | 474   | GPT-Live relay                                      | None                                       |
| `happyAgentTerminalBridge`                                           | 224   | Terminal byte relay                                 | None                                       |
| `happyAgentBrowserProxy`                                             | 363   | Loopback proxy for in-app browser tunnels           | None                                       |
| `desktopDaemonController`                                            | 1191  | Agent install, select, update                       | None                                       |
| `happyAgentRelease`                                                  | 884   | Release download, checksum, extraction              | None                                       |
| `happyAgentRestart`                                                  | 384   | Drain, stop, start                                  | None                                       |
| Install lock, binary config and paths, data version, version, reload | 830   | Shared `~/.happy/dist` state                        | None                                       |
| `localHappyAgent`                                                    | 717   | Login-shell probe; attach or start the daemon       | None                                       |
| `localOnboarding`                                                    | 1450  | First-run state machine                             | Injected directory picker                  |
| `desktopRuntime`                                                     | 702   | Topology and connection runtime                     | None                                       |
| `serverSessions`                                                     | 834   | Team-server OAuth                                   | Injected `net.fetch`, `shell.openExternal` |
| `happyCloud`, vault                                                  | 649   | Happy Cloud servers; encrypted sign-in file         | Injected `net.fetch`, `safeStorage`        |
| `happyCloudArtifacts`, forward                                       | 206   | Cloud sites and forwarding                          | None                                       |
| `credentialImport`                                                   | 717   | Scans local API keys, OAuth tokens, Keychain        | None                                       |
| `deviceBridgeHost`, port                                             | 1096  | Port forwards; USB bridge lifetime                  | None                                       |
| `deviceBridgeUsb*`                                                   | 1240  | libusb access and a user-space USB/IP exporter      | None (native `usb` addon)                  |
| `windowsSandbox`                                                     | 253   | Consent gate for sandbox setup                      | None                                       |
| `localApps`, `openIn`                                                | 1021  | App detection; open in an editor or terminal        | None                                       |
| `desktopQuit`                                                        | 72    | Quit socket for an external status app              | None                                       |

**Transport** (survey). All daemon data already travels over loopback HTTP and
WebSocket; IPC carries only control calls. The renderer learns one address,
`http://happy-agent`, from `runtimeGet`. A proxy rule routes that host to the
utility process, a request gate admits only registered main frames, and main
injects the credentials. The terminal's capability travels as a WebSocket
subprotocol injected by the proxy (`happyAgentRendererProxy.ts:84-99`).

The existing fallback is for the page to call a loopback URL that contains a
capability. It would work on any engine, but the renderer would then hold the
capability and the per-frame gate would be gone. That is a change to the
security model, not a port. (inferred)

**Process supervision** (survey). The host supervises almost nothing:

- The agent daemon starts itself through `happy-agent start`, is shared with
  other clients, and is not killed on quit (`main.ts:2488-2517`). A restart
  drains for up to 15 minutes (`happyAgentRestart.ts:23-41`).
- The install lock is a file holding a process id and token, shared with the
  agent's own installer (`happyAgentInstallLock.ts`).
- The utility process is the one supervised child: timeouts, restart with
  backoff from 100 ms to 5 s, killed on close.
- Terminals live in the daemon. USB/IP runs in-process.

A sidecar would need a graceful-quit message with a deadline, death when its
parent dies, and restart with backoff.

**Native addons** (survey). `koffi` is used only in `powerSaving.ts` for Low
Power Mode and the Windows battery-saver flag; in a Rust shell it disappears.
`usb` (node-usb 2.19.1) does device enumeration, hot-plug, and transfers for the
USB/IP exporter; it would stay in Node and needs prebuilt binaries for each
target.

**Platform branches to preserve** (survey):

- **Windows:** named-pipe daemon address; PATH from the registry; sandbox
  consent (`windowsSandbox.ts`; `main.ts:1801`); x64-only releases with retries
  when antivirus holds files (`happyAgentRelease.ts:291-326`); App Paths through
  PowerShell (`openIn.ts:507`).
- **Linux:** refuse to keep sign-ins with no keyring
  (`happyCloudVault.ts:44-50`); `xdg-open`; USB kernel-driver detach.
- **macOS:** Keychain through `/usr/bin/security`
  (`credentialImport.ts:482`); `open -a` and `open -R`.

**Surveyor's recommendation:** a split weighted toward a Node sidecar. The typed
daemon client is TypeScript shared with the daemon, so a Rust port would
duplicate an owned contract. Riskiest to move: the renderer session with its
proxy, the USB bridges, and the agent install and restart protocol.

### 3. Embedded web content and Chromium dependence

**Guest surfaces** (survey). Every one is an Electron `<webview>` drawn as part
of the app's DOM.

| Surface           | Purpose                                           | Electron mechanism                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace browser | A real browser whose traffic leaves via the agent | `persist:` partition per network (`main.ts:792-817`), `session.setProxy` with `<-loopback>`, loopback proxy tunnelling through the daemon (`happyAgentBrowserProxy.ts:35-141`), proxy login (`main.ts:962-985`), honest user agent (`main.ts:857-861`), popups to a new tab, per-profile permission prompts (`browserPermissions.ts:120-215`) |
| Live artifact     | A URL shown as an artifact in its own profile     | The same, with partition `persist:happy-artifact-live-*` (`happyAgentBrowser.ts:27-32`)                                                                                                                                                                                                                                                       |
| Artifact sites    | Each artifact version is its own origin           | Privileged custom scheme (`main.ts:415-420`, checked), streaming handler (`artifactSite.ts:517-561`), request allow-list and header stripping (`artifactBrowser.ts:178-200`), SSRF-judging proxy (`artifactNetwork.ts:142-310`), all permissions denied                                                                                       |
| HTML preview      | A workspace HTML file as a sandboxed site         | In-memory partition and proxy serving `http://<hmac>.localhost/` (`htmlPreviewProxy.ts:99-221`)                                                                                                                                                                                                                                               |
| Guest scripting   | Inline height, app styles, Escape, close          | `executeJavaScriptInIsolatedWorld` (`main.ts:2268-2291`), user-origin CSS (`guestPageStyle.ts:75`)                                                                                                                                                                                                                                            |
| Media preview     | One image or video in a second window             | `BrowserWindow` (`main.ts:1440-1522`)                                                                                                                                                                                                                                                                                                         |

**Master-plan requirements at risk on a system webview** (inferred unless
marked):

- **Plan 08:** "Any URL inline… in a browser profile of that artifact's own",
  full height, measured in an invisible frame, never moving what the reader is
  looking at. A cross-origin live page cannot be an iframe, and a native child
  view cannot scroll with the transcript or be covered by overlays
  (`InlinePage.tsx:60-64`, `200-210`; `BrowserGuestFrame.tsx:7-29`, survey).
- **Plan 11, Google sign-in:** Google's policy forbids OAuth in an embedded user
  agent (web, updated 2026-08-05). Electron passes because it does not claim to
  be Chrome (`main.ts:858-860`, survey).
- **Plan 11, cookies encrypted at rest:** not built in on WKWebView or
  WebKitGTK. Electron sets the cookie-encryption fuse today.
- **Plan 11, refusing debuggers:** feasible on macOS; on Windows an environment
  variable or registry value can enable WebView2 debugging.

**Chrome DevTools Protocol uses** (survey). All are developer tooling:

| Use                             | Where                                             | Without the protocol            |
| ------------------------------- | ------------------------------------------------- | ------------------------------- |
| Shared debugger lease           | `desktopCdpShared.ts:66-67`                       | Gone                            |
| Profiler (Settings → Profiler)  | `desktopProfilerController.ts:427-450`, `817-870` | Trace and renderer metrics lost |
| Renderer debugger relay         | `desktopRendererDebugger.ts:28-150`               | Lost                            |
| `--debug` remote debugging port | `main.ts:421-437` (checked)                       | Lost                            |
| Live-artifact DevTools          | `happyAgentBrowser.ts:117-121`                    | Private API on macOS            |

React DevTools profiling goes over IPC and survives.

**Media and devices** (survey). GPT-Live uses `getUserMedia` audio and
`RTCPeerConnection` with a data channel (`gptLiveMedia.ts:84-141`). No code asks
for video; the camera usage string and permission path are leftovers from the
removed stories feature. `MediaRecorder`, WebUSB, Serial, HID, and the Screen
Wake Lock API are unused.

**Terminal** (survey). The WASM module only parses; rendering is DOM spans sized
in `ch` (`terminalPanelRenderer.ts:97-128`), with no canvas or WebGL. WebKit
orders composition events differently, so CJK input and dead keys would need
testing.

**Web-platform floor** (survey for the usage; inferred for engine versions):

- No fallback: `AbortSignal.any` in 12 state stores and `checkVisibility()` in
  three UI files, both Safari 17.4.
- Degrades: `field-sizing: content` for the composer, `text-wrap: pretty`,
  `text-box` trim, `@starting-style`, `light-dark()`.
- `::-webkit-scrollbar` is the main path in `scrollbar.css`.
- The practical minimum would be macOS 14. No minimum is configured today.

**Ranked blockers for a pure system webview** (inferred):

| #   | Blocker                                                                    | Removed by bundled Chromium?                 |
| --- | -------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Web content drawn as part of the app's DOM                                 | Partially; the same layering problem remains |
| 2   | Per-network browser profiles with an authenticated proxy                   | Yes                                          |
| 3   | Google sign-in with an honest user agent                                   | Yes                                          |
| 4   | Cookies encrypted at rest on macOS and Linux                               | Yes                                          |
| 5   | Refusing debuggers on Windows                                              | Yes                                          |
| 6   | Isolated artifact partition with filtering, streaming, and isolated worlds | Yes                                          |
| 7   | Engine floor; profile and proxy APIs need macOS 14                         | Yes                                          |
| 8   | Profiler, debugger, and hidden-window gym rendering                        | Yes                                          |
| 9   | WebRTC for GPT-Live on Linux                                               | Yes                                          |

### 4. Gyms, tooling, and the dev loop

**What launches the real shell** (survey). Only
`packages/happy-desktop-gym/sources/electron`: 21 workloads plus `smoke` and
`live-voice`, all through `gymElectronLaunch` (Playwright `_electron`) or
`gymElectronProcessRun`. The session gym, leak mode, the other perf scripts, and
the demo recorder run in headless Chromium against the shell package's Node dev
server and never launch the shell.

**Everything a gym does to the app goes over the Chrome DevTools Protocol:**
Playwright's page handle, in-page evaluation (41 calls), polled predicates (21),
about 46 clicks, typing and wheel input, screenshots, console and network
capture, WebSocket frames, heap and DOM counters, traces. Main-process
evaluation reads and sets window state, bounds, and zoom.

**Size** (survey). 12,305 lines in `sources/electron`: about 1,050 call Electron
main APIs or the raw protocol, about 7,200 drive the renderer through Playwright
`Page`, and about 4,000 are daemon, fixture, and inference code with no shell
dependency.

**Hidden windows** (survey):

| Mechanism                                                                                       | Where                               | Portable?                        |
| ----------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------- |
| Triggers: `HAPPY_DESKTOP_WINDOWS_HIDDEN`, `HAPPY_DESKTOP_GYM_PROFILE`, or Playwright's run hook | `hiddenWindows.ts:32-43`, `84-88`   | The environment check is generic |
| Accessory activation policy and hidden Dock                                                     | `hiddenWindows.ts:93-96`            | Plain AppKit                     |
| Windows created hidden and never ordered in                                                     | `main.ts:1177`, `1463`              | Plain window behaviour           |
| Background throttling off; DevTools refused                                                     | `hiddenWindows.ts:149-153`          | Chromium                         |
| Show, focus, maximize, full screen, dialogs, and external opens stubbed or refused              | `hiddenWindows.ts:102-147`          | Electron monkey-patching         |
| Loud failure: a 100 ms poll exits with code 87 if anything becomes visible                      | `hiddenWindows.ts:70-77`, `154-171` | The pattern is generic           |
| Window-server proof: `CGWindowListCopyWindowInfo` filtered by process id every 25 ms            | `windowServer.swift:28-53`          | Works with any shell             |

Whether a never-shown WKWebView keeps rendering at display rate is unmeasured.

**Video and screenshots** (survey). Video is the protocol's
`Page.startScreencast` at JPEG quality 90, re-emitted at a constant 25 fps into
ffmpeg (`launch.ts:340-467`). Screenshots are `page.screenshot` and
`capturePage({ stayHidden: true })`. Screen or desktop capture is forbidden by
`master-plans/10-gyms.md`.

**Portability split** (inferred). About 17 of the 21 workloads prove renderer
behaviour and could run in a Playwright browser against a real host process, as
the session gym and demo already do. Six entry points need the native shell:
`hidden-window`, `boot`, `window-edge-resize`, `window-zoom`, `smoke`, and
`live-voice`.

**Dev loop** (survey). `pnpm dev` runs `portless`, then four processes: a main
watch build, a preload watch build, the Vite renderer, and Electron. The
Electron-specific parts are the binary, `preload.cjs`, and the renaming of the
`node_modules` Electron app (`name-dev-electron.mjs:92-119`). Portless, Vite,
and `dev:web` do not depend on the shell.

**CI** (survey). Linux runs the `boot` workload unpackaged and a packaged
AppImage smoke; Windows runs a smoke of the installed app. No macOS job launches
the app, so the window-server proof runs only locally.

### 5. Release, updates, and installed users

**What the host notice protects** (survey). "Cloud updates" are the hosted
Nightly renderer. The notice was added on 2026-08-20 by Steve Korshakov in
5291a066 (checked).

- The Nightly host loads one fixed HTTPS origin and ships no renderer
  (`main.ts:1218-1223`, `1379-1383`).
- The renderer polls `/local-web-version.json` every 15 s and offers a reload
  (`localWebUpdateStore.ts:53-64`).
- The host exposes no version and no capability list. Compatibility is feature
  detection on 23 optional bridge members marked absent on older shells
  (`desktopContract.ts:1182`, `1192-1195`).
- So a host change that breaks what the deployed renderer calls, or breaks the
  updater, cannot be repaired by a renderer push. The only recovery is a manual
  reinstall. (inferred)

A new shell serving the same hosted renderer would have to inject an identical
`window.happyDesktop`, keep the origin and query string, and identify itself
through an explicit host descriptor.

**Current pipeline** (survey):

|           | macOS                                                      | Windows                                         | Linux                          |
| --------- | ---------------------------------------------------------- | ----------------------------------------------- | ------------------------------ |
| Artifacts | dmg and zip per architecture, for both flavors             | NSIS `.exe`                                     | AppImage, standard flavor only |
| Signing   | Developer ID, team 466DQWDR8C, notarized, hardened runtime | Azure Trusted Signing                           | None                           |
| Updater   | `electron-updater` through Squirrel.Mac                    | `electron-updater` NSIS, with a publisher check | None                           |
| Manifest  | `latest-mac.yml`, `nightly-mac.yml`                        | `latest.yml`, `nightly.yml`                     | –                              |

- The feed lists the newest 100 releases (`desktopUpdateFeed.ts:36`, checked)
  and picks the newest one that matches the channel and carries this platform's
  manifest.
- The channel is `previewUpdatesEnabled` in `~/.happy/desktop/config.json`.
- It checks every 15 minutes and installs on quit or from the Install button
  (`updater.ts:35-36`, `131-139`).
- macOS hosts from before 2026-09-12 read only GitHub's latest release. Windows
  auto-update exists only since 2026-11-04.

**Tauri gaps** (inferred, partly web):

- The updater has no channels, no install-on-quit, and no publisher check; it
  uses its own minisign key and a JSON manifest.
- No differential downloads.
- MSI is likely impossible because its major version must be 255 or less and
  CalVer's is 2026, which leaves NSIS.
- Default artifact names differ from what the Homebrew cask expects.

**Moving installed users** (inferred):

- **macOS:** Squirrel checks only the designated requirement, which is the
  bundle id and the signing team. A Tauri app with the same id and team, zipped
  in the existing format, should install in place.
- **Windows:** a stock Tauri installer would install side by side with the
  Electron one. The bridge installer would have to remove the old install.
- **Linux:** manual download or Homebrew.
- **Stragglers:** Electron-format manifests would have to keep shipping,
  because the old feed sees only the newest 100 releases and releases are
  frequent (about 20 previews in 8 days).

**Data continuity** (survey for locations; inferred for the outcome):

| Data                 | Location                                                                                           | Under Tauri                                                |
| -------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| App data             | `~/Library/Application Support/Happy` on macOS                                                     | A different directory by default; must be copied           |
| Host files           | `desktop/window-state.json`, `desktop-settings.json`, `local-onboarding.json`, diagnostics         | Copyable                                                   |
| Encrypted sign-ins   | `happy-cloud-sessions.bin`, encrypted with `safeStorage`                                           | Needs Electron's Keychain key; signing in again is simpler |
| Shared home          | `~/.happy/desktop/config.json`, `~/.happy/agent`, `~/.happy/dist`                                  | Kept                                                       |
| Renderer web storage | About 25 `localStorage` key families: device id, sidebar order, connection history, model settings | Lost unless imported from Chromium's store on first run    |
| Browser profiles     | Encrypted cookies and `persist:happy-browser-*` partitions                                         | Lost                                                       |

The renderer uses no IndexedDB and no cookies of its own.

**Identity a new bundle would have to match** (survey): the two deep-link
schemes; a single-instance lock keyed on the app data directory; entitlements
for JIT, unsigned executable memory, disabled library validation, network,
audio input, and camera; the camera and microphone usage strings; hardened
runtime and notarization.

**CI that would be rewritten** (survey): `build-mac-apps.mjs`,
`build-windows-app.mjs`, `verify-packaged-main-modules.mjs`,
`name-dev-electron.mjs`, the `electron-builder` steps, and the Electron smokes
used as release gates. Shell-independent: `desktopVersion.mjs`,
`local-web-pages.yml`, the tag-claim logic, and the signing checks.

### 6. Tauri as of 2026-11-15

All from the web unless marked.

**Versions.** Stable is 2.12.5 (2026-10-21, checked). The 3.0 alphas began on
2026-09-13; the latest is alpha.6 (2026-11-06, checked). No stable 3.0 date is
published.

**Bundled Chromium (CEF) runtime.**

- "The CEF runtime is new in the Tauri 3.0 alpha and is not available in Tauri
  2.0." (checked)
- The migration guide says "Keep production apps on 2.x." (checked)
- "Windows currently runs unsandboxed regardless of the policy." (checked)
- Bundles are "hundreds of megabytes larger than with wry." (checked) One app
  measured about 170 MB.
- It offers remote debugging by port or pipe (off by default), a request context
  per webview with its own data directory and proxy, a user-agent override,
  cookies encrypted through the OS secret store, and off-screen rendering since
  alpha.6. (survey of the `v3` branch source)

**Multi-webview.** `Window::add_child` still needs the `unstable` feature. On
macOS a per-webview data store and proxy both need macOS 14. Request
interception covers only Tauri's own scheme. Child webviews are native views
drawn above the main webview's DOM.

**Node sidecar.** The official route is a sidecar binary per target triple.
Tauri's shell plugin kills child processes only on a graceful exit. In a Node
single executable, native addons must be written to disk before loading.

**IPC.** Commands, events, and channels. A remote HTTPS page can call commands
when a capability lists its URL; the docs warn that on Linux Tauri cannot tell
an embedded iframe from the window. The only synchronous channel before first
paint is an initialization script.

**Automation on macOS.** The docs say macOS "has no WKWebView driver tool".
`tauri-driver` supports Windows and Linux only. The alternatives are in-app
plugins, one of them paid. Nothing equivalent to Playwright's `_electron`
exists.

**Size and memory.** An empty-app benchmark on macOS arm64 measured 268 MB
against 5 MB on disk and 370 MB against 96 MB in memory. On Windows it measured
no memory saving. Tauri started more slowly in that benchmark.

**Reports from other apps.**

- OpenCode Desktop and Paseo, both agent apps with a sidecar, moved from Tauri
  back to Electron in 2026, citing WebKit and sidecar packaging.
- Atrium moved from WKWebView to CEF inside Tauri for Google sign-in and the
  debugging protocol.
- Three apps that moved installed Electron users reported a bridge release, lost
  local storage, and repeated sign-in.

## The plan that was shelved

Kept for reference. None of it was started.

**Intended end result.** A Tauri shell on macOS, Windows, and Linux in both
flavors, with the Electron package deleted; the same renderer with no fork by
shell; every criterion of master plans 08, 10, and 11 holding; the hosted
Nightly renderer working on old Electron and new Tauri hosts throughout; and
installed users moved across through their existing updater with their settings.

**Routes considered.**

| Route | What it is                                        | Verdict at the time                                    |
| ----- | ------------------------------------------------- | ------------------------------------------------------ |
| A     | Tauri 2.12 stable on system webviews              | Contradicts master plans 08, 10, and 11                |
| B     | Tauri 3 with the CEF runtime, plus a Node sidecar | The only route that could meet them; not shippable yet |
| C     | Stay on Electron                                  | Chosen on 2026-11-15                                   |

**Target architecture for route B.** A Rust shell owning windows, menus, deep
links, native services, guest webviews, updates, and sidecar supervision. One
Node sidecar running the existing host services unchanged. The data plane stays
loopback HTTP and WebSocket; the control plane becomes typed JSON-RPC that the
shell re-exposes as commands. The shell injects an identical
`window.happyDesktop` generated from `shared/desktopContract.ts`, plus a host
descriptor.

**Phases.**

| Phase | Work                                        | Done when                                                             |
| ----- | ------------------------------------------- | --------------------------------------------------------------------- |
| 0     | Five throwaway spikes                       | The owner chooses go, wait, or stop                                   |
| 1     | Sidecar-ready host                          | The renderer runs in a browser against that process                   |
| 2     | Tauri shell boots on macOS, standard flavor | It completes onboarding and runs a session in a hidden window         |
| 3     | Gyms on the new shell                       | Plan 10's criteria hold at both depths                                |
| 4     | Transport and the hosted renderer           | One hosted renderer build works in both hosts                         |
| 5     | Guests                                      | The criteria of plans 08 and 11 hold                                  |
| 6     | Packaging, updates, data migration          | A preview installs, updates itself, and opens with a migrated profile |
| 7     | Handoff and sunset, one platform at a time  | Cutover gates open, including a sandboxed runtime on Windows          |
| 8     | Remove Electron                             | The owner declares the Electron fleet gone                            |

**The five spikes.**

Throwaway work under the ignored `.context/` directory, with no product code
and no Electron host change. The estimate was 2 to 4 hours of agent time each,
untested.

| Spike | Question                                                                                                  | Pass means                                                                                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1    | Can a guest page be drawn inside the transcript under CEF (off-screen rendering or a clipped child view)? | It scrolls with the transcript, sits under a modal, and is measured before it shows, as plan 08 requires.                                                   |
| S2    | Can a never-shown Tauri CEF window be driven and filmed?                                                  | Playwright attaches over the debugging protocol, the screencast yields 25 fps at 2x, the page reports visible, and the existing window-server proof passes. |
| S3    | What replaces `http://happy-agent`?                                                                       | WebSockets, no socket cap, and credentials the page never holds; or a written case for the loopback-capability alternative.                                 |
| S4    | Can one signed sidecar binary per target load `usb`?                                                      | A macOS arm64 binary runs notarized, loads the addon, and dies when its parent dies.                                                                        |
| S5    | Does the Electron updater install a Tauri app in place on macOS?                                          | Proven with a throwaway bundle id signed by the same team. Needs signing credentials from a person.                                                         |

**Cutover gates, per platform.** Phases 1 to 6 done; a soak as
`docs/releases.md` requires; Tauri 3 stable or the owner's written acceptance of
the alpha; and on Windows, a sandboxed CEF runtime plus an installer that removes
the Electron install. macOS was to move first, with Windows and Linux staying on
Electron until their own gates opened.

**Work packages.** One row is one package: one agent and one reviewable diff.
Rows that share a wave could run in parallel; waves within a phase run in order.

| Phase | Wave                       | Scope                                                                                                          |
| ----- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0     | S1 to S4 together, then S5 | The five spikes, one agent each.                                                                               |
| 1     | 1a                         | Sidecar entry and its data plane.                                                                              |
| 1     | 1b                         | Control-plane RPC, typed from the bridge contract.                                                             |
| 1     | 1c                         | Interfaces for the injected Electron dependencies (fetch, open external, directory pick, cipher).              |
| 2     | 2a                         | Shell skeleton: window, title bar, drag regions, menu, theme, zoom, window state, single instance, deep links. |
| 2     | 2a                         | Native services: power state, keep-awake, Dock badge, secret storage, dialogs.                                 |
| 2     | 2b                         | Bridge shim, host descriptor, launch values, and a replacement for `attachmentSourcePath`.                     |
| 2     | 2b                         | Sidecar supervision: start, ready, restart with backoff, parent death, graceful quit.                          |
| 3     | 3a                         | Hidden mode and loud failure in the shell.                                                                     |
| 3     | 3b                         | Launcher, protocol attach, video, smoke report.                                                                |
| 3     | 3b                         | Host-side gym channel; profiler and Dev Tools over CEF.                                                        |
| 3     | 3c                         | Portable workloads against the host process.                                                                   |
| 4     | 4a                         | Transport.                                                                                                     |
| 4     | 4b                         | Hosted-renderer access and the renderer's host-kind branch.                                                    |
| 5     | 5a                         | Workspace browser.                                                                                             |
| 5     | 5a                         | Artifact sites.                                                                                                |
| 5     | 5a                         | HTML preview, guest scripting, media preview.                                                                  |
| 5     | 5b                         | Inline pages.                                                                                                  |
| 5     | 5b                         | Plan 11 protections.                                                                                           |
| 6     | 6a                         | macOS bundle, signing, notarization.                                                                           |
| 6     | 6a                         | Updater and channels.                                                                                          |
| 6     | 6a                         | First-run data migration.                                                                                      |
| 6     | 6b                         | Windows installer and signing; Linux AppImage.                                                                 |
| 6     | 6c                         | CI workflows.                                                                                                  |

**Constraints the plan carried.**

- Master plans 08, 10, and 11 were acceptance criteria. Plans 06 and 07 name
  Electron files; editing them is the owner's call.
- Electron keeps shipping until a platform's cutover gate opens.
- No renderer fork: a host-kind branch only where the transport differs.
- Agent-driven launches stay invisible from the first spike, as plan 10
  requires.
- The repository rule is no new tests unless asked, so the gym work in Phase 3
  needed the owner's explicit ask.

**How it was to be run.**

1. Every agent on Opus with one package; anything that writes in its own
   worktree, because a worktree holds one unmerged feature.
2. Each brief names the plan, the root `AGENTS.md`, `master-plans/00` and the
   relevant plans, the package scope, and its exit check.
3. Each brief forbids Electron host edits, commits, pushes, releases, visible
   launches, unrequested tests, and edits to `master-plans/`.
4. An agent reports what changed and why, what it ran, and what it could not
   verify. The orchestrator reruns the typecheck or build before relaying.
5. A separate Opus agent reviews the security-critical packages from the code
   alone: the bridge shim, transport, guests, and updater.
6. Nothing is committed until the owner asks. A phase closes only at its gate.

## If this is reopened

These are the orchestrator's suggestions, not owner decisions.

- Re-check Tauri's status first: a stable 3.0, and a sandboxed CEF runtime on
  Windows.
- Run S1 before anything else. If guest pages cannot be drawn inside the
  transcript, no Tauri route keeps plan 08.
- Decide what the switch must deliver. With bundled Chromium the size and
  memory gains mostly disappear.
- Get the double confirmation for the host change before Phase 1.
- Decide the transport security model: credentials kept out of the page with a
  per-frame gate, or a capability held by the renderer.
- Decide the minimum macOS and whether Windows and Linux are in the first
  cutover.

## Unverified and open questions

- Whether a never-shown WKWebView keeps rendering and reports itself visible.
- Whether Playwright's `connectOverCDP` works against Tauri's CEF runtime.
- Minimum OS versions for the CEF runtime.
- Whether per-webview proxies force localhost and WebRTC through the proxy.
- Whether Google sign-in accepts an honest user agent in WebView2.
- How `electron-builder`'s NSIS install is keyed on Windows, and whether a Tauri
  installer can remove it.
- Whether Nightly shares `Application Support/Happy` and the single-instance
  lock with the standard flavor.
- Whether a Tauri app can read Electron's Keychain item without a prompt.
- Who reads `~/.happy/agent/desktop-quit/*.json`; no consumer is in this
  repository.
- Whether the `usb` addon loads from a Node single executable or a Bun binary.
- Whether enterprise users depend on Chromium's system proxy for team-server
  sign-in.

## Mismatches between docs and code

Found during the survey. Reported, not fixed.

- `master-plans/11-in-app-browser.md` says installed builds refuse any debugger.
  Today they accept one on purpose through `--debug`, `HAPPY_DESKTOP_DEBUG=1`,
  or Settings → Dev Tools (`main.ts:152-154`, `421-425`, checked). That step of
  plan 11 is not done yet.
- The root `AGENTS.md` cites `gym/state`; no such directory exists. (checked)
- The root `AGENTS.md` says `pnpm check` and `pnpm release` run the UI suite.
  Root `check` is format, lint, typecheck, and build, and there is no root
  `release` script. (checked)
- The shell's `AGENTS.md` cites `sources/main/happyAgentProjection.ts`, which is
  gone; projection lives in `happy-desktop-state`. (checked)
- The shell's `AGENTS.md` calls the shell macOS-only, while it builds and
  releases for Windows and Linux. (checked)
- The camera usage string and camera permission path remain although no code
  asks for video. (survey)

## Sources

- Tauri releases: <https://github.com/tauri-apps/tauri/releases>
- CEF runtime: <https://v3.tauri.app/develop/cef/> (updated 2026-09-13)
- Tauri 2 to 3: <https://v3.tauri.app/start/migrate/from-tauri-2/> (updated
  2026-09-13)
- Tauri 2.12: <https://v2.tauri.app/blog/tauri-2.12>
- Capabilities and remote URLs: <https://v2.tauri.app/security/capabilities/>
- Updater: <https://v2.tauri.app/plugin/updater/>
- Node sidecar: <https://v2.tauri.app/learn/sidecar-nodejs/>
- WebDriver on macOS: <https://v2.tauri.app/develop/tests/webdriver/>
- Deep links: <https://v2.tauri.app/plugin/deep-linking/>
- Node single executables:
  <https://nodejs.org/api/single-executable-applications.html>
- Size benchmark:
  <https://github.com/Elanis/web-to-desktop-framework-comparison>
- CEF for Google sign-in:
  <https://getatrium.dev/blog/embedding-real-browser-tauri>
- Back to Electron:
  <https://dev.to/brendonovich/moving-opencode-desktop-to-electron-4hip>,
  <https://paseo.sh/blog/i-was-wrong-about-electron>
- Updater handoff reports: <https://github.com/me-shaon/devtools/pull/36>,
  <https://github.com/metawave/kanbanflow-app/pull/452>,
  <https://www.fluxzy.io/resources/blogs/electron-to-tauri-migration-fluxzy-desktop>
- Sidecar decision record: <https://github.com/kyh/idlebiz/issues/60>
