document.addEventListener("DOMContentLoaded",()=>{
  if(sessionStorage.getItem("nova_admin_session")!=="yes"){location.replace("admin-login.html");return}

  const $=id=>document.getElementById(id);
  const page=document.body.dataset.adminPage||"home";
  let products=Store.getProducts();
  let cloud={name:Store.getSettings().cloudinaryCloudName||"",preset:Store.getSettings().cloudinaryUploadPreset||""};

  const navItems=[
    {id:"home",href:"admin.html",label:"Overview"},
    {id:"products",href:"admin-products.html",label:"Products"},
    {id:"suppliers",href:"admin-suppliers.html",label:"Suppliers"},
    {id:"gambia",href:"admin-gambia.html",label:"In The Gambia"},
    {id:"pricing",href:"admin-pricing.html",label:"Pricing"},
    {id:"shipping",href:"admin-shipping.html",label:"Shipping"},
    {id:"settings",href:"admin-settings.html",label:"Settings"}
  ];

  function renderSidebar(){
    const side=$("admin-sidebar");
    if(!side)return;
    side.innerHTML=`<a class="admin-side-brand" href="admin.html"><img class="brand-logo" src="assets/logo.png" alt=""><span><strong data-store-name>Buxin Store</strong><small>Admin</small></span></a><nav class="admin-nav" aria-label="Admin menu">${navItems.map(item=>`<a href="${item.href}" class="${item.id===page?"active":""}">${item.label}</a>`).join("")}</nav><div class="admin-side-foot"><a href="index.html">View store ↗</a><button type="button" id="logout-button" class="btn btn-outline btn-small">Log out</button></div>`;
    $("logout-button").onclick=()=>{sessionStorage.removeItem("nova_admin_session");location.href="admin-login.html"};
  }

  function refreshProducts(){products=Store.getProducts();return products}

  function initHome(){
    const list=refreshProducts();
    if($("stat-products"))$("stat-products").textContent=list.length;
    if($("stat-categories"))$("stat-categories").textContent=new Set(list.map(p=>p.category)).size;
    if($("stat-gambia"))$("stat-gambia").textContent=list.filter(p=>p.inGambia).length;
    if($("stat-shipping"))$("stat-shipping").textContent=Store.getShippingFee()?Store.money(Store.getShippingFee()):"Not set";
  }

  function initSuppliers(){
    const listEl=$("supplier-list"),empty=$("supplier-empty"),link=$("supplier-link");
    if(link)link.textContent=location.origin.replace(/\/$/,"")+"/supplier.html";
    async function render(){
      if(!window.SupplierData){Store.toast("Supplier tools failed to load.");return}
      listEl.innerHTML=`<p class="settings-hint">Loading suppliers…</p>`;
      try{
        const suppliers=await SupplierData.listSuppliers();
        const totalProducts=suppliers.reduce((n,s)=>n+(Number(s.productCount)||0),0);
        if($("stat-suppliers"))$("stat-suppliers").textContent=suppliers.length;
        if($("stat-supplier-products"))$("stat-supplier-products").textContent=totalProducts;
        empty?.classList.toggle("hidden",suppliers.length>0);
        if(!suppliers.length){listEl.innerHTML="";return}
        const blocks=await Promise.all(suppliers.map(async s=>{
          const products=s.products||await SupplierData.listSupplierProducts(s.id);
          const rows=products.length?products.map(p=>`<tr><td><strong>${Store.safeText(p.name)}</strong><small>${Store.safeText(p.title||"")}</small></td><td>${Store.safeText(p.category||"—")}</td><td>${Store.money(p.price)}</td><td>${Store.safeText(p.description||"—")}</td></tr>`).join(""):`<tr><td colspan="4">No products yet.</td></tr>`;
          return `<article class="supplier-admin-card"><header><div><h3>${Store.safeText(s.name)}</h3><p>${products.length} product${products.length===1?"":"s"}</p></div></header><div class="table-wrap"><table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
        }));
        listEl.innerHTML=blocks.join("");
      }catch(err){
        listEl.innerHTML=`<p class="form-error">Could not load suppliers. ${Store.safeText(err.message||"")}</p>`;
      }
    }
    $("refresh-suppliers")?.addEventListener("click",()=>render().then(()=>Store.toast("Supplier list refreshed.")));
    render();
  }

  function initProducts(){
    const modal=$("product-modal"),form=$("product-form");
    if(!modal||!form)return;

    function refresh(){
      refreshProducts();
      if($("stat-products"))$("stat-products").textContent=products.length;
      if($("stat-categories"))$("stat-categories").textContent=new Set(products.map(p=>p.category)).size;
      const q=($("admin-search")?.value||"").toLowerCase();
      const shown=products.filter(p=>(p.name+" "+p.title+" "+p.category).toLowerCase().includes(q));
      $("admin-empty")?.classList.toggle("hidden",shown.length>0);
      if($("admin-product-list"))$("admin-product-list").innerHTML=shown.map(p=>`<tr><td><div class="table-product">${p.image?`<img src="${Store.safeText(p.image)}" alt="" onerror="this.style.display='none'">`:`<div class="brand-mark">✳</div>`}<div><strong>${Store.safeText(p.name)}</strong><small>${Store.safeText(p.title||"")}</small></div></div></td><td>${Store.safeText(p.category||"—")}</td><td><strong>${Store.money(p.price)}</strong></td><td><div class="table-actions"><button data-edit="${p.id}">Edit</button><button class="delete-action" data-delete="${p.id}">Delete</button></div></td></tr>`).join("");
      const cats=[...new Set(products.map(p=>p.category).filter(Boolean))];
      if($("category-options"))$("category-options").innerHTML=cats.map(c=>`<option value="${Store.safeText(c)}">`).join("");
    }

    function preview(url){
      const img=$("image-preview"),placeholder=$("image-preview-placeholder");
      if(!img||!placeholder)return;
      if(url){img.src=url;img.classList.remove("hidden");placeholder.classList.add("hidden")}
      else{img.classList.add("hidden");placeholder.classList.remove("hidden")}
    }

    function openModal(p){
      form.reset();
      $("edit-id").value=p?.id||"";
      $("modal-title").textContent=p?"Edit product":"Add a product";
      $("form-name").value=p?.name||"";
      $("form-title").value=p?.title||"";
      $("form-price").value=p?.productPrice??p?.price??"";
      $("form-category").value=p?.category||"";
      $("form-description").value=p?.description||"";
      $("form-gambia").checked=!!p?.inGambia;
      $("form-image").value=p?.image||"";
      preview(p?.image||"");
      $("upload-status").textContent=cloud.name&&cloud.preset?"Cloudinary upload is configured.":"Optional. Configure Cloudinary in Settings to enable uploads.";
      modal.classList.remove("hidden");
    }

    function closeModal(){modal.classList.add("hidden")}

    $("add-product-top")?.addEventListener("click",()=>openModal(null));
    document.querySelectorAll("[data-close-modal]").forEach(el=>el.addEventListener("click",closeModal));
    $("admin-search")?.addEventListener("input",refresh);
    $("admin-product-list")?.addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
      if(edit){const p=products.find(x=>x.id===edit.dataset.edit);if(p)openModal(p)}
      if(del){const p=products.find(x=>x.id===del.dataset.delete);if(p&&confirm(`Delete "${p.name}"?`)){Store.saveProducts(products.filter(x=>x.id!==p.id));refresh();Store.toast("Product deleted.")}}
    });
    $("form-image")?.addEventListener("input",e=>preview(e.target.value));
    $("form-image-file")?.addEventListener("change",async e=>{
      const file=e.target.files[0];if(!file)return;
      if(!cloud.name||!cloud.preset){$("upload-status").textContent="Set Cloudinary in Settings first.";e.target.value="";return}
      const fd=new FormData();fd.append("file",file);fd.append("upload_preset",cloud.preset);
      $("upload-status").textContent="Uploading image…";
      try{
        const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud.name)}/image/upload`,{method:"POST",body:fd});
        const data=await response.json();
        if(!response.ok)throw new Error(data.error?.message||"Upload failed");
        $("form-image").value=data.secure_url;preview(data.secure_url);$("upload-status").textContent="Image uploaded successfully.";
      }catch(err){$("upload-status").textContent="Upload failed: "+err.message}
    });
    form.addEventListener("submit",e=>{
      e.preventDefault();
      const id=$("edit-id").value||"PRD"+Date.now().toString(36).toUpperCase();
      const product={id,name:$("form-name").value.trim(),title:$("form-title").value.trim(),price:Number($("form-price").value),priceCurrency:"GMD",category:$("form-category").value.trim(),description:$("form-description").value.trim(),image:$("form-image").value.trim()};
      if(!Number.isFinite(product.price)||product.price<0){alert("Enter a valid product price.");return}
      const index=products.findIndex(p=>p.id===id);
      if(index>=0)products[index]=product;else products.unshift(product);
      Store.setProductPrice(id,product.price);
      Store.setGambiaAvailable(id,$("form-gambia").checked);
      Store.saveProducts(products);
      refresh();closeModal();
      Store.toast(index>=0?"Product updated.":"Product added.");
    });
    refresh();
  }

  function initGambia(){
    if(!$("gambia-settings"))return;
    function gambiaRow(p,marked){return `<div class="price-result"><div><strong>${Store.safeText(p.name)}</strong><small>${Store.safeText(p.category||"General")}${marked?" · Buy today, get it today":""}</small></div><button type="button" class="btn ${marked?"btn-outline":"btn-primary"} btn-small" data-gambia-id="${Store.safeText(p.id)}" data-gambia-on="${marked?"0":"1"}">${marked?"Remove":"Mark in The Gambia"}</button></div>`}
    function renderGambia(){
      refreshProducts();
      const marked=products.filter(p=>p.inGambia);
      if($("gambia-count"))$("gambia-count").textContent=marked.length;
      if($("gambia-current"))$("gambia-current").innerHTML=marked.length?marked.slice(0,40).map(p=>gambiaRow(p,true)).join(""):`<p class="settings-hint">No products marked yet. Search above and mark the ones already in The Gambia.</p>`;
      const q=($("gambia-search")?.value||"").trim().toLowerCase();
      const box=$("gambia-search-results");
      if(!box)return;
      if(!q){box.innerHTML="";return}
      const matches=products.filter(p=>`${p.name} ${p.id}`.toLowerCase().includes(q)).slice(0,12);
      box.innerHTML=matches.length?matches.map(p=>gambiaRow(p,!!p.inGambia)).join(""):`<p class="settings-hint">No product matches that search.</p>`;
    }
    $("gambia-search")?.addEventListener("input",renderGambia);
    $("gambia-settings").addEventListener("click",e=>{
      const button=e.target.closest("[data-gambia-id]");
      if(!button)return;
      Store.setGambiaAvailable(button.dataset.gambiaId,button.dataset.gambiaOn==="1");
      renderGambia();
      Store.toast(button.dataset.gambiaOn==="1"?"Marked as available in The Gambia. Lock site data house before PUSH.":"Removed from The Gambia list. Lock site data house before PUSH.");
    });
    renderGambia();
  }

  function initPricing(){
    if(!$("price-settings"))return;
    function priceStatus(){
      const rules=Store.getPriceRules();
      const sample=Math.round(100*rules.factor+rules.offset);
      const custom=Object.keys(rules.overrides).length;
      const changed=rules.factor!==1||rules.offset!==0||custom>0;
      const lastWords={multiply:`Multiplied by ${rules.lastAmount}`,divide:`Divided by ${rules.lastAmount}`,add:`Added D${rules.lastAmount}`,subtract:`Subtracted D${rules.lastAmount}`};
      if($("price-factor-display"))$("price-factor-display").textContent=Store.formatPriceFactor(rules.factor);
      if($("price-offset-display"))$("price-offset-display").textContent=(rules.offset>=0?"+":"−")+" D"+Math.abs(Math.round(rules.offset));
      if($("price-last-display"))$("price-last-display").textContent=rules.lastOperation&&rules.lastAmount!==null?(lastWords[rules.lastOperation]||"Saved change"):"None yet";
      if(rules.lastOperation&&$("price-operation"))$("price-operation").value=rules.lastOperation;
      if(rules.lastAmount!==null&&Number.isFinite(rules.lastAmount)&&$("price-amount"))$("price-amount").value=rules.lastAmount;
      if(!changed){$("price-rule-status").textContent="No store-wide price change yet. A price of D100 still shows as D100. When you change prices, the multiplier and amount stay saved here after refresh."}
      else $("price-rule-status").textContent=`Saved now: multiplier ${Store.formatPriceFactor(rules.factor)}. A starting price of D100 shows as D${sample>0?sample:0}. This stays after refresh until you change or reset it.${custom?` ${custom} ${custom===1?"product has its own price.":"products have their own price."}`:""}`;
      renderPriceSamples();
    }
    function renderPriceSamples(){
      const box=$("price-sample-results");
      if(!box)return;
      refreshProducts();
      const samples=products.filter(p=>Number(p.productPrice)>0).slice(0,6);
      if(!samples.length){box.innerHTML=`<p class="settings-hint">No priced products to preview yet.</p>`;return}
      box.innerHTML=samples.map(p=>{
        const note=p.shipping?`Product ${Store.money(p.productPrice)} + shipping ${Store.money(p.shipping)}`:`${Store.money(p.productPrice)}`;
        return `<div class="price-result"><div><strong>${Store.safeText(p.name)}</strong><small>${Store.safeText(p.category||"General")} · base D${Math.round(p.basePrice||0)}</small></div><strong>${note}</strong></div>`;
      }).join("");
    }
    function renderPriceSearch(){
      refreshProducts();
      const q=($("price-search")?.value||"").trim().toLowerCase();
      const box=$("price-search-results");
      if(!box)return;
      if(!q){box.innerHTML="";return}
      const matches=products.filter(p=>`${p.name} ${p.id}`.toLowerCase().includes(q)).slice(0,12);
      box.innerHTML=matches.length?matches.map(p=>{
        const note=p.shipping?` · shows as ${Store.money(p.price)} with shipping`:` · ${Store.money(p.price)}`;
        return `<div class="price-result"><div><strong>${Store.safeText(p.name)}</strong><small>${Store.safeText(p.category||"General")}${note}</small></div><form data-price-id="${Store.safeText(p.id)}"><input type="number" min="0" step="1" value="${Number(p.productPrice)||0}" aria-label="Price for ${Store.safeText(p.name)}"><button class="btn btn-outline btn-small" type="submit">Save</button></form></div>`;
      }).join(""):`<p class="settings-hint">No product matches that search.</p>`;
    }
    $("price-adjust-form")?.addEventListener("submit",e=>{
      e.preventDefault();
      const operation=$("price-operation").value;
      const amount=Number($("price-amount").value);
      const words={multiply:`Multiply every price by ${amount}`,divide:`Divide every price by ${amount}`,add:`Add D${amount} to every price`,subtract:`Subtract D${amount} from every price`};
      if(!confirm(`${words[operation]||"Update every price"}? This updates the whole store.`))return;
      try{
        const result=Store.adjustAllPrices(operation,amount);
        if(!result.ok){alert(result.message||"Could not update prices.");return}
        priceStatus();renderPriceSearch();
        Store.toast("Price change saved. Lock site data house before PUSH.");
      }catch(err){alert(err.message||"Could not update prices.")}
    });
    $("price-reset")?.addEventListener("click",()=>{
      if(!confirm("Reset every price back to the original dalasi amount?"))return;
      try{
        const result=Store.resetPriceAdjustments();
        if(result&&result.ok===false){alert(result.message||"Could not reset prices.");return}
        if($("price-operation"))$("price-operation").value="multiply";
        if($("price-amount"))$("price-amount").value="";
        priceStatus();renderPriceSearch();
        Store.toast("Prices reset. Lock site data house before PUSH.");
      }catch(err){alert(err.message||"Could not reset prices.")}
    });
    $("price-search")?.addEventListener("input",renderPriceSearch);
    $("price-search-results")?.addEventListener("submit",e=>{
      const form=e.target.closest("[data-price-id]");
      if(!form)return;
      e.preventDefault();
      const price=Number(form.querySelector("input").value);
      if(!Number.isFinite(price)||price<0){alert("Enter a valid price in dalasi.");return}
      if(!Store.setProductPrice(form.dataset.priceId,price)){alert("Could not save that product price.");return}
      priceStatus();renderPriceSearch();
      Store.toast("Price saved.");
    });
    priceStatus();
    renderPriceSearch();
  }

  function initShipping(){
    if(!$("shipping-form"))return;
    function shippingStatus(){
      const fee=Store.getShippingFee();
      if($("shipping-amount"))$("shipping-amount").value=fee;
      if($("shipping-status"))$("shipping-status").textContent=fee?`Saved shipping: D${fee}. It stays after refresh until you change it, and is added to every priced product that is not available in The Gambia.`:"No shipping price set yet. When you save one, it stays here until you change it.";
    }
    $("shipping-form").addEventListener("submit",e=>{
      e.preventDefault();
      try{
        const result=Store.setShippingFee($("shipping-amount").value);
        if(!result.ok){alert(result.message);return}
        shippingStatus();
        Store.toast(Store.getShippingFee()?"Shipping price saved. Lock site data house before PUSH.":"Shipping cleared. Lock site data house before PUSH.");
      }catch(err){alert(err.message||"Could not save shipping.")}
    });
    shippingStatus();
  }

  function initSettings(){
    function renderSiteData(){
      const data=Store.buildSiteData();
      const box=$("site-data-summary");
      if(box){box.className="price-saved-state price-saved-state-four";box.innerHTML=`<div><span>WhatsApp</span><strong>${Store.safeText(data.settings.whatsappNumber||"Not set")}</strong></div><div><span>Shipping</span><strong>${data.shippingFee?"D"+data.shippingFee:"None"}</strong></div><div><span>Multiplier</span><strong>${Store.formatPriceFactor(data.priceRules.factor)}</strong></div><div><span>In The Gambia</span><strong>${data.gambiaIds.length}</strong></div>`}
      if($("site-data-status"))$("site-data-status").textContent=`House ready. WhatsApp, shipping, pricing, and ${data.gambiaIds.length} Gambia product mark(s) will stay after PUSH when you lock them into js/store-data.js.`;
    }
    if($("setting-store-name"))$("setting-store-name").value=Store.getSettings().storeName;
    if($("setting-whatsapp"))$("setting-whatsapp").value=Store.getSettings().whatsappNumber;
    if($("cloud-name"))$("cloud-name").value=cloud.name;
    if($("cloud-preset"))$("cloud-preset").value=cloud.preset;
    $("settings-form")?.addEventListener("submit",e=>{
      e.preventDefault();
      const s=Store.getSettings();
      s.storeName=$("setting-store-name").value.trim();
      s.whatsappNumber=$("setting-whatsapp").value.replace(/\D/g,"");
      Store.saveSettings(s);
      Store.applyStoreName();
      renderSiteData();
      Store.toast("Store settings saved. Lock the site data house before PUSH.");
    });
    $("cloudinary-form")?.addEventListener("submit",e=>{
      e.preventDefault();
      cloud={name:$("cloud-name").value.trim(),preset:$("cloud-preset").value.trim()};
      const s=Store.getSettings();
      s.cloudinaryCloudName=cloud.name;
      s.cloudinaryUploadPreset=cloud.preset;
      Store.saveSettings(s);
      renderSiteData();
      Store.toast("Image settings saved. Lock the site data house before PUSH.");
    });
    $("lock-site-data")?.addEventListener("click",async()=>{
      const result=await Store.downloadSiteData();
      renderSiteData();
      if(result?.cancelled)return;
      Store.toast(result?.method==="file"?"Saved into store-data.js. Now PUSH to keep it live.":"Downloaded store-data.js. Put it in the js folder, then PUSH.");
    });
    renderSiteData();
  }

  renderSidebar();
  Store.applyStoreName();

  if(page==="home")initHome();
  if(page==="products")initProducts();
  if(page==="suppliers")initSuppliers();
  if(page==="gambia")initGambia();
  if(page==="pricing")initPricing();
  if(page==="shipping")initShipping();
  if(page==="settings")initSettings();
});
