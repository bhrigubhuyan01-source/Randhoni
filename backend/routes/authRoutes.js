const express = require("express");
const supabase = require("../config/supabase");

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

    // Create auth user
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

    // Insert profile into users table
    const { error: profileError } = await supabase
      .from("users")
      .insert([
        {
          id: authUser.id,
          name,
          email,
          role: role || "customer",
          phone,
          location,
        },
      ]);

    if (profileError) {
      return res.status(500).json({
        error: profileError.message,
      });
    }

    res.status(201).json({
      message: "Registration successful",
      user: authUser,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================================
   LOGIN
========================================= */

router.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return res.status(401).json({
        error: error.message,
      });
    }

    // Fetch profile data
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    res.status(200).json({
      message: "Login successful",
      session: data.session,
      user: profile,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;