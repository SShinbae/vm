import React from "react";
import { Platform } from "react-native";
import { render } from "@testing-library/react-native";
import { Modal } from "@/components/ui/Modal";

// Jest runs in the node environment, so there is no real DOM: stub the few
// document members WebModal touches. Real focus movement is a manual check.
const originalOS = Platform.OS;
const originalDocument = (global as any).document;
let listeners: Record<string, ((e: any) => void)[]>;
let trigger: { focus: jest.Mock };

beforeEach(() => {
  listeners = {};
  trigger = { focus: jest.fn() };
  (Platform as any).OS = "web";
  (global as any).document = {
    activeElement: trigger,
    body: { classList: { add: jest.fn(), remove: jest.fn() } },
    addEventListener: jest.fn((type: string, fn: any) => {
      listeners[type] = [...(listeners[type] ?? []), fn];
    }),
    removeEventListener: jest.fn((type: string, fn: any) => {
      listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
    }),
  };
});

afterEach(() => {
  (Platform as any).OS = originalOS;
  (global as any).document = originalDocument;
});

// Fires the event on every registered document listener, like the browser.
const dispatch = (type: string, event: any) =>
  [...(listeners[type] ?? [])].forEach((fn) => fn(event));
const keydownCount = () => (listeners.keydown ?? []).length;

const modal = (props: Partial<React.ComponentProps<typeof Modal>> = {}) => (
  <Modal visible onClose={props.onClose ?? jest.fn()} {...props}>
    {null}
  </Modal>
);

describe("WebModal keyboard and focus", () => {
  it("Escape closes the modal", () => {
    const onClose = jest.fn();
    render(modal({ onClose }));
    dispatch("keydown", { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    dispatch("keydown", { key: "a" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape respects closeOnBackdrop={false}", () => {
    const onClose = jest.fn();
    render(modal({ onClose, closeOnBackdrop: false }));
    dispatch("keydown", { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("removes the listener and restores focus on unmount", () => {
    const { unmount } = render(modal());
    expect(keydownCount()).toBe(1);
    unmount();
    expect(keydownCount()).toBe(0);
    expect(trigger.focus).toHaveBeenCalledTimes(1);
  });

  it("does not listen while hidden", () => {
    render(modal({ visible: false }));
    expect(keydownCount()).toBe(0);
  });
});

describe("WebModal stacking", () => {
  it("one Escape closes only the top modal, the next closes the one below", () => {
    const onCloseA = jest.fn();
    const onCloseB = jest.fn();
    render(modal({ onClose: onCloseA }));
    const b = render(modal({ onClose: onCloseB }));

    dispatch("keydown", { key: "Escape" });
    expect(onCloseA).not.toHaveBeenCalled();
    expect(onCloseB).toHaveBeenCalledTimes(1);

    b.unmount();
    dispatch("keydown", { key: "Escape" });
    expect(onCloseA).toHaveBeenCalledTimes(1);
    expect(onCloseB).toHaveBeenCalledTimes(1);
  });
});

describe("WebModal focus trap", () => {
  // The dialog ref is the (mocked) View instance; the modal reads its
  // querySelectorAll and focus at Tab time, so stub them on that instance.
  const focusable = () => ({ focus: jest.fn() });
  const renderWithDialog = (items: any[], props = {}) => {
    const result = modal(props);
    const view = render(result);
    const dialog = view.UNSAFE_getByProps({ tabIndex: -1 }).instance;
    dialog.focus = jest.fn();
    dialog.querySelectorAll = jest.fn(() => items);
    return view;
  };
  const tab = (shiftKey = false) => {
    const event = { key: "Tab", shiftKey, preventDefault: jest.fn() };
    dispatch("keydown", event);
    return event;
  };

  it("Tab from the last element moves focus to the first", () => {
    const first = focusable();
    const last = focusable();
    renderWithDialog([first, last]);
    (global as any).document.activeElement = last;

    const event = tab();

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(first.focus).toHaveBeenCalledTimes(1);
  });

  it("Shift+Tab from the first element moves focus to the last", () => {
    const first = focusable();
    const last = focusable();
    renderWithDialog([first, last]);
    (global as any).document.activeElement = first;

    const event = tab(true);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(last.focus).toHaveBeenCalledTimes(1);
  });

  it("only the top modal traps Tab when two are stacked", () => {
    const lowerFirst = focusable();
    const lowerLast = focusable();
    const topFirst = focusable();
    const topLast = focusable();
    renderWithDialog([lowerFirst, lowerLast]);
    renderWithDialog([topFirst, topLast]);
    (global as any).document.activeElement = topLast;

    const event = tab();

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(topFirst.focus).toHaveBeenCalledTimes(1);
    expect(lowerFirst.focus).not.toHaveBeenCalled();
    expect(lowerLast.focus).not.toHaveBeenCalled();
  });
});
