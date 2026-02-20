const mongoose = require("mongoose");

const scheduleConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main",
    },
    week1StartDate: {
      type: String,
      required: true,
    },
    testDayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    windowStartHour: {
      type: Number,
      min: 0,
      max: 23,
      required: true,
    },
    windowStartMinute: {
      type: Number,
      min: 0,
      max: 59,
      required: true,
    },
    windowEndHour: {
      type: Number,
      min: 0,
      max: 23,
      required: true,
    },
    windowEndMinute: {
      type: Number,
      min: 0,
      max: 59,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScheduleConfig", scheduleConfigSchema);
