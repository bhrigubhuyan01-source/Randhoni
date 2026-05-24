const express = require("express");
const bcrypt = require("bcrypt");
const supabase = require("../config/supabase");

const router = express.Router();

// REGISTER API
// LOGIN API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check missing fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    // Find user
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    if (!users || users.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const user = users[0];

    // Compare password
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid password",
      });
    }

    // Generate JWT token
    const jwt = require("jsonwebtoken");

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  location: user.location,
},
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
router.post("/register", async (req, res) => {
  try {
    const {
  name,
  email,
  password,
  role,
  phone,
  location
} = req.body;

    // Check missing fields
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          
  name,
  email,
  password: hashedPassword,
  role: role || "customer",
  phone,
  location,
},
        
      ])
      .select();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      user: data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;