/* أدوات الإدارة: جلسة الإدارة، العودة للتطبيق، وحذف الإعلانات المنشورة */
(function(){
  const wait=(fn,n=80)=>{if(fn())return;setTimeout(()=>wait(fn,n),n)};
  const data=()=>typeof listings!=='undefined'?(listings||[]):[];
  const isAdmin=async()=>{
    try{
      const {data:{user}}=await db.auth.getUser();
      if(!user)return false;
      const {data:p}=await db.from('profiles').select('role').eq('id',user.id).single();
      return p?.role==='admin';
    }catch(_){return false}
  };
  function installStyle(){
    if(document.getElementById('adminToolsStyle'))return;
    const s=document.createElement('style');s.id='adminToolsStyle';s.textContent=`
      .admin-session-bar{position:fixed;z-index:95;top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:7px;padding:7px 9px;background:rgba(15,23,42,.94);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.12);border-radius:16px;color:#fff;box-shadow:0 12px 32px rgba(0,0,0,.25);font:700 10px Cairo,Arial,sans-serif;direction:rtl}.admin-session-bar span{display:flex;align-items:center;gap:5px;padding:0 5px}.admin-session-bar span i{width:7px;height:7px;border-radius:50%;background:#31d39b;box-shadow:0 0 10px #31d39b}.admin-session-bar button{border:0;border-radius:10px;padding:7px 10px;background:#243047;color:#fff;font:700 9px Cairo,Arial,sans-serif;cursor:pointer}.admin-session-bar button:first-of-type{background:#087f68}.admin-delete-action{width:100%;margin-top:8px;border:1px solid rgba(184,59,59,.15);border-radius:10px;background:#fff4f3;color:#a63a35;padding:8px 10px;font:800 9px Cairo,Arial,sans-serif;cursor:pointer;transition:.18s}.admin-delete-action:active{transform:scale(.98)}.admin-delete-action span{margin-left:4px}.map-delete{width:auto;display:block;margin-top:8px;padding:7px 13px}.admin-can-manage{outline:1px solid rgba(8,127,104,.10)}@media(max-width:700px){.admin-session-bar{top:8px;max-width:calc(100% - 16px);width:max-content}.admin-session-bar span{font-size:9px}.admin-session-bar button{padding:7px 8px;font-size:8px}}
    `;document.head.appendChild(s);
  }
  function backToApp(){
    document.getElementById('adminPanel')?.classList.add('hidden');
    document.querySelector('.map-app')?.classList.remove('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
    setTimeout(()=>{window.formMap?.remove();window.formMap=null;publicMap?.invalidateSize?.()},150);
  }
  async function signOut(){
    await db.auth.signOut();
    document.getElementById('adminPanel')?.classList.add('hidden');
    document.querySelector('.map-app')?.classList.remove('hidden');
    removeAdminActions();
    if(typeof showToast==='function')showToast('تم تسجيل الخروج');
  }
  function removeAdminActions(){document.querySelectorAll('.admin-delete-action,.admin-session-bar').forEach(e=>e.remove())}
  async function deleteProperty(id,title){
    if(!(await isAdmin())){if(typeof showToast==='function')showToast('هذه العملية مخصصة للإدارة');return}
    if(!confirm(`حذف الإعلان «${title}» نهائياً؟\nسيختفي من الخريطة وقائمة العقارات.`))return;
    const {error}=await db.from('properties').delete().eq('id',id);
    if(error){console.error(error);if(typeof showToast==='function')showToast('تعذر حذف الإعلان. قد تحتاج صلاحية DELETE في Supabase.');return}
    const {error:imgError}=await db.from('property_images').delete().eq('property_id',id);
    if(imgError)console.warn('property_images cleanup:',imgError);
    const i=data().findIndex(x=>x.id===id);if(i>=0)data().splice(i,1);
    if(typeof loadListings==='function')await loadListings();
    if(typeof showToast==='function')showToast('تم حذف الإعلان');
    decorateCards();
  }
  function makeBar(){
    if(document.getElementById('adminSessionBar'))return;
    const bar=document.createElement('div');bar.id='adminSessionBar';bar.className='admin-session-bar';
    bar.innerHTML='<span><i></i> وضع الإدارة</span><button type="button" id="adminBackBtn">العودة للتطبيق</button><button type="button" id="adminLogoutBtn">تسجيل الخروج</button>';
    document.body.appendChild(bar);
    document.getElementById('adminBackBtn').onclick=backToApp;
    document.getElementById('adminLogoutBtn').onclick=signOut;
  }
  function findListingFromCard(card){const title=card.querySelector('h3')?.textContent?.trim();return data().find(x=>x.title===title)}
  function decorateCards(){
    document.querySelectorAll('.listing').forEach(card=>{
      if(card.querySelector('.admin-delete-action'))return;
      const x=findListingFromCard(card);if(!x)return;
      const body=card.querySelector('.listing-body');if(!body)return;
      const b=document.createElement('button');b.type='button';b.className='admin-delete-action';b.innerHTML='<span>⌫</span> حذف الإعلان';b.onclick=e=>{e.stopPropagation();deleteProperty(x.id,x.title)};body.appendChild(b);card.classList.add('admin-can-manage');
    });
  }
  function decorateMap(){
    if(window.__adminMapPatched||typeof publicMap==='undefined'||!publicMap)return;
    window.__adminMapPatched=true;
    publicMap.on('popupopen',async e=>{
      if(!(await isAdmin()))return;
      const popup=e.popup.getElement();if(!popup)return;
      const text=popup.textContent||'';const x=data().find(v=>text.includes(v.title));if(!x)return;
      const b=document.createElement('button');b.className='admin-delete-action map-delete';b.type='button';b.textContent='حذف الإعلان';b.onclick=()=>deleteProperty(x.id,x.title);popup.querySelector('.leaflet-popup-content')?.appendChild(b);
    });
  }
  async function refreshAdminState(){const admin=await isAdmin();if(admin){makeBar();decorateCards();decorateMap()}else removeAdminActions()}
  window.backToApp=backToApp;window.signOut=signOut;window.deleteProperty=deleteProperty;
  wait(()=>{installStyle();refreshAdminState();return !!document.body});
  db.auth.onAuthStateChange(()=>setTimeout(refreshAdminState,180));
  const observer=new MutationObserver(()=>{if(document.getElementById('adminSessionBar')){decorateCards();decorateMap()}});
  wait(()=>{observer.observe(document.body,{childList:true,subtree:true});return true});
})();
