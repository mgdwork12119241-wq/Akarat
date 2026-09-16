// مكتب المجد العقاري — precise property location picker
(function(){
  const DEFAULT=[34.73,36.72];
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function css(){
    if(document.getElementById('premiumPickerCss'))return;
    const s=document.createElement('style');s.id='premiumPickerCss';
    s.textContent=`
      .premium-picker{position:relative;width:100%;height:100%;min-height:420px;overflow:hidden;border-radius:24px;background:#dfe7e4}
      .premium-picker-map{position:absolute;inset:0;width:100%;height:100%;min-height:420px}
      .premium-picker .leaflet-container{width:100%;height:100%;min-height:420px;background:#dfe7e4}
      .premium-picker .leaflet-control-zoom{border:0!important;box-shadow:0 8px 22px rgba(16,24,40,.16)!important}
      .premium-picker .leaflet-control-zoom a{width:42px!important;height:42px!important;line-height:42px!important;background:rgba(255,255,255,.96)!important;color:#344054!important}
      .picker-center-pin{position:absolute;z-index:900;left:50%;top:50%;width:36px;height:48px;transform:translate(-50%,-100%);pointer-events:none;filter:drop-shadow(0 6px 7px rgba(0,0,0,.24))}
      .picker-center-pin:before{content:'';position:absolute;left:6px;top:0;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#087f68;border:3px solid #fff}
      .picker-center-pin:after{content:'';position:absolute;left:14px;top:9px;width:6px;height:6px;border-radius:50%;background:#fff}
      .picker-top{position:absolute;z-index:901;top:12px;left:12px;right:12px;display:grid;gap:8px;pointer-events:none}
      .picker-row{display:flex;gap:7px;align-items:center}
      .picker-input{min-width:0;flex:1;border:1px solid rgba(16,24,40,.08);background:rgba(255,255,255,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 8px 20px rgba(16,24,40,.12);border-radius:14px;padding:11px 12px;font:700 11px Cairo,Arial,sans-serif;color:#27312f;outline:none;direction:ltr}
      .picker-input:focus{border-color:#087f68;box-shadow:0 0 0 3px rgba(8,127,104,.12)}
      .picker-action,.picker-go,.picker-full{border:0;cursor:pointer;border-radius:14px;padding:10px 12px;font:800 11px Cairo,Arial,sans-serif;box-shadow:0 8px 20px rgba(16,24,40,.12)}
      .picker-action,.picker-go{background:rgba(255,255,255,.95);color:#27312f}.picker-go{background:#087f68;color:#fff}
      .picker-hint{justify-self:center;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);box-shadow:0 7px 18px rgba(16,24,40,.1);font:800 10px Cairo,Arial,sans-serif;color:#344054}
      .picker-bottom{position:absolute;z-index:901;left:12px;right:12px;bottom:12px;display:flex;gap:8px;align-items:center;pointer-events:none}
      .picker-coords{flex:1;padding:10px 12px;border-radius:15px;background:rgba(255,255,255,.92);backdrop-filter:blur(14px);box-shadow:0 8px 20px rgba(16,24,40,.12);font:700 10px/1.5 Cairo,Arial,sans-serif;color:#52605d;pointer-events:auto}
      .picker-full{background:#087f68;color:#fff;pointer-events:auto}
      .picker-status{position:absolute;z-index:902;left:50%;bottom:72px;transform:translateX(-50%);max-width:82%;padding:8px 12px;border-radius:12px;background:rgba(16,24,40,.82);color:#fff;font:700 10px/1.5 Cairo,Arial,sans-serif;opacity:0;pointer-events:none;transition:.2s}.picker-status.show{opacity:1}
      .picker-fullscreen{position:fixed!important;inset:0!important;z-index:10000!important;width:100vw!important;height:100dvh!important;border-radius:0!important;min-height:100dvh!important}
      .picker-fullscreen .premium-picker-map,.picker-fullscreen .leaflet-container{width:100%!important;height:100%!important;min-height:100dvh!important}
      .picker-fullscreen .picker-top{top:calc(12px + env(safe-area-inset-top))}
      .picker-fullscreen .picker-bottom{bottom:calc(12px + env(safe-area-inset-bottom))}
      .picker-fullscreen .leaflet-control-attribution{margin-bottom:env(safe-area-inset-bottom)}
      @media(max-width:600px){.picker-row{gap:5px}.picker-input{font-size:10px}.picker-action,.picker-go,.picker-full{padding:10px 9px;font-size:10px}}
    `;
    document.head.appendChild(s);
  }

  function parseGoogleMapsLink(value){
    const raw=String(value||'').trim();if(!raw)return null;let decoded=raw;try{decoded=decodeURIComponent(raw)}catch(_){ }
    const patterns=[/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,/[?&](?:q|query|ll|center)=(-?\d+(?:\.\d+)?)[,%20]+(-?\d+(?:\.\d+)?)/i,/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/];
    for(const re of patterns){const m=decoded.match(re);if(!m)continue;const lat=Number(m[1]),lng=Number(m[2]);if(Math.abs(lat)<=90&&Math.abs(lng)<=180)return{lat,lng}}
    return null;
  }

  async function searchPlace(query){
    const q=String(query||'').trim();if(!q)return null;
    const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=ar&q='+encodeURIComponent(q+', سوريا');
    const res=await fetch(url,{headers:{Accept:'application/json'}});if(!res.ok)throw new Error('تعذر البحث عن المكان');
    const data=await res.json();if(!data?.[0])return null;return{lat:Number(data[0].lat),lng:Number(data[0].lon),label:data[0].display_name||q};
  }

  function mount(mapId){
    const mapHost=document.getElementById(mapId);if(!mapHost||!window.L)return null;
    const box=mapHost.closest('.location-box');if(!box)return null;
    css();
    if(mapHost.dataset.premium==='1')return window.formMap||null;
    mapHost.dataset.premium='1';
    const latInput=box.querySelector('input[name="latitude"]');const lngInput=box.querySelector('input[name="longitude"]');
    const savedLat=Number(latInput?.value),savedLng=Number(lngInput?.value);const initial=[Number.isFinite(savedLat)?savedLat:DEFAULT[0],Number.isFinite(savedLng)?savedLng:DEFAULT[1]];
    const wrap=document.createElement('div');wrap.className='premium-picker';mapHost.innerHTML='';mapHost.appendChild(wrap);
    const mh=document.createElement('div');mh.className='premium-picker-map';wrap.appendChild(mh);
    const map=L.map(mh,{zoomControl:true,minZoom:5,maxZoom:20,zoomSnap:.25,zoomDelta:.5,preferCanvas:true,fadeAnimation:false,zoomAnimation:true}).setView(initial,Number.isFinite(savedLat)?17:11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,updateWhenZooming:false,updateWhenIdle:true,keepBuffer:2,attribution:'© OpenStreetMap contributors'}).addTo(map);
    const pin=document.createElement('div');pin.className='picker-center-pin';wrap.appendChild(pin);
    const top=document.createElement('div');top.className='picker-top';top.innerHTML=`<div class="picker-row"><input class="picker-input" id="${mapId}GoogleLink" type="url" inputmode="url" placeholder="الصق رابط Google Maps هنا"><button type="button" class="picker-go">تحديد</button><button type="button" class="picker-action">موقعي</button></div><div class="picker-row"><input class="picker-input" id="${mapId}Search" type="search" placeholder="أو اكتب اسم المنطقة / الشارع"><button type="button" class="picker-go picker-search">بحث</button></div><div class="picker-hint">حرّك الخريطة حتى يصبح الدبوس فوق العقار</div>`;wrap.appendChild(top);
    const bottom=document.createElement('div');bottom.className='picker-bottom';bottom.innerHTML='<div class="picker-coords">لم يتم تحديد الموقع بعد</div><button type="button" class="picker-full">ملء الشاشة</button>';wrap.appendChild(bottom);
    const status=document.createElement('div');status.className='picker-status';wrap.appendChild(status);const coords=bottom.querySelector('.picker-coords');
    const say=message=>{status.textContent=message;status.classList.add('show');clearTimeout(status._timer);status._timer=setTimeout(()=>status.classList.remove('show'),3000)};
    function update(){const c=map.getCenter();if(latInput)latInput.value=c.lat.toFixed(6);if(lngInput)lngInput.value=c.lng.toFixed(6);if(coords)coords.textContent=`${c.lat.toFixed(6)} ، ${c.lng.toFixed(6)}`}
    map.on('moveend',update);update();
    const refresh=()=>{requestAnimationFrame(()=>map.invalidateSize({pan:false}));setTimeout(()=>map.invalidateSize({pan:false}),120);setTimeout(()=>map.invalidateSize({pan:false}),450)};
    const goTo=(lat,lng,zoom=18)=>{if(!Number.isFinite(lat)||!Number.isFinite(lng))return;map.setView([clamp(lat,-90,90),clamp(lng,-180,180)],zoom,{animate:true});refresh();say('تم تحديد الموقع من الرابط')};
    top.querySelector('.picker-go').onclick=()=>{const input=top.querySelector(`#${mapId}GoogleLink`);const result=parseGoogleMapsLink(input.value);if(result)goTo(result.lat,result.lng);else say('هذا الرابط لا يحتوي إحداثيات قابلة للقراءة. جرّب رابط Google Maps الكامل.')};
    top.querySelector('.picker-action').onclick=()=>{map.locate({setView:true,maxZoom:18,enableHighAccuracy:true});refresh()};
    map.on('locationerror',()=>say('تعذر الوصول إلى موقع الجهاز، يمكنك تحريك الخريطة يدوياً'));
    const search=async()=>{const input=top.querySelector(`#${mapId}Search`);const btn=top.querySelector('.picker-search');if(!input.value.trim())return;say('جاري البحث…');if(btn)btn.disabled=true;try{const result=await searchPlace(input.value);if(!result){say('لم أجد هذا المكان. جرّب اسم المنطقة بشكل أوضح.');return}goTo(result.lat,result.lng,17);say('تم العثور على المكان، راجع الدبوس ثم حرّك الخريطة للدقة.')}catch(error){console.error(error);say('تعذر البحث عن المكان حالياً.')}finally{if(btn)btn.disabled=false}};
    top.querySelector('.picker-search').onclick=search;top.querySelector(`#${mapId}Search`).addEventListener('keydown',e=>{if(e.key==='Enter')search()});
    const fullBtn=bottom.querySelector('.picker-full');
    fullBtn.onclick=()=>{const on=wrap.classList.toggle('picker-fullscreen');fullBtn.textContent=on?'تم':'ملء الشاشة';document.body.classList.toggle('location-picker-active',on);refresh()};
    if(window.ResizeObserver){const ro=new ResizeObserver(refresh);ro.observe(wrap);map._pickerResizeObserver=ro}
    setTimeout(refresh,80);setTimeout(refresh,300);window.formMap=map;return map;
  }

  function mountById(mapId){return mount(mapId)}
  function boot(){if(!window.L){setTimeout(boot,250);return}const box=document.querySelector('.location-box');if(box){const host=box.querySelector('.picker-map');if(host&&!host.id)host.id='subMap'}document.querySelectorAll('.location-box .picker-map').forEach(h=>mount(h.id));new MutationObserver(()=>document.querySelectorAll('.location-box .picker-map').forEach(h=>mount(h.id))).observe(document.body,{childList:true,subtree:true})}
  window.parseGoogleMapsLink=parseGoogleMapsLink;window.mountLocationPicker=mountById;setTimeout(boot,200);
})();