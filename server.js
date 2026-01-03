// The Misty Cup - QR Menu & Events Website
const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 4445;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("index");
});

// Reorder categories based on IST time
function reorderCategories(menu, brand) {
  if (brand !== "misty-cup") return menu;

  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;
  const istHours = Math.floor(istMinutes / 60) % 24;
  const istMins = istMinutes % 60;

  // Convert to minutes since midnight for easier comparison
  const currentTimeInMins = istHours * 60 + istMins;
  const breakfastStart = 7 * 60 + 30;  // 7:30 AM = 450 mins
  const breakfastEnd = 11 * 60;         // 11:00 AM = 660 mins

  const categories = [...menu.categories];
  const isBreakfastTime = currentTimeInMins >= breakfastStart && currentTimeInMins < breakfastEnd;

  if (isBreakfastTime) {
    // Breakfast time: 7:30 AM - 11:00 AM IST - Breakfast on top
    const breakfastIndex = categories.findIndex(c => c.name.startsWith("Breakfast"));
    if (breakfastIndex > 0) {
      const [category] = categories.splice(breakfastIndex, 1);
      categories.unshift(category);
    }
  } else {
    // Non-breakfast hours: TMC Specials on top, Breakfast at the end
    const specialsIndex = categories.findIndex(c => c.name === "TMC Specials");
    if (specialsIndex > 0) {
      const [category] = categories.splice(specialsIndex, 1);
      categories.unshift(category);
    }
    const breakfastIndex = categories.findIndex(c => c.name.startsWith("Breakfast"));
    if (breakfastIndex !== -1 && breakfastIndex !== categories.length - 1) {
      const [category] = categories.splice(breakfastIndex, 1);
      categories.push(category);
    }
  }

  return { ...menu, categories };
}

app.get("/menu/:brand", async (req, res) => {
  const brand = req.params.brand;

  if (brand !== "crispy-days" && brand !== "misty-cup") {
    return res.status(404).render("404", { message: "Brand not found" });
  }

  try {
    const menuData = await fs.readFile(
      path.join(__dirname, "data", `${brand}.json`),
      "utf8"
    );
    let menu = JSON.parse(menuData);
    menu = reorderCategories(menu, brand);
    res.render("menu", { menu, brand });
  } catch (error) {
    console.error("Error loading menu:", error);
    res.status(500).render("404", { message: "Error loading menu" });
  }
});

app.get("/events/:eventType", (req, res) => {
  const eventType = req.params.eventType;
  const validEvents = ["birthday-party", "kitty-party", "social-gatherings"];

  if (!validEvents.includes(eventType)) {
    return res.status(404).render("404", { message: "Event not found" });
  }

  res.render(`events/${eventType}`);
});

app.get("/work-from-cafe", (req, res) => {
  res.render("work-from-cafe");
});

app.get("/black-friday-sale-25", (req, res) => {
  return;
  res.render("thanks-giving-offer-25");
});

app.use((req, res) => {
  res.status(404).render("404", { message: "Page not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
