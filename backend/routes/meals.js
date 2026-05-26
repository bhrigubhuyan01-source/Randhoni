const express = require("express");
const supabase = require("../config/supabase");
const { protect, chefOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================================
   ADD NEW MEAL
   Protected: must be logged in as a chef
========================================= */

router.post("/", protect, chefOnly, async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      allergen_notes,
      price,
      category,
      is_veg,
      pickup_time,
      image_url,
    } = req.body;

    // chef_id comes from verified token — NOT from request body
    const chef_id = req.user.id;

    // --- Input Validation ---
    if (!title || !price || !pickup_time) {
      return res.status(400).json({
        error: "Title, price, and pickup_time are required.",
      });
    }

    if (isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({
        error: "Price must be a positive number.",
      });
    }

    // --- Fetch Chef Profile (single query — name, location, phone) ---
    const { data: chefData, error: chefError } = await supabase
      .from("users")
      .select("name, location, phone")
      .eq("id", chef_id)
      .single();

    if (chefError || !chefData) {
      return res.status(404).json({
        error: "Chef profile not found.",
      });
    }

    // --- Insert Meal ---
    const { data, error } = await supabase
      .from("meals")
      .insert([
        {
          chef_id,
          chef_name: chefData.name,
          chef_location: chefData.location,
          chef_phone: chefData.phone,
          title,
          description: description || null,
          ingredients: ingredients || null,
          allergen_notes: allergen_notes || null,
          price: Number(price),
          category: category || null,
          is_veg: is_veg ?? false,
          pickup_time,
          image_url: image_url || null,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.status(201).json({
      message: "Meal listed successfully.",
      meal: data[0],
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

/* =========================================
   GET ALL MEALS
   Public — no auth required
   Optional filters: ?category=thali&is_veg=true&search=momos
========================================= */

router.get("/", async (req, res) => {
  try {
    const { category, is_veg, search } = req.query;

    let query = supabase
      .from("meals")
      .select("*")
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (is_veg !== undefined) {
      query = query.eq("is_veg", is_veg === "true");
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.status(200).json({
      count: data.length,
      meals: data,
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

/* =========================================
   GET SINGLE MEAL BY ID
   Public — no auth required
========================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: "Meal not found.",
      });
    }

    res.status(200).json({ meal: data });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

/* =========================================
   GET MY MEALS (chef's own listings)
   Protected: must be logged in as a chef
========================================= */

router.get("/my/listings", protect, chefOnly, async (req, res) => {
  try {
    const chef_id = req.user.id;

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("chef_id", chef_id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.status(200).json({
      count: data.length,
      meals: data,
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

/* =========================================
   UPDATE A MEAL
   Protected: must be the chef who owns it
========================================= */

router.patch("/:id", protect, chefOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const chef_id = req.user.id;

    // Check ownership
    const { data: existing, error: findError } = await supabase
      .from("meals")
      .select("chef_id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: "Meal not found." });
    }

    if (existing.chef_id !== chef_id) {
      return res.status(403).json({
        error: "You can only edit your own meals.",
      });
    }

    const {
      title,
      description,
      ingredients,
      allergen_notes,
      price,
      category,
      is_veg,
      pickup_time,
      image_url,
    } = req.body;

    const { data, error } = await supabase
      .from("meals")
      .update({
        title,
        description,
        ingredients,
        allergen_notes,
        price: price ? Number(price) : undefined,
        category,
        is_veg,
        pickup_time,
        image_url,
      })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({
      message: "Meal updated successfully.",
      meal: data[0],
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

/* =========================================
   DELETE A MEAL
   Protected: must be the chef who owns it
========================================= */

router.delete("/:id", protect, chefOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const chef_id = req.user.id;

    // Check ownership
    const { data: existing, error: findError } = await supabase
      .from("meals")
      .select("chef_id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: "Meal not found." });
    }

    if (existing.chef_id !== chef_id) {
      return res.status(403).json({
        error: "You can only delete your own meals.",
      });
    }

    const { error } = await supabase
      .from("meals")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({
      message: "Meal deleted successfully.",
    });

  } catch (err) {
    res.status(500).json({
      error: "Server error: " + err.message,
    });
  }
});

module.exports = router;
