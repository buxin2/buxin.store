document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("id");
  const root = document.getElementById("product-detail");
  const missing = document.getElementById("detail-not-found");
  let qty = 1;

  function currentProduct() {
    return Store.getProducts().find(x => String(x.id) === String(id));
  }

  function render() {
    const p = currentProduct();
    if (!p) {
      root?.classList.add("hidden");
      missing?.classList.remove("hidden");
      return;
    }
    missing?.classList.add("hidden");
    root?.classList.remove("hidden");
    document.title = `${p.name} | ${Store.getSettings().storeName}`;
    root.innerHTML = `<div class="detail-image-wrap">${p.image ? `<img src="${Store.safeText(p.image)}" alt="${Store.safeText(p.name)}" onerror="this.style.display='none'">` : `<div class="product-image-fallback">✳</div>`}</div><div class="detail-copy"><span class="eyebrow">${Store.safeText(p.category || "PRODUCT")}</span><h1>${Store.safeText(p.title || p.name)}</h1>${Store.priceBreakdownHtml(p)}<p class="detail-description">${Store.safeText(p.description || "Contact us for more information about this product.")}</p><div class="detail-actions"><div class="quantity-control"><button id="qty-minus" aria-label="Decrease quantity">−</button><span id="qty-value">${qty}</span><button id="qty-plus" aria-label="Increase quantity">＋</button></div><button id="detail-add" class="btn btn-outline">Add to cart</button><button id="detail-buy" class="btn btn-primary">Buy now ↗</button></div></div>`;
    document.getElementById("qty-minus").onclick = () => {
      qty = Math.max(1, qty - 1);
      document.getElementById("qty-value").textContent = qty;
    };
    document.getElementById("qty-plus").onclick = () => {
      qty += 1;
      document.getElementById("qty-value").textContent = qty;
    };
    document.getElementById("detail-add").onclick = () => {
      const live = currentProduct();
      if (!live) return;
      Store.addToCart(live.id, qty);
      Store.toast("Product added to your cart.");
    };
    document.getElementById("detail-buy").onclick = () => {
      const live = currentProduct();
      if (!live) return;
      Store.openWhatsApp(Store.productMessage(live, qty));
    };
  }

  render();
  Store.subscribe(() => render());
});
