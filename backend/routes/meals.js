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
      !chef_id ||
      !title ||
      !price
    ) {
      return res.status(400).json({
        error: "Required fields missing",
      });
    }
const { data: chefData, error: chefError } = await supabase
  .from("users")
  .select("name, location, phone")
  .eq("id", chef_id)
  .single();

if (chefError || !chefData) {
  return res.status(404).json({
    error: "Chef not found",
  });
}
const { data: userData, error: userError } = await supabase
  .from("users")
  .select("role")
  .eq("id", chef_id)
  .single();

if (userError || userData.role !== "chef") {
  return res.status(403).json({
    error: "Only chefs can add meals",
  });
}
    const { data, error } = await supabase
      .from("meals")
      .insert([
        {
          chef_id,
          chef_name: chefData.name,
chef_location: chefData.location,
chef_phone: chefData.phone,
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