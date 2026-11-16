import { useState } from "react";
import type { HappyAgentGenUiSource } from "happy-desktop-state";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { ModalOverlay } from "../ModalOverlay";
import {
    HappyAgentSecretCreateDialog,
    happyAgentSecretCreateDraftValid,
    happyAgentSecretNameError,
    type HappyAgentSecretCreateDraft,
    type HappyAgentSecretVariableDraft,
} from "../pages/settings/HappyAgentSecretCreateDialog";
import type { GenUiSecretPrefill } from "./genUiRender";

/** Where a Happy Agent `secret` form is opened and saved, as the application reads it. */
export interface GenUiSecretHost {
    formOpen(
        source: HappyAgentGenUiSource,
        element: string,
        secretId: string | undefined,
    ): Promise<GenUiSecretForm>;
}

/** One opening of a Happy Agent secret form; every save from it is one click. */
export interface GenUiSecretForm {
    /** The stored secret the form changes; nothing when it creates one. */
    readonly secret:
        | {
              readonly id: string;
              readonly description: string;
              readonly variables: readonly string[];
          }
        | undefined;
    create(input: {
        readonly id: string;
        readonly description: string;
        readonly environment: ReadonlyMap<string, string>;
    }): Promise<void>;
    /** A value sets a variable, `null` removes it, and a name left out keeps its value. */
    update(input: {
        readonly description: string;
        readonly environment: ReadonlyMap<string, string | null>;
    }): Promise<void>;
}

/** A secret form being shown: what the agent suggested and how opening it went. */
export type GenUiSecretFormOpen = {
    readonly type: "secret";
    readonly prefill: GenUiSecretPrefill;
    readonly opened: { readonly form: GenUiSecretForm } | { readonly error: string };
    readonly finish: (saved: boolean) => void;
};

/** The form a secret action opened, or why it could not open. */
export function GenUiSecretFormView(props: { readonly open: GenUiSecretFormOpen }) {
    const open = props.open;
    const { finish } = open;
    const error = "error" in open.opened ? open.opened.error : undefined;
    if (error !== undefined)
        return (
            <ModalOverlay onDismiss={() => finish(false)}>
                <Modal
                    footer={<Button onClick={() => finish(false)}>Close</Button>}
                    icon="lock"
                    onClose={() => finish(false)}
                    size="small"
                    title="This form can’t open"
                >
                    {error}
                </Modal>
            </ModalOverlay>
        );
    if ("form" in open.opened)
        return <SecretForm finish={finish} form={open.opened.form} prefill={open.prefill} />;
    return null;
}

/*
 * The form a Happy Agent `secret` action opens: the agent's name, description
 * and variable names, each value typed here. When the action names a stored
 * secret, its variables are listed with their values kept unless retyped.
 */
function initialDraft(
    prefill: GenUiSecretPrefill,
    secret: GenUiSecretForm["secret"],
): HappyAgentSecretCreateDraft {
    const hints = new Map(
        prefill.variables.flatMap((variable) =>
            variable.description ? [[variable.name, variable.description] as const] : [],
        ),
    );
    const stored = secret?.variables ?? [];
    const names = [
        ...stored,
        ...prefill.variables
            .map((variable) => variable.name)
            .filter((name) => !stored.includes(name)),
    ];
    const variables: HappyAgentSecretVariableDraft[] = names.map((name, index) => {
        const hint = hints.get(name);
        return {
            id: index + 1,
            name,
            value: "",
            ...(stored.includes(name) ? { stored: true } : {}),
            ...(hint === undefined ? {} : { hint }),
        };
    });
    return {
        availableToAgents: false,
        description: prefill.description ?? secret?.description ?? "",
        nextVariableId: variables.length + 2,
        variables: variables.length > 0 ? variables : [{ id: 1, name: "", value: "" }],
    };
}

function SecretForm(props: {
    readonly prefill: GenUiSecretPrefill;
    readonly form: GenUiSecretForm;
    readonly finish: (saved: boolean) => void;
}) {
    const { form, finish } = props;
    const secret = form.secret;
    const [name, setName] = useState(secret?.id ?? props.prefill.id ?? "");
    const [draft, setDraft] = useState(() => initialDraft(props.prefill, secret));
    const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
    const [attempted, setAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>();
    const change = (next: HappyAgentSecretCreateDraft) => {
        setDraft(next);
        setError(undefined);
    };
    const variableChange = (id: number, patch: Partial<HappyAgentSecretVariableDraft>) =>
        change({
            ...draft,
            variables: draft.variables.map((variable) =>
                variable.id === id ? { ...variable, ...patch } : variable,
            ),
        });
    const submit = () => {
        if (submitting) return;
        setAttempted(true);
        const nameValid = secret !== undefined || happyAgentSecretNameError(name) === undefined;
        if (!nameValid || !happyAgentSecretCreateDraftValid(draft, true)) return;
        setSubmitting(true);
        setError(undefined);
        const description = draft.description.trim();
        const saving = secret
            ? form.update({
                  description,
                  environment: new Map<string, string | null>([
                      ...[...removed].map((gone) => [gone, null] as const),
                      ...draft.variables.flatMap((variable) =>
                          variable.stored && variable.value === ""
                              ? []
                              : [[variable.name, variable.value] as const],
                      ),
                  ]),
              })
            : form.create({
                  id: name,
                  description,
                  environment: new Map(
                      draft.variables.map((variable) => [variable.name, variable.value] as const),
                  ),
              });
        void saving.then(
            () => finish(true),
            (reason: unknown) => {
                setSubmitting(false);
                setError(reason instanceof Error ? reason.message : String(reason));
            },
        );
    };
    return (
        <HappyAgentSecretCreateDialog
            attempted={attempted}
            draft={draft}
            {...(error === undefined ? {} : { error })}
            name={{ value: name, locked: secret !== undefined, onChange: setName }}
            onClose={() => finish(false)}
            onDescriptionChange={(description) => change({ ...draft, description })}
            onSubmit={submit}
            onVariableAdd={() =>
                change({
                    ...draft,
                    nextVariableId: draft.nextVariableId + 1,
                    variables: [
                        ...draft.variables,
                        { id: draft.nextVariableId, name: "", value: "" },
                    ],
                })
            }
            onVariableNameChange={(id, value) => variableChange(id, { name: value })}
            onVariableRemove={(id) => {
                const gone = draft.variables.find((variable) => variable.id === id);
                if (gone?.stored) setRemoved(new Set([...removed, gone.name]));
                change({
                    ...draft,
                    variables: draft.variables.filter((variable) => variable.id !== id),
                });
            }}
            onVariableValueChange={(id, value) => variableChange(id, { value })}
            submitLabel={secret ? "Save secret" : "Create secret"}
            submitting={submitting}
            title={secret ? `Change ${secret.id}` : "Add a secret"}
            valuesRequired
        />
    );
}
