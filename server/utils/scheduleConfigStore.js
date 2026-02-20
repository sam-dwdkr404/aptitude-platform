const ScheduleConfig = require("../models/ScheduleConfig");

const DEFAULT_WEEK1_START_DATE = "2026-02-21";
const DEFAULT_TEST_DAY_OF_WEEK = 6; // Saturday

function toInt(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? Math.floor(next) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseStartDate(raw) {
  if (!raw || typeof raw !== "string") return null;
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m || !d) return null;
  const parsed = new Date(y, m - 1, d);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toIsoDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function alignDateToDay(date, dayOfWeek) {
  const aligned = new Date(date);
  const delta = (dayOfWeek - aligned.getDay() + 7) % 7;
  aligned.setDate(aligned.getDate() + delta);
  return aligned;
}

function getDefaultConfig() {
  const envDate =
    parseStartDate(process.env.WEEK1_START_DATE) ||
    parseStartDate(DEFAULT_WEEK1_START_DATE);
  const envDay = clamp(
    toInt(process.env.TEST_DAY_OF_WEEK, DEFAULT_TEST_DAY_OF_WEEK),
    0,
    6
  );
  const alignedDate = alignDateToDay(envDate, envDay);

  return {
    week1StartDate: toIsoDateLocal(alignedDate),
    testDayOfWeek: envDay,
    windowStartHour: clamp(
      toInt(process.env.TEST_WINDOW_START_HOUR, 7),
      0,
      23
    ),
    windowStartMinute: clamp(
      toInt(process.env.TEST_WINDOW_START_MINUTE, 0),
      0,
      59
    ),
    windowEndHour: clamp(toInt(process.env.TEST_WINDOW_END_HOUR, 23), 0, 23),
    windowEndMinute: clamp(
      toInt(process.env.TEST_WINDOW_END_MINUTE, 59),
      0,
      59
    ),
  };
}

function sanitizeConfig(input, fallback = getDefaultConfig()) {
  const base = {
    ...fallback,
    ...(input || {}),
  };

  const day = clamp(toInt(base.testDayOfWeek, fallback.testDayOfWeek), 0, 6);
  const rawDate = parseStartDate(base.week1StartDate) || parseStartDate(fallback.week1StartDate);
  const week1StartDate = toIsoDateLocal(alignDateToDay(rawDate, day));

  return {
    week1StartDate,
    testDayOfWeek: day,
    windowStartHour: clamp(toInt(base.windowStartHour, fallback.windowStartHour), 0, 23),
    windowStartMinute: clamp(toInt(base.windowStartMinute, fallback.windowStartMinute), 0, 59),
    windowEndHour: clamp(toInt(base.windowEndHour, fallback.windowEndHour), 0, 23),
    windowEndMinute: clamp(toInt(base.windowEndMinute, fallback.windowEndMinute), 0, 59),
  };
}

let runtimeConfig = getDefaultConfig();

function getScheduleConfig() {
  return { ...runtimeConfig };
}

async function loadScheduleConfig() {
  const row = await ScheduleConfig.findOne({ key: "main" }).lean();
  runtimeConfig = row ? sanitizeConfig(row, runtimeConfig) : runtimeConfig;
  return getScheduleConfig();
}

async function saveScheduleConfig(input) {
  const next = sanitizeConfig(input, runtimeConfig);
  await ScheduleConfig.findOneAndUpdate(
    { key: "main" },
    { $set: { key: "main", ...next } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  runtimeConfig = next;
  return getScheduleConfig();
}

module.exports = {
  getScheduleConfig,
  loadScheduleConfig,
  saveScheduleConfig,
  sanitizeConfig,
};
