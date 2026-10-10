import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { FullWindowOverlay } from "react-native-screens";
import { AlertModal, ChoiceModal, ConfirmModal } from "@/components/ui/Modal";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export interface DialogAlertOptions {
  title: string;
  message?: string;
  variant?: "info" | "success" | "warning" | "error";
  buttonText?: string;
}

export interface ChooseOptions<T extends string> {
  title: string;
  message?: string;
  options: { label: string; value: T; destructive?: boolean }[];
  cancelText?: string;
}

export interface DialogApi {
  confirm(opts: ConfirmOptions): Promise<boolean>;
  alert(opts: DialogAlertOptions): Promise<void>;
  choose<T extends string>(opts: ChooseOptions<T>): Promise<T | null>;
}

type Request =
  | { kind: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: "alert"; opts: DialogAlertOptions; resolve: () => void }
  | {
      kind: "choose";
      opts: ChooseOptions<string>;
      resolve: (v: string | null) => void;
    };

const cancel = (r: Request) =>
  r.kind === "confirm"
    ? r.resolve(false)
    : r.kind === "choose"
      ? r.resolve(null)
      : r.resolve();

const sameAs = (a: Request) => (b: Request) =>
  a.kind === b.kind &&
  a.opts.title === b.opts.title &&
  a.opts.message === b.opts.message;

// Registered by the mounted DialogProvider so non-React code can use `dialog`.
let active: DialogApi | null = null;

export const dialog: DialogApi = {
  confirm: (opts) => active?.confirm(opts) ?? Promise.resolve(false),
  choose: (opts) => active?.choose(opts) ?? Promise.resolve(null),
  alert: (opts) => active?.alert(opts) ?? Promise.resolve(),
};

const DialogContext = createContext<DialogApi | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Request[]>([]);
  // An identical pending request (double tap) resolves as cancel at once.
  // Resolving inside the updater is safe: a promise settles only once.
  const enqueue = useCallback(
    (r: Request) =>
      setQueue((q) => {
        if (!q.some(sameAs(r))) return [...q, r];
        cancel(r);
        return q;
      }),
    [],
  );

  const api = useMemo<DialogApi>(() => {
    const confirm = (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) =>
        enqueue({ kind: "confirm", opts, resolve }),
      );
    const choose = <T extends string>(opts: ChooseOptions<T>) =>
      new Promise<T | null>((resolve) =>
        enqueue({
          kind: "choose",
          opts: opts as ChooseOptions<string>,
          resolve: resolve as (v: string | null) => void,
        }),
      );
    const alert = (opts: DialogAlertOptions) =>
      new Promise<void>((resolve) => enqueue({ kind: "alert", opts, resolve }));

    return { confirm, choose, alert };
  }, [enqueue]);

  useEffect(() => {
    active = api;
    return () => {
      if (active === api) active = null;
    };
  }, [api]);

  const head = queue[0];
  // Dequeue by identity so a second resolve of the same head can't drop the next one.
  const done = () => setQueue((q) => (q[0] === head ? q.slice(1) : q));
  // iOS: an RN Modal can't present while another RN Modal is up (e.g. Edit
  // Profile), which would hide the head and jam the queue. Draw the dialog in
  // a window-level overlay instead. Android keeps RN Modal (back button), web
  // keeps its portal.
  const inline = Platform.OS === "ios";

  const headEl = (
    <>
      {head?.kind === "confirm" && (
        <ConfirmModal
          visible
          inline={inline}
          title={head.opts.title}
          message={head.opts.message ?? ""}
          confirmText={head.opts.confirmText}
          cancelText={head.opts.cancelText}
          variant={head.opts.destructive ? "danger" : "default"}
          onConfirm={() => {
            head.resolve(true);
            done();
          }}
          onClose={() => {
            head.resolve(false);
            done();
          }}
        />
      )}
      {head?.kind === "alert" && (
        <AlertModal
          visible
          inline={inline}
          title={head.opts.title}
          message={head.opts.message ?? ""}
          variant={head.opts.variant}
          buttonText={head.opts.buttonText}
          onClose={() => {
            head.resolve();
            done();
          }}
        />
      )}
      {head?.kind === "choose" && (
        <ChoiceModal
          visible
          inline={inline}
          title={head.opts.title}
          message={head.opts.message}
          options={head.opts.options}
          cancelText={head.opts.cancelText}
          onSelect={(v) => {
            head.resolve(v);
            done();
          }}
          onClose={() => {
            head.resolve(null);
            done();
          }}
        />
      )}
    </>
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {head && inline ? (
        <FullWindowOverlay>{headEl}</FullWindowOverlay>
      ) : (
        headEl
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
