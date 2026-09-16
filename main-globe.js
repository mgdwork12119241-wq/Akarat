(()=>{
  const MAP_ID='publicMap';
  const CENTER=[38.5,35.1];
  const SYRIA_BOUNDS=[[35.4,32.0],[42.7,37.6]];
  const STYLE_URL='https://tiles.openfreemap.org/styles/bright';
  let map=null;
  let markerLayer=[];
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money=v=>v==null||v===''?'السعر عند التواصل':`${Number(v).toLocaleString('ar-SY')} ل.س`;
  function inject(){
    if(document.getElementById('mainMapCss'))return;
    const s=document.createElement('style');s.id='mainMapCss';
    s.textContent=`#publicMap{background:#e7ecea;overflow:hidden}.leaflet-container{display:none!important}.main-map-shell{position:absolute;inset:0;z-index:2}.main-map-shell .maplibregl-canvas{outline:none}.main-map-shell .maplibregl-ctrl-group{background:rgba(255,255,255,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(16,24,40,.1);border-radius:15px;overflow:hidden;box-shadow:0 8px 22px rgba(16,24,40,.14)}.main-map-shell .maplibregl-ctrl button{width:42px;height:42px}.main-map-shell .maplibregl-ctrl-attrib{font-size:8px}.map-syria-label{position:absolute;right:18px;bottom:calc(35dvh + 22px);z-index:5;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.86);color:#344054;font:800 10px Cairo,Arial,sans-serif;box-shadow:0 6px 18px rgba(16,24,40,.1);pointer-events:none;backdrop-filter:blur(12px)}.map-pin-price{min-width:70px;padding:6px 9px;border:2px solid #fff;border-radius:14px;background:#0b7a68;color:#fff;font:800 10px/1.2 Cairo,Arial,sans-serif;text-align:center;box-shadow:0 8px 18px rgba(16,24,40,.22);white-space:nowrap}.map-pin-price.rent{background:#1677a8}.map-pin-price.sale{background:#b86b08}.globe-popup{direction:rtl;text-align:right;font:600 12px/1.6 Cairo,Arial,sans-serif;min-width:145px}.globe-popup b{font-size:13px;color:#16201f}.globe-popup div{color:#0b7a68;font-weight:900}.globe-popup small{color:#71807d}`;
    document.head.appendChild(s)
  }
  function forceArabicLabels(){
    if(!map)return;
    const st=map.getStyle();
    (st.layers||[]).forEach(layer=>{
      if(layer.type!=='symbol'||!layer.layout||!layer.layout['text-field'])return;
      try{map.setLayoutProperty(layer.id,'text-field',['coalesce',['get','name:ar'],['get','name_ar'],['get','name']])}catch(e){}
      try{map.setPaintProperty(layer.id,'text-color','#33403e')}catch(e){}
      try{map.setPaintProperty(layer.id,'text-halo-color','rgba(255,255,255,.92)');map.setPaintProperty(layer.id,'text-halo-width',1.2)}catch(e){}
    })
  }
  function create(){
    if(!window.maplibregl||!document.getElementById(MAP_ID))return false;
    if(map)return true;
    inject();
    const host=document.getElementById(MAP_ID);
    host.querySelectorAll('.leaflet-pane,.leaflet-control-container,.leaflet-marker-icon,.leaflet-marker-shadow').forEach(x=>x.remove());
    const shell=document.createElement('div');shell.className='main-map-shell';host.appendChild(shell);
    map=new maplibregl.Map({container:shell,style:STYLE_URL,center:CENTER,zoom:5.55,minZoom:4.8,maxZoom:18,maxBounds:SYRIA_BOUNDS,maxBoundsViscosity:1,projection:{type:'mercator'},pitch:0,bearing:0,dragRotate:false,renderWorldCopies:false,attributionControl:false,cooperativeGestures:false});
    map.addControl(new maplibregl.NavigationControl({showCompass:false,showZoom:false}),'bottom-left');
    map.addControl(new maplibregl.AttributionControl({compact:true}));
    const tag=document.createElement('div');tag.className='map-syria-label';tag.textContent='سورية';shell.appendChild(tag);
    map.on('load',()=>{forceArabicLabels();map.fitBounds(SYRIA_BOUNDS,{padding:48,duration:0});setTimeout(()=>map.resize(),100);loadPins()});
    return true
  }
  async function loadPins(){
    if(!map||!window.db)return;
    markerLayer.forEach(m=>m.remove());markerLayer=[];
    const {data,error}=await db.from('properties').select('id,title,price,address,latitude,longitude,status,deal_type').in('status',['published','sold','rented']).not('latitude','is',null).not('longitude','is',null);
    if(error)return;
    (data||[]).forEach(x=>{
      const el=document.createElement('div');el.className='map-pin-price '+(x.deal_type==='rent'?'rent':'sale');el.textContent=money(x.price);
      const popup=new maplibregl.Popup({offset:16,closeButton:true,maxWidth:'250px'}).setHTML(`<div class="globe-popup"><b>${esc(x.title)}</b><div>${esc(money(x.price))}</div><small>${esc(x.address||'الموقع عند التواصل')}</small></div>`);
      const m=new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat([Number(x.longitude),Number(x.latitude)]).setPopup(popup).addTo(map);markerLayer.push(m)
    })
  }
  function locate(){if(!map||!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(p=>{map.flyTo({center:[p.coords.longitude,p.coords.latitude],zoom:13,duration:1000,essential:true})},()=>{})}
  function wire(){
    document.getElementById('zoomIn')?.addEventListener('click',()=>map?.zoomIn());
    document.getElementById('zoomOut')?.addEventListener('click',()=>map?.zoomOut());
    document.getElementById('resetMap')?.addEventListener('click',()=>map?.fitBounds(SYRIA_BOUNDS,{padding:48,duration:800}));
    document.getElementById('locateBtn')?.addEventListener('click',locate)
  }
  function boot(){if(!create()){setTimeout(boot,300);return}wire()}
  new MutationObserver(()=>{if(!map)boot()}).observe(document.body,{childList:true,subtree:true});
  setTimeout(boot,250);
  window.MainGlobe={reload:loadPins,focus:(lng,lat,z=13)=>map?.flyTo({center:[lng,lat],zoom:z,duration:900}),getMap:()=>map};
})();