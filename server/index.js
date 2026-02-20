require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const authRoutes = require("./routes/auth");

// Models (IMPORT ONLY ONCE)
const User = require("./models/User");
const TestAttempt = require("./models/TestAttempt");
const Question = require("./models/Question");
const Reminder = require("./models/Reminder");
const { getScheduleInfo, getWeekInfoForWeek, getWeekWindowForWeek } = require("./utils/schedule");
const { getScheduleConfig, loadScheduleConfig, saveScheduleConfig } = require("./utils/scheduleConfigStore");

const ALLOW_EARLY_TESTS = String(process.env.ALLOW_EARLY_TESTS || "").toLowerCase() === "true";

function withQuestionSequence(questions) {
  const totalsByWeek = {};
  questions.forEach((row) => {
    const week = Number(row.week) || 0;
    totalsByWeek[week] = (totalsByWeek[week] || 0) + 1;
  });

  const questionNoByWeek = {};
  return questions.map((row) => {
    const week = Number(row.week) || 0;
    questionNoByWeek[week] = (questionNoByWeek[week] || 0) + 1;
    const questionNumber = questionNoByWeek[week];
    const totalQuestionsInWeek = totalsByWeek[week] || 0;
    return {
      ...row.toObject(),
      questionNumber,
      totalQuestionsInWeek,
      questionCode: `W${week}-Q${questionNumber}`,
    };
  });
}

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middlewares
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


// ================= BASIC ROUTES =================

app.get("/", (req, res) => {
  res.send("Aptitude API is running");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Frontend connected successfully" });
});

app.get("/api/schedule", (req, res) => {
  try {
    res.json(getScheduleInfo());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

app.get("/api/admin/schedule-config", async (req, res) => {
  try {
    const config = getScheduleConfig();
    res.json(config);
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch schedule config" });
  }
});

app.post("/api/admin/reminders/send", async (req, res) => {
  try {
    const schedule = getScheduleInfo();
    const week = Number(req.body?.week || schedule.upcomingWeek || schedule.scheduledWeek || 1);
    const title = `Week ${week} Test Reminder`;
    const message = `Week ${week} test is scheduled on ${schedule.testDayLabel || "Saturday"} at ${schedule.windowStartTime || "7:00 AM"}. Please attempt on time.`;

    const reminder = await Reminder.create({
      week,
      title,
      message,
      active: true,
    });

    res.json({
      message: "Reminder sent successfully",
      reminder,
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to send reminder" });
  }
});

app.get("/api/student/reminders/latest", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("role");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.role !== "student") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const reminder = await Reminder.findOne({ active: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!reminder) {
      return res.json({ reminder: null });
    }

    res.json({ reminder });
  } catch (_err) {
    res.status(500).json({ error: "Failed to fetch reminder" });
  }
});

app.put("/api/admin/schedule-config", async (req, res) => {
  try {
    const {
      week1StartDate,
      testDayOfWeek,
      windowStartHour,
      windowStartMinute,
      windowEndHour,
      windowEndMinute,
    } = req.body || {};

    if (!week1StartDate || typeof week1StartDate !== "string") {
      return res.status(400).json({ error: "week1StartDate is required (YYYY-MM-DD)" });
    }

    const startHour = Number(windowStartHour);
    const startMinute = Number(windowStartMinute);
    const endHour = Number(windowEndHour);
    const endMinute = Number(windowEndMinute);
    const startTotal = (startHour * 60) + startMinute;
    const endTotal = (endHour * 60) + endMinute;
    const dayOfWeek = Number(testDayOfWeek);

    if (!Number.isFinite(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: "testDayOfWeek must be between 0 and 6" });
    }
    if (
      !Number.isFinite(startHour) ||
      !Number.isFinite(startMinute) ||
      !Number.isFinite(endHour) ||
      !Number.isFinite(endMinute)
    ) {
      return res.status(400).json({ error: "Window start/end time is invalid" });
    }
    if (startTotal >= endTotal) {
      return res.status(400).json({ error: "Window end time must be later than start time" });
    }

    const nextConfig = await saveScheduleConfig({
      week1StartDate,
      testDayOfWeek: dayOfWeek,
      windowStartHour: Number(windowStartHour),
      windowStartMinute: Number(windowStartMinute),
      windowEndHour: Number(windowEndHour),
      windowEndMinute: Number(windowEndMinute),
    });

    res.json({
      message: "Schedule config updated",
      config: nextConfig,
      schedule: getScheduleInfo(),
    });
  } catch (_err) {
    res.status(500).json({ error: "Failed to update schedule config" });
  }
});

// ================= PUBLIC STATS =================
app.get("/api/public/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTests = await TestAttempt.countDocuments();
    const uniqueStudentsAttempted = await TestAttempt.distinct("userEmail");
    const activeWeeks = await TestAttempt.distinct("week");
    const questionWeeks = await Question.distinct("week");
    const attempts = await TestAttempt.find();

    let totalScore = 0;
    let totalPossible = 0;
    attempts.forEach((a) => {
      totalScore += a.score || 0;
      totalPossible += a.totalQuestions || 0;
    });

    const averageScore =
      totalPossible === 0 ? 0 : Math.round((totalScore / totalPossible) * 100);
    const completionRate =
      totalUsers === 0
        ? 0
        : Math.min(
            100,
            Math.round((uniqueStudentsAttempted.length / totalUsers) * 100)
          );

    res.json({
      totalUsers,
      totalTests,
      activeWeeks: activeWeeks.length,
      testsDeployed: questionWeeks.length,
      averageScore,
      completionRate,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public stats" });
  }
});

// ================= TEST ATTEMPTS =================

app.post("/api/save-test", requireAuth, async (req, res) => {
  try {
    const { week, score, totalQuestions } = req.body;
    const user = await User.findById(req.user.id).select("email role");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.role !== "student") {
      return res.status(403).json({ error: "Only students can submit tests" });
    }
    const email = user.email;
    const weekNumber = Number(week);
    if (!Number.isFinite(weekNumber) || weekNumber < 1) {
      return res.status(400).json({ error: "Valid week is required" });
    }
    const weekInfo = getWeekInfoForWeek(weekNumber);
    const weekWindow = getWeekWindowForWeek(weekNumber);
    const scheduleInfo = getScheduleInfo();
    if (
      !ALLOW_EARLY_TESTS &&
      (!weekWindow.windowStart || !weekWindow.windowEnd || new Date() < weekWindow.windowStart || new Date() > weekWindow.windowEnd)
    ) {
      return res.status(403).json({
        error: `Test submissions are allowed only on ${weekInfo.weekStartDay} between ${scheduleInfo.windowStartTime} and ${scheduleInfo.windowEndTime}.`,
      });
    }
    const weekQuestionCount = await Question.countDocuments({ week: weekNumber });

    const existingAttempt = await TestAttempt.findOne({
      userEmail: email,
      week: weekNumber,
    }).sort({ createdAt: -1 });
    const existingCoveredQuestions = Number(existingAttempt?.totalQuestions || 0);
    if (existingAttempt && existingCoveredQuestions >= weekQuestionCount) {
      return res.status(409).json({ error: "Test already attempted" });
    }

    const attempt = new TestAttempt({
      userEmail: email,
      week: weekNumber,
      weekStartDate: weekInfo.weekStartDate,
      weekStartDay: weekInfo.weekStartDay,
      weekStartYear: weekInfo.weekStartYear,
      score,
      totalQuestions,
      answers: [],
    });

    await attempt.save();
    res.json({ message: "Test saved successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error saving test" });
  }
});

// Check if a student already attempted a week
app.get("/api/student/attempted", requireAuth, async (req, res) => {
  try {
    const { week } = req.query;
    if (!week) {
      return res.status(400).json({ error: "Week is required" });
    }
    const user = await User.findById(req.user.id).select("email role");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.role !== "student") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const existingAttempt = await TestAttempt.findOne({
      userEmail: user.email,
      week: Number(week),
    }).sort({ createdAt: -1 });
    if (!existingAttempt) {
      return res.json({ attempted: false, canRetry: false });
    }

    const weekQuestionCount = await Question.countDocuments({ week: Number(week) });
    const attemptedCount = Number(existingAttempt.totalQuestions || 0);
    const canRetry = weekQuestionCount > attemptedCount;
    const attempted = !canRetry;

    res.json({
      attempted,
      canRetry,
      attemptTotalQuestions: attemptedCount,
      availableQuestions: weekQuestionCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to check attempt status" });
  }
});

// Student attempts history
app.get("/api/student/attempts", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email role");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.role !== "student") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const attempts = await TestAttempt.find({ userEmail: user.email })
      .sort({ createdAt: -1 })
      .select(
        "week weekStartDate weekStartDay weekStartYear score totalQuestions createdAt"
      );

    res.json(
      attempts.map((row) => {
        const weekInfo = getWeekInfoForWeek(row.week);
        return {
          ...row.toObject(),
          weekStartDate: row.weekStartDate || weekInfo.weekStartDate,
          weekStartDay: row.weekStartDay || weekInfo.weekStartDay,
          weekStartYear: row.weekStartYear || weekInfo.weekStartYear,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
});

// Student: question history for attempted weeks
app.get("/api/student/questions-history", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email role");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.role !== "student") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const attempts = await TestAttempt.find({ userEmail: user.email })
      .select("week createdAt")
      .sort({ createdAt: 1 });

    const firstAttemptByWeek = {};
    attempts.forEach((row) => {
      const week = Number(row.week);
      if (!Number.isFinite(week) || week <= 0) return;
      if (!firstAttemptByWeek[week]) {
        firstAttemptByWeek[week] = row.createdAt;
      }
    });

    const weekFilters = Object.entries(firstAttemptByWeek).map(([week, attemptedAt]) => ({
      week: Number(week),
      createdAt: { $lte: attemptedAt },
    }));

    if (weekFilters.length === 0) {
      return res.json([]);
    }

    const questions = await Question.find({ $or: weekFilters }).sort({
      week: 1,
      createdAt: 1,
    });
    const withSequence = withQuestionSequence(questions).sort(
      (a, b) => b.week - a.week || a.questionNumber - b.questionNumber
    );

    res.json(
      withSequence.map((row) => {
        const weekInfo = getWeekInfoForWeek(row.week);
        return {
          ...row,
          weekStartDate: weekInfo.weekStartDate,
          weekStartDay: weekInfo.weekStartDay,
          weekStartYear: weekInfo.weekStartYear,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch question history" });
  }
});

// ================= QUESTIONS =================

// Add Question (Admin)
app.post("/api/questions", async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.json({ message: "Question added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add question" });
  }
});

// Get Questions by Week
app.get("/api/questions", async (req, res) => {
  try {
    const week = Number(req.query.week);
    const questions = await Question.find({ week });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Admin: get all questions or questions by week
app.get("/api/admin/questions", async (req, res) => {
  try {
    const week = Number(req.query.week);
    const filter =
      Number.isFinite(week) && week > 0
        ? { week }
        : {};

    const questions = await Question.find(filter).sort({ week: 1, createdAt: 1 });
    const withSequence = withQuestionSequence(questions).sort(
      (a, b) => a.week - b.week || a.questionNumber - b.questionNumber
    );
    res.json(withSequence);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Admin: update a question
app.put("/api/admin/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options, correctAnswer, explanation, week } = req.body;

    if (
      !question ||
      !Array.isArray(options) ||
      options.length !== 4 ||
      !options.every((value) => typeof value === "string" && value.trim().length > 0) ||
      !Number.isInteger(Number(correctAnswer)) ||
      Number(correctAnswer) < 0 ||
      Number(correctAnswer) > 3 ||
      !explanation ||
      !Number.isInteger(Number(week)) ||
      Number(week) < 1
    ) {
      return res.status(400).json({ error: "Invalid question payload" });
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      {
        question: question.trim(),
        options: options.map((value) => value.trim()),
        correctAnswer: Number(correctAnswer),
        explanation: explanation.trim(),
        week: Number(week),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question updated successfully", question: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Admin: delete a question
app.delete("/api/admin/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete question" });
  }
});

// ================= ADMIN DASHBOARD =================

// Stats
app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalAttempts = await TestAttempt.countDocuments();
    const attempts = await TestAttempt.find();

    let totalScore = 0;
    attempts.forEach((a) => (totalScore += a.score));

    const averageScore =
      totalAttempts === 0 ? 0 : (totalScore / totalAttempts).toFixed(2);

    res.json({
      totalAttempts,
      averageScore,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Weekly stats
app.get("/api/admin/weekly-stats", async (req, res) => {
  try {
    const data = await TestAttempt.aggregate([
      {
        $group: {
          _id: "$week",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      data.map((item) => {
        const weekInfo = getWeekInfoForWeek(item._id);
        return {
          ...item,
          weekStartDate: weekInfo.weekStartDate,
          weekStartDay: weekInfo.weekStartDay,
          weekStartYear: weekInfo.weekStartYear,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weekly stats" });
  }
});

// Leaderboard
app.get("/api/admin/leaderboard", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const data = await TestAttempt.aggregate([
      {
        $group: {
          _id: "$userEmail",
          bestScore: { $max: "$score" },
          attempts: { $sum: 1 },
          lastWeek: { $max: "$week" },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: limit },
    ]);

    res.json(
      data.map((entry, index) => {
        const weekInfo = getWeekInfoForWeek(entry.lastWeek);
        return {
          rank: index + 1,
          email: entry._id,
          bestScore: entry.bestScore,
          attempts: entry.attempts,
          week: entry.lastWeek,
          weekStartDate: weekInfo.weekStartDate,
          weekStartDay: weekInfo.weekStartDay,
          weekStartYear: weekInfo.weekStartYear,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Recent activity
app.get("/api/admin/activity", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const attempts = await TestAttempt.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(
      attempts.map((attempt) => {
        const weekInfo = getWeekInfoForWeek(attempt.week);
        return {
          id: attempt._id,
          email: attempt.userEmail,
          week: attempt.week,
          weekStartDate: attempt.weekStartDate || weekInfo.weekStartDate,
          weekStartDay: attempt.weekStartDay || weekInfo.weekStartDay,
          weekStartYear: attempt.weekStartYear || weekInfo.weekStartYear,
          score: attempt.score,
          time: attempt.createdAt,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// ================= REPORTS =================

// 1) Student-wise Attempt Report
app.get("/api/admin/reports/student-attempts", async (req, res) => {
  try {
    const attempts = await TestAttempt.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userEmail",
          foreignField: "email",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          studentName: "$user.name",
          email: "$userEmail",
          week: "$week",
          weekStartDate: "$weekStartDate",
          weekStartDay: "$weekStartDay",
          weekStartYear: "$weekStartYear",
          score: "$score",
          totalQuestions: "$totalQuestions",
          percentage: {
            $cond: [
              { $eq: ["$totalQuestions", 0] },
              0,
              {
                $round: [
                  { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] },
                  0,
                ],
              },
            ],
          },
          attemptedAt: "$createdAt",
        },
      },
    ]);

    res.json(
      attempts.map((attempt) => {
        const weekInfo = getWeekInfoForWeek(attempt.week);
        return {
          ...attempt,
          weekStartDate: attempt.weekStartDate || weekInfo.weekStartDate,
          weekStartDay: attempt.weekStartDay || weekInfo.weekStartDay,
          weekStartYear: attempt.weekStartYear || weekInfo.weekStartYear,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student attempts report" });
  }
});

// 2) Weekly Participation Report
app.get("/api/admin/reports/weekly-participation", async (req, res) => {
  try {
    const data = await TestAttempt.aggregate([
      {
        $group: {
          _id: "$week",
          totalAttempts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const withDelta = data.map((item, idx) => {
      const prev = idx === 0 ? 0 : data[idx - 1].totalAttempts;
      const weekInfo = getWeekInfoForWeek(item._id);
      return {
        week: item._id,
        weekStartDate: weekInfo.weekStartDate,
        weekStartDay: weekInfo.weekStartDay,
        weekStartYear: weekInfo.weekStartYear,
        totalAttempts: item.totalAttempts,
        delta: item.totalAttempts - prev,
      };
    });

    res.json(withDelta);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weekly participation report" });
  }
});

// 3) Performance Analysis Report
app.get("/api/admin/reports/performance", async (req, res) => {
  try {
    const data = await TestAttempt.aggregate([
      {
        $group: {
          _id: "$week",
          averageScore: { $avg: "$score" },
          highestScore: { $max: "$score" },
          lowestScore: { $min: "$score" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      data.map((item) => {
        const weekInfo = getWeekInfoForWeek(item._id);
        return {
          week: item._id,
          weekStartDate: weekInfo.weekStartDate,
          weekStartDay: weekInfo.weekStartDay,
          weekStartYear: weekInfo.weekStartYear,
          averageScore: Math.round(item.averageScore || 0),
          highestScore: item.highestScore || 0,
          lowestScore: item.lowestScore || 0,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch performance report" });
  }
});

// 4) Top Scorers Report (per week)
app.get("/api/admin/reports/top-scorers", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 3);
    const attempts = await TestAttempt.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userEmail",
          foreignField: "email",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          week: "$week",
          studentName: "$user.name",
          email: "$userEmail",
          score: "$score",
          createdAt: "$createdAt",
        },
      },
      { $sort: { week: 1, score: -1, createdAt: 1 } },
    ]);

    // Keep only one best entry per student per week.
    const byWeek = {};
    attempts.forEach((attempt) => {
      const week = Number(attempt.week);
      if (!Number.isFinite(week) || week < 1) return;
      if (!byWeek[week]) byWeek[week] = new Map();

      const emailKey = String(attempt.email || "").toLowerCase();
      if (!emailKey) return;

      const existing = byWeek[week].get(emailKey);
      if (!existing) {
        byWeek[week].set(emailKey, attempt);
        return;
      }

      const existingScore = Number(existing.score || 0);
      const nextScore = Number(attempt.score || 0);
      const existingTime = new Date(existing.createdAt).getTime();
      const nextTime = new Date(attempt.createdAt).getTime();
      if (nextScore > existingScore || (nextScore === existingScore && nextTime < existingTime)) {
        byWeek[week].set(emailKey, attempt);
      }
    });

    const result = Object.keys(byWeek)
      .sort((a, b) => Number(a) - Number(b))
      .flatMap((week) =>
        [...byWeek[week].values()]
          .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
          .slice(0, limit)
          .map((item, idx) => {
          const weekInfo = getWeekInfoForWeek(Number(week));
          return {
            week: Number(week),
            weekStartDate: weekInfo.weekStartDate,
            weekStartDay: weekInfo.weekStartDay,
            weekStartYear: weekInfo.weekStartYear,
            rank: idx + 1,
            studentName: item.studentName || "Unknown",
            email: item.email,
            score: item.score,
            createdAt: item.createdAt,
          };
          })
      );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top scorers report" });
  }
});

// 5) Unique Student Engagement Report
app.get("/api/admin/reports/engagement", async (req, res) => {
  try {
    const totalRegisteredStudents = await User.countDocuments();
    const uniqueStudentsAttempted = await TestAttempt.distinct("userEmail");
    const totalAttempts = await TestAttempt.countDocuments();

    res.json({
      totalRegisteredStudents,
      uniqueStudentsAttempted: uniqueStudentsAttempted.length,
      totalAttempts,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch engagement report" });
  }
});

// 6) Admin Activity & System Report
app.get("/api/admin/reports/system", async (req, res) => {
  try {
    const totalTestsConducted = await TestAttempt.distinct("week");
    const totalQuestionsAdded = await Question.countDocuments();
    const totalAttemptsRecorded = await TestAttempt.countDocuments();
    const timeline = await TestAttempt.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          attempts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalTestsConducted: totalTestsConducted.length,
      totalQuestionsAdded,
      totalAttemptsRecorded,
      timeline,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch system report" });
  }
});

// ================= STUDENT SUMMARY =================
app.get("/api/student/summary", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email role");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.role !== "student") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const attempts = await TestAttempt.find({ userEmail: user.email });
    const questionWeeks = await Question.distinct("week");

    let bestScore = 0;
    let totalScore = 0;
    let totalPossible = 0;
    let lastWeek = 0;

    attempts.forEach((a) => {
      bestScore = Math.max(bestScore, a.score || 0);
      totalScore += a.score || 0;
      totalPossible += a.totalQuestions || 0;
      lastWeek = Math.max(lastWeek, a.week || 0);
    });

    const averageScore =
      totalPossible === 0 ? 0 : Math.round((totalScore / totalPossible) * 100);
    const schedule = getScheduleInfo();
    const publishedWeeks = questionWeeks
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    const highestPublishedWeek =
      publishedWeeks.length === 0 ? 0 : Math.max(...publishedWeeks);
    const scheduledWeek = schedule.scheduledWeek || 0;
    const currentWeek =
      highestPublishedWeek === 0
        ? 0
        : ALLOW_EARLY_TESTS
          ? Math.min(Math.max(scheduledWeek, 1), highestPublishedWeek)
          : schedule.isWindowOpen
            ? Math.min(scheduledWeek, highestPublishedWeek)
            : 0;
    const currentWeekInfo = getWeekInfoForWeek(currentWeek);
    const attemptedWeekCount = new Set(
      attempts.map((row) => Number(row.week)).filter((value) => Number.isFinite(value) && value > 0)
    ).size;
    const completionRate =
      highestPublishedWeek === 0
        ? 0
        : Math.round((attemptedWeekCount / highestPublishedWeek) * 100);

    res.json({
      currentWeek,
      scheduledWeek,
      weekStartDate: currentWeek ? currentWeekInfo.weekStartDate : null,
      weekStartDay: currentWeek ? currentWeekInfo.weekStartDay : null,
      weekStartYear: currentWeek ? currentWeekInfo.weekStartYear : null,
      schedule,
      bestScore,
      completionRate,
      attempts: attempts.length,
      lastWeek,
      averageScore,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student summary" });
  }
});

// ================= GOOGLE AUTH =================

app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        role: email.endsWith("@agmrcet.edu.in") ? "admin" : "student",
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: jwtToken,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// ================= DB + SERVER =================

const PORT = 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    await loadScheduleConfig();
    console.log("MongoDB connected");
  })
  .catch((err) => console.error(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
