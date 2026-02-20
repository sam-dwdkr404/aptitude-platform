const mongoose = require("mongoose");

const testAttemptSchema = new mongoose.Schema(
  {
    userEmail: String,
    week: Number,
    weekStartDate: String,
    weekStartDay: String,
    weekStartYear: Number,
    score: Number,
    totalQuestions: Number,
    answers: [Number],
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestAttempt", testAttemptSchema);
