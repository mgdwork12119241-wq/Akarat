/* أدوات الإدارة: جلسة الإدارة، العودة للتطبيق، وحذف الإعلانات المنشورة */
(function(){
  const wait=(fn,n=80)=>{if(fn())return;setTimeout(()=>wait(fn,n),n)};
  const isAdmin=async()=>{
    try{
      const {data:{user}}=await db.auth.getUser();
      if(!user)return false;
      const {data:p}=await db.from('profiles').select('role').eq('id',user.id).single();
      return p?.role==='admin';
    }catch(_){return false}
  };
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
  function removeAdminActions(){
    document.querySelectorAll('.admin-delete-action,.admin-session-bar').forEach(e=>e.remove());
  }
  async function deleteProperty(id,title){
    if(!(await isAdmin())){if(typeof showToast==='function')showToast('هذه العملية مخصصة للإدارة');return}
    if(!confirm(`حذف الإعلان «${title}» نهائياً؟\nسيختفي من الخريطة وقائمة العقارات.`))return;
    const {error}=await db.from('properties').delete().eq('id',id);
    if(error){console.error(error);if(typeof showToast==='function')showToast('تعذر حذف الإعلان. تحقق من صلاحيات الحذف في Supabase.');return}
    const {error:imgError}=await db.from('property_images').delete().eq('property_id',id);
    if(imgError)console.warn('property_images cleanup:',imgError);
    window.listings?.splice?.(window.listings.findIndex(x=>x.id===id),1);
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
  function findListingFromCard(card){
    const title=card.querySelector('h3')?.textContent?.trim();
    return (window.listings||[]).find(x=>x.title===title);
  }
  function decorateCards(){
    document.querySelectorAll('.listing').forEach(card=>{
      if(card.querySelector('.admin-delete-action'))return;
      const x=findListingFromCard(card);if(!x)return;
      const body=card.querySelector('.listing-body');if(!body)return;
      const b=document.createElement('button');b.type='button';b.className='admin-delete-action';b.innerHTML='<span>⌫</span> حذف الإعلان';
      b.onclick=e=>{e.stopPropagation();deleteProperty(x.id,x.title)};
      body.appendChild(b);
      card.classList.add('admin-can-manage');
    });
  }
  function decorateMap(){
    // نضيف زر الإدارة إلى النوافذ المنبثقة للخريطة من خلال مراقبة فتح الـpopup.
    if(window.__adminMapPatched||!window.publicMap)return;
    window.__adminMapPatched=true;
    publicMap.on('popupopen',async e=>{
      if(!(await isAdmin()))return;
      const popup=e.popup.getElement();if(!popup)return;
      const text=popup.textContent||'';
      const x=(window.listings||[]).find(v=>text.includes(v.title));if(!x)return;
      const b=document.createElement('button');b.className='admin-delete-action map-delete';b.type='button';b.textContent='حذف الإعلان';b.onclick=()=>deleteProperty(x.id,x.title);
      popup.querySelector('.leaflet-popup-content')?.appendChild(b);
    });
  }
  async function refreshAdminState(){
    const admin=await isAdmin();
    if(admin){makeBar();decorateCards();decorateMap();}
    else removeAdminActions();
  }
  window.backToApp=backToApp;
  window.signOut=signOut;
  window.deleteProperty=deleteProperty;
  wait(()=>{refreshAdminState();return !!document.body});
  db.auth.onAuthStateChange(()=>setTimeout(refreshAdminState,120));
  const observer=new MutationObserver(()=>refreshAdminState());
  wait(()=>{observer.observe(document.body,{childList:true,subtree:true});return true});
})();
