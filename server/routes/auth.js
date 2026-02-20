const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* ================= SIGNUP ================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: email.endsWith("@agmrcet.edu.in") ? "admin" : "student",
    });

    res.status(201).json({
      message: "User created successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({ message: "Password login unavailable for this account" });
    }

    const isHashed = user.password.startsWith("$2a$") ||
      user.password.startsWith("$2b$") ||
      user.password.startsWith("$2y$");
    const isMatch = isHashed
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (isMatch && !isHashed) {
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    }
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.role !== "admin" && email.endsWith("@agmrcet.edu.in")) {
      user.role = "admin";
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
