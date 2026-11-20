document.addEventListener("DOMContentLoaded",()=>{
  const id=new URLSearchParams(location.search).get("id"),p=Store.getProducts().find(x=>x.id===id),root=document.getElementById("product-detail"),missing=document.getElementById("detail-not-found");
  if(!p){missing?.classList.remove("hidden");return}
  document.title=`${p.name} | ${Store.getSettings().storeName}`;
  let qty=1;
  root.innerHTML=`<div class="detail-image-wrap">${p.image?`<img src="${Store.safeText(p.image)}" alt="${Store.safeText(p.name)}" onerror="this.style.display='none'">`:`<div class="product-image-fallback">✳</div>`}</div><div class="detail-copy"><span class="eyebrow">${Store.safeText(p.category||"PRODUCT")}</span><h1>${Store.safeText(p.title||p.name)}</h1><div class="detail-price">${Store.money(p.price)}</div><p class="detail-description">${Store.safeText(p.description||"Contact us for more information about this product.")}</p><div class="detail-actions"><div class="quantity-control"><button id="qty-minus" aria-label="Decrease quantity">−</button><span id="qty-value">1</span><button id="qty-plus" aria-label="Increase quantity">＋</button></div><button id="detail-add" class="btn btn-outline">Add to cart</button><button id="detail-buy" class="btn btn-primary">Buy now ↗</button></div></div>`;
  const setQty=()=>document.getElementById("qty-value").textContent=qty;
  document.getElementById("qty-minus").onclick=()=>{qty=Math.max(1,qty-1);setQty()};document.getElementById("qty-plus").onclick=()=>{qty++;setQty()};
  document.getElementById("detail-add").onclick=()=>{Store.addToCart(p.id,qty);Store.toast("Product added to your cart.")};
  document.getElementById("detail-buy").onclick=()=>Store.openWhatsApp(Store.productMessage(p,qty));
});