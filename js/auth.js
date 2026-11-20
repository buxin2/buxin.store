document.addEventListener("DOMContentLoaded",()=>{
  if(sessionStorage.getItem("nova_admin_session")==="yes"){location.replace("admin.html");return}
  document.getElementById("login-form").addEventListener("submit",e=>{e.preventDefault();const entered=document.getElementById("admin-password").value;const expected=window.STORE_CONFIG.demoAdminPassword;if(entered===expected){sessionStorage.setItem("nova_admin_session","yes");location.href="admin.html"}else{document.getElementById("login-error").textContent="That password wasn't correct. Please try again."}});
});