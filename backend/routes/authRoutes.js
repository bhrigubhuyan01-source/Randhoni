const express = require("express");
const supabase = require("../config/supabase");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================================
   REGISTER
========================================= */

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      location,
    } = req.body;

    // --- Input Validation ---
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        error: "Name, email, password, and phone are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    const allowedRoles = ["customer", "chef"];
    const userRole = role && allowedRoles.includes(role) ? role : "customer";

    // --- Create Supabase Auth User ---
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    const authUser = data.user;

    // --- Insert Profile into users table ---
    const { error: profileError } = await supabase
      .from("users")
      .insert([
        {
          id: authUser.id,
          name,
          email,
          role: userRole,
          phone,
          location: location || null,
        },
      ]);

    if (profileError) {
      return res.status(500).json({
        error: profileError.message,
      });
    }

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      user: {
        id: authUser.id,
        email: authUser.email,
        role: userRole,
      },
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

/* =========================================
   LOGIN
========================================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Input Validation ---
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    // --- Sign In via Supabase ---
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    // --- Fetch Profile ---
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({
        error: "Could not fetch user profile.",
      });
    }

    res.status(200).json({
      message: "Login successful.",
      session: data.session, // contains access_token for future requests
      user: profile,
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

/* =========================================
   GET LOGGED-IN USER PROFILE
   Protected — requires Bearer token
========================================= */

router.get("/me", protect, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: "Profile not found.",
      });
    }

    res.status(200).json({ user: profile });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

/* =========================================
   LOGOUT
   Protected — requires Bearer token
========================================= */

router.post("/logout", protect, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(500).json({
        error: "Logout failed: " + error.message,
      });
    }

    res.status(200).json({ message: "Logged out successfully." });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

module.exports = router;
