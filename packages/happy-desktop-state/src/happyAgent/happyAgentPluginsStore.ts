import { UserError } from "../types.js";

/** A plugin's picture: its address, with the ThumbHash painted until it loads. */
export interface HappyAgentPluginImage {
    readonly url: string;
    readonly thumbhash: string | null;
}

export interface HappyAgentPluginTool {
    readonly name: string;
    readonly summary: string;
}

/** One value a fields sign-in asks for, such as an API key. */
export interface HappyAgentPluginAuthField {
    readonly key: string;
    readonly label: string;
    readonly help: string;
    readonly required: boolean;
    /** Typed into a password field and never shown again. */
    readonly secret: boolean;
    readonly multiline: boolean;
}

/** One way an installation signs in to the service its plugin wraps. */
export type HappyAgentPluginAuthMethod =
    | {
          readonly type: "oauth";
          readonly id: string;
          readonly label: string;
          readonly scopes: readonly string[];
      }
    | {
          readonly type: "fields";
          readonly id: string;
          readonly label: string;
          readonly fields: readonly HappyAgentPluginAuthField[];
      };

/** One plugin the server offers, installed or not. */
export interface HappyAgentPlugin {
    /** The store's own key for it; pass it back unchanged, never read into. */
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly version: string;
    readonly image: HappyAgentPluginImage | null;
    readonly tools: readonly HappyAgentPluginTool[];
    /** Whether an installation does nothing until it signs in. */
    readonly authRequired: boolean;
    /** Only the methods that work on this server. */
    readonly authMethods: readonly HappyAgentPluginAuthMethod[];
    /** Whether it may be installed again while installed. */
    readonly multiInstance: boolean;
    /** Why this server cannot install it, in plain words; null when it can. */
    readonly installRefusal: string | null;
    /** `cluster` for a Happy Agent plugin from its cluster's own catalog rather than the public one. */
    readonly catalog: "public" | "cluster" | null;
}

/**
 * `notConfigured` is installed but waiting for a sign-in; `methodUnavailable`
 * signed in with a method this server no longer offers. `installing` and
 * `failed` are a Happy Agent unpacking a plugin, and that ending in an error.
 */
export type HappyAgentPluginInstallationStatus =
    | "active"
    | "installing"
    | "failed"
    | "notConfigured"
    | "methodUnavailable";

/** One installation of a plugin on the team. A plugin may be installed more than once. */
export interface HappyAgentPluginInstallation {
    readonly id: string;
    readonly pluginId: string;
    /** The plugin's name, or its ID once the server stops offering it. */
    readonly name: string;
    /** Counts installations of one plugin from 1; never reused. */
    readonly ordinal: number;
    readonly label: string | null;
    readonly status: HappyAgentPluginInstallationStatus;
    /** Why a `failed` installation failed. */
    readonly error: string | null;
    /** The method it signed in with, if any. */
    readonly authMethod: string | null;
    /** What the agent's tools from this installation are named with, where it has tools. */
    readonly toolPrefix: string | null;
    readonly image: HappyAgentPluginImage | null;
    /** False for a plugin this server no longer offers; it cannot be changed or removed then. */
    readonly available: boolean;
}

export interface HappyAgentPluginsSnapshot {
    /** True until the server first answers, so "nothing installed" is never claimed early. */
    readonly loading: boolean;
    /** Why the first read failed. A later successful read clears it. */
    readonly error?: UserError;
    /** Sorted by name. */
    readonly plugins: readonly HappyAgentPlugin[];
    /** Every installation on the team; a reader who may not manage them sees them too. */
    readonly installations: readonly HappyAgentPluginInstallation[];
    /** Whether the reader may install, set up and remove plugins. */
    readonly manage: boolean;
}

/** What the person's browser is sent to for a sign-in. Never kept by the store. */
export interface HappyAgentPluginConnectTarget {
    open(url: string): void;
}

/**
 * A setup the server refused, with what is wrong with each field by its key.
 * The messages never repeat a value.
 */
export class HappyAgentPluginFieldsError extends UserError {
    constructor(
        message: string,
        readonly fields: ReadonlyMap<string, string>,
    ) {
        super(message, "invalid_fields");
        this.name = "HappyAgentPluginFieldsError";
    }
}

/**
 * The plugins one server offers and the team's installations of them. Every
 * action is a promise that rejects with the reason to show, and the list is
 * read again after it settles.
 */
export interface HappyAgentPluginsStore {
    get(): HappyAgentPluginsSnapshot;
    subscribe(listener: () => void): () => void;
    /** Installs one plugin and answers the new installation's ID. */
    pluginInstall(pluginId: string): Promise<string>;
    /** Removes an installation with its secrets; one already gone counts as removed. */
    installationRemove(installationId: string): Promise<void>;
    /** Signs an installation in with a fields method. Refused fields reject with `HappyAgentPluginFieldsError`. */
    installationConfigure(
        installationId: string,
        methodId: string,
        values: ReadonlyMap<string, string>,
    ): Promise<void>;
    /** Starts an OAuth sign-in and sends `target` to the provider; the server finishes it. */
    installationConnect(
        installationId: string,
        methodId: string,
        target: HappyAgentPluginConnectTarget,
    ): Promise<void>;
    /** Forgets every secret of an installation, revoking each grant upstream where it can. */
    installationDisconnect(installationId: string): Promise<void>;
    [Symbol.dispose](): void;
}

const NONE: HappyAgentPluginsSnapshot = {
    loading: false,
    plugins: [],
    installations: [],
    manage: false,
};

/** For a connection without plugins: nothing to read, nothing ever loads. */
export const happyAgentPluginsStoreNone: HappyAgentPluginsStore = {
    get: () => NONE,
    subscribe: () => () => undefined,
    pluginInstall: () => Promise.reject(new UserError("This server has no plugins.")),
    installationRemove: () => Promise.resolve(),
    installationConfigure: () => Promise.reject(new UserError("This server has no plugins.")),
    installationConnect: () => Promise.reject(new UserError("This server has no plugins.")),
    installationDisconnect: () => Promise.resolve(),
    [Symbol.dispose]: () => undefined,
};
