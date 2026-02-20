const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
    week: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
