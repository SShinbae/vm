export type ReminderVehicle = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  current_mileage: number | null;
};

export type ReminderLog = {
  id: string;
  vehicle_id: string;
  service_type: string;
  date: string;
  created_at?: string | null;
  next_service_due: string | null;
  next_service_mileage: number | null;
};

export type ServiceReminder = {
  logId: string;
  vehicleName: string;
  serviceType: string;
  dueDate: string | null;
  dueMileage: number | null;
  daysUntilDue: number | null;
  kmUntilDue: number | null;
  status: "overdue" | "due_soon";
};

export function selectServiceReminders(
  logs: ReminderLog[],
  vehicles: ReminderVehicle[],
  today: Date = new Date(),
): ServiceReminder[] {
  const vehiclesById = new Map(
    vehicles.map((vehicle) => [vehicle.id, vehicle]),
  );
  const seen = new Set<string>();
  const todayDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const reminders: ServiceReminder[] = [];

  for (const log of [...logs].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.created_at || "").localeCompare(a.created_at || ""),
  )) {
    const vehicle = vehiclesById.get(log.vehicle_id);
    if (!vehicle) continue;

    const key = `${log.vehicle_id}:${log.service_type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const [year, month, day] =
      log.next_service_due?.split("-").map(Number) || [];
    const dueDay = year && month && day ? Date.UTC(year, month - 1, day) : NaN;
    const daysUntilDue = Number.isFinite(dueDay)
      ? Math.round((dueDay - todayDay) / 86_400_000)
      : null;
    const kmUntilDue =
      log.next_service_mileage == null || vehicle.current_mileage == null
        ? null
        : log.next_service_mileage - vehicle.current_mileage;

    if (
      (daysUntilDue == null || daysUntilDue > 30) &&
      (kmUntilDue == null || kmUntilDue > 1000)
    )
      continue;

    reminders.push({
      logId: log.id,
      vehicleName:
        [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
        "Vehicle",
      serviceType: log.service_type,
      dueDate: log.next_service_due,
      dueMileage: log.next_service_mileage,
      daysUntilDue,
      kmUntilDue,
      status:
        (daysUntilDue != null && daysUntilDue < 0) ||
        (kmUntilDue != null && kmUntilDue < 0)
          ? "overdue"
          : "due_soon",
    });
  }

  const urgency = (reminder: ServiceReminder) =>
    Math.min(
      reminder.daysUntilDue == null ? Infinity : reminder.daysUntilDue / 30,
      reminder.kmUntilDue == null ? Infinity : reminder.kmUntilDue / 1000,
    );
  return reminders.sort(
    (a, b) =>
      (a.status === "overdue" ? 0 : 1) - (b.status === "overdue" ? 0 : 1) ||
      urgency(a) - urgency(b),
  );
}
