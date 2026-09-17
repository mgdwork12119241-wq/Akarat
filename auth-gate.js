/* بوابة الحسابات — الدفعة 1
   المستخدم العام لا ينشئ حساباً حالياً، وحساب الإدارة الوحيد يبقى قادراً على الدخول.
*/
(function(){
  const MENU_ID='adminMenuBtn';
  const ADMIN_PANEL_ID='adminPanel';

  function adminButton(){
    return document.getElementById(MENU_ID);
  }

  function setAdminMenu(visible){
    const b=adminButton();
    if(b) b.classList.toggle('hidden',!visible);
  }

  async function currentIsAdmin(){
    try{
      const {data:{user}}=await db.auth.getUser();
      if(!user) return false;
      const {data:profile,error}=await db.from('profiles').select('role').eq('id',user.id).single();
      return !error && profile?.role==='admin';
    }catch(_){return false}
  }

  async function syncAdminMenu(){
    const ok=await currentIsAdmin();
    setAdminMenu(ok);
    if(!ok) document.getElementById(ADMIN_PANEL_ID)?.classList.add('hidden');
    return ok;
  }

  function showAdminOnlyLogin(){
    modal(`<h2>دخول الإدارة</h2>
      <p class="muted">تسجيل الدخول متاح حالياً لحساب الإدارة فقط. إنشاء حساب للمستخدمين سيكون متاحاً قريباً.</p>
      <form id="adminLoginForm" class="form-grid">
        <input name="email" type="email" placeholder="البريد الإلكتروني" autocomplete="email" required>
        <input name="password" type="password" placeholder="كلمة المرور" autocomplete="current-password" required>
        <button class="primary">تسجيل الدخول</button>
      </form>
      <button type="button" class="ghost" id="comingSoonSignup" style="width:100%;margin-top:8px">＋ إنشاء حساب</button>`);
    const form=document.getElementById('adminLoginForm');
    const signup=document.getElementById('comingSoonSignup');
    signup.onclick=()=>showToast('سيتم توفير إنشاء الحساب للمستخدمين قريباً');
    form.onsubmit=async e=>{
      e.preventDefault();
      const f=new FormData(e.target),button=e.target.querySelector('button');
      button.disabled=true;
      const {error}=await db.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});
      if(error){
        button.disabled=false;
        showToast('سيتم توفير تسجيل الدخول للمستخدمين قريباً');
        return;
      }
      const ok=await checkAdmin();
      if(ok){closeModal();await syncAdminMenu();showToast('تم تسجيل دخول الإدارة');}
      else {button.disabled=false;setAdminMenu(false);}
    };
  }

  function openAdminPanel(){
    if(!adminButton()) return;
    if(document.getElementById(ADMIN_PANEL_ID)){
      document.querySelector('.map-app')?.classList.add('hidden');
      document.getElementById(ADMIN_PANEL_ID).classList.remove('hidden');
      document.getElementById(ADMIN_PANEL_ID).scrollIntoView({behavior:'smooth'});
      return;
    }
    showAdmin();
    document.querySelector('.map-app')?.classList.add('hidden');
  }

  window.publicLoginMessage=showAdminOnlyLogin;
  window.openAdminPanel=openAdminPanel;
  window.syncAdminMenu=syncAdminMenu;

  function boot(){
    const menu=document.getElementById('sideMenu');
    if(!menu) return false;
    if(!adminButton()){
      const b=document.createElement('button');
      b.id=MENU_ID;
      b.className='hidden';
      b.type='button';
      b.textContent='⚙ لوحة الإدارة';
      b.onclick=()=>{openAdminPanel();toggleMenu()};
      const install=menu.querySelector('[onclick*="openInstallPrompt"]');
      if(install) install.insertAdjacentElement('afterend',b); else menu.appendChild(b);
    }
    syncAdminMenu();
    return true;
  }

  const wait=()=>boot()||setTimeout(wait,80);
  wait();
  db.auth.onAuthStateChange(()=>setTimeout(syncAdminMenu,180));
})();
