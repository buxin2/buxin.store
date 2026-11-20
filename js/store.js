(function () {
  const PRODUCTS_KEY = "nova_store_products_v1";
  const CART_KEY = "nova_store_cart_v1";
  const SETTINGS_KEY = "nova_store_settings_v1";
  const IMAGE_FALLBACK = "assets/placeholder.svg";
  const sampleProducts = [
    {id:"PRD001",name:"Wireless Headphones",title:"Everyday Wireless Headphones",price:2499,description:"Enjoy your favorite music, podcasts, and calls with comfortable wireless headphones. A simple everyday essential with a clean, modern design.",image:"",category:"Electronics"},
    {id:"PRD002",name:"Smart Watch",title:"Smart Watch Series One",price:1899,description:"Keep your day organized with a versatile smartwatch. Designed for everyday wear and easy pairing with your lifestyle.",image:"",category:"Electronics"},
    {id:"PRD003",name:"Desk Lamp",title:"Minimal LED Desk Lamp",price:999,description:"A clean, modern desk lamp for your workspace, study table, or bedside. Simple styling that fits into any room.",image:"",category:"Home & Living"},
    {id:"PRD004",name:"Travel Backpack",title:"Everyday Travel Backpack",price:1599,description:"A practical everyday backpack for work, study, and travel. Spacious, versatile, and easy to carry.",image:"",category:"Accessories"}
  ];
  function read(key, fallback){try{const value=JSON.parse(localStorage.getItem(key));return value===null?fallback:value}catch(e){return fallback}}
  function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
  function getSettings(){const saved=read(SETTINGS_KEY,{});const settings={...window.STORE_CONFIG,...saved};if(!saved.storeName||saved.storeName==="Nova Store")settings.storeName=window.STORE_CONFIG.storeName;return settings}
  function saveSettings(settings){write(SETTINGS_KEY,settings)}
  function getProducts(){let p=read(PRODUCTS_KEY,null);if(!Array.isArray(p)){p=sampleProducts;write(PRODUCTS_KEY,p)}return p}
  function saveProducts(products){write(PRODUCTS_KEY,products)}
  function getCart(){return read(CART_KEY,[])}
  function saveCart(cart){write(CART_KEY,cart);updateCartCount()}
  function updateCartCount(){const count=getCart().reduce((s,i)=>s+Number(i.quantity||0),0);document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=count)}
  function money(value){const s=getSettings();try{return new Intl.NumberFormat(s.currencyLocale,{style:"currency",currency:s.currency,maximumFractionDigits:2}).format(Number(value)||0)}catch(e){return "₹"+(Number(value)||0).toFixed(2)}}
  function safeText(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function productImage(url,alt=""){if(url)return `<img class="product-image" src="${safeText(url)}" alt="${safeText(alt)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="product-image-fallback" style="display:none">✳</div>`;return `<div class="product-image-fallback">✳</div>`}
  function addToCart(id,quantity=1){const product=getProducts().find(p=>p.id===id);if(!product)return false;const cart=getCart();const existing=cart.find(i=>i.id===id);if(existing)existing.quantity+=quantity;else cart.push({id,quantity});saveCart(cart);return true}
  function updateQuantity(id,quantity){let cart=getCart();if(quantity<=0)cart=cart.filter(i=>i.id!==id);else{const item=cart.find(i=>i.id===id);if(item)item.quantity=quantity}saveCart(cart)}
  function removeFromCart(id){saveCart(getCart().filter(i=>i.id!==id))}
  function cartDetails(){const products=getProducts(),cart=getCart();const items=cart.map(i=>{const p=products.find(x=>x.id===i.id);return p?{...p,quantity:i.quantity,subtotal:Number(p.price)*i.quantity}:null}).filter(Boolean);return {items,total:items.reduce((s,i)=>s+i.subtotal,0),count:items.reduce((s,i)=>s+i.quantity,0)}}
  function whatsappUrl(message){const number=String(getSettings().whatsappNumber||"").replace(/\D/g,"");if(!number||number.length<8){alert("Please configure a valid WhatsApp number in the admin settings.");return null}return `https://wa.me/${number}?text=${encodeURIComponent(message)}`}
  function openWhatsApp(message){const url=whatsappUrl(message);if(url)window.open(url,"_blank","noopener,noreferrer")}
  function productMessage(p,q){const total=Number(p.price)*q;return `Hello! I would like to order:\n\nPRODUCT: ${p.name}\n${p.title||""}\nQuantity: ${q}\nUnit price: ${money(p.price)}\nTotal: ${money(total)}\n\nPlease let me know how to proceed.`}
  function cartMessage(){const d=cartDetails();let msg="Hello! I would like to place an order.\n\nMY ORDER:\n\n";d.items.forEach((p,i)=>{msg+=`${i+1}. ${p.name}\n   Quantity: ${p.quantity}\n   Unit Price: ${money(p.price)}\n   Subtotal: ${money(p.subtotal)}\n\n`});msg+=`--------------------\nTOTAL ITEMS: ${d.count}\nTOTAL AMOUNT: ${money(d.total)}\n--------------------\n\nPlease let me know how to proceed with this order.`;return msg}
  function toast(message){const el=document.getElementById("toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
  function applyStoreName(){const name=getSettings().storeName||"Buxin Store";document.querySelectorAll("[data-store-name]").forEach(el=>el.textContent=name);document.title=document.title.replace("Buxin Store",name);const y=document.getElementById("year");if(y)y.textContent=new Date().getFullYear()}
  window.Store={getProducts,saveProducts,getCart,saveCart,addToCart,updateQuantity,removeFromCart,cartDetails,money,safeText,productImage,openWhatsApp,productMessage,cartMessage,toast,updateCartCount,getSettings,saveSettings,applyStoreName,IMAGE_FALLBACK};
  document.addEventListener("DOMContentLoaded",()=>{updateCartCount();applyStoreName()});
})();