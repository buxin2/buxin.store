document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const nameStep = $("supplier-name-step");
  const productStep = $("supplier-product-step");
  const nameForm = $("supplier-name-form");
  const productForm = $("supplier-product-form");
  const activeName = $("active-supplier-name");
  const productCount = $("supplier-product-count");
  const status = $("supplier-status");
  const statusName = $("supplier-status-name");
  const saveBtn = $("supplier-save-product");

  function showStatus(target, message, ok) {
    if (!target) return;
    target.textContent = message || "";
    target.className = "supplier-status" + (message ? (ok ? " ok" : " err") : "");
  }

  function paintCount(name) {
    const n = SupplierData.countLocalProducts(name);
    if (productCount) productCount.textContent = String(n);
  }

  function showProducts(name) {
    nameStep?.classList.add("hidden");
    productStep?.classList.remove("hidden");
    if (activeName) activeName.textContent = name;
    paintCount(name);
    showStatus(status, "", true);
    $("product-name")?.focus();
  }

  function showName() {
    productStep?.classList.add("hidden");
    nameStep?.classList.remove("hidden");
    SupplierData.clearSessionSupplier();
    showStatus(status, "", true);
    showStatus(statusName, "", true);
    $("supplier-name")?.focus();
  }

  const existing = SupplierData.getSessionSupplierName();
  if (existing) showProducts(existing);
  else showName();

  nameForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = SupplierData.normalizeName($("supplier-name").value);
    if (!name) {
      showStatus(statusName, "Enter your name or company to continue.", false);
      return;
    }
    try {
      await SupplierData.ensureSupplier(name);
      showProducts(name);
      Store.toast("Welcome, " + name);
    } catch (err) {
      showStatus(statusName, err.message || "Could not continue. Try again.", false);
    }
  });

  $("change-supplier")?.addEventListener("click", () => {
    showName();
    if ($("supplier-name")) $("supplier-name").value = "";
  });

  productForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = SupplierData.getSessionSupplierName();
    if (!name) {
      showName();
      return;
    }
    const payload = {
      name: $("product-name").value,
      title: $("product-title").value,
      price: $("product-price").value,
      category: $("product-category").value,
      description: $("product-description").value,
      image: $("product-image").value
    };
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";
    }
    try {
      await SupplierData.addProduct(name, payload);
      productForm.reset();
      paintCount(name);
      showStatus(status, "Saved. Ready for the next product.", true);
      Store.toast("Product saved");
      $("product-name")?.focus();
    } catch (err) {
      showStatus(status, err.message || "Could not save this product.", false);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save product";
      }
    }
  });

  try {
    const cats = [...new Set(Store.getProducts().map((p) => p.category).filter(Boolean))].slice(0, 80);
    const list = $("supplier-category-options");
    if (list) list.innerHTML = cats.map((c) => `<option value="${Store.safeText(c)}">`).join("");
  } catch (e) {}

  Store.applyStoreName();
});
