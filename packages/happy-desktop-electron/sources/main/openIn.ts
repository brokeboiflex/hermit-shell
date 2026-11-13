import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, rm, stat } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { promisify } from "node:util";

import open from "open";
import which from "which";
import type { HappyAgentFileActions } from "happy-desktop-state";

const execFileAsync = promisify(execFile);

/**
 * Applications for local projects and files. The renderer names a catalog id
 * and a file path; it never chooses an executable, bundle id, or launch flags.
 * The proxy resolves the path against the authoritative local workspace before
 * it is passed as one argument, without a command shell.
 *
 * Editions are several bundle ids behind one id — PyCharm Professional and
 * Community are one entry to the reader, and the first one installed wins.
 */
interface OpenInApp {
    readonly id: string;
    readonly label: string;
    readonly kind: "file-manager" | "terminal" | "editor" | "file-editor" | "project";
    readonly commands?: { readonly win32?: readonly string[]; readonly linux?: readonly string[] };
    /**
     * What the installed bundle is named on disk. This is what actually finds an
     * application: the directories below are read directly, because Spotlight
     * cannot be trusted to know (see `appsDetect`). Several names are the
     * editions and channels one entry covers; the first one installed wins.
     */
    readonly appNames: readonly string[];
    /**
     * The bundle ids that are genuinely this application. A bundle found by name
     * is confirmed against these before it is offered, so a differently authored
     * application wearing a familiar name is not launched in its place, and this
     * is also what `open -b` is given.
     */
    readonly bundleIds: readonly string[];
}

const OPEN_IN_APPS: readonly OpenInApp[] = [
    {
        id: "explorer",
        label: "File Explorer",
        kind: "file-manager",
        appNames: [],
        bundleIds: [],
        commands: { win32: ["explorer.exe"] },
    },
    {
        id: "file-manager",
        label: "File manager",
        kind: "file-manager",
        appNames: [],
        bundleIds: [],
        commands: { linux: ["xdg-open"] },
    },
    {
        id: "windows-terminal",
        label: "Windows Terminal",
        kind: "terminal",
        appNames: [],
        bundleIds: [],
        commands: { win32: ["wt.exe"] },
    },
    {
        id: "powershell",
        label: "PowerShell",
        kind: "terminal",
        appNames: [],
        bundleIds: [],
        commands: { win32: ["pwsh.exe", "powershell.exe"] },
    },
    {
        id: "gnome-terminal",
        label: "Terminal",
        kind: "terminal",
        appNames: [],
        bundleIds: [],
        commands: { linux: ["gnome-terminal"] },
    },
    {
        id: "konsole",
        label: "Konsole",
        kind: "terminal",
        appNames: [],
        bundleIds: [],
        commands: { linux: ["konsole"] },
    },
    {
        id: "xfce-terminal",
        label: "Xfce Terminal",
        kind: "terminal",
        appNames: [],
        bundleIds: [],
        commands: { linux: ["xfce4-terminal"] },
    },
    {
        id: "notepad",
        label: "Notepad",
        kind: "file-editor",
        appNames: [],
        bundleIds: [],
        commands: { win32: ["notepad.exe"] },
    },
    {
        id: "notepad-plus-plus",
        label: "Notepad++",
        kind: "file-editor",
        appNames: [],
        bundleIds: [],
        commands: { win32: ["notepad++.exe"] },
    },

    {
        id: "finder",
        kind: "file-manager",
        label: "Finder",
        appNames: ["Finder.app"],
        bundleIds: ["com.apple.finder"],
    },
    {
        id: "terminal",
        kind: "terminal",
        label: "Terminal",
        appNames: ["Terminal.app"],
        bundleIds: ["com.apple.Terminal"],
    },
    {
        id: "iterm",
        kind: "terminal",
        label: "iTerm",
        appNames: ["iTerm.app"],
        bundleIds: ["com.googlecode.iterm2"],
    },
    {
        id: "ghostty",
        kind: "terminal",
        commands: { linux: ["ghostty"] },
        label: "Ghostty",
        appNames: ["Ghostty.app"],
        bundleIds: ["com.mitchellh.ghostty"],
    },
    {
        id: "kitty",
        kind: "terminal",
        commands: { linux: ["kitty"] },
        label: "kitty",
        appNames: ["kitty.app"],
        bundleIds: ["net.kovidgoyal.kitty"],
    },
    {
        id: "warp",
        kind: "terminal",
        label: "Warp",
        appNames: ["Warp.app"],
        bundleIds: ["dev.warp.Warp-Stable", "dev.warp.Warp"],
    },
    {
        id: "vscode",
        kind: "editor",
        commands: { win32: ["Code.exe"], linux: ["code"] },
        label: "VS Code",
        appNames: ["Visual Studio Code.app"],
        bundleIds: ["com.microsoft.VSCode"],
    },
    {
        id: "cursor",
        kind: "editor",
        commands: { win32: ["Cursor.exe"], linux: ["cursor"] },
        label: "Cursor",
        appNames: ["Cursor.app"],
        bundleIds: ["com.todesktop.230313mzl4w4u92"],
    },
    {
        id: "zed",
        kind: "editor",
        commands: { win32: ["zed.exe"], linux: ["zed"] },
        label: "Zed",
        appNames: ["Zed.app"],
        bundleIds: ["dev.zed.Zed"],
    },
    {
        id: "sublime-text",
        kind: "editor",
        commands: { win32: ["sublime_text.exe"], linux: ["subl"] },
        label: "Sublime Text",
        appNames: ["Sublime Text.app"],
        bundleIds: ["com.sublimetext.4", "com.sublimetext.3"],
    },
    {
        id: "xcode",
        kind: "editor",
        label: "Xcode",
        appNames: ["Xcode.app"],
        bundleIds: ["com.apple.dt.Xcode"],
    },
    {
        id: "intellij",
        kind: "editor",
        commands: { win32: ["idea64.exe", "idea.exe"], linux: ["idea"] },
        label: "IntelliJ IDEA",
        appNames: [
            "IntelliJ IDEA.app",
            "IntelliJ IDEA Ultimate.app",
            "IntelliJ IDEA CE.app",
            "IntelliJ IDEA Community Edition.app",
        ],
        bundleIds: ["com.jetbrains.intellij", "com.jetbrains.intellij.ce"],
    },
    {
        id: "pycharm",
        kind: "editor",
        commands: { win32: ["pycharm64.exe", "pycharm.exe"], linux: ["pycharm"] },
        label: "PyCharm",
        appNames: [
            "PyCharm.app",
            "PyCharm Professional.app",
            "PyCharm CE.app",
            "PyCharm Community Edition.app",
        ],
        bundleIds: ["com.jetbrains.pycharm", "com.jetbrains.pycharm.ce"],
    },
    {
        id: "webstorm",
        kind: "editor",
        commands: { win32: ["webstorm64.exe", "webstorm.exe"], linux: ["webstorm"] },
        label: "WebStorm",
        appNames: ["WebStorm.app"],
        bundleIds: ["com.jetbrains.WebStorm"],
    },
    {
        id: "rustrover",
        kind: "editor",
        commands: { win32: ["rustrover64.exe", "rustrover.exe"], linux: ["rustrover"] },
        label: "RustRover",
        appNames: ["RustRover.app"],
        bundleIds: ["com.jetbrains.rustrover"],
    },
    {
        id: "goland",
        kind: "editor",
        commands: { win32: ["goland64.exe", "goland.exe"], linux: ["goland"] },
        label: "GoLand",
        appNames: ["GoLand.app"],
        bundleIds: ["com.jetbrains.goland"],
    },
    {
        id: "datagrip",
        kind: "editor",
        commands: { win32: ["datagrip64.exe", "datagrip.exe"], linux: ["datagrip"] },
        label: "DataGrip",
        appNames: ["DataGrip.app"],
        bundleIds: ["com.jetbrains.datagrip"],
    },
    {
        id: "android-studio",
        kind: "editor",
        commands: { win32: ["studio64.exe", "studio.exe"], linux: ["studio", "android-studio"] },
        label: "Android Studio",
        appNames: ["Android Studio.app"],
        bundleIds: ["com.google.android.studio"],
    },
    {
        id: "sourcetree",
        kind: "project",
        label: "Sourcetree",
        appNames: ["Sourcetree.app", "SourceTree.app"],
        // The direct download and the App Store build ship different ids.
        bundleIds: ["com.torusknot.SourceTreeNotMAS", "com.torusknot.SourceTree"],
    },
    {
        id: "fork",
        kind: "project",
        label: "Fork",
        appNames: ["Fork.app"],
        bundleIds: ["com.DanPristupov.Fork"],
    },
    {
        id: "tower",
        kind: "project",
        label: "Tower",
        appNames: ["Tower.app"],
        bundleIds: ["com.fournova.Tower3"],
    },
    {
        id: "github-desktop",
        kind: "project",
        label: "GitHub Desktop",
        appNames: ["GitHub Desktop.app"],
        bundleIds: ["com.github.GitHubClient"],
    },
    {
        id: "antigravity",
        kind: "editor",
        commands: { win32: ["Antigravity.exe"], linux: ["antigravity"] },
        label: "Antigravity",
        appNames: ["Antigravity.app"],
        bundleIds: ["com.google.antigravity"],
    },
];

/**
 * Where macOS applications live. Every one of these is read on each detection —
 * they are directory lookups, not a search — so an application installed since
 * the last pass is found by the next one.
 *
 * `/System/Library/CoreServices` is here for Finder, which lives there rather
 * than beside the other system applications. JetBrains Toolbox installs into its
 * own folder under the home directory, which is why that appears too.
 */
const APP_DIRECTORIES: readonly string[] = [
    "/Applications",
    "/Applications/Utilities",
    "/System/Applications",
    "/System/Applications/Utilities",
    "/System/Library/CoreServices",
    join(homedir(), "Applications"),
    join(homedir(), "Applications", "JetBrains Toolbox"),
];

export interface OpenInTarget {
    readonly id: string;
    readonly label: string;
    /**
     * The application's own macOS icon as a PNG data URL, taken from the
     * installed bundle. It is the picture of the thing being launched, so the
     * menu is recognizable at a glance instead of a column of words; absent only
     * when the system declines to render one.
     */
    readonly iconUrl?: string;
}

/** How long a detection result is reused before the applications are looked up again. */
const DETECT_TTL_MS = 60_000;

interface DetectedApp {
    readonly path: string;
    readonly iconUrl?: string;
}

let detected:
    | { readonly at: number; readonly value: Promise<ReadonlyMap<string, DetectedApp>> }
    | undefined;

/** 64px covers a 16px menu row and a 24px trigger at 2× with room to spare. */
const ICON_SIZE = 64;

/**
 * The `.icns` an application bundle ships, if it has one: the icon named by
 * `CFBundleIconFile`, or the only one in `Resources` when the plist points
 * somewhere else. An application built against an asset catalog has neither and
 * simply appears in the menu without a picture.
 */
async function icnsPathRead(bundlePath: string): Promise<string | undefined> {
    const resources = join(bundlePath, "Contents", "Resources");
    try {
        const { stdout } = await execFileAsync(
            "/usr/bin/plutil",
            [
                "-extract",
                "CFBundleIconFile",
                "raw",
                "-o",
                "-",
                join(bundlePath, "Contents", "Info.plist"),
            ],
            { timeout: 4_000 },
        );
        const named = stdout.trim();
        if (named.length > 0) {
            const path = join(resources, named.endsWith(".icns") ? named : `${named}.icns`);
            if (existsSync(path)) return path;
        }
    } catch {
        // No plist key, or an unreadable bundle. The directory listing below is
        // the answer either way.
    }
    try {
        const entries = await readdir(resources);
        const found = entries.find((entry) => entry.endsWith(".icns"));
        return found === undefined ? undefined : join(resources, found);
    } catch {
        return undefined;
    }
}

/**
 * Converted icons, keyed by bundle path and the bundle's own modification time.
 * Detection runs again every so often, and converting the same unchanged
 * artwork each time is the expensive half of it. An update rewrites the bundle
 * and so changes the key, which is how a reinstalled application's new icon
 * still arrives.
 */
const icons = new Map<string, string | undefined>();

/**
 * The installed bundle's own icon as a PNG data URL.
 *
 * The artwork is read out of the bundle rather than drawn by us: these are other
 * people's icons, and an application that ships a new one gets it here for free.
 * `sips` converts the `.icns` in a subprocess, so the scan needs no window, GUI
 * session, or icon service and never blocks this process's own work.
 *
 * A failure is not worth reporting: the entry simply appears without a picture.
 */
async function iconRead(bundlePath: string): Promise<string | undefined> {
    const key = await stat(bundlePath).then(
        (info) => `${bundlePath}:${info.mtimeMs}`,
        () => undefined,
    );
    if (key !== undefined && icons.has(key)) return icons.get(key);
    const icon = await iconConvert(bundlePath);
    if (key !== undefined) icons.set(key, icon);
    return icon;
}

async function iconConvert(bundlePath: string): Promise<string | undefined> {
    const icns = await icnsPathRead(bundlePath);
    if (icns === undefined) return undefined;
    const output = join(
        tmpdir(),
        `happy-open-in-${createHash("sha1").update(icns).digest("hex")}.png`,
    );
    try {
        await execFileAsync(
            "/usr/bin/sips",
            [
                "-s",
                "format",
                "png",
                "--resampleHeightWidth",
                String(ICON_SIZE),
                String(ICON_SIZE),
                icns,
                "--out",
                output,
            ],
            { timeout: 10_000 },
        );
        const png = await readFile(output);
        return `data:image/png;base64,${png.toString("base64")}`;
    } catch {
        return undefined;
    } finally {
        await rm(output, { force: true });
    }
}

/** The bundle's own `CFBundleIdentifier`, or nothing if it cannot be read. */
async function bundleIdRead(bundlePath: string): Promise<string | undefined> {
    try {
        const { stdout } = await execFileAsync(
            "/usr/bin/plutil",
            [
                "-extract",
                "CFBundleIdentifier",
                "raw",
                "-o",
                "-",
                join(bundlePath, "Contents", "Info.plist"),
            ],
            { timeout: 4_000 },
        );
        const id = stdout.trim();
        return id.length === 0 ? undefined : id;
    } catch {
        return undefined;
    }
}

/**
 * Where one of the known applications is installed, by looking in the places
 * applications are installed.
 *
 * Spotlight is not asked, because it does not reliably know. An index can report
 * itself enabled and still contain nothing outside the system volume, which
 * leaves `mdfind` answering for Finder and Terminal and denying that Xcode, VS
 * Code, or Cursor exist while all three sit in /Applications — a menu with two
 * entries on a machine full of editors. A directory lookup cannot be wrong about
 * that, and it costs no subprocess at all.
 *
 * The price is that an application somewhere unusual is not found. That is the
 * better failure: it is visible, and the reader can move the bundle where
 * applications go.
 */
async function bundlePathFind(candidate: OpenInApp): Promise<string | undefined> {
    for (const directory of APP_DIRECTORIES)
        for (const name of candidate.appNames) {
            const path = join(directory, name);
            if (!existsSync(path)) continue;
            // A name is how the bundle was found; the id is what it is. An
            // application that does not answer at all is still offered — the
            // bundle is there, and a launch reports its own failure — but one
            // that names itself something else is a different application.
            const bundleId = await bundleIdRead(path);
            if (bundleId !== undefined && !candidate.bundleIds.includes(bundleId)) continue;
            return path;
        }
    return undefined;
}

/** Windows registered executable locations, including per-user installations. */
async function windowsAppPathsRead(): Promise<ReadonlyMap<string, string>> {
    const names = OPEN_IN_APPS.flatMap((app) => app.commands?.win32 ?? []);
    // Only the catalog's fixed executable names enter this script, never a file path or renderer data.
    const script = String.raw`
$result = @{}
foreach ($root in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths')) {
    foreach ($name in @(${names.map((name) => `'${name}'`).join(",")})) {
        if ($result.ContainsKey($name)) { continue }
        $key = Get-Item -LiteralPath (Join-Path $root $name) -ErrorAction SilentlyContinue
        if ($null -ne $key) {
            $value = $key.GetValue('')
            if ($value -is [string]) { $result[$name] = $value.Trim('"') }
        }
    }
}
ConvertTo-Json -InputObject $result -Compress
`;
    try {
        const { stdout } = await execFileAsync(
            "powershell.exe",
            ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
            { timeout: 10_000, windowsHide: true },
        );
        const values: unknown = JSON.parse(stdout);
        if (typeof values !== "object" || values === null) return new Map();
        return new Map(
            Object.entries(values).filter(
                (entry): entry is [string, string] =>
                    typeof entry[1] === "string" && isAbsolute(entry[1]) && existsSync(entry[1]),
            ),
        );
    } catch {
        return new Map();
    }
}

async function commandPathFind(
    candidate: OpenInApp,
    registered: ReadonlyMap<string, string>,
): Promise<string | undefined> {
    const commands =
        process.platform === "win32" ? candidate.commands?.win32 : candidate.commands?.linux;
    for (const command of commands ?? []) {
        const registeredPath = registered.get(command);
        if (registeredPath) return registeredPath;
        const executable = await which(command, { nothrow: true });
        if (executable) return resolve(executable);
    }
    return undefined;
}

/**
 * Which of the known applications are installed, with each one's bundle path and
 * icon. A failure to read one is not worth reporting: it simply does not appear
 * in the menu, and detection runs again later.
 */
async function appsDetect(): Promise<ReadonlyMap<string, DetectedApp>> {
    if (!["darwin", "win32", "linux"].includes(process.platform)) return new Map();
    const registered =
        process.platform === "win32" ? await windowsAppPathsRead() : new Map<string, string>();
    const entries = await Promise.all(
        OPEN_IN_APPS.map(async (candidate) => {
            try {
                const path =
                    process.platform === "darwin"
                        ? await bundlePathFind(candidate)
                        : await commandPathFind(candidate, registered);
                if (path === undefined) return undefined;
                return [
                    candidate.id,
                    {
                        path,
                        iconUrl: process.platform === "darwin" ? await iconRead(path) : undefined,
                    },
                ] as const;
            } catch {
                return undefined;
            }
        }),
    );
    return new Map(entries.filter((entry) => entry !== undefined));
}

function detectedRead(): Promise<ReadonlyMap<string, DetectedApp>> {
    const now = Date.now();
    if (detected && now - detected.at < DETECT_TTL_MS) return detected.value;
    const value = appsDetect();
    detected = { at: now, value };
    return value;
}

/**
 * The applications currently installed, in the fixed order above so the menu
 * does not reshuffle itself between openings, each carrying its own icon. Finder
 * and Terminal ship with the system, but they are detected like everything else
 * rather than assumed.
 */
export async function openInTargetsRead(): Promise<readonly OpenInTarget[]> {
    const installed = await detectedRead();
    return OPEN_IN_APPS.filter(
        (candidate) => candidate.kind !== "file-editor" && installed.has(candidate.id),
    ).map((candidate) => ({
        id: candidate.id,
        label: candidate.label,
        iconUrl: installed.get(candidate.id)?.iconUrl,
    }));
}

/** File capabilities are explicit so the renderer never guesses the host OS from an app id. */
export async function fileActionsRead(): Promise<HappyAgentFileActions | undefined> {
    const installed = await detectedRead();
    const applications = OPEN_IN_APPS.filter((candidate) => installed.has(candidate.id));
    if (!applications.some((candidate) => candidate.kind === "file-manager")) return undefined;
    return {
        revealLabel:
            process.platform === "darwin"
                ? "Show in Finder"
                : process.platform === "win32"
                  ? "Show in File Explorer"
                  : "Show in file manager",
        targets: [
            { id: "default-app", label: "Default app", acceptsFolders: true },
            ...applications
                .filter(
                    (app) =>
                        app.kind === "editor" ||
                        app.kind === "file-editor" ||
                        app.kind === "terminal",
                )
                .map((app) => ({
                    id: app.id,
                    label: app.label,
                    iconUrl: installed.get(app.id)?.iconUrl,
                    acceptsFolders: app.kind !== "file-editor",
                })),
        ],
    };
}

function externalOpenGuard(): void {
    if (process.env.HAPPY_DESKTOP_WINDOWS_HIDDEN !== undefined)
        throw new Error("A hidden-window run cannot open another application.");
}

async function localPathStat(path: string) {
    if (!isAbsolute(path)) throw new Error("Only a path on this computer can be opened.");
    try {
        return await stat(path);
    } catch {
        throw new Error("That file or folder is not on this computer.");
    }
}

/** A detached program owns its window; no shell ever interprets the selected file path. */
function applicationLaunch(
    executable: string,
    args: readonly string[],
    cwd: string,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(executable, [...args], { cwd, detached: true, stdio: "ignore" });
        child.once("error", reject);
        child.once("spawn", () => {
            child.unref();
            resolve();
        });
    });
}

function terminalArguments(id: string, directory: string): readonly string[] {
    switch (id) {
        case "windows-terminal":
            return ["-d", directory];
        case "powershell":
            return ["-NoLogo", "-NoProfile", "-NoExit"];
        case "konsole":
            return ["--workdir", directory];
        case "kitty":
            return ["--directory", directory];
        case "ghostty":
            return [`--working-directory=${directory}`];
        case "gnome-terminal":
        case "xfce-terminal":
            return [`--working-directory=${directory}`];
        default:
            return [];
    }
}

/** Opens an authorized local project or selected file in a host-detected application. */
export async function openInRun(
    targetId: string,
    path: string,
    scope: "workspace" | "file" = "workspace",
): Promise<void> {
    externalOpenGuard();
    const info = await localPathStat(path);
    const directory = info.isDirectory() ? path : dirname(path);
    if (targetId === "default-app" && scope === "file") {
        if (!(await fileActionsRead())) throw new Error("This host cannot open local files.");
        await open(path);
        return;
    }
    const target = OPEN_IN_APPS.find((candidate) => candidate.id === targetId);
    if (
        !target ||
        (scope === "file" &&
            target.kind !== "editor" &&
            target.kind !== "file-editor" &&
            target.kind !== "terminal")
    )
        throw new Error("That application is not available for this file.");
    if (target.kind === "file-editor" && (scope === "workspace" || info.isDirectory()))
        throw new Error(`${target.label} opens files, not folders.`);
    const executable = (await detectedRead()).get(target.id)?.path;
    if (executable === undefined)
        throw new Error(`${target.label} does not appear to be installed.`);
    const destination = target.kind === "terminal" ? directory : path;
    try {
        if (process.platform === "darwin") {
            await execFileAsync("/usr/bin/open", ["-a", executable, destination], {
                timeout: 10_000,
            });
        } else if (target.kind === "file-manager") {
            await open(directory);
        } else {
            await applicationLaunch(
                executable,
                target.kind === "terminal"
                    ? terminalArguments(target.id, directory)
                    : [destination],
                directory,
            );
        }
    } catch {
        throw new Error(
            `${target.label} could not open this ${scope === "file" ? "file or folder" : "project"}.`,
        );
    }
}

/** Reveal through the current OS's file manager; Linux opens the containing directory. */
export async function fileReveal(path: string): Promise<void> {
    externalOpenGuard();
    const info = await localPathStat(path);
    if (process.platform === "darwin") {
        await execFileAsync("/usr/bin/open", ["-R", path], { timeout: 10_000 });
    } else if (process.platform === "win32") {
        const explorer = (await detectedRead()).get("explorer")?.path;
        if (!explorer) throw new Error("File Explorer is not available.");
        await applicationLaunch(explorer, ["/select," + path], dirname(path));
    } else if (process.platform === "linux") {
        await open(info.isDirectory() ? path : dirname(path));
    } else {
        throw new Error("This host cannot reveal local files.");
    }
}
