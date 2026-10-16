import { useEffect } from "react";
import { Platform } from "react-native";

interface UseKeyboardShortcutsProps {
  onToggleSidebar?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onToggleSidebar,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (Platform.OS !== "web" || !enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+B or Cmd+B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        onToggleSidebar?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onToggleSidebar, enabled]);
}
