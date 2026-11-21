(function () {
  const PRODUCTS_KEY = "buxin_store_products_v1";
  const CART_KEY = "nova_store_cart_v1";
  const SETTINGS_KEY = "nova_store_settings_v1";
  const PRICE_RULES_KEY = "buxin_store_price_rules_v1";
  const GAMBIA_KEY = "buxin_store_gambia_v1";
  const SHIPPING_KEY = "buxin_store_shipping_v1";
  const IMAGE_FALLBACK = "assets/placeholder.svg";
  const sampleProducts = [
    {id:"PRD001",name:"Wireless Headphones",title:"Everyday Wireless Headphones",price:2499,description:"Enjoy your favorite music, podcasts, and calls with comfortable wireless headphones. A simple everyday essential with a clean, modern design.",image:"",category:"Electronics"},
    {id:"PRD002",name:"Smart Watch",title:"Smart Watch Series One",price:1899,description:"Keep your day organized with a versatile smartwatch. Designed for everyday wear and easy pairing with your lifestyle.",image:"",category:"Electronics"},
    {id:"PRD003",name:"Desk Lamp",title:"Minimal LED Desk Lamp",price:999,description:"A clean, modern desk lamp for your workspace, study table, or bedside. Simple styling that fits into any room.",image:"",category:"Home & Living"},
    {id:"PRD004",name:"Travel Backpack",title:"Everyday Travel Backpack",price:1599,description:"A practical everyday backpack for work, study, and travel. Spacious, versatile, and easy to carry.",image:"",category:"Accessories"}
  ];
  function read(key, fallback){try{const value=JSON.parse(localStorage.getItem(key));return value===null?fallback:value}catch(e){return fallback}}
  function freeStorageSpace(){try{localStorage.removeItem(PRODUCTS_KEY)}catch(e){}try{localStorage.removeItem("buxin_store_site_data_v1")}catch(e){}}
  function write(key,value){const text=JSON.stringify(value);try{localStorage.setItem(key,text);return true}catch(e){freeStorageSpace();try{localStorage.setItem(key,text);return true}catch(err){console.warn("Storage write failed for",key,err);return false}}}
  function hasKey(key){return localStorage.getItem(key)!==null}
  const CHANGE_EVENT="buxin:store-change";
  let changeChannel=null;
  try{changeChannel=typeof BroadcastChannel==="function"?new BroadcastChannel("buxin-store"):null}catch(e){changeChannel=null}
  function notifyChange(reason){const detail={reason:reason||"update",at:Date.now()};try{window.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail}))}catch(e){}try{changeChannel&&changeChannel.postMessage(detail)}catch(e){}}
  function subscribe(handler){if(typeof handler!=="function")return ()=>{};const watched=[PRICE_RULES_KEY,SHIPPING_KEY,GAMBIA_KEY,SETTINGS_KEY,PRODUCTS_KEY,CART_KEY,"buxin_store_site_data_v1"];const run=detail=>{try{updateCartCount()}catch(e){}handler(detail||{reason:"update"})};const onLocal=event=>run(event.detail||{reason:"local"});const onChannel=event=>run(event.data||{reason:"channel"});const onStorage=event=>{if(!event.key||watched.includes(event.key))run({reason:"storage",key:event.key})};window.addEventListener(CHANGE_EVENT,onLocal);window.addEventListener("storage",onStorage);if(changeChannel)changeChannel.addEventListener("message",onChannel);return ()=>{window.removeEventListener(CHANGE_EVENT,onLocal);window.removeEventListener("storage",onStorage);if(changeChannel)changeChannel.removeEventListener("message",onChannel)}}
  // Old admin saves dumped the whole catalogue into localStorage and filled the browser quota.
  try{const raw=localStorage.getItem(PRODUCTS_KEY);if(raw&&raw.length>400000)localStorage.removeItem(PRODUCTS_KEY)}catch(e){}
  function publishedData(){return window.STORE_DATA&&typeof window.STORE_DATA==="object"?window.STORE_DATA:{}}
  function normalizePriceRules(raw){const source=raw&&typeof raw==="object"?raw:defaultPriceRules();const factor=Number(source.factor),offset=Number(source.offset),overrides={};if(source.overrides&&typeof source.overrides==="object")Object.keys(source.overrides).forEach(id=>{const n=Number(source.overrides[id]);if(Number.isFinite(n))overrides[String(id)]=n});const lastAmount=source.lastAmount===null||source.lastAmount===undefined||source.lastAmount===""?null:Number(source.lastAmount);const version=Number(source.version)||1;return {version:Number.isFinite(version)&&version>0?version:1,factor:Number.isFinite(factor)&&factor>0?factor:1,offset:Number.isFinite(offset)?offset:0,overrides,lastOperation:typeof source.lastOperation==="string"?source.lastOperation:"",lastAmount:Number.isFinite(lastAmount)?lastAmount:null}}
  function whatsappDigits(value){return String(value||"").replace(/\D/g,"")}
  // Number comes only from Admin save (browser) or locked store-data.js — never from config placeholders.
  function pickWhatsAppNumber(){const published=publishedData().settings&&typeof publishedData().settings==="object"?publishedData().settings:{};const saved=hasKey(SETTINGS_KEY)?read(SETTINGS_KEY,{}):{};const candidates=[saved.whatsappNumber,published.whatsappNumber].map(whatsappDigits);return candidates.find(d=>d&&d.length>=8)||""}
  function getSettings(){const config=window.STORE_CONFIG||{};const published=publishedData().settings&&typeof publishedData().settings==="object"?publishedData().settings:{};const saved=hasKey(SETTINGS_KEY)?read(SETTINGS_KEY,{}):{};const settings={...config,...published,...saved};if(!settings.storeName||settings.storeName==="Nova Store")settings.storeName=published.storeName||config.storeName||"Buxin Store";settings.whatsappNumber=pickWhatsAppNumber();settings.currency=config.currency;settings.currencyLocale=config.currencyLocale;settings.usdToInr=config.usdToInr;settings.inrToGmd=config.inrToGmd;settings.priceMarkup=config.priceMarkup;return settings}
  function saveSettings(settings){const next={...settings,whatsappNumber:whatsappDigits(settings.whatsappNumber)};write(SETTINGS_KEY,next);rememberSiteData();notifyChange("settings");return true}
  function displayCategory(product){const category=product.category||"General";if(category==="Modules")return "Modules & Components";if(category==="Starter Kits")return "Starter & Learning Kits";return category}
  function getGambiaIds(){const saved=hasKey(GAMBIA_KEY)?read(GAMBIA_KEY,[]):null;const published=Array.isArray(publishedData().gambiaIds)?publishedData().gambiaIds:(Array.isArray(window.GAMBIA_PRODUCT_IDS)?window.GAMBIA_PRODUCT_IDS:[]);const ids=Array.isArray(saved)?saved:published;return [...new Set(ids.map(id=>String(id)))]}
  function setGambiaAvailable(id,on){const ids=new Set(getGambiaIds());if(on)ids.add(String(id));else ids.delete(String(id));write(GAMBIA_KEY,[...ids]);rememberSiteData();notifyChange("gambia");return true}
  function getShippingFee(){const saved=hasKey(SHIPPING_KEY)?Number(read(SHIPPING_KEY,0)):null;const n=saved===null?Number(publishedData().shippingFee||0):saved;return Number.isFinite(n)&&n>0?Math.round(n):0}
  function setShippingFee(amount){const n=Number(amount);if(!Number.isFinite(n)||n<0)return {ok:false,message:"Enter 0 or more dalasi for shipping."};if(!write(SHIPPING_KEY,Math.round(n)))return {ok:false,message:"Could not save shipping. Clear site data for this website in your browser and try again."};rememberSiteData();notifyChange("shipping");return {ok:true}}
  function withDelivery(description,sameDay){const note=sameDay?"Buy today, get it today.":"This product will arrive in 7 to 20 days.";const other=sameDay?"This product will arrive in 7 to 20 days.":"Buy today, get it today.";let text=String(description||"").trim();if(text.includes(other))text=text.replaceAll(other,"").replace(/\n{3,}/g,"\n\n").trim();if(text.includes(note))return text;return text?text+"\n\n"+note:note}
  function defaultPriceRules(){return {version:2,factor:1,offset:0,overrides:{},lastOperation:"",lastAmount:null}}
  function catalogProducts(){return Array.isArray(window.CATALOG_PRODUCTS)&&window.CATALOG_PRODUCTS.length?window.CATALOG_PRODUCTS:sampleProducts}
  function dalasiBase(item){const c=window.STORE_CONFIG||{};const usdRate=Number(c.usdToInr)||0,mk=Number(c.priceMarkup)||1,inrToGmd=Number(c.inrToGmd)||0;if(item.costUsd&&usdRate>0&&inrToGmd>0){const inr=Math.round(Number(item.costUsd)*usdRate*mk);return inr>0?Math.round(inr*inrToGmd):0}const amount=Number(item.price)||0;if(item.priceCurrency==="GMD")return amount>0?Math.round(amount):0;if(amount>0&&inrToGmd>0)return Math.round(amount*inrToGmd);return amount>0?Math.round(amount):0}
  function migratePriceRules(rules){const next={...rules,overrides:{...rules.overrides}};const catalog=new Map(catalogProducts().map(p=>[String(p.id),p]));Object.keys(next.overrides).forEach(id=>{const seed=catalog.get(String(id));if(!seed)return;const base=dalasiBase(seed);if(base>0&&Math.round(Number(next.overrides[id]))===Math.round(base))delete next.overrides[id]});if((Number(next.version)||1)<2){const factor=next.factor||1;Object.keys(next.overrides).forEach(id=>{const shelf=Number(next.overrides[id]);if(!Number.isFinite(shelf))return;next.overrides[id]=Math.max(0,Math.round((shelf-next.offset)/factor))});next.version=2}return next}
  function getPriceRules(){const loaded=hasKey(PRICE_RULES_KEY)?normalizePriceRules(read(PRICE_RULES_KEY,null)):normalizePriceRules(publishedData().priceRules);const migrated=migratePriceRules(loaded);if(JSON.stringify(migrated)!==JSON.stringify(loaded))write(PRICE_RULES_KEY,migrated);return migrated}
  function savePriceRules(rules){const next=migratePriceRules(normalizePriceRules(rules));next.version=2;if(!write(PRICE_RULES_KEY,next))return {ok:false,message:"Could not save prices. Clear site data for this website in your browser and try again."};rememberSiteData();notifyChange("pricing");return {ok:true}}
  function formatPriceFactor(factor){const n=Number(factor);if(!Number.isFinite(n)||n<=0)return "×1";const rounded=Math.round(n*10000)/10000;return "×"+(Number.isInteger(rounded)?String(rounded):String(rounded))}
  function buildSiteData(){const s=getSettings();const rules=getPriceRules();return {version:1,updatedAt:new Date().toISOString(),settings:{storeName:s.storeName||"Buxin Store",whatsappNumber:String(s.whatsappNumber||"").replace(/\D/g,""),cloudinaryCloudName:s.cloudinaryCloudName||"",cloudinaryUploadPreset:s.cloudinaryUploadPreset||""},shippingFee:getShippingFee(),priceRules:rules,gambiaIds:getGambiaIds()}}
  function siteDataFileText(data){return "window.STORE_DATA = "+JSON.stringify(data||buildSiteData(),null,2)+";\n"}
  function rememberSiteData(){const data=buildSiteData();window.STORE_DATA=data;try{write("buxin_store_site_data_v1",data)}catch(e){}return data}
  async function downloadSiteData(){const text=siteDataFileText(rememberSiteData());if(window.showSaveFilePicker){try{const handle=await window.showSaveFilePicker({suggestedName:"store-data.js",types:[{description:"JavaScript",accept:{"text/javascript":[".js"]}}]});const writable=await handle.createWritable();await writable.write(text);await writable.close();return {ok:true,method:"file"}}catch(err){if(err&&err.name==="AbortError")return {ok:false,cancelled:true}}}const blob=new Blob([text],{type:"text/javascript"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="store-data.js";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);return {ok:true,method:"download"}}
  function finalDalasi(base,id,rules){const key=String(id);const hasOverride=Object.prototype.hasOwnProperty.call(rules.overrides,key);const amount=hasOverride?Number(rules.overrides[key]):base;if(!Number.isFinite(amount)||amount<=0)return 0;const next=Math.round(amount*rules.factor+rules.offset);return next>0?next:0}
  function productOverrides(){const saved=read(PRODUCTS_KEY,null);return Array.isArray(saved)?saved:[]}
  function getProducts(){const catalog=catalogProducts();const originals=new Map(catalog.map(p=>[String(p.id),p]));const overrides=productOverrides();const overrideMap=new Map(overrides.map(p=>[String(p.id),p]));const list=catalog.map(p=>overrideMap.has(String(p.id))?{...p,...overrideMap.get(String(p.id))}:p);overrides.forEach(p=>{if(!originals.has(String(p.id)))list.push(p)});const rules=getPriceRules();const gambia=new Set(getGambiaIds());const shippingFee=getShippingFee();return list.map(x=>{const seed=originals.get(String(x.id))||x;const item={...seed,...x,category:displayCategory({...seed,...x})};item.inGambia=gambia.has(String(item.id))||item.inGambia===true;item.description=withDelivery(item.description,item.inGambia);const base=dalasiBase(seed);item.basePrice=base;item.productPrice=finalDalasi(base,item.id,rules);item.shipping=(!item.inGambia&&item.productPrice>0&&shippingFee>0)?shippingFee:0;item.price=item.productPrice+item.shipping;item.priceCurrency="GMD";return item})}
  function adjustAllPrices(operation,amount){const n=Number(amount);if(!Number.isFinite(n))return {ok:false,message:"Enter a number."};const rules=getPriceRules();if(operation==="multiply"){if(n<=0)return {ok:false,message:"Enter a number greater than 0 to multiply."};rules.factor*=n;rules.offset*=n}else if(operation==="divide"){if(n<=0)return {ok:false,message:"Enter a number greater than 0 to divide."};rules.factor/=n;rules.offset/=n}else if(operation==="add"){if(n<0)return {ok:false,message:"Enter 0 or more dalasi to add."};rules.offset+=n}else if(operation==="subtract"){if(n<0)return {ok:false,message:"Enter 0 or more dalasi to subtract."};rules.offset-=n}else return {ok:false,message:"Choose multiply, divide, add, or subtract."};rules.lastOperation=operation;rules.lastAmount=n;rules.version=2;const saved=savePriceRules(rules);if(!saved.ok)return saved;return {ok:true}}
  function setProductPrice(id,price){const n=Number(price);if(!id||!Number.isFinite(n)||n<0)return false;const rules=getPriceRules();const factor=rules.factor||1;const raw=(n-rules.offset)/factor;rules.overrides[String(id)]=Math.max(0,Math.round(raw));rules.version=2;const saved=savePriceRules(rules);return !!saved.ok}
  function resetPriceAdjustments(){return savePriceRules(defaultPriceRules())}
  function saveProducts(products){const catalog=catalogProducts();const originals=new Map(catalog.map(p=>[String(p.id),p]));const slim=[];(Array.isArray(products)?products:[]).forEach(p=>{const id=String(p.id||"");if(!id)return;const orig=originals.get(id);const row={id,name:p.name,title:p.title||p.name||"",price:Number(p.productPrice??p.price)||0,priceCurrency:"GMD",category:p.category||"General",description:p.description||"",image:p.image||""};if(p.costUsd!==undefined&&p.costUsd!==null&&p.costUsd!=="")row.costUsd=Number(p.costUsd);if(!orig){slim.push(row);return}const changed=row.name!==orig.name||row.title!==(orig.title||orig.name||"")||row.category!==(orig.category||"General")||row.description!==(orig.description||"")||row.image!==(orig.image||"");if(changed)slim.push(row)});let ok=true;if(!slim.length){try{localStorage.removeItem(PRODUCTS_KEY)}catch(e){}}else ok=write(PRODUCTS_KEY,slim);notifyChange("products");return ok}
  function getCart(){return read(CART_KEY,[])}
  function saveCart(cart){write(CART_KEY,cart);updateCartCount();notifyChange("cart")}
  function updateCartCount(){const count=getCart().reduce((s,i)=>s+Number(i.quantity||0),0);document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=count)}
  function money(value){if(!Number(value))return "Ask for price";const s=getSettings();const amount=Math.round(Number(value)||0);try{return new Intl.NumberFormat(s.currencyLocale,{style:"currency",currency:s.currency,maximumFractionDigits:0}).format(amount)}catch(e){return "D"+amount}}
  function safeText(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function productImage(url,alt=""){if(url)return `<img class="product-image" src="${safeText(url)}" alt="${safeText(alt)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="product-image-fallback" style="display:none">✳</div>`;return `<div class="product-image-fallback">✳</div>`}
  function addToCart(id,quantity=1){const product=getProducts().find(p=>p.id===id);if(!product)return false;const cart=getCart();const existing=cart.find(i=>i.id===id);if(existing)existing.quantity+=quantity;else cart.push({id,quantity});saveCart(cart);return true}
  function updateQuantity(id,quantity){let cart=getCart();if(quantity<=0)cart=cart.filter(i=>i.id!==id);else{const item=cart.find(i=>i.id===id);if(item)item.quantity=quantity}saveCart(cart)}
  function removeFromCart(id){saveCart(getCart().filter(i=>i.id!==id))}
  function cartDetails(){const products=getProducts(),cart=getCart();const items=cart.map(i=>{const p=products.find(x=>x.id===i.id);if(!p)return null;const quantity=i.quantity;return {...p,quantity,productSubtotal:Number(p.productPrice)*quantity,shippingSubtotal:Number(p.shipping)*quantity,subtotal:Number(p.price)*quantity}}).filter(Boolean);return {items,productTotal:items.reduce((s,i)=>s+i.productSubtotal,0),shippingTotal:items.reduce((s,i)=>s+i.shippingSubtotal,0),total:items.reduce((s,i)=>s+i.subtotal,0),count:items.reduce((s,i)=>s+i.quantity,0)}}
  function whatsappUrl(message){const number=whatsappDigits(getSettings().whatsappNumber);if(!number||number.length<8){alert("Please configure a valid WhatsApp number in the admin settings.");return null}return `https://wa.me/${number}?text=${encodeURIComponent(message)}`}
  function isMobileWhatsApp(){return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent||"")}
  function openWhatsApp(message){
    const url=whatsappUrl(message);
    if(!url)return;
    // Phones often block window.open; same-tab wa.me opens the WhatsApp app reliably.
    if(isMobileWhatsApp()){window.location.href=url;return}
    const opened=window.open(url,"_blank","noopener,noreferrer");
    if(!opened)window.location.href=url;
  }
  function applyWhatsApp(){
    const contactMsg="Hello! I would like to contact Buxin Store.";
    const contactUrl=whatsappUrl(contactMsg);
    const float=document.getElementById("whatsapp-float");
    if(float){
      if(contactUrl){
        if(float.tagName==="A"){
          float.href=contactUrl;
          float.target=isMobileWhatsApp()?"_self":"_blank";
          float.rel="noopener noreferrer";
        }
        float.style.display="";
        float.onclick=isMobileWhatsApp()?null:event=>{event.preventDefault();openWhatsApp(contactMsg)};
      }else{
        if(float.tagName==="A")float.href="#";
        float.onclick=event=>{event.preventDefault();alert("WhatsApp number is not set yet. Add it in Admin → Settings, then Lock site data house and PUSH.")};
      }
    }
    const contact=document.getElementById("contact-whatsapp");
    if(contact){
      if(contactUrl){
        contact.href=contactUrl;
        contact.target=isMobileWhatsApp()?"_self":"_blank";
        contact.rel="noopener noreferrer";
      }else{
        contact.href="#";
        contact.removeAttribute("target");
      }
    }
  }
  function priceBreakdownHtml(p){if(!Number(p.productPrice)&&!Number(p.price))return `<div class="detail-price">${money(0)}</div>`;if(p.inGambia)return `<div class="detail-price">${money(p.price)}</div><div class="price-breakdown"><span>No shipping</span><span>Available in The Gambia · buy today, get it today</span></div>`;if(Number(p.shipping)>0)return `<div class="detail-price">${money(p.price)}</div><div class="price-breakdown"><span>Product ${money(p.productPrice)}</span><span>Shipping ${money(p.shipping)}</span><span class="price-breakdown-total">Total ${money(p.price)}</span></div>`;return `<div class="detail-price">${money(p.price)}</div>`}
  function cardPriceHtml(p){if(!Number(p.price))return money(0);if(Number(p.shipping)>0)return `${money(p.price)}<small class="price-note">Product ${money(p.productPrice)} + shipping ${money(p.shipping)}</small>`;if(p.inGambia)return `${money(p.price)}<small class="price-note">No shipping</small>`;return money(p.price)}
  function productMessage(p,q){const quantity=Math.max(1,Number(q)||1);const productSub=Number(p.productPrice)*quantity;const shipSub=Number(p.shipping)*quantity;const total=Number(p.price)*quantity;let msg=`Hello! I would like to order from Buxin Store.\n\nPRODUCT\n${p.name}`;if(p.title)msg+=`\n${p.title}`;msg+=`\nQuantity: ${quantity}\n\nPRICE BREAKDOWN\nProduct price: ${money(p.productPrice)} each`;if(p.inGambia)msg+=`\nShipping: None (available in The Gambia)`;else if(Number(p.shipping)>0)msg+=`\nShipping: ${money(p.shipping)} each`;else msg+=`\nShipping: None`;msg+=`\nUnit total: ${money(p.price)} each\n\nProduct subtotal: ${money(productSub)}\nShipping subtotal: ${shipSub?money(shipSub):"None"}\n--------------------\nTOTAL TO PAY: ${money(total)}\n--------------------\n\nPlease let me know how to proceed.`;return msg}
  function cartMessage(){const d=cartDetails();let msg="Hello! I would like to place an order from Buxin Store.\n\nMY ORDER\n\n";d.items.forEach((p,i)=>{msg+=`${i+1}. ${p.name}\n   Quantity: ${p.quantity}\n   Product price: ${money(p.productPrice)} each\n`;msg+=p.inGambia?`   Shipping: None (available in The Gambia)\n`:Number(p.shipping)>0?`   Shipping: ${money(p.shipping)} each\n`:`   Shipping: None\n`;msg+=`   Unit total: ${money(p.price)} each\n   Line total: ${money(p.subtotal)}\n\n`});msg+=`--------------------\nTOTAL ITEMS: ${d.count}\nPRODUCT TOTAL: ${money(d.productTotal)}\nSHIPPING TOTAL: ${d.shippingTotal?money(d.shippingTotal):"None"}\nTOTAL TO PAY: ${money(d.total)}\n--------------------\n\nPlease let me know how to proceed with this order.`;return msg}
  function toast(message){const el=document.getElementById("toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
  function applyStoreName(){const name=getSettings().storeName||"Buxin Store";document.querySelectorAll("[data-store-name]").forEach(el=>el.textContent=name);document.title=document.title.replace("Buxin Store",name);const y=document.getElementById("year");if(y)y.textContent=new Date().getFullYear();applyWhatsApp()}
  window.Store={getProducts,saveProducts,getCart,saveCart,addToCart,updateQuantity,removeFromCart,cartDetails,money,safeText,productImage,openWhatsApp,whatsappUrl,productMessage,cartMessage,priceBreakdownHtml,cardPriceHtml,toast,updateCartCount,getSettings,saveSettings,applyStoreName,applyWhatsApp,getPriceRules,adjustAllPrices,setProductPrice,resetPriceAdjustments,formatPriceFactor,getGambiaIds,setGambiaAvailable,getShippingFee,setShippingFee,buildSiteData,siteDataFileText,rememberSiteData,downloadSiteData,notifyChange,subscribe,IMAGE_FALLBACK,CHANGE_EVENT};
  function bootUi(){updateCartCount();applyStoreName();subscribe(()=>{updateCartCount();applyWhatsApp()})}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootUi);else bootUi();
})();