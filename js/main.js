document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  const search = document.getElementById("product-search");
  const filter = document.getElementById("category-filter");
  const empty = document.getElementById("empty-products");
  const categoryList = document.getElementById("category-list");
  const resultsLabel = document.getElementById("results-label");
  const gambiaButton = document.getElementById("gambia-filter");
  const GAMBIA = "gambia";
  const categoryOrder = [
    "Science Experiment Kits", "DIY Kits", "Engineering Project Kits", "Electronic Science Kits", "Solar STEM Kits", "Experiment Sets",
    "Educational Robots", "Robot Kits", "Aircraft Engine Models", "Starter & Learning Kits", "Finished Systems",
    "Smart switches - US standard", "Smart switches - EU standard", "Matter smart switches", "Ewelink smart switches",
    "Microcontrollers & Dev Boards", "ESP32 & ESP8266 Boards", "ESP32 Smart Displays", "LILYGO Dev Boards",
    "Raspberry Pi Kits", "Raspberry Pi 5 Cases", "Raspberry Pi 4 Cases", "Raspberry Pi Accessories",
    "Sensors", "Displays & Touch Screens", "Displays & Input", "Small OLED & TFT Modules", "Cameras & Vision",
    "Motors, Drivers & Relays", "Power & Regulators", "Power Amplifiers & Audio", "Wireless & Communication",
    "Modules & Components", "Electronic Components", "Connectors, Terminals & Hardware", "PCB & Prototype Boards"
  ];

  function products() { return Store.getProducts(); }
  function categories() {
    const counts = new Map();
    products().forEach(product => {
      const category = product.category || "General";
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return [...counts.keys()].sort((a, b) => {
      const ai = categoryOrder.indexOf(a);
      const bi = categoryOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }).map(name => ({ name, count: counts.get(name) }));
  }
  function card(product) {
    const today = product.inGambia ? `<span class="today-badge">Today</span>` : "";
    return `<article class="product-card"><a class="product-image-link" href="product-details.html?id=${encodeURIComponent(product.id)}">${Store.productImage(product.image, product.name)}</a><div class="product-info"><span class="product-category">${Store.safeText(product.category || "General")}${today}</span><h3><a href="product-details.html?id=${encodeURIComponent(product.id)}">${Store.safeText(product.name)}</a></h3><div class="product-price">${Store.money(product.price)}</div><div class="product-card-actions"><a class="btn btn-outline" href="product-details.html?id=${encodeURIComponent(product.id)}">View product ↗</a><button class="btn btn-soft" data-add="${Store.safeText(product.id)}">＋ Add to cart</button></div></div></article>`;
  }
  function matchesName(product, query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const name = `${product.name || ""} ${product.id || ""}`.toLowerCase();
    return words.every(word => name.includes(word));
  }
  function iconFor(name) {
    const n = name.toLowerCase();
    const path = n.includes("gambia") ? "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 11.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z" :
      n.includes("sensor") ? "M4 12h3l2-5 4 10 2-5h5" :
      n.includes("display") || n.includes("oled") || n.includes("tft") ? "M4 5h16v10H4zM8 19h8" :
      n.includes("camera") ? "M4 8h3l2-2h6l2 2h3v10H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" :
      n.includes("motor") ? "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 3v3M12 18v3M3 12h3M18 12h3" :
      n.includes("power") || n.includes("amplifier") ? "M13 3L6 13h5l-1 8 8-12h-5z" :
      n.includes("wireless") || n.includes("switch") || n.includes("ewelink") || n.includes("matter") ? "M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0M12 12h.01" :
      n.includes("robot") || n.includes("aircraft") ? "M12 4v3M8 11h8l2 6H6zM9 20h6" :
      n.includes("solar") ? "M12 4v2M12 18v2M4 12h2M18 12h2M6 6l1.5 1.5M16.5 16.5L18 18M18 6l-1.5 1.5M7.5 16.5L6 18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" :
      n.includes("raspberry") || n.includes("esp") || n.includes("lilygo") || n.includes("microcontroller") ? "M8 7h8v10H8zM4 9h4M4 12h4M4 15h4M16 9h4M16 12h4M16 15h4" :
      n.includes("science") || n.includes("experiment") ? "M9 3h6M10 3v6L6 19a3 3 0 0 0 2.6 4h6.8A3 3 0 0 0 18 19l-4-10V3" :
      "M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z";
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  }
  function mixedProducts() {
    const groups = new Map();
    products().forEach(product => {
      const category = product.category || "General";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(product);
    });
    return [...groups.values()].map(group => group[0]);
  }
  function renderCategories(selected) {
    if (!categoryList) return;
    const items = [{ name: "All", value: "all" }, { name: "Available in The Gambia", value: GAMBIA }, ...categories().map(item => ({ name: item.name, value: item.name }))];
    categoryList.innerHTML = items.map(item => `<button type="button" class="category-card${item.value === selected ? " active" : ""}" data-category="${Store.safeText(item.value)}">${iconFor(item.value === "all" ? "all" : item.name)}<span>${Store.safeText(item.name)}</span></button>`).join("");
  }
  function render() {
    const query = (search?.value || "").trim();
    const category = filter?.value || "all";
    const inView = product => category === GAMBIA ? product.inGambia : category === "all" || product.category === category;
    renderCategories(category);
    gambiaButton?.classList.toggle("active", category === GAMBIA);
    let list = category === "all" && !query ? mixedProducts() : products().filter(product => inView(product) && (!query || matchesName(product, query)));
    grid.classList.remove("hidden");
    grid.innerHTML = list.map(card).join("");
    if (resultsLabel) {
      if (category === GAMBIA && query) resultsLabel.textContent = `${list.length} in The Gambia matching “${query}”`;
      else if (query) resultsLabel.textContent = `${list.length} product${list.length === 1 ? "" : "s"} matching “${query}”`;
      else if (category === GAMBIA) resultsLabel.textContent = list.length ? `${list.length} available in The Gambia · buy today, get it today` : "No products available in The Gambia yet";
      else if (category !== "all") resultsLabel.textContent = `${list.length} products in ${category}`;
      else resultsLabel.textContent = "A mix from different categories";
    }
    const emptyTitle = empty?.querySelector("h3");
    const emptyCopy = empty?.querySelector("p");
    if (emptyTitle && emptyCopy) {
      if (category === GAMBIA && !query) {
        emptyTitle.textContent = "Nothing in The Gambia yet";
        emptyCopy.textContent = "Mark products in admin. Buy today, get it today.";
      } else {
        emptyTitle.textContent = "No products found";
        emptyCopy.textContent = "Try another search or category.";
      }
    }
    empty?.classList.toggle("hidden", list.length > 0);
  }

  if (filter && ![...filter.options].some(option => option.value === GAMBIA)) {
    const gambiaOption = document.createElement("option");
    gambiaOption.value = GAMBIA;
    gambiaOption.textContent = "Available in The Gambia";
    filter.appendChild(gambiaOption);
  }
  categories().forEach(category => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = `${category.name} (${category.count})`;
    filter?.appendChild(option);
  });
  const params = new URLSearchParams(location.search);
  if (filter && params.get("category") && [...filter.options].some(option => option.value === params.get("category"))) filter.value = params.get("category");
  if (search && params.get("q")) search.value = params.get("q");
  search?.addEventListener("input", render);
  filter?.addEventListener("change", render);
  gambiaButton?.addEventListener("click", () => {
    if (!filter) return;
    filter.value = filter.value === GAMBIA ? "all" : GAMBIA;
    if (search) search.value = "";
    render();
    grid.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  categoryList?.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button || !filter) return;
    filter.value = button.dataset.category;
    if (search) search.value = "";
    render();
    grid.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    Store.addToCart(button.dataset.add);
    Store.toast("Product added to your cart.");
  });
  render();
  document.querySelector(".menu-toggle")?.addEventListener("click", () => document.querySelector(".main-nav")?.classList.toggle("open"));
  const contact = document.getElementById("contact-whatsapp");
  if (contact) contact.addEventListener("click", event => { event.preventDefault(); Store.openWhatsApp("Hello! I have a question about your products."); });
});
