// Randhoni Application State Engine
// Backed by LocalStorage for robust, production-ready demonstration
import { supabase } from "../../config/supabase.js";
import ASSAM_LOCATIONS from "../../data/assamlocations.js";
const PLATFORM_DOMAIN = "randhoni.in";
const API_BASE_URL = "https://randhoni.onrender.com/api/auth";
const CURRENCY_SYMBOL = "\u20b9";
const registerCity =
  document.getElementById("registerCity");

const registerArea =
  document.getElementById("registerArea");
  if (registerCity && registerArea) {

  Object.keys(ASSAM_LOCATIONS).forEach((city) => {

    const option =
      document.createElement("option");

    option.value = city;
    option.textContent = city;

    registerCity.appendChild(option);
  });

  registerCity.addEventListener("change", () => {

    const selectedCity =
      registerCity.value;

    registerArea.innerHTML =
`
<option value="">Choose Area</option>
<option value="other">
  Other / Type Your Area
</option>
`;

    if (!selectedCity) return;

    ASSAM_LOCATIONS[selectedCity].forEach((area) => {

      const option =
        document.createElement("option");

      option.value = area;
      option.textContent = area;

      registerArea.appendChild(option);
    });
  });
}
if (registerArea) {
  registerArea.addEventListener("change", () => {

  const customAreaInput =
    document.getElementById("customArea");

  if (!customAreaInput) return;

  if (registerArea.value === "other") {

    customAreaInput.style.display = "block";

  } else {

    customAreaInput.style.display = "none";
    customAreaInput.value = "";

  }
});
}

function formatCurrency(amount) {
  return `${CURRENCY_SYMBOL}${amount}`;
}



// Presets for Cook Add Product images
const IMAGE_PRESETS = [
  {
    name: "Thali / Rice Meals",
    url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Momos / Dumplings",
    url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Curries / Meat Dishes",
    url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Samosa / Fried Snacks",
    url: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Deserts / Sweet treats",
    url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop",
  },
];

// Main App State
const state = {
  meals: [],
  cart: [],
  currentUser: null,
  activeFilter: "all",
  searchQuery: "",
  activeCookTab: "dishes",
};
async function fetchMeals() {

  try {

    const response = await fetch(
      "https://randhoni.onrender.com/api/meals"
    );

    const data = await response.json();

    state.meals = data.map((meal) => ({
      id: meal.id,

      name: meal.title,

      cook: meal.chef_name,

      cookPhone: meal.chef_phone,

      cookLocation: meal.chef_location,

      price: meal.price,

      category: meal.category,

      isVeg: meal.is_veg,

      itemDescription:
        meal.description,

      ingredients:
        meal.ingredients,

      allergenNotes:
        meal.allergen_notes,

      pickupTime:
        meal.pickup_time,

      rating:
        meal.rating || 5,

      image:
        meal.image_url,

      reviews: [],
    }));

    renderCatalog();

    if (state.currentUser) {
      renderCookDishes();
    }

  } catch (error) {

    console.error(
      "Failed to fetch meals",
      error
    );
  }
}

// Initialize State from LocalStorage or seed defaults
function initStorage() {
  

  const storedCart = localStorage.getItem("randhoni_cart");
  if (storedCart) {
    state.cart = JSON.parse(storedCart);
  }

  const storedUser = localStorage.getItem("randhoni_user");
  if (storedUser) {
    state.currentUser = JSON.parse(storedUser);
  }
}

// Save specific parts of state


function saveCart() {
  localStorage.setItem("randhoni_cart", JSON.stringify(state.cart));
}

function saveUser(user) {
  state.currentUser = user;
  if (user) {
    localStorage.setItem("randhoni_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("randhoni_user");
  }
  updateAuthUI();
}

// Toast System
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-xmark";
  if (type === "warning") icon = "fa-triangle-exclamation";
  if (type === "info") icon = "fa-circle-info";

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3200);
}

// Render Listings catalog
function renderCatalog() {
  const catalogGrid = document.getElementById("listingsCatalog");
  if (!catalogGrid) return;

  catalogGrid.innerHTML = "";

  const filteredMeals = state.meals.filter((meal) => {
    // Category filter
    const matchesFilter =
      state.activeFilter === "all" ||
      (state.activeFilter === "veg" && meal.isVeg) ||
      (state.activeFilter === "non-veg" && !meal.isVeg) ||
      meal.category === state.activeFilter;

    // Search query match
    const query = state.searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      meal.name.toLowerCase().includes(query) ||
      meal.cookLocation.toLowerCase().includes(query) ||
      meal.itemDescription.toLowerCase().includes(query) ||
      meal.cook.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  if (filteredMeals.length === 0) {
    catalogGrid.innerHTML = `
      <div class="col-span-full text-center py-16" style="grid-column: 1 / -1;">
        <div style="font-size: 4rem; opacity: 0.3; margin-bottom: 16px;"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3 class="text-xl font-bold">No Meals Found</h3>
        <p class="text-muted">Try adjusting your search filters or neighborhood.</p>
      </div>
    `;
    return;
  }

  filteredMeals.forEach((meal) => {
    const card = document.createElement("div");
    card.className = "meal-card";

    const isVegBadge = meal.isVeg
      ? `<span class="tag-badge tag-veg"><i class="fa-solid fa-leaf"></i> Veg</span>`
      : `<span class="tag-badge tag-nonveg"><i class="fa-solid fa-drumstick-bite"></i> Non-Veg</span>`;

    const bestsellerBadge = meal.isBestseller
      ? `<span class="tag-badge tag-bestseller"><i class="fa-solid fa-star"></i> Bestseller</span>`
      : "";

    card.innerHTML = `
      <div class="meal-img-box">
        <img class="meal-img" src="${meal.image}" alt="${meal.name}" onerror="this.src='https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=800&auto=format&fit=crop'">
        <div class="meal-tags">
          ${isVegBadge}
          ${bestsellerBadge}
        </div>
        <div class="meal-price-badge">${formatCurrency(meal.price)}</div>
      </div>
      <div class="meal-content">
        <div class="meal-cook-info">
          <i class="fa-solid fa-house-chimney-user"></i>
          <span>${meal.cook} • ${meal.cookLocation.split(",")[0]}</span>
        </div>
        <h3 class="meal-title">${meal.name}</h3>
        <p class="meal-desc">${meal.itemDescription}</p>
        
        <div class="meal-footer">
          <div class="meal-time-info">
            <i class="fa-solid fa-clock"></i>
            <span>${meal.pickupTime}</span>
          </div>
          <div class="meal-card-btns">
            <button onclick="openMealDetail('${meal.id}')" class="btn btn-outline">
              <i class="fa-solid fa-info-circle"></i> Details
            </button>
            <button onclick="addToCart('${meal.id}')" class="btn btn-primary btn-icon-only" title="Add to Order">
              <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    catalogGrid.appendChild(card);
  });
}

// Open Meal Details Modal
window.openMealDetail = function (id) {
  const meal = state.meals.find((m) => m.id === id);
  if (!meal) return;

  const backdrop = document.getElementById("mealDetailModal");
  const body = backdrop.querySelector(".modal-body");
  const footer = backdrop.querySelector(".modal-footer");

  const ratingStars =
    `<i class="fa-solid fa-star"></i>`.repeat(Math.round(meal.rating)) +
    `<i class="fa-regular fa-star"></i>`.repeat(5 - Math.round(meal.rating));

  const reviewsHtml =
    meal.reviews.length > 0
      ? meal.reviews
          .map(
            (r) => `
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${r.author}</span>
            <span class="review-stars">${`<i class="fa-solid fa-star"></i>`.repeat(r.rating)}</span>
          </div>
          <p class="review-text">"${r.text}"</p>
        </div>
      `,
          )
          .join("")
      : `<p class="text-muted text-xs italic">No reviews yet. Be the first to order and review!</p>`;

  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-img-box">
        <img class="detail-img" src="${meal.image}" alt="${meal.name}" onerror="this.src='https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=800&auto=format&fit=crop'">
      </div>
      <div class="detail-info">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
          <span class="tag-badge ${meal.isVeg ? "tag-veg" : "tag-nonveg"}">${meal.isVeg ? "Veg" : "Non-Veg"}</span>
          <span style="font-size: 0.9rem; color: var(--accent); font-weight:700;">
            ${ratingStars} (${meal.rating})
          </span>
        </div>
        <h2 class="modal-title" style="margin-bottom: 12px;">${meal.name}</h2>
        <p class="text-muted" style="font-size: 0.95rem; margin-bottom: 16px;">${meal.itemDescription}</p>
        
        <p style="font-size:0.9rem; font-weight:600; margin-bottom: 4px;">Ingredients:</p>
        <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 16px;">${meal.ingredients}</p>

        <p style="font-size:0.9rem; font-weight:600; margin-bottom: 4px;">Allergen notes:</p>
        <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 16px;">${meal.allergenNotes || "Ask the cook to confirm allergen details before pickup."}</p>
        
        <div style="display:flex; gap: 16px; margin-bottom: 20px; font-size:0.85rem;">
          <div style="background:var(--bg-main); padding: 8px 12px; border-radius:var(--radius-sm);">
            <i class="fa-solid fa-clock" style="color:var(--accent); margin-right:4px;"></i>
            <strong>Pickup:</strong> ${meal.pickupTime}
          </div>
          <div style="background:var(--bg-main); padding: 8px 12px; border-radius:var(--radius-sm);">
            <i class="fa-solid fa-tag" style="color:var(--primary); margin-right:4px;"></i>
            <strong>Price:</strong> ${formatCurrency(meal.price)}
          </div>
        </div>

        <div class="detail-cook-card">
          <div class="cook-avatar">${meal.cook.charAt(0)}</div>
          <div class="cook-meta">
            <h4>Prepared by ${meal.cook}</h4>
            <p><i class="fa-solid fa-location-dot"></i> ${meal.cookLocation}</p>
            <p style="font-size: 0.75rem; color: var(--primary); margin-top:2px; font-weight:600;"><i class="fa-solid fa-shield-halved"></i> Profile verification and compliance guidance recorded</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="detail-reviews" style="margin-top: 32px; border-top: 1px solid var(--border); padding-top: 24px;">
      <h3 style="font-family:var(--font-fancy); font-size: 1.35rem; margin-bottom:16px;">Customer Reviews</h3>
      <div style="max-height: 200px; overflow-y:auto; padding-right:8px;">
        ${reviewsHtml}
      </div>
      
      <!-- Add Review Form -->
      <div style="margin-top: 24px; background:var(--bg-main); padding:16px; border-radius:var(--radius-md);">
        <h4 style="font-weight:600; font-size: 0.9rem; margin-bottom:8px;">Leave a Review</h4>
        <div style="display:flex; gap: 8px; margin-bottom:8px; align-items:center;">
          <span style="font-size:0.85rem; font-weight:500;">Your Rating:</span>
          <div id="reviewRatingStars" style="color:var(--accent); cursor:pointer; font-size: 1.1rem;">
            <i class="fa-regular fa-star" data-value="1"></i>
            <i class="fa-regular fa-star" data-value="2"></i>
            <i class="fa-regular fa-star" data-value="3"></i>
            <i class="fa-regular fa-star" data-value="4"></i>
            <i class="fa-regular fa-star" data-value="5"></i>
          </div>
        </div>
        <div style="display:flex; gap: 8px;">
          <input id="reviewAuthor" type="text" placeholder="Your Name" class="form-input" style="padding:8px 12px; font-size:0.85rem; width:130px;">
          <input id="reviewText" type="text" placeholder="Share your dining experience..." class="form-input" style="padding:8px 12px; font-size:0.85rem; flex-grow:1;">
          <button onclick="submitReview('${meal.id}')" class="btn btn-primary" style="padding:8px 16px; font-size:0.85rem;">Submit</button>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <span style="margin-right:auto; font-size:1.35rem; font-weight:800; color:var(--primary)">${formatCurrency(meal.price)}</span>
    <button onclick="closeModal('mealDetailModal')" class="btn btn-outline">Close</button>
    <button onclick="addToCart('${meal.id}'); closeModal('mealDetailModal');" class="btn btn-primary">
      <i class="fa-solid fa-cart-plus"></i> Add to Order
    </button>
  `;

  // Bind Star rating selector logic
  const starsContainer = document.getElementById("reviewRatingStars");
  let selectedRating = 5;

  // Set default visual to 5 stars
  updateReviewStarsVisual(starsContainer, 5);

  starsContainer.addEventListener("click", (e) => {
    if (e.target.matches("i")) {
      selectedRating = parseInt(e.target.getAttribute("data-value"));
      updateReviewStarsVisual(starsContainer, selectedRating);
      starsContainer.setAttribute("data-selected", selectedRating);
    }
  });

  openModal("mealDetailModal");
};

function updateReviewStarsVisual(container, rating) {
  const stars = container.querySelectorAll("i");
  stars.forEach((star, i) => {
    if (i < rating) {
      star.className = "fa-solid fa-star";
    } else {
      star.className = "fa-regular fa-star";
    }
  });
}

// Submit dining review
window.submitReview = function (mealId) {
  const authorInput = document.getElementById("reviewAuthor");
  const textInput = document.getElementById("reviewText");
  const starsContainer = document.getElementById("reviewRatingStars");
  const rating = parseInt(starsContainer.getAttribute("data-selected") || "5");

  const author = authorInput.value.trim();
  const text = textInput.value.trim();

  if (!author || !text) {
    showToast("Please fill in both your name and review message.", "warning");
    return;
  }

  const mealIndex = state.meals.findIndex((m) => m.id === mealId);
  if (mealIndex === -1) return;

  // Add review
  state.meals[mealIndex].reviews.push({ author, rating, text });

  // Recalculate average rating
  const total = state.meals[mealIndex].reviews.reduce(
    (sum, r) => sum + r.rating,
    0,
  );
  state.meals[mealIndex].rating = parseFloat(
    (total / state.meals[mealIndex].reviews.length).toFixed(1),
  );
  
  showToast("Thank you for your rating! Review added successfully.", "success");

  // Refresh modal content
  openMealDetail(mealId);
  renderCatalog();
};

// Cart Drawer Operations
window.addToCart = function (id) {
  const meal = state.meals.find((m) => m.id === id);
  if (!meal) return;

  const existingCartItem = state.cart.find((item) => item.mealId === id);

  if (existingCartItem) {
    existingCartItem.quantity += 1;
  } else {
    state.cart.push({
      mealId: id,
      name: meal.name,
      price: meal.price,
      cook: meal.cook,
      cookPhone: meal.cookPhone || "+919876543210",
      cookLocation: meal.cookLocation,
      image: meal.image,
      quantity: 1,
    });
  }

  saveCart();
  updateCartBadge();
  renderCart();
  showToast(`"${meal.name}" added to pickup order!`, "success");
};

window.removeFromCart = function (mealId) {
  state.cart = state.cart.filter((item) => item.mealId !== mealId);
  saveCart();
  updateCartBadge();
  renderCart();
  showToast("Item removed from your cart", "info");
};

window.updateQty = function (mealId, delta) {
  const item = state.cart.find((i) => i.mealId === mealId);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(mealId);
  } else {
    saveCart();
    updateCartBadge();
    renderCart();
  }
};

function updateCartBadge() {
  const badges = document.querySelectorAll(".cart-count-badge");
  const count = state.cart.reduce((total, item) => total + item.quantity, 0);

  badges.forEach((badge) => {
    badge.textContent = count;
    if (count > 0) {
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  });
}

function renderCart() {
  const cartList = document.getElementById("cartItemsList");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartPkgFee = document.getElementById("cartPkgFee");
  const cartTotal = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("cartCheckoutBtn");

  if (!cartList) return;

  if (state.cart.length === 0) {
    cartList.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-basket-shopping"></i>
        <h3>Your basket is empty</h3>
        <p style="font-size:0.85rem; margin-top:8px;">Add freshly cooked delicious items from local home kitchens to make a pickup order.</p>
      </div>
    `;
    cartSubtotal.textContent = formatCurrency(0);
    cartPkgFee.textContent = formatCurrency(0);
    cartTotal.textContent = formatCurrency(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  cartList.innerHTML = "";
  let subtotal = 0;

  state.cart.forEach((item) => {
    const itemCost = item.price * item.quantity;
    subtotal += itemCost;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=800&auto=format&fit=crop'">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>Cook: ${item.cook}</p>
        <div class="cart-item-qty">
          <button onclick="updateQty('${item.mealId}', -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateQty('${item.mealId}', 1)">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-price">${formatCurrency(itemCost)}</span>
        <button onclick="removeFromCart('${item.mealId}')" class="cart-item-remove">Remove</button>
      </div>
    `;
    cartList.appendChild(div);
  });

  const packageCharge = 10; // Nominal package containers fee
  const grandTotal = subtotal + packageCharge;

  cartSubtotal.textContent = formatCurrency(subtotal);
  cartPkgFee.textContent = formatCurrency(packageCharge);
  cartTotal.textContent = formatCurrency(grandTotal);
  if (checkoutBtn) checkoutBtn.disabled = false;
}

// Checkout & WhatsApp Link Compiler
window.openCheckout = function () {
  if (state.cart.length === 0) return;

  // Close the cart drawer first
  closeDrawer();

  // Setup default dynamic date selectors (Today / Tomorrow)
  const pickupDateSelect = document.getElementById("checkoutDate");
  if (pickupDateSelect) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    pickupDateSelect.innerHTML = `
      <option value="Today (${today.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})">Today (${today.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})</option>
      <option value="Tomorrow (${tomorrow.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})">Tomorrow (${tomorrow.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})</option>
    `;
  }

  openModal("checkoutModal");
};

window.processCheckout = function (event) {
  event.preventDefault();

  const customerName = document.getElementById("checkoutName").value.trim();
  const customerPhone = document.getElementById("checkoutPhone").value.trim();
  const pickupDate = document.getElementById("checkoutDate").value;
  const pickupTime = document.getElementById("checkoutTime").value;

  if (!customerName || !customerPhone || !pickupTime) {
    showToast(
      "Please complete all order details before proceeding.",
      "warning",
    );
    return;
  }

  // Compile individual cook messages. In our Guwahati network model:
  // Since meals can belong to multiple home cooks, we sort cart items by Cook so that the customer
  // can place separate orders/WhatsApp logs to respective cooks, or a consolidated admin dispatch.
  // Realistically, we open a WhatsApp message targeting the first cook in the cart, but notify user if multiple cooks exist.

  const cooksMap = {};
  state.cart.forEach((item) => {
    if (!cooksMap[item.cook]) {
      cooksMap[item.cook] = {
        phone: item.cookPhone || "+919876543210",
        items: [],
        location: item.cookLocation,
      };
    }
    cooksMap[item.cook].items.push(item);
  });

  const cookNames = Object.keys(cooksMap);
  const primaryCookName = cookNames[0];
  const primaryCookData = cooksMap[primaryCookName];

  let totalOrderCost = 0;
  let itemsStr = "";

  primaryCookData.items.forEach((item) => {
    const cost = item.price * item.quantity;
    totalOrderCost += cost;
    itemsStr += `- ${item.name} (Qty: ${item.quantity}) - ${formatCurrency(cost)}\n`;
  });

  const totalWithPkg = totalOrderCost + 10;

  // Formulate high-fidelity WhatsApp text
  const rawMsg = `*RANDHONI PICKUP ORDER*
-----------------------------------
Hello Chef *${primaryCookName}*, I'd like to reserve home-cooked food from your kitchen:

*Ordered Items:*
${itemsStr}
*Packaging Charge:* ${formatCurrency(10)}
*Grand Total:* ${formatCurrency(totalWithPkg)} (Free Pickup)

*Pickup details:*
- *Date:* ${pickupDate}
- *Requested Time:* ${pickupTime}
- *Location:* ${primaryCookData.location}

*Customer Info:*
- *Name:* ${customerName}
- *Phone:* ${customerPhone}

_Order placed via Randhoni.in pickup marketplace. Please confirm availability, pickup address, ingredients, and allergen details._`;

  const encodedMsg = encodeURIComponent(rawMsg);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${primaryCookData.phone.replace(/[^0-9+]/g, "")}&text=${encodedMsg}`;

  // Clear cart and close modal
  state.cart = [];
  saveCart();
  updateCartBadge();
  renderCart();
  closeModal("checkoutModal");

  // Show customized confirmation Modal
  const successModal = document.getElementById("orderSuccessModal");
  if (successModal) {
    const detailDiv = document.getElementById("successOrderDetails");
    detailDiv.innerHTML = `
      <div style="background:var(--primary-light); color:var(--primary); padding:16px; border-radius:var(--radius-md); margin-bottom: 20px;">
        <h4 style="font-weight:700; margin-bottom:4px;"><i class="fa-solid fa-store"></i> Cook Details:</h4>
        <p style="font-size:0.95rem;"><strong>${primaryCookName}</strong> (${primaryCookData.location.split(",")[0]})</p>
        <p style="font-size:0.85rem; opacity:0.9;">Phone: ${primaryCookData.phone}</p>
      </div>
      <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6; margin-bottom: 16px;">
        We have compiled your receipt. Clicking below will open **WhatsApp** to send this receipt directly to **Chef ${primaryCookName}** to confirm the pickup timing and grab their exact building address!
      </p>
      <a href="${whatsappUrl}" target="_blank" onclick="closeModal('orderSuccessModal')" class="btn btn-accent" style="width:100%; display:flex; padding:14px; font-size:1.1rem; border-radius:var(--radius-md);">
        <i class="fa-brands fa-whatsapp" style="font-size:1.4rem;"></i> Send WhatsApp Order & Confirm
      </a>
    `;

    // If multiple cooks, append a notification
    if (cookNames.length > 1) {
      const warningNote = document.createElement("p");
      warningNote.style.cssText =
        "font-size: 0.75rem; color: var(--error); margin-top: 12px; font-weight:600;";
      warningNote.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Note: You ordered from ${cookNames.length} different cooks. This receipt covers Chef ${primaryCookName}. Please place separate orders for other kitchens.`;
      detailDiv.appendChild(warningNote);
    }

    openModal("orderSuccessModal");
  } else {
    // Fallback if success modal not loaded
    window.open(whatsappUrl, "_blank");
    showToast("Order compiled! WhatsApp chat launched.", "success");
  }
};

// Seller Portal (Cook Dashboard) Logic
window.toggleCookPanel = function (tabName) {
  state.activeCookTab = tabName;

  // Set tab active state
  document.querySelectorAll(".dash-menu-item").forEach((item) => {
    item.classList.remove("active");
  });
  const activeMenu = document.querySelector(
    `.dash-menu-item[data-tab="${tabName}"]`,
  );
  if (activeMenu) activeMenu.classList.add("active");

  // Set panel active state
  document.querySelectorAll(".dash-panel").forEach((panel) => {
    panel.classList.remove("active");
  });
  const activePanel = document.getElementById(`dashPanel-${tabName}`);
  if (activePanel) activePanel.classList.add("active");

  // Load appropriate panel contents
  if (tabName === "dishes") {
    renderCookDishes();
  }
};

async function renderCookDishes() {

  const container =
    document.getElementById("cookDishesList");

  if (!container) return;

  container.innerHTML = `
    <p style="padding:20px;">
      Loading dishes...
    </p>
  `;

  try {

    const response = await fetch(
      "https://randhoni.onrender.com/api/meals"
    );

    const meals = await response.json();

    const cookMeals = meals.filter((meal) => {

  return (
    meal.chef_name &&
    state.currentUser &&
    meal.chef_name.toLowerCase().trim() ===
    state.currentUser.cookName.toLowerCase().trim()
  );

});

    if (cookMeals.length === 0) {

      container.innerHTML = `
        <div style="
          text-align:center;
          padding:40px;
        ">
          No dishes listed yet.
        </div>
      `;

      return;
    }

    container.innerHTML = "";

    cookMeals.forEach((meal) => {

      const div =
        document.createElement("div");

      div.style.cssText = `
        border:1px solid #ddd;
        border-radius:12px;
        padding:16px;
        margin-bottom:16px;
      `;

      div.innerHTML = `
        <img
          src="${meal.image_url}"
          style="
            width:100%;
            height:180px;
            object-fit:cover;
            border-radius:10px;
          "
        />

        <h3 style="margin-top:12px;">
          ${meal.title}
        </h3>

        <p>
          ₹${meal.price}
        </p>

        <p>
          ${meal.category}
        </p>

        <p>
          ${meal.pickup_time}
        </p>
      `;

      container.appendChild(div);

    });

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <p style="padding:20px;color:red;">
        Failed to load dishes
      </p>
    `;
  }
}

window.deleteCookDish = function (id) {
  if (
    confirm(
      "Are you sure you want to delete this dish listing? It will immediately disappear from the public marketplace catalog.",
    )
  ) {
    state.meals = state.meals.filter((m) => m.id !== id);
    
    renderCookDishes();
    renderCatalog();
    showToast("Dish listing successfully deleted", "info");
  }
};

window.populateImagePresets = function () {
  const wrapper = document.getElementById("imagePresetsWrapper");
  if (!wrapper) return;

  wrapper.innerHTML = "";
  IMAGE_PRESETS.forEach((img, index) => {
    const div = document.createElement("div");
    div.className = "image-preset-item";
    div.style.cssText =
      "cursor:pointer; border:2px solid var(--border); border-radius:8px; overflow:hidden; position:relative; height:80px; transition:var(--transition-fast);";

    div.innerHTML = `
      <img src="${img.url}" style="width:100%; height:100%; object-fit:cover;" title="${img.name}">
      <span style="position:absolute; bottom:0; left:0; width:100%; background:rgba(0,0,0,0.6); color:white; font-size:0.65rem; text-align:center; padding:2px 0;">${img.name}</span>
    `;

    if (index === 0) {
      div.style.borderColor = "var(--primary)";
      document.getElementById("addDishImageUrl").value = img.url;
    }

    div.addEventListener("click", () => {
      wrapper.querySelectorAll(".image-preset-item").forEach((el) => {
        el.style.borderColor = "var(--border)";
      });
      div.style.borderColor = "var(--primary)";
      document.getElementById("addDishImageUrl").value = img.url;
    });

    wrapper.appendChild(div);
  });
};



  
window.addNewDish = async function (event) {

  event.preventDefault();

  const name =
    document.getElementById("addDishName").value.trim();

  const price =
    parseInt(
      document.getElementById("addDishPrice").value
    );

  const category =
    document.getElementById("addDishCategory").value;

  const isVeg =
    document.getElementById("addDishVeg").value === "true";

  const desc =
    document.getElementById("addDishDesc").value.trim();

  const ingredients =
    document
      .getElementById("addDishIngredients")
      .value.trim();

  const allergenNotes =
    document
      .getElementById("addDishAllergens")
      .value.trim();

  const pickupTime =
    document
      .getElementById("addDishTime")
      .value.trim();

  const imageFile =
    document.getElementById("dishImageFile").files[0];

  if (
    !name ||
    isNaN(price) ||
    !desc ||
    !pickupTime
  ) {

    showToast(
      "Please fill all required fields",
      "warning"
    );

    return;
  }

  let uploadedImageUrl = "";

  try {

    if (imageFile) {

      const fileName =
        `${Date.now()}-${imageFile.name}`;

      const { error: uploadError } =
        await supabase.storage
          .from("dish-images")
          .upload(fileName, imageFile);

      if (uploadError) {

        showToast(
          "Image upload failed",
          "error"
        );

        return;
      }

      const {
        data: publicUrlData
      } = supabase.storage
          .from("dish-images")
          .getPublicUrl(fileName);

      uploadedImageUrl =
        publicUrlData.publicUrl;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {

      showToast(
        "Please login again",
        "error"
      );

      return;
    }

    const response = await fetch(
      "https://randhoni.onrender.com/api/meals",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${session.access_token}`,
        },

        body: JSON.stringify({

          chef_id: state.currentUser.id,

          title: name,

          description: desc,

          ingredients: ingredients,

          allergen_notes: allergenNotes,

          price: price,

          category: category,

          is_veg: isVeg,

          pickup_time: pickupTime,

          image_url: uploadedImageUrl,

        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      showToast(
        data.error ||
        "Failed to upload dish",
        "error"
      );

      return;
    }

    await fetchMeals();

    renderCookDishes();

    renderCatalog();

    document
      .getElementById("addDishForm")
      .reset();

    showToast(
      "Dish uploaded successfully!",
      "success"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Server connection failed",
      "error"
    );
  }
};


window.submitLogin = async function (event) {

  event.preventDefault();

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPass").value;

  try {

    const { data, error } =
      await supabase.auth.signInWithPassword({

        email,
        password,

      });

    if (error) {

      showToast(error.message, "error");
      return;
    }

    // Fetch profile from users table
    const { data: profile, error: profileError } =
      await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

    if (profileError) {

      showToast(
        "Profile loading failed",
        "error"
      );

      return;
    }

    const loggedUser = {

      id: profile.id,

      cookName: profile.name,

      email: profile.email,

      cookLocation:
        profile.location || "Guwahati",

      cookPhone:
        profile.phone || "Not Added",

      role: profile.role,

    };

    saveUser(loggedUser);

    closeModal("authModal");

    showToast(
      `Welcome back, ${loggedUser.cookName}!`,
      "success"
    );

    openCookDashboard();

  } catch (error) {

    console.error(error);

    showToast(
      "Login failed",
      "error"
    );
  }
};
window.submitRegister = async function (event) {

  event.preventDefault();

  const name =
    document.getElementById("registerName").value.trim();

  const email =
    document.getElementById("registerEmail").value.trim();

  const password =
    document.getElementById("registerPass").value;

  const phone =
    document.getElementById("registerPhone").value.trim();

  const city =
    document.getElementById("registerCity").value;

  const area =
    document.getElementById("registerArea").value;

  const role = "chef";

  const location = `${area}, ${city}`;

  try {

    // Create Supabase Auth user
    const { data, error } =
      await supabase.auth.signUp({

        email,
        password,

      });

    if (error) {

      showToast(error.message, "error");
      return;
    }

    // Insert profile into users table
    const { error: profileError } =
      await supabase
        .from("users")
        .insert([{

          id: data.user.id,

          name,
          email,
          role,
          phone,
          location,

        }]);

    if (profileError) {

      showToast(
        profileError.message,
        "error"
      );

      return;
    }

    showToast(
      "Registration successful! Please login.",
      "success"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Registration failed",
      "error"
    );
  }
};
  
window.logoutCook = async function () {

  await supabase.auth.signOut();

  saveUser(null);

  closeModal("cookDashboardModal");

  showToast(
    "Logged out successfully.",
    "info"
  );
};

window.openCookDashboard = function () {
  if (!state.currentUser) {
    // Open auth modal instead
    openModal("authModal");
    return;
  }

  // Set details
  document.getElementById("dashCookName").textContent =
    state.currentUser.cookName;
  document.getElementById("dashCookLoc").textContent =
    state.currentUser.cookLocation;
  document.getElementById("dashCookPhone").textContent =
    state.currentUser.cookPhone;

  // Populate Image Preset catalog
  window.populateImagePresets();

  // Load and show dashboard
  toggleCookPanel("dishes");
  openModal("cookDashboardModal");
};

function updateAuthUI() {
  const loginBtn = document.getElementById("headerLoginBtn");
  const joinBtn = document.getElementById("headerJoinBtn");
  const portalBtn = document.getElementById("headerPortalBtn");

  // Mobile drawer elements
  const mLoginBtn = document.getElementById("mobileLoginBtn");
  const mJoinBtn = document.getElementById("mobileJoinBtn");
  const mPortalBtn = document.getElementById("mobilePortalBtn");

  if (!loginBtn || !joinBtn || !portalBtn) return;

  if (state.currentUser) {
    loginBtn.style.display = "none";
    joinBtn.style.display = "none";
    portalBtn.style.display = "block";
    portalBtn.innerHTML = `<i class="fa-solid fa-circle-user"></i> Chef ${state.currentUser.cookName.split(" ")[0]} Dashboard`;

    if (mLoginBtn && mJoinBtn && mPortalBtn) {
      mLoginBtn.style.display = "none";
      mJoinBtn.style.display = "none";
      mPortalBtn.style.display = "block";
      mPortalBtn.innerHTML = `<i class="fa-solid fa-circle-user"></i> Chef ${state.currentUser.cookName.split(" ")[0]} Dashboard`;
    }
  } else {
    loginBtn.style.display = "block";
    joinBtn.style.display = "block";
    portalBtn.style.display = "none";

    if (mLoginBtn && mJoinBtn && mPortalBtn) {
      mLoginBtn.style.display = "block";
      mJoinBtn.style.display = "block";
      mPortalBtn.style.display = "none";
    }
  }
}



/* =========================================================
   IMPROVED MODAL SYSTEM
========================================================= */

window.openModal = function (modalId) {
  const backdrop = document.getElementById(modalId);

  if (!backdrop) return;

  backdrop.classList.add("active");

  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  // iOS Safari fix
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
};

window.closeModal = function (modalId) {
  const backdrop = document.getElementById(modalId);

  if (!backdrop) return;

  backdrop.classList.remove("active");

  document.body.style.overflow = "";
  document.body.style.touchAction = "";
  document.body.style.position = "";
  document.body.style.width = "";
};

/* =========================================================
   IMPROVED CART DRAWER
========================================================= */

window.openDrawer = function () {
  const backdrop = document.getElementById("cartDrawerBackdrop");

  if (!backdrop) return;

  backdrop.classList.add("active");

  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
};

window.closeDrawer = function () {
  const backdrop = document.getElementById("cartDrawerBackdrop");

  if (!backdrop) return;

  backdrop.classList.remove("active");

  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
};

/* =========================================================
   MOBILE SAFE SCROLLING
========================================================= */

function smoothScrollToElement(elementId) {
  const element = document.getElementById(elementId);

  if (!element) return;

  const yOffset = -80;
  const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

  window.scrollTo({
    top: y,
    behavior: "smooth",
  });
}

/* =========================================================
   BETTER MOBILE SEARCH UX
========================================================= */

const heroSearchInput = document.getElementById("heroSearchInput");

if (heroSearchInput) {
  // Prevent zoom on iOS
  heroSearchInput.setAttribute("autocomplete", "off");
  heroSearchInput.setAttribute("autocorrect", "off");
  heroSearchInput.setAttribute("autocapitalize", "off");
  heroSearchInput.setAttribute("spellcheck", "false");

  heroSearchInput.addEventListener("focus", () => {
    // iOS viewport fix
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    }, 300);
  });
}

/* =========================================================
   BETTER TOUCH FEEDBACK
========================================================= */

document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("touchstart", () => {
    btn.style.transform = "scale(0.97)";
  });

  btn.addEventListener("touchend", () => {
    btn.style.transform = "";
  });
});

/* =========================================================
   AUTO CLOSE DRAWER ON MOBILE RESIZE
========================================================= */

window.addEventListener("resize", () => {
  const navLinks = document.querySelector(".nav-links");

  if (window.innerWidth > 768) {
    if (navLinks) {
      navLinks.classList.remove("active");
    }

    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
  }
});

/* =========================================================
   IOS SAFARI HEIGHT FIX
========================================================= */

function setMobileViewportHeight() {
  const vh = window.innerHeight * 0.01;

  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

setMobileViewportHeight();

window.addEventListener("resize", setMobileViewportHeight);
window.addEventListener("orientationchange", setMobileViewportHeight);

/* =========================================================
   MOBILE PERFORMANCE OPTIMIZATION
========================================================= */

// Lazy animation rendering
const observerOptions = {
  threshold: 0.1,
};

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

document.querySelectorAll(".meal-card, .step-card").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = "all 0.5s ease";

  fadeObserver.observe(el);
});

/* =========================================================
   PREVENT DOUBLE SUBMISSIONS
========================================================= */

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", () => {
    const submitBtn = form.querySelector("button[type='submit']");

    if (submitBtn) {
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.disabled = false;
      }, 2500);
    }
  });
});

/* =========================================================
   BETTER MOBILE TOAST POSITIONING
========================================================= */

function adjustToastForMobile() {
  const toastContainer = document.getElementById("toastContainer");

  if (!toastContainer) return;

  if (window.innerWidth < 768) {
    toastContainer.style.left = "10px";
    toastContainer.style.right = "10px";
    toastContainer.style.bottom = "10px";
  } else {
    toastContainer.style.left = "24px";
    toastContainer.style.right = "";
    toastContainer.style.bottom = "24px";
  }
}

adjustToastForMobile();

window.addEventListener("resize", adjustToastForMobile);

/* =========================================================
   MOBILE INIT
========================================================= */

window.addEventListener("load", () => {
  // Ensure smooth initial rendering
  document.body.style.opacity = "1";

  // Mobile rendering fix
  setTimeout(() => {
    window.scrollTo(0, 1);
    window.scrollTo(0, 0);
  }, 100);
});

console.log("✅ Randhoni Mobile Optimization Loaded");
