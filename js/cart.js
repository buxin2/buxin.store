document.addEventListener("DOMContentLoaded", () => {
  const itemsRoot = document.getElementById("cart-items");
  const summary = document.getElementById("cart-summary");
  const empty = document.getElementById("cart-empty");
  const layout = document.getElementById("cart-content");

  function render() {
    const d = Store.cartDetails();
    if (!d.items.length) {
      layout.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }
    layout.classList.remove("hidden");
    empty.classList.add("hidden");
    itemsRoot.innerHTML = d.items.map(p => {
      const note = p.inGambia
        ? "No shipping · In The Gambia"
        : Number(p.shipping) > 0
          ? `Product ${Store.money(p.productPrice)} + shipping ${Store.money(p.shipping)}`
          : Store.money(p.price) + " each";
      return `<article class="cart-item"><div>${p.image ? `<img class="cart-item-image" src="${Store.safeText(p.image)}" alt="${Store.safeText(p.name)}" onerror="this.style.display='none'">` : `<div class="cart-item-image product-image-fallback">✳</div>`}</div><div><h3>${Store.safeText(p.name)}</h3><div class="cart-item-price">${Store.money(p.price)} each</div><div class="cart-item-note">${note}</div><div class="cart-item-actions"><div class="quantity-control"><button data-minus="${p.id}" aria-label="Decrease">−</button><span>${p.quantity}</span><button data-plus="${p.id}" aria-label="Increase">＋</button></div><button class="remove-button" data-remove="${p.id}">Remove</button></div></div><div class="cart-line-total">${Store.money(p.subtotal)}</div></article>`;
    }).join("");
    summary.innerHTML = `<h3>Order summary</h3><div class="summary-row"><span>Products (${d.count})</span><strong>${Store.money(d.productTotal)}</strong></div><div class="summary-row"><span>Shipping</span><strong>${d.shippingTotal ? Store.money(d.shippingTotal) : "None"}</strong></div><div class="summary-row summary-total"><span>Total to pay</span><strong>${Store.money(d.total)}</strong></div><button id="checkout-button" class="btn btn-primary">Checkout on WhatsApp ↗</button><small>WhatsApp will show product price, shipping, and the total clearly. Products in The Gambia have no shipping.</small>`;
    document.getElementById("checkout-button").onclick = () => Store.openWhatsApp(Store.cartMessage());
  }

  itemsRoot.addEventListener("click", e => {
    const plus = e.target.closest("[data-plus]");
    const minus = e.target.closest("[data-minus]");
    const remove = e.target.closest("[data-remove]");
    if (plus) {
      const i = Store.getCart().find(x => x.id === plus.dataset.plus);
      if (i) Store.updateQuantity(i.id, i.quantity + 1);
    }
    if (minus) {
      const i = Store.getCart().find(x => x.id === minus.dataset.minus);
      if (i) Store.updateQuantity(i.id, i.quantity - 1);
    }
    if (remove) Store.removeFromCart(remove.dataset.remove);
    render();
  });

  render();
  Store.subscribe(() => render());
});
