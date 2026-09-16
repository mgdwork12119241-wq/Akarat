// مكتب المجد العقاري — application core
// UI/forms/auth live here; the public map is owned exclusively by main-globe.js.
const SUPABASE_URL='https://utvwvwlrsqoccqwxgfil.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_bR3lG3PwdaX3XSyo6s3_uQ_25LWaOCC';
const {createClient}=supabase;
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

let listings=[];
const labels={rent:'للإيجار',sale:'للبيع'};
const typeLabels={apartment:'شقة',house:'منزل',villa:'فيلا',land:'أرض',shop:'محل',office:'مكتب',building:'مبنى',other:'أخرى'};
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const money=v=>v==null||v===''?'السعر عند التواصل':Number(v).toLocaleString('ar-SY')+' ل.س';
const propertyDetails=x=>[
  x.area!=null&&x.area!==''?Number(x.area).toLocaleString('ar-SY')+' م²':'',
  x.rooms!=null&&x.rooms!==''&&x.property_type!=='land'?x.rooms+' غرف':''
].filter(Boolean).join(' · ')||'التفاصيل داخل الإعلان';

function normalize(x){
  const images=(x.property_images||[]).slice().sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
  return {
    id:x.id,deal:x.deal_type,type:x.property_type,title:x.title||'عقار بدون عنوان',
    description:x.description||'',location:x.address||'الموقع عند التواصل',
    details:propertyDetails(x),price:money(x.price),rawPrice:x.price,
    image:images[0]?.image_url||'',latitude:x.latitude,longitude:x.longitude,images
  };
}

async function loadListings(){
  const status=document.getElementById('listingStatus');
  try{
    const {data,error}=await db.from('properties')
      .select('id,title,description,property_type,deal_type,price,area,rooms,address,latitude,longitude,status,created_at,property_images(id,image_url,sort_order)')
      .in('status',['published','sold','rented'])
      .order('created_at',{ascending:false});
    if(error)throw error;
    listings=(data||[]).map(normalize);
    status?.classList.add('hidden');
    render();
    window.MainGlobe?.reload?.();
  }catch(error){
    console.error('loadListings',error);
    if(status){status.textContent='تعذر تحميل العقارات حالياً.';status.classList.remove('hidden')}
  }
}

function render(items=listings){
  const grid=document.getElementById('listingGrid');
  const empty=document.getElementById('emptyState');
  if(!grid)return;
  grid.innerHTML=items.map(x=>`<article class="listing" data-property-id="${esc(x.id)}" tabindex="0" role="button" aria-label="فتح ${esc(x.title)}">
    <div class="listing-img" ${x.image?`style="background-image:url('${esc(x.image)}')"`:''}><span class="badge">${esc(labels[x.deal]||x.deal||'عقار')}</span></div>
    <div class="listing-body"><h3>${esc(x.title)}</h3><div class="meta">📍 ${esc(x.location)}</div><div class="meta">${esc(typeLabels[x.type]||x.type||'عقار')}${x.details?' · '+esc(x.details):''}</div><div class="price">${esc(x.price)} <small>${x.deal==='rent'?'شهرياً':''}</small></div></div>
  </article>`).join('');
  empty?.classList.toggle('hidden',items.length>0);
}

function filterListings(){
  const q=(document.getElementById('searchInput')?.value||'').trim().toLocaleLowerCase('ar');
  const deal=document.getElementById('dealFilter')?.value||'all';
  const type=document.getElementById('typeFilter')?.value||'all';
  const filtered=listings.filter(x=>
    (deal==='all'||x.deal===deal)&&
    (type==='all'||x.type===type)&&
    (!q||`${x.title} ${x.location} ${x.details} ${typeLabels[x.type]||''}`.toLocaleLowerCase('ar').includes(q))
  );
  render(filtered);
  window.MainGlobe?.filter?.(filtered.map(x=>x.id));
}

function resetFilters(){
  const search=document.getElementById('searchInput'); if(search)search.value='';
  const deal=document.getElementById('dealFilter'); if(deal)deal.value='all';
  const type=document.getElementById('typeFilter'); if(type)type.value='all';
  document.querySelectorAll('.category').forEach(c=>c.classList.toggle('active',c.dataset.deal==='all'));
  render(); window.MainGlobe?.reload?.();
}

function showToast(message){
  const toast=document.getElementById('toast'); if(!toast)return;
  toast.textContent=message;toast.classList.add('show');clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>toast.classList.remove('show'),3200);
}

function modal(html){
  let m=document.getElementById('appModal');
  if(!m){m=document.createElement('div');m.id='appModal';m.className='modal';document.body.appendChild(m)}
  m.innerHTML=`<div class="modal-card"><button class="modal-close" onclick="closeModal()" aria-label="إغلاق">×</button>${html}</div>`;
  m.classList.remove('hidden');
}
function closeModal(){
  const m=document.getElementById('appModal');
  m?.classList.add('hidden');m?.classList.remove('submission-wizard','location-fullscreen');
  setTimeout(()=>{try{window.formMap?.remove()}catch(_){}window.formMap=null},100);
}

function locationPickerHtml(prefix){
  return `<div class="location-box"><label>موقع العقار</label><div id="${prefix}Map" class="picker-map"></div><small>يمكنك استخدام رابط Google Maps أو تحريك الخريطة تحت الدبوس.</small><div class="coords"><input id="${prefix}Lat" name="latitude" type="number" step="any" placeholder="خط العرض" readonly><input id="${prefix}Lng" name="longitude" type="number" step="any" placeholder="خط الطول" readonly></div></div>`;
}

function publicLoginMessage(){openLogin()}
function openLogin(){
  modal(`<h2>تسجيل الدخول / إنشاء حساب</h2><p class="muted">الوصول إلى لوحة الإدارة مخصص للحساب الإداري فقط.</p><div style="display:flex;gap:8px;margin:12px 0"><button type="button" class="ghost" id="loginTab">تسجيل الدخول</button><button type="button" class="ghost" id="signupTab">إنشاء حساب</button></div><form id="loginForm" class="form-grid"><input name="email" type="email" placeholder="البريد الإلكتروني" autocomplete="email" required><input name="password" type="password" placeholder="كلمة المرور" autocomplete="current-password" minlength="6" required><button class="primary">تسجيل الدخول</button></form><form id="signupForm" class="form-grid hidden"><input name="email" type="email" placeholder="البريد الإلكتروني" autocomplete="email" required><input name="password" type="password" placeholder="كلمة المرور (6 أحرف على الأقل)" autocomplete="new-password" minlength="6" required><button class="primary">إنشاء حساب</button></form>`);
  const loginForm=document.getElementById('loginForm'),signupForm=document.getElementById('signupForm');
  document.getElementById('loginTab').onclick=()=>{loginForm.classList.remove('hidden');signupForm.classList.add('hidden')};
  document.getElementById('signupTab').onclick=()=>{signupForm.classList.remove('hidden');loginForm.classList.add('hidden')};
  loginForm.onsubmit=login;signupForm.onsubmit=signup;
}

async function login(e){
  e.preventDefault();const form=new FormData(e.target);const button=e.target.querySelector('button');if(button)button.disabled=true;
  const {error}=await db.auth.signInWithPassword({email:form.get('email'),password:form.get('password')});
  if(error){if(button)button.disabled=false;showToast(error.message||'تعذر تسجيل الدخول');return}
  const ok=await checkAdmin();if(!ok&&button)button.disabled=false;
}
async function signup(e){
  e.preventDefault();const form=new FormData(e.target);const button=e.target.querySelector('button');if(button)button.disabled=true;
  const {data,error}=await db.auth.signUp({email:form.get('email'),password:form.get('password')});
  if(error){if(button)button.disabled=false;showToast(error.message||'تعذر إنشاء الحساب');return}
  if(data?.user)await db.auth.signOut();
  showToast('تم إنشاء الحساب. إذا طُلب تأكيد البريد، أكّد البريد ثم سجّل الدخول.');
}
async function checkAdmin(){
  const {data:{user}}=await db.auth.getUser();if(!user)return false;
  const {data:profile,error}=await db.from('profiles').select('role').eq('id',user.id).single();
  if(error||profile?.role!=='admin'){await db.auth.signOut();showToast('هذا الحساب لا يملك صلاحيات الإدارة.');return false}
  showAdmin();return true;
}

function showAdmin(){
  let panel=document.getElementById('adminPanel');
  if(!panel){
    panel=document.createElement('section');panel.id='adminPanel';panel.className='admin-section';
    panel.innerHTML=`<div class="container"><div class="admin-head"><div><span class="eyebrow">إدارة خاصة</span><h2>لوحة الإدارة</h2><p>طلبات الزوار لا تصبح منشورة إلا بموافقتك.</p></div><div><button class="ghost" onclick="backToApp()">العودة للموقع</button> <button class="ghost" onclick="signOut()">تسجيل الخروج</button></div></div><div class="admin-grid"><div class="admin-card"><h3>طلبات الإعلانات</h3><div id="submissionList">جاري التحميل...</div></div><div class="admin-card"><h3>إضافة عقار مباشرة</h3><p class="muted">أضف الصور وحدد الموقع ثم ينشر العقار مباشرة.</p><form id="adminPropertyForm" class="form-grid"><input name="title" placeholder="عنوان الإعلان" required><select name="property_type"><option value="apartment">شقة</option><option value="house">منزل</option><option value="villa">فيلا</option><option value="land">أرض</option><option value="shop">محل</option><option value="office">مكتب</option><option value="building">مبنى</option><option value="other">أخرى</option></select><select name="deal_type"><option value="sale">للبيع</option><option value="rent">للإيجار</option></select><input name="price" type="number" min="0" placeholder="السعر"><input name="area" type="number" min="0" placeholder="المساحة م²"><input name="rooms" type="number" min="0" placeholder="عدد الغرف"><input name="address" placeholder="العنوان"><input name="owner_name" placeholder="اسم المالك"><input name="owner_phone" placeholder="هاتف المالك">${locationPickerHtml('admin')}<div class="full">${imageInput('images')}</div><textarea name="description" placeholder="تفاصيل الإعلان"></textarea><button class="primary">نشر العقار</button></form></div></div></div>`;
    document.body.appendChild(panel);document.getElementById('adminPropertyForm').onsubmit=adminAdd;
  }
  panel.classList.remove('hidden');loadSubmissions();setTimeout(()=>{window.formMap=window.mountLocationPicker?.('adminMap')||window.formMap},180);panel.scrollIntoView({behavior:'smooth'});
}

async function loadSubmissions(){
  const box=document.getElementById('submissionList');if(!box)return;
  const {data,error}=await db.from('property_submissions').select('*').order('created_at',{ascending:false});
  if(error){box.textContent='تعذر تحميل الطلبات.';return}
  if(!data?.length){box.innerHTML='<div class="empty">لا توجد طلبات حالياً.</div>';return}
  box.innerHTML=data.map(s=>`<div class="submission"><b>${esc(s.title)}</b><span>${esc(typeLabels[s.property_type]||s.property_type)} · ${esc(labels[s.deal_type]||s.deal_type)} · ${esc(s.submitter_name)} · ${esc(s.submitter_phone)}</span><small>${esc(s.address||'')}</small>${(s.image_urls||[]).length?`<div class="thumbs">${s.image_urls.map(u=>`<img src="${esc(u)}" alt="صورة العقار" loading="lazy">`).join('')}</div>`:''}<div class="submission-actions">${s.status==='pending'?`<button class="primary" onclick="approveSubmission('${esc(s.id)}')">موافقة ونشر</button><button class="danger" onclick="rejectSubmission('${esc(s.id)}')">رفض</button>`:`<span>الحالة: ${esc(s.status)}</span>`}</div></div>`).join('');
}
async function approveSubmission(id){
  if(!(await checkAdmin()))return;
  const {data:s,error}=await db.from('property_submissions').select('*').eq('id',id).single();if(error||!s)return showToast('تعذر قراءة الطلب');
  const {data:{user}}=await db.auth.getUser();
  const {data:p,error:e}=await db.from('properties').insert({title:s.title,description:s.description,property_type:s.property_type,deal_type:s.deal_type,price:s.price,area:s.area,rooms:s.rooms,address:s.address,latitude:s.latitude,longitude:s.longitude,owner_name:s.owner_name,owner_phone:s.owner_phone,status:'published',published_at:new Date().toISOString(),created_by:user.id}).select('id').single();
  if(e)return showToast('تعذر نشر الإعلان');
  if(s.image_urls?.length){const {error:ie}=await db.from('property_images').insert(s.image_urls.map((u,i)=>({property_id:p.id,image_url:u,sort_order:i})));if(ie)return showToast('تم إنشاء الإعلان لكن تعذر ربط الصور')}
  await db.from('property_submissions').update({status:'approved',reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq('id',id);
  showToast('تم نشر الإعلان مع الصور');loadSubmissions();loadListings();
}
async function rejectSubmission(id){
  if(!(await checkAdmin()))return;
  const {data:{user}}=await db.auth.getUser();const reason=prompt('سبب الرفض (اختياري):')||null;
  const {error}=await db.from('property_submissions').update({status:'rejected',admin_note:reason,reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq('id',id);
  showToast(error?'تعذر رفض الطلب':'تم رفض الطلب');loadSubmissions();
}

async function uploadImages(files,folder){
  const urls=[];
  for(const file of Array.from(files||[])){
    if(!file.type.startsWith('image/'))throw new Error('يسمح برفع الصور فقط');
    if(file.size>8*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 8 ميغابايت');
    const safe=file.name.replace(/[^\w.\-\u0600-\u06ff ]/g,'_');
    const path=`${folder}/${crypto.randomUUID()}-${safe}`;
    const {error}=await db.storage.from('property-images').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type});
    if(error)throw error;urls.push(db.storage.from('property-images').getPublicUrl(path).data.publicUrl);
  }
  return urls;
}
function imageInput(name){return `<div class="file-field"><label>صور العقار</label><input name="${name}" type="file" accept="image/jpeg,image/png,image/webp" multiple><small>حتى 8 ميغابايت للصورة، ويمكن اختيار عدة صور.</small></div>`}

async function adminAdd(e){
  e.preventDefault();if(!(await checkAdmin()))return;
  const form=e.target,button=form.querySelector('button[type="submit"],button.primary');if(button)button.disabled=true;
  const f=new FormData(form),row=Object.fromEntries(f.entries());const files=f.getAll('images');delete row.images;
  ['price','area','rooms','latitude','longitude'].forEach(k=>{row[k]=row[k]?Number(row[k]):null});
  const {data:{user}}=await db.auth.getUser();Object.assign(row,{status:'published',published_at:new Date().toISOString(),created_by:user.id});
  try{
    const {data:p,error}=await db.from('properties').insert(row).select('id').single();if(error)throw error;
    if(files.length){const urls=await uploadImages(files,`properties/${p.id}`);const {error:ie}=await db.from('property_images').insert(urls.map((u,i)=>({property_id:p.id,image_url:u,sort_order:i})));if(ie)throw ie}
    showToast('تم نشر العقار مع الصور');form.reset();window.formMap?.remove?.();window.formMap=window.mountLocationPicker?.('adminMap')||null;loadListings();
  }catch(error){console.error('adminAdd',error);showToast(error.message||'تعذر نشر العقار')}finally{if(button)button.disabled=false}
}

function backToApp(){document.getElementById('adminPanel')?.classList.add('hidden');window.scrollTo({top:0,behavior:'smooth'})}
async function signOut(){await db.auth.signOut();document.getElementById('adminPanel')?.classList.add('hidden');showToast('تم تسجيل الخروج')}

function openSubmission(){
  modal(`<h2>إضافة إعلان</h2><p class="muted">أرسل بيانات العقار مع الصور وحدد موقعه. سيصل الطلب إلى الإدارة قبل النشر.</p><form id="submissionForm" class="form-grid"><input name="submitter_name" placeholder="اسمك" required><input name="submitter_phone" placeholder="رقم هاتفك" inputmode="tel" required><input name="title" placeholder="عنوان الإعلان" required><select name="property_type"><option value="apartment">شقة</option><option value="house">منزل</option><option value="villa">فيلا</option><option value="land">أرض</option><option value="shop">محل</option><option value="office">مكتب</option><option value="building">مبنى</option><option value="other">أخرى</option></select><select name="deal_type"><option value="sale">للبيع</option><option value="rent">للإيجار</option></select><input name="price" type="number" min="0" placeholder="السعر"><input name="area" type="number" min="0" placeholder="المساحة م²"><input name="rooms" type="number" min="0" placeholder="عدد الغرف"><input name="address" placeholder="العنوان"><input name="owner_name" placeholder="اسم المالك"><input name="owner_phone" placeholder="هاتف التواصل" inputmode="tel">${locationPickerHtml('sub')}<div class="full">${imageInput('images')}</div><textarea name="description" placeholder="تفاصيل العقار"></textarea><button class="primary">إرسال الطلب</button></form>`);
  document.getElementById('submissionForm').onsubmit=submitProperty;
  setTimeout(()=>window.mountLocationPicker?.('subMap'),160);
}
async function submitProperty(e){
  e.preventDefault();const form=e.target,button=form.querySelector('button[type="submit"],button.primary');if(button)button.disabled=true;
  const f=new FormData(form),row=Object.fromEntries(f.entries());const files=f.getAll('images');delete row.images;
  ['price','area','rooms','latitude','longitude'].forEach(k=>{row[k]=row[k]?Number(row[k]):null});
  try{
    const folder=`submissions/${crypto.randomUUID()}`;const imageUrls=files.length?await uploadImages(files,folder):[];
    row.image_urls=imageUrls;row.status='pending';const {error}=await db.from('property_submissions').insert(row);if(error)throw error;
    closeModal();showToast('تم إرسال الإعلان والصور، وسيبقى قيد المراجعة حتى موافقة الإدارة');
  }catch(error){console.error('submitProperty',error);showToast(error.message||'تعذر إرسال الطلب حالياً');if(button)button.disabled=false}
}

function updateCounts(){
  const counts={all:listings.length,sale:listings.filter(x=>x.deal==='sale').length,rent:listings.filter(x=>x.deal==='rent').length,land:listings.filter(x=>x.type==='land').length};
  Object.entries(counts).forEach(([key,value])=>{const el=document.getElementById('count'+key.charAt(0).toUpperCase()+key.slice(1));if(el)el.textContent=value});
}

document.addEventListener('click',e=>{
  const card=e.target.closest('.listing');if(card){window.MainGlobe?.focusProperty?.(card.dataset.propertyId);return}
  const category=e.target.closest('.category');if(category){document.querySelectorAll('.category').forEach(x=>x.classList.toggle('active',x===category));const deal=document.getElementById('dealFilter');if(deal)deal.value=category.dataset.deal||'all';filterListings()}
});
document.getElementById('searchInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')filterListings()});
let searchTimer;document.getElementById('searchInput')?.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(filterListings,180)});

loadListings();
db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN')setTimeout(checkAdmin,0)});
function toggleMenu(){document.getElementById('sideMenu')?.classList.toggle('hidden')}
window.updateCounts=updateCounts;
