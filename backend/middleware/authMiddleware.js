const supabase = require("../config/supabase");

/* =========================================
   PROTECT MIDDLEWARE
   Verifies the Bearer token from Supabase.
   Attaches req.user to the request object.
========================================= */

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired token. Please log in again.",
      });
    }

    req.user = data.user; // e.g. req.user.id, req.user.email
    next();

  } catch (err) {
    res.status(500).json({
      error: "Authentication error: " + err.message,
    });
  }
};

/* =========================================
   CHEF ONLY MIDDLEWARE
   Must be used AFTER protect middleware.
   Checks that the logged-in user has role = "chef".
========================================= */

const chefOnly = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: "User profile not found.",
      });
    }

    if (profile.role !== "chef") {
      return res.status(403).json({
        error: "Access denied. Only chefs can perform this action.",
      });
    }

    next();

  } catch (err) {
    res.status(500).json({
      error: "Authorization error: " + err.message,
    });
  }
};

module.exports = { protect, chefOnly };
