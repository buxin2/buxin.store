document.addEventListener("DOMContentLoaded",()=>{
  const grid=document.getElementById("product-grid");if(!grid)return;
  const search=document.getElementById("product-search"),filter=document.getElementById("category-filter"),empty=document.getElementById("empty-products");
  const products=Store.getProducts();
  const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();
  cats.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;filter?.appendChild(o)});
  function render(){const q=(search?.value||"").toLowerCase();const c=filter?.value||"all";const list=Store.getProducts().filter(p=>(c==="all"||p.category===c)&&`${p.name} ${p.title} ${p.description} ${p.category}`.toLowerCase().includes(q));grid.innerHTML=list.map(p=>`<article class="product-card"><a class="product-image-link" href="product-details.html?id=${encodeURIComponent(p.id)}">${Store.productImage(p.image,p.name)}</a><div class="product-info"><span class="product-category">${Store.safeText(p.category||"General")}</span><h3><a href="product-details.html?id=${encodeURIComponent(p.id)}">${Store.safeText(p.name)}</a></h3><div class="product-price">${Store.money(p.price)}</div><div class="product-card-actions"><a class="btn btn-outline" href="product-details.html?id=${encodeURIComponent(p.id)}">View product ↗</a><button class="btn btn-soft" data-add="${p.id}">＋ Add to cart</button></div></div></article>`).join("");empty?.classList.toggle("hidden",list.length>0)}
  search?.addEventListener("input",render);filter?.addEventListener("change",render);
  grid.addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(!b)return;Store.addToCart(b.dataset.add);Store.toast("Product added to your cart.")});
  render();
  document.querySelector(".menu-toggle")?.addEventListener("click",()=>document.querySelector(".main-nav")?.classList.toggle("open"));
  const contact=document.getElementById("contact-whatsapp");if(contact){contact.addEventListener("click",e=>{e.preventDefault();Store.openWhatsApp("Hello! I have a question about your products.")})}
});