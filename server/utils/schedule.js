const MS_PER_DAY = 24 * 60 * 60 * 1000;
const { getScheduleConfig } = require("./scheduleConfigStore");

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function toDateOnly(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIsoDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function formatTimeLabel(hour, minute) {
  const probe = new Date(2026, 0, 1, hour, minute, 0, 0);
  return probe.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getWeek1StartDate() {
  const config = getScheduleConfig();
  const [y, m, d] = String(config.week1StartDate).split("-").map(Number);
  return toDateOnly(new Date(y, m - 1, d));
}

function getWeekInfoForWeek(weekNumber) {
  const week = Number(weekNumber);
  if (!Number.isFinite(week) || week < 1) {
    return {
      week: 0,
      weekStartDate: null,
      weekStartDay: null,
      weekStartYear: null,
      weekDisplay: "Week 0",
    };
  }

  const week1 = getWeek1StartDate();
  const weekDate = new Date(week1);
  weekDate.setDate(weekDate.getDate() + (week - 1) * 7);

  const weekStartDate = toIsoDateLocal(weekDate);
  const weekStartDay = weekDate.toLocaleDateString("en-US", { weekday: "long" });
  const weekStartYear = weekDate.getFullYear();

  return {
    week,
    weekStartDate,
    weekStartDay,
    weekStartYear,
    weekDisplay: `Week ${week} - ${weekStartDay}, ${weekStartDate}`,
  };
}

function getWeekWindowForWeek(weekNumber) {
  const config = getScheduleConfig();
  const weekInfo = getWeekInfoForWeek(weekNumber);
  if (!weekInfo.week) {
    return {
      ...weekInfo,
      windowStart: null,
      windowEnd: null,
      windowStartDateTime: null,
      windowEndDateTime: null,
    };
  }

  const [y, m, d] = String(weekInfo.weekStartDate).split("-").map(Number);
  const baseDate = new Date(y, m - 1, d);
  const dayShift = (Number(config.testDayOfWeek) - baseDate.getDay() + 7) % 7;
  baseDate.setDate(baseDate.getDate() + dayShift);

  const windowStart = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    Number(config.windowStartHour),
    Number(config.windowStartMinute),
    0,
    0
  );
  const windowEnd = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    Number(config.windowEndHour),
    Number(config.windowEndMinute),
    59,
    999
  );

  return {
    ...weekInfo,
    weekStartDate: toIsoDateLocal(baseDate),
    weekStartDay: baseDate.toLocaleDateString("en-US", { weekday: "long" }),
    weekStartYear: baseDate.getFullYear(),
    windowStart,
    windowEnd,
    windowStartDateTime: toIsoDateTimeLocal(windowStart),
    windowEndDateTime: toIsoDateTimeLocal(windowEnd),
  };
}

function getScheduleInfo(now = new Date()) {
  const config = getScheduleConfig();
  const nowDate = new Date(now);
  const today = toDateOnly(nowDate);
  const week1 = getWeek1StartDate();
  const diffDays = Math.floor((today - week1) / MS_PER_DAY);

  if (diffDays < 0) {
    const week1Window = getWeekWindowForWeek(1);
    const daysUntilStart = Math.ceil((week1Window.windowStart - nowDate) / MS_PER_DAY);
    return {
      hasStarted: false,
      isWindowOpen: false,
      windowStatus: "not_started",
      todayDate: toIsoDateLocal(today),
      todayDay: today.toLocaleDateString("en-US", { weekday: "long" }),
      week1StartDate: toIsoDateLocal(week1),
      week1StartDay: week1.toLocaleDateString("en-US", { weekday: "long" }),
      scheduledWeek: 0,
      activeWeek: 0,
      upcomingWeek: 1,
      daysUntilStart,
      activeWeekDate: null,
      nextWeekDate: toIsoDateLocal(week1),
      nextWindowStartDateTime: week1Window.windowStartDateTime,
      windowStartTime: formatTimeLabel(
        Number(config.windowStartHour),
        Number(config.windowStartMinute)
      ),
      windowEndTime: formatTimeLabel(
        Number(config.windowEndHour),
        Number(config.windowEndMinute)
      ),
      testDayOfWeek: Number(config.testDayOfWeek),
      testDayLabel: DAY_NAMES[Number(config.testDayOfWeek)] || "Saturday",
      windowStartHour: Number(config.windowStartHour),
      windowStartMinute: Number(config.windowStartMinute),
      windowEndHour: Number(config.windowEndHour),
      windowEndMinute: Number(config.windowEndMinute),
    };
  }

  const completedWeekCycles = Math.floor(diffDays / 7);
  const scheduledWeek = completedWeekCycles + 1;
  const scheduledWindow = getWeekWindowForWeek(scheduledWeek);
  const nextWeekNumber = scheduledWeek + 1;
  const nextWeek = getWeekWindowForWeek(nextWeekNumber);

  const isBeforeWindowStart = nowDate < scheduledWindow.windowStart;
  const isAfterWindowEnd = nowDate > scheduledWindow.windowEnd;
  const isWindowOpen = !isBeforeWindowStart && !isAfterWindowEnd;

  let windowStatus = "closed";
  if (isWindowOpen) {
    windowStatus = "live";
  } else if (isBeforeWindowStart) {
    windowStatus = "pre_window";
  }

  const upcomingWeek = isBeforeWindowStart ? scheduledWeek : nextWeekNumber;
  const upcomingWindow = getWeekWindowForWeek(upcomingWeek);
  const daysUntilStart = Math.max(
    0,
    Math.ceil((upcomingWindow.windowStart - nowDate) / MS_PER_DAY)
  );

  return {
    hasStarted: true,
    isWindowOpen,
    windowStatus,
    todayDate: toIsoDateLocal(today),
    todayDay: today.toLocaleDateString("en-US", { weekday: "long" }),
    week1StartDate: toIsoDateLocal(week1),
    week1StartDay: week1.toLocaleDateString("en-US", { weekday: "long" }),
    scheduledWeek,
    activeWeek: isWindowOpen ? scheduledWeek : 0,
    upcomingWeek,
    daysUntilStart,
    activeWeekDate: isWindowOpen ? scheduledWindow.weekStartDate : null,
    nextWeekDate: upcomingWindow.weekStartDate,
    activeWindowStartDateTime: isWindowOpen ? scheduledWindow.windowStartDateTime : null,
    activeWindowEndDateTime: isWindowOpen ? scheduledWindow.windowEndDateTime : null,
    nextWindowStartDateTime: upcomingWindow.windowStartDateTime,
    windowStartTime: formatTimeLabel(
      Number(config.windowStartHour),
      Number(config.windowStartMinute)
    ),
    windowEndTime: formatTimeLabel(
      Number(config.windowEndHour),
      Number(config.windowEndMinute)
    ),
    testDayOfWeek: Number(config.testDayOfWeek),
    testDayLabel: DAY_NAMES[Number(config.testDayOfWeek)] || "Saturday",
    windowStartHour: Number(config.windowStartHour),
    windowStartMinute: Number(config.windowStartMinute),
    windowEndHour: Number(config.windowEndHour),
    windowEndMinute: Number(config.windowEndMinute),
  };
}

module.exports = {
  getWeek1StartDate,
  getWeekInfoForWeek,
  getWeekWindowForWeek,
  getScheduleInfo,
};
