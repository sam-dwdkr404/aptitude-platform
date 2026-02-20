export function getWeekStartDateFromWeek(week1StartDate, week, testDayOfWeek) {
  const weekNumber = Number(week);
  if (!week1StartDate || !Number.isFinite(weekNumber) || weekNumber < 1) {
    return null;
  }

  const [y, m, d] = String(week1StartDate).split("-").map(Number);
  if (!y || !m || !d) return null;

  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + (weekNumber - 1) * 7);

  if (Number.isFinite(Number(testDayOfWeek))) {
    const targetDay = Number(testDayOfWeek);
    const shift = (targetDay - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + shift);
  }

  return date;
}

export function formatWeekDate(week1StartDate, week, testDayOfWeek) {
  const date = getWeekStartDateFromWeek(week1StartDate, week, testDayOfWeek);
  if (!date) return "-";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatWeekSlot(week1StartDate, week, slotTime = "7:00 AM", testDayOfWeek) {
  const dateLabel = formatWeekDate(week1StartDate, week, testDayOfWeek);
  if (dateLabel === "-") return "-";
  return `${dateLabel} at ${slotTime} (local time)`;
}
