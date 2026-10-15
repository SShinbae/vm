import { goBack } from "@/lib/utils/goBack";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { toast } from "@/hooks/useToast";
import { ApiResponse, LogWithVehicle } from "@/types";

type LogRecord = {
  id: string;
  vehicle_id: string | null;
  source?: string | null;
};

export function useLogRecord<T extends LogRecord>(
  id: string,
  kind: "mileage" | "fuel" | "service",
  load: (id: string) => Promise<ApiResponse<LogWithVehicle<T>>>,
) {
  const userId = useAuth().user?.id;
  const layout = useResponsiveLayout();
  const desktop = useRef(layout.isWeb && !layout.isMobile);
  desktop.current = layout.isWeb && !layout.isMobile;
  const [record, setRecord] = useState<LogWithVehicle<T> | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setRecord(null);
      setLoading(true);
      setError(null);
      void (async () => {
        try {
          if (!id) throw new Error("Invalid log ID");
          if (!userId) throw new Error("User not authenticated");
          const result = await load(id);
          if (!active) return;
          if (result.error || !result.data)
            throw new Error(result.error || "Log not found");
          setLoadedUserId(userId);
          setRecord(result.data);
        } catch (reason) {
          if (!active) return;
          const message =
            reason instanceof Error ? reason.message : "Failed to load log";
          setError(message);
          if (!desktop.current) {
            toast.error(message);
            goBack("/logs");
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
      // A retry restarts the same focused request.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, userId, load, attempt]),
  );
  const current = record?.id === id && loadedUserId === userId ? record : null;
  const readOnly = kind === "mileage" && current?.source === "fuel_log";
  // The direct loaders authenticate and verify access before returning a record.
  const canModify = !!userId && !!current && !loading && !error && !readOnly;
  const canDelete =
    canModify && (kind !== "service" || current?.vehicles?.user_id === userId);
  return {
    record: current,
    loading,
    error,
    readOnly,
    canModify,
    canDelete,
    retry: () => setAttempt((value) => value + 1),
  };
}
