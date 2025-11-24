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
    const menu = JSON.parse(menuData);
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

app.use((req, res) => {
  res.status(404).render("404", { message: "Page not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
