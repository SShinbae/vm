import React from "react";
import { Modal as RNModal, Platform } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import {
  DialogProvider,
  dialog,
  useDialog,
} from "@/lib/contexts/DialogContext";

let api: ReturnType<typeof useDialog>;
function Probe() {
  api = useDialog();
  return null;
}

// The card is accessibilityViewIsModal, so RNTL treats the backdrop as hidden.
const backdrop = () =>
  screen.getByTestId("modal-backdrop", { includeHiddenElements: true });

const setup = () =>
  render(
    <DialogProvider>
      <Probe />
    </DialogProvider>,
  );

describe("DialogProvider", () => {
  it("confirm resolves true on confirm and false on cancel", async () => {
    setup();
    let p!: Promise<boolean>;
    act(() => {
      p = api.confirm({ title: "Sure?", confirmText: "Yes" });
    });
    fireEvent.press(screen.getByText("Yes"));
    await expect(p).resolves.toBe(true);

    act(() => {
      p = api.confirm({ title: "Sure?" });
    });
    fireEvent.press(screen.getByText("Cancel"));
    await expect(p).resolves.toBe(false);
  });

  it("choose resolves the tapped value and null on cancel", async () => {
    setup();
    const opts = [
      { label: "Join", value: "join" },
      { label: "Decline", value: "decline", destructive: true },
    ];
    let p!: Promise<string | null>;
    act(() => {
      p = api.choose({ title: "Invite", options: opts });
    });
    fireEvent.press(screen.getByText("Decline"));
    await expect(p).resolves.toBe("decline");

    act(() => {
      p = api.choose({ title: "Invite", options: opts });
    });
    fireEvent.press(screen.getByText("Cancel"));
    await expect(p).resolves.toBeNull();
  });

  it("alert resolves on OK", async () => {
    setup();
    let p!: Promise<void>;
    act(() => {
      p = api.alert({ title: "Heads up", message: "Note" });
    });
    fireEvent.press(screen.getByText("OK"));
    await expect(p).resolves.toBeUndefined();
  });

  it("shows queued dialogs one after another", async () => {
    setup();
    let p1!: Promise<boolean>;
    let p2!: Promise<boolean>;
    act(() => {
      p1 = api.confirm({ title: "First" });
      p2 = api.confirm({ title: "Second" });
    });
    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.queryByText("Second")).toBeNull();
    fireEvent.press(screen.getByText("Confirm"));
    await expect(p1).resolves.toBe(true);
    expect(screen.getByText("Second")).toBeTruthy();
    fireEvent.press(screen.getByText("Cancel"));
    await expect(p2).resolves.toBe(false);
  });

  it("static dialog is safe without a provider", async () => {
    await expect(dialog.confirm({ title: "x" })).resolves.toBe(false);
    await expect(
      dialog.choose({ title: "x", options: [] }),
    ).resolves.toBeNull();
    await expect(dialog.alert({ title: "x" })).resolves.toBeUndefined();
  });

  it("static dialog uses the mounted provider", async () => {
    setup();
    let p!: Promise<boolean>;
    act(() => {
      p = dialog.confirm({ title: "Static" });
    });
    fireEvent.press(screen.getByText("Confirm"));
    await expect(p).resolves.toBe(true);
  });
  it("dismissing via the backdrop resolves as cancel (iOS overlay)", async () => {
    expect(Platform.OS).toBe("ios");
    setup();
    let c!: Promise<boolean>;
    act(() => {
      c = api.confirm({ title: "Delete?", destructive: true });
    });
    expect(screen.UNSAFE_queryAllByType(RNModal)).toHaveLength(0);
    fireEvent.press(backdrop());
    await expect(c).resolves.toBe(false);

    let ch!: Promise<string | null>;
    act(() => {
      ch = api.choose({
        title: "Invite",
        options: [{ label: "Decline", value: "decline", destructive: true }],
      });
    });
    fireEvent.press(backdrop());
    await expect(ch).resolves.toBeNull();
    expect(screen.queryByText("Invite")).toBeNull();
  });

  it("Android back (onRequestClose) resolves as cancel", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    try {
      setup();
      let c!: Promise<boolean>;
      act(() => {
        c = api.confirm({ title: "Delete?", destructive: true });
      });
      act(() => screen.UNSAFE_getByType(RNModal).props.onRequestClose());
      await expect(c).resolves.toBe(false);

      let ch!: Promise<string | null>;
      act(() => {
        ch = api.choose({
          title: "Invite",
          options: [{ label: "Decline", value: "decline" }],
        });
      });
      act(() => screen.UNSAFE_getByType(RNModal).props.onRequestClose());
      await expect(ch).resolves.toBeNull();
    } finally {
      jest.restoreAllMocks();
    }
  });

  it("an identical pending request resolves as cancel at once (double tap)", async () => {
    setup();
    let p1!: Promise<boolean>;
    let p2!: Promise<boolean>;
    let c1!: Promise<string | null>;
    let c2!: Promise<string | null>;
    let a2!: Promise<void>;
    const opts = [{ label: "Camera", value: "camera" }];
    act(() => {
      p1 = api.confirm({ title: "Delete?", message: "Gone" });
      p2 = api.confirm({ title: "Delete?", message: "Gone" });
      c1 = api.choose({ title: "Photo", options: opts });
      c2 = api.choose({ title: "Photo", options: opts });
      api.alert({ title: "Note" });
      a2 = api.alert({ title: "Note" });
    });
    await expect(p2).resolves.toBe(false);
    await expect(c2).resolves.toBeNull();
    await expect(a2).resolves.toBeUndefined();

    fireEvent.press(screen.getByText("Confirm"));
    await expect(p1).resolves.toBe(true);
    fireEvent.press(screen.getByText("Camera"));
    await expect(c1).resolves.toBe("camera");
    fireEvent.press(screen.getByText("OK"));
    expect(screen.queryByText("Note")).toBeNull();
  });

  it("a different request is still queued", async () => {
    setup();
    let p2!: Promise<boolean>;
    act(() => {
      api.confirm({ title: "Delete?", message: "A" });
      p2 = api.confirm({ title: "Delete?", message: "B" });
    });
    fireEvent.press(screen.getByText("Cancel"));
    expect(screen.getByText("B")).toBeTruthy();
    fireEvent.press(screen.getByText("Confirm"));
    await expect(p2).resolves.toBe(true);
  });

  it("a double resolve of the head does not drop the next request", async () => {
    setup();
    act(() => {
      api.confirm({ title: "First" });
      api.confirm({ title: "Second" });
    });
    const confirmBtn = screen.getByText("Confirm");
    const backdropEl = backdrop();
    act(() => {
      fireEvent.press(confirmBtn);
      fireEvent.press(backdropEl);
    });
    expect(screen.getByText("Second")).toBeTruthy();
  });
});
