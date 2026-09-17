/* بوابة الحسابات — وصول صامت للإدارة
   الواجهة العامة تعرض تسجيل الدخول/إنشاء الحساب فقط.
   أي حساب غير حساب الإدارة المعتمد يُعامل كمستخدم عام حتى تتوفر الحسابات العامة.
*/
(function(){
  const MENU_ID='adminMenuBtn', PANEL_ID='adminPanel';
  let adminState=null;
  const getButton=()=>document.getElementById(MENU_ID);
  const setMenu=visible=>getButton()?.classList.toggle('hidden',!visible);

  async function isAdmin(force=false){
    if(!force&&adminState!==null)return adminState;
    try{
      const {data:{user}}=await db.auth.getUser();
      if(!user)return adminState=false;
      const {data:profile,error}=await db.from('profiles').select('role').eq('id',user.id).maybeSingle();
      adminState=!error&&profile?.role==='admin';
    }catch(_){adminState=false}
    return adminState;
  }
  async function sync(force=false){
    const ok=await isAdmin(force);setMenu(ok);
    if(!ok)document.getElementById(PANEL_ID)?.classList.add('hidden');
    return ok;
  }

  function openLogin(){
    modal(`<h2>تسجيل الدخول / إنشاء حساب</h2><p class="muted">أدخل بياناتك للمتابعة.</p><form id="publicLoginForm" class="form-grid"><input name="email" type="email" placeholder="البريد الإلكتروني" autocomplete="email" required><input name="password" type="password" placeholder="كلمة المرور" autocomplete="current-password" required><button class="primary">تسجيل الدخول</button></form><button type="button" class="ghost" id="publicSignupBtn" style="width:100%;margin-top:8px">＋ إنشاء حساب</button>`);
    const form=document.getElementById('publicLoginForm'),signup=document.getElementById('publicSignupBtn');
    signup.onclick=()=>showToast('سيتم توفير إنشاء الحساب للمستخدمين قريباً');
    form.onsubmit=async e=>{
      e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;const f=new FormData(e.target);
      const {error}=await db.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});
      if(error){button.disabled=false;showToast('سيتم توفير تسجيل الدخول للمستخدمين قريباً');return}
      const ok=await sync(true);
      if(ok){closeModal();await window.checkAdmin?.();showToast('تم تسجيل الدخول');}
      else{await db.auth.signOut();button.disabled=false;showToast('سيتم توفير تسجيل الدخول للمستخدمين قريباً');}
    };
  }

  async function openAdminPanel(){
    if(!(await isAdmin())){setMenu(false);return}
    const panel=document.getElementById(PANEL_ID);
    if(panel){document.querySelector('.map-app')?.classList.add('hidden');panel.classList.remove('hidden');panel.scrollIntoView({behavior:'smooth'});return}
    if(typeof showAdmin==='function'){showAdmin();document.querySelector('.map-app')?.classList.add('hidden')}
  }

  window.publicLoginMessage=openLogin;window.openAdminPanel=openAdminPanel;
  window.syncAdminMenu=()=>sync(true);window.currentIsAdmin=()=>isAdmin();

  function boot(){
    const menu=document.getElementById('sideMenu');if(!menu)return false;
    if(!getButton()){
      const b=document.createElement('button');b.id=MENU_ID;b.className='hidden';b.type='button';b.textContent='⚙ لوحة الإدارة';b.onclick=()=>{openAdminPanel();toggleMenu()};
      const install=menu.querySelector('[onclick*="openInstallPrompt"]');install?install.insertAdjacentElement('afterend',b):menu.appendChild(b);
    }
    sync();return true;
  }
  const wait=()=>boot()||setTimeout(wait,100);wait();
  db.auth.onAuthStateChange(()=>{adminState=null;setTimeout(()=>sync(true),200)});
})();
