const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

/* =========================================
   ADD NEW MEAL
========================================= */

router.post("/", async (req, res) => {
  try {
    const {
      chef_id,
      chef_name,
      chef_location,
      chef_phone,
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

    // Basic validation
    if (
      !chef_name ||
      !title ||
      !price
    ) {
      return res.status(400).json({
        error: "Required fields missing",
      });
    }

    const { data, error } = await supabase
      .from("meals")
      .insert([
        {
          chef_id,
          chef_name,
          chef_location,
          chef_phone,
          title,
          description,
          ingredients,
          allergen_notes,
          price,
          category,
          is_veg,
          pickup_time,
          image_url,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.status(201).json({
      message: "Meal added successfully",
      meal: data,
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* =========================================
   GET ALL MEALS
========================================= */

router.get("/", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;