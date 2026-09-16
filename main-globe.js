// مكتب المجد العقاري — public map controller
(()=>{
  const MAP_ID='publicMap';
  const CENTER=[35.1,38.5];
  const TYPE_LABELS={apartment:'شقة',house:'منزل',villa:'فيلا',land:'أرض',shop:'محل',office:'مكتب',building:'مبنى',other:'أخرى'};
  let map=null,markers=null,allProperties=[],visibleIds=null,adminPromise=null;
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money=v=>v==null||v===''?'السعر عند التواصل':Number(v).toLocaleString('ar-SY')+' ل.س';

  function inject(){
    if(document.getElementById('mainMapCss'))return;
    const s=document.createElement('style');s.id='mainMapCss';
    s.textContent=`#publicMap{background:#e7ecea;overflow:hidden}.main-leaflet{position:absolute;inset:0;z-index:2}.main-leaflet .leaflet-control-zoom{border:0!important;box-shadow:0 8px 22px rgba(16,24,40,.14)!important}.main-leaflet .leaflet-control-zoom a{width:42px!important;height:42px!important;line-height:42px!important;background:rgba(255,255,255,.95)!important;color:#344054!important;font-weight:800}.main-leaflet .leaflet-control-attribution{font-size:8px}.price-marker{min-width:70px;padding:6px 9px;border:2px solid #fff;border-radius:14px;background:#0b7a68;color:#fff;font:800 10px/1.2 Cairo,Arial,sans-serif;text-align:center;box-shadow:0 8px 18px rgba(16,24,40,.22);white-space:nowrap}.price-marker.rent{background:#1677a8}.price-marker.sale{background:#b86b08}.marker-cluster{background:rgba(8,127,104,.2)!important;border-radius:50%!important}.marker-cluster div{background:#087f68!important;color:#fff!important;font:900 11px Cairo,Arial,sans-serif}.main-popup{direction:rtl;text-align:right;font:600 12px/1.7 Cairo,Arial,sans-serif;width:min(320px,76vw)}.main-popup b{font-size:15px;color:#16201f}.main-popup .post-images{display:flex;gap:6px;overflow:auto;margin:8px 0}.main-popup .post-images img{width:88px;height:66px;object-fit:cover;border-radius:10px;flex:0 0 auto}.main-popup .post-price{color:#0b7a68;font-size:14px;font-weight:900}.main-popup .post-meta{color:#667085;font-size:11px}.main-popup .post-desc{color:#344054;margin-top:6px}.main-popup .post-phone{display:block;margin-top:9px;padding:10px 12px;border-radius:11px;background:#087f68;color:#fff;text-decoration:none;text-align:center;font-weight:900}.main-popup .post-actions{display:none;gap:6px;margin-top:7px}.main-popup.admin .post-actions{display:flex}.main-popup .post-actions button{flex:1;border:0;border-radius:10px;padding:8px;background:#101828;color:#fff;font:800 10px Cairo;cursor:pointer}.main-popup .post-actions .danger{background:#a63a35}.popup-loading{padding:12px 0;color:#667085}`;
    document.head.appendChild(s);
  }

  function create(){
    if(!window.L||!document.getElementById(MAP_ID))return false;
    if(map)return true;inject();
    const host=document.getElementById(MAP_ID);host.querySelectorAll('.main-leaflet').forEach(x=>x.remove());
    const shell=document.createElement('div');shell.className='main-leaflet';host.appendChild(shell);
    map=L.map(shell,{zoomControl:true,minZoom:3,maxZoom:19,zoomSnap:.25,zoomDelta:.5,preferCanvas:true}).setView(CENTER,6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,updateWhenZooming:false,updateWhenIdle:true,keepBuffer:2,attribution:'© OpenStreetMap contributors'}).addTo(map);
    markers=window.L.markerClusterGroup?L.markerClusterGroup({showCoverageOnHover:false,removeOutsideVisibleBounds:true,animate:false,chunkedLoading:true,chunkInterval:40,chunkDelay:10}):L.layerGroup();
    markers.addTo(map);
    setTimeout(()=>map.invalidateSize(),150);
    loadPins();
    return true;
  }

  function markerFor(x){
    const icon=L.divIcon({className:'',html:`<div class="price-marker ${x.deal_type==='rent'?'rent':'sale'}">${esc(money(x.price))}</div>`,iconSize:[100,38],iconAnchor:[50,38]});
    const marker=L.marker([Number(x.latitude),Number(x.longitude)],{icon,keyboard:true,title:x.title||'عقار'});
    marker._propertyId=x.id;
    marker.on('popupopen',()=>loadPopup(marker,x));
    marker.bindPopup('<article class="main-popup"><div class="popup-loading">جاري تحميل تفاصيل الإعلان…</div></article>',{maxWidth:360,autoPanPadding:[18,18]});
    return marker;
  }

  async function isAdmin(){
    if(adminPromise)return adminPromise;
    adminPromise=(async()=>{try{const {data:{user}}=await db.auth.getUser();if(!user)return false;const {data}=await db.from('profiles').select('role').eq('id',user.id).single();return data?.role==='admin'}catch(_){return false}})();
    return adminPromise;
  }

  async function loadPopup(marker,x){
    const popup=marker.getPopup();
    const admin=await isAdmin();
    let images=[];
    try{
      const {data}=await db.from('property_images').select('image_url,sort_order').eq('property_id',x.id).order('sort_order',{ascending:true});
      images=data||[];
    }catch(error){console.warn('property_images',error)}
    const details=[TYPE_LABELS[x.property_type]||x.property_type||'',x.area!=null?Number(x.area).toLocaleString('ar-SY')+' م²':'',x.rooms!=null&&x.property_type!=='land'?x.rooms+' غرف':''].filter(Boolean).join(' · ');
    const gallery=images.length?`<div class="post-images">${images.map(i=>`<img src="${esc(i.image_url)}" alt="صورة العقار" loading="lazy">`).join('')}</div>`:'';
    const phone=x.owner_phone||'';
    const actions=admin?`<div class="post-actions"><button type="button" onclick="window.openPropertyEdit?.('${esc(x.id)}')">تعديل</button><button type="button" class="danger" onclick="window.deleteProperty?.('${esc(x.id)}','${esc(x.title)}')">حذف</button></div>`:'';
    popup.setContent(`<article class="main-popup${admin?' admin':''}"><b>${esc(x.title||'عقار')}</b>${gallery}<div class="post-price">${esc(money(x.price))}${x.deal_type==='rent'?' · شهرياً':''}</div><div class="post-meta">📍 ${esc(x.address||'الموقع عند التواصل')}${details?`<br>${esc(details)}`:''}</div>${x.description?`<div class="post-desc">${esc(x.description)}</div>`:''}${phone?`<a class="post-phone" href="tel:${esc(phone)}">☎ ${esc(phone)} — تواصل</a>`:''}${actions}</article>`);
  }

  async function loadPins(){
    if(!map||!window.db||!markers)return;
    markers.clearLayers();
    const {data,error}=await db.from('properties').select('id,title,description,price,address,latitude,longitude,status,deal_type,property_type,area,rooms,owner_phone').in('status',['published','sold','rented']).not('latitude','is',null).not('longitude','is',null);
    if(error){console.error('map properties',error);return}
    allProperties=(data||[]).filter(x=>Number.isFinite(Number(x.latitude))&&Number.isFinite(Number(x.longitude)));
    updateMarkers();
  }

  function updateMarkers(){
    if(!markers)return;markers.clearLayers();
    const source=visibleIds?allProperties.filter(x=>visibleIds.has(x.id)):allProperties;
    source.forEach(x=>markers.addLayer(markerFor(x)));
    updateCounts();
  }
  function updateCounts(){
    const source=allProperties;const counts={all:source.length,sale:source.filter(x=>x.deal_type==='sale').length,rent:source.filter(x=>x.deal_type==='rent').length,land:source.filter(x=>x.property_type==='land').length};
    Object.entries(counts).forEach(([key,value])=>{const el=document.getElementById('count'+key.charAt(0).toUpperCase()+key.slice(1));if(el)el.textContent=value});
  }
  function filter(ids){visibleIds=new Set(ids||[]);updateMarkers()}
  function focusProperty(id){
    const x=allProperties.find(p=>p.id===id);if(!x||!map)return;
    visibleIds=null;updateMarkers();map.setView([Number(x.latitude),Number(x.longitude)],16,{animate:true});
    const marker=allProperties.find(p=>p.id===id);void marker;
    setTimeout(()=>{let target=null;markers.eachLayer(m=>{if(m._propertyId===id)target=m});target?.openPopup()},350);
  }
  function locate(){if(map)map.locate({setView:true,maxZoom:15,enableHighAccuracy:true})}
  function wire(){
    document.getElementById('zoomIn')?.addEventListener('click',()=>map?.zoomIn());
    document.getElementById('zoomOut')?.addEventListener('click',()=>map?.zoomOut());
    document.getElementById('resetMap')?.addEventListener('click',()=>{visibleIds=null;updateMarkers();map?.setView(CENTER,6,{animate:true})});
    document.getElementById('locateBtn')?.addEventListener('click',locate);
  }
  function boot(){if(!create()){setTimeout(boot,300);return}wire()}
  setTimeout(boot,250);
  window.MainGlobe={reload:loadPins,filter,focusProperty,focus:(lng,lat,z=13)=>map?.setView([lat,lng],z,{animate:true}),getMap:()=>map};
})();