(function () {
  const LOCAL_KEY = "buxin_supplier_intake_v1";
  const SESSION_SUPPLIER = "buxin_supplier_name_v1";

  function readLocal() {
    try {
      const value = JSON.parse(localStorage.getItem(LOCAL_KEY));
      return Array.isArray(value) ? value : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocal(list) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  }

  function intakeUrl() {
    const url = String((window.STORE_CONFIG && window.STORE_CONFIG.neonIntakeUrl) || "").trim();
    if (!url) return "";
    return url.replace(/[&?]channel_binding=[^&]*/g, "");
  }

  async function sqlClient() {
    const url = intakeUrl();
    if (!url) return null;
    const mod = await import("https://esm.sh/@neondatabase/serverless@0.10.4");
    return mod.neon(url);
  }

  function newId(prefix) {
    return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function normalizeName(name) {
    return String(name || "").trim().replace(/\s+/g, " ");
  }

  function upsertLocalSupplier(name) {
    const clean = normalizeName(name);
    if (!clean) return null;
    const list = readLocal();
    let row = list.find((s) => s.name.toLowerCase() === clean.toLowerCase());
    if (!row) {
      row = { id: newId("SUP"), name: clean, createdAt: new Date().toISOString(), products: [] };
      list.push(row);
    } else {
      row.name = clean;
    }
    writeLocal(list);
    return row;
  }

  function addLocalProduct(supplierId, product) {
    const list = readLocal();
    const row = list.find((s) => s.id === supplierId);
    if (!row) return null;
    const item = {
      id: product.id || newId("SP"),
      name: product.name,
      title: product.title || product.name,
      price: Number(product.price) || 0,
      category: product.category || "General",
      description: product.description || "",
      image: product.image || "",
      createdAt: product.createdAt || new Date().toISOString()
    };
    row.products = Array.isArray(row.products) ? row.products : [];
    row.products.unshift(item);
    writeLocal(list);
    return item;
  }

  async function ensureSupplier(name) {
    const clean = normalizeName(name);
    if (!clean) throw new Error("Enter the supplier name.");
    const local = upsertLocalSupplier(clean);
    sessionStorage.setItem(SESSION_SUPPLIER, clean);
    const sql = await sqlClient();
    if (sql) {
      try {
        const existing = await sql`SELECT id, name FROM suppliers WHERE lower(name) = lower(${clean}) LIMIT 1`;
        if (existing.length) {
          local.id = existing[0].id;
          const list = readLocal();
          const row = list.find((s) => s.name.toLowerCase() === clean.toLowerCase());
          if (row) {
            row.id = existing[0].id;
            writeLocal(list);
          }
          await sql`UPDATE suppliers SET updated_at = now() WHERE id = ${existing[0].id}`;
          return { id: existing[0].id, name: existing[0].name };
        }
        await sql`INSERT INTO suppliers (id, name) VALUES (${local.id}, ${clean})`;
      } catch (err) {
        console.warn("Neon supplier save failed, kept local copy.", err);
      }
    }
    return { id: local.id, name: local.name };
  }

  async function addProduct(supplierName, product) {
    const supplier = await ensureSupplier(supplierName);
    const item = {
      id: newId("SP"),
      name: String(product.name || "").trim(),
      title: String(product.title || product.name || "").trim(),
      price: Number(product.price) || 0,
      category: String(product.category || "General").trim() || "General",
      description: String(product.description || "").trim(),
      image: String(product.image || "").trim(),
      createdAt: new Date().toISOString()
    };
    if (!item.name) throw new Error("Enter a product name.");
    addLocalProduct(supplier.id, item);
    const sql = await sqlClient();
    if (sql) {
      try {
        await sql`
          INSERT INTO supplier_products (id, supplier_id, name, title, price, category, description, image)
          VALUES (${item.id}, ${supplier.id}, ${item.name}, ${item.title}, ${item.price}, ${item.category}, ${item.description}, ${item.image})
        `;
        await sql`UPDATE suppliers SET updated_at = now() WHERE id = ${supplier.id}`;
      } catch (err) {
        console.warn("Neon product save failed, kept local copy.", err);
      }
    }
    return { supplier, product: item };
  }

  async function listSuppliers() {
    const sql = await sqlClient();
    if (sql) {
      try {
        const rows = await sql`
          SELECT s.id, s.name, s.created_at, s.updated_at,
            COALESCE((SELECT count(*)::int FROM supplier_products p WHERE p.supplier_id = s.id), 0) AS product_count
          FROM suppliers s
          ORDER BY s.updated_at DESC, s.name ASC
        `;
        return rows.map((r) => ({
          id: r.id,
          name: r.name,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          productCount: Number(r.product_count) || 0
        }));
      } catch (err) {
        console.warn("Neon supplier list failed, using local copy.", err);
      }
    }
    return readLocal()
      .map((s) => ({
        id: s.id,
        name: s.name,
        createdAt: s.createdAt,
        updatedAt: s.createdAt,
        productCount: (s.products || []).length,
        products: s.products || []
      }))
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }

  async function listSupplierProducts(supplierId) {
    const sql = await sqlClient();
    if (sql) {
      try {
        const rows = await sql`
          SELECT id, name, title, price, category, description, image, created_at
          FROM supplier_products
          WHERE supplier_id = ${supplierId}
          ORDER BY created_at DESC
        `;
        return rows.map((r) => ({
          id: r.id,
          name: r.name,
          title: r.title,
          price: Number(r.price) || 0,
          category: r.category,
          description: r.description,
          image: r.image,
          createdAt: r.created_at
        }));
      } catch (err) {
        console.warn("Neon product list failed, using local copy.", err);
      }
    }
    const local = readLocal().find((s) => s.id === supplierId);
    return local && Array.isArray(local.products) ? local.products : [];
  }

  function getSessionSupplierName() {
    return normalizeName(sessionStorage.getItem(SESSION_SUPPLIER) || "");
  }

  function clearSessionSupplier() {
    sessionStorage.removeItem(SESSION_SUPPLIER);
  }

  function countLocalProducts(supplierName) {
    const clean = normalizeName(supplierName);
    const row = readLocal().find((s) => s.name.toLowerCase() === clean.toLowerCase());
    return row && Array.isArray(row.products) ? row.products.length : 0;
  }

  window.SupplierData = {
    ensureSupplier,
    addProduct,
    listSuppliers,
    listSupplierProducts,
    getSessionSupplierName,
    clearSessionSupplier,
    countLocalProducts,
    normalizeName
  };
})();
