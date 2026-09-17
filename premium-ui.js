// مكتب المجد العقاري — premium mobile app UI layer + first-run app tour
(()=>{
  const KEY='majdalisting_app_tour_seen_v1';
  const icons={menu:'☰',close:'×',search:'⌕',location:'⌖',plus:'＋',minus:'−',pin:'●',back:'‹',check:'✓'};
  const css=`
  :root{--p-ink:#111b1a;--p-muted:#72807d;--p-primary:#087f68;--p-primary2:#12ad91;--p-surface:rgba(255,255,255,.94);--p-border:rgba(20,35,32,.09);--p-shadow:0 18px 55px rgba(15,30,27,.16);--p-ease:cubic-bezier(.22,1,.36,1)}
  html,body{font-family:Cairo,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  button,input,select,textarea{font-family:inherit;-webkit-tap-highlight-color:transparent}
  button{transition:transform .18s var(--p-ease),box-shadow .22s var(--p-ease),background .22s ease,border-color .22s ease,opacity .22s ease}
  button:active{transform:scale(.965)!important}
  .map-toolbar,.category,.search-panel,.bottom-sheet,.map-controls button,.modal-card,.side-menu,.listing{box-shadow:var(--p-shadow)!important}
  .map-toolbar{border-color:rgba(255,255,255,.92)!important;background:rgba(250,252,251,.84)!important;backdrop-filter:blur(26px) saturate(150%)!important;-webkit-backdrop-filter:blur(26px) saturate(150%)!important}
  .office-pill{box-shadow:inset 0 1px 0 #fff,0 5px 16px rgba(20,35,32,.06)!important}
  .office-mark{position:relative;overflow:hidden}.office-mark:after{content:'';position:absolute;inset:1px;border-radius:10px;border:1px solid rgba(255,255,255,.28)}
  .category{border-color:rgba(255,255,255,.95)!important}.category.active{box-shadow:0 10px 25px rgba(16,24,40,.22)!important}
  .search-panel{border-color:rgba(255,255,255,.95)!important}.search-field{box-shadow:inset 0 1px 2px rgba(16,24,40,.025)}
  .map-controls button{border-color:rgba(255,255,255,.95)!important}.map-controls button:hover{box-shadow:0 12px 28px rgba(20,35,32,.18)!important}
  .bottom-sheet{border-top:1px solid rgba(255,255,255,.95)!important}
  .sheet-handle{transition:width .25s var(--p-ease)}.bottom-sheet:active .sheet-handle{width:46px}
  .listing{animation:pCardIn .45s var(--p-ease) both}.listing:nth-child(2){animation-delay:.035s}.listing:nth-child(3){animation-delay:.07s}.listing:nth-child(4){animation-delay:.105s}.listing:nth-child(5){animation-delay:.14s}.listing:nth-child(6){animation-delay:.175s}
  @keyframes pCardIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
  .listing-img{background-color:#edf2f0}.badge{border:1px solid rgba(255,255,255,.8)}
  .price{letter-spacing:.1px}.modal{animation:pModalBg .2s ease}.modal-card{animation:pSheetIn .46s var(--p-ease)}
  @keyframes pModalBg{from{opacity:0}to{opacity:1}}@keyframes pSheetIn{from{opacity:0;transform:translateY(35px) scale(.985)}to{opacity:1;transform:none}}
  .modal-close{left:auto!important;right:14px!important;top:14px!important;width:40px!important;height:40px!important;border:1px solid var(--p-border)!important;background:rgba(255,255,255,.92)!important;font-size:24px!important;line-height:1!important;z-index:50;display:grid;place-items:center;color:var(--p-ink)!important}
  .modal-card h2{padding-right:48px;font-weight:900;letter-spacing:-.3px}.form-grid input,.form-grid select,.form-grid textarea{min-height:47px;transition:border-color .2s,box-shadow .2s,transform .2s}.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus{transform:translateY(-1px)}
  .side-menu{animation:pMenuIn .38s var(--p-ease)}@keyframes pMenuIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
  .side-menu>button:not(.modal-close){position:relative;overflow:hidden}.side-menu>button:not(.modal-close):after{content:'›';position:absolute;left:14px;opacity:.35;font-size:18px}
  .toast{backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important;border:1px solid rgba(255,255,255,.13);font-weight:700}
  .premium-ripple{position:fixed;z-index:999999;width:8px;height:8px;border-radius:50%;pointer-events:none;background:rgba(8,127,104,.22);transform:translate(-50%,-50%) scale(1);animation:pRipple .55s ease-out forwards}@keyframes pRipple{to{transform:translate(-50%,-50%) scale(18);opacity:0}}
  /* The assistant is available from the menu; the floating orb is intentionally removed from the home map. */
  .ai-fab,.ai-hide,.ai-restore{display:none!important}.ai-panel{z-index:75!important}
  /* First-run application tour */
  #appTour{position:fixed;inset:0;z-index:200000;display:none;align-items:flex-end;justify-content:center;background:rgba(5,12,18,.58);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);direction:rtl;padding:14px}
  #appTour.show{display:flex;animation:pTourBg .25s ease}@keyframes pTourBg{from{opacity:0}to{opacity:1}}
  .tour-card{width:min(480px,100%);max-height:min(720px,94dvh);overflow:hidden;border:1px solid rgba(255,255,255,.78);border-radius:30px;background:rgba(249,251,250,.98);box-shadow:0 30px 90px rgba(0,0,0,.28);animation:pTourIn .5s var(--p-ease)}@keyframes pTourIn{from{opacity:0;transform:translateY(42px) scale(.97)}to{opacity:1;transform:none}}
  .tour-top{padding:20px 20px 12px;background:linear-gradient(180deg,#fff,#f8faf9)}.tour-brand{font-size:10px;font-weight:900;color:var(--p-primary)}.tour-title{margin-top:5px;font-size:22px;font-weight:900;color:var(--p-ink);line-height:1.35}.tour-progress{display:flex;gap:5px;margin-top:14px}.tour-progress i{height:4px;flex:1;border-radius:99px;background:#dfe7e4}.tour-progress i.on{background:linear-gradient(90deg,var(--p-primary),var(--p-primary2))}
  .tour-body{padding:22px 20px 16px;overflow:auto}.tour-visual{height:155px;border-radius:25px;background:linear-gradient(145deg,#e5f5f1,#f5f8f7);display:grid;place-items:center;margin-bottom:18px;position:relative;overflow:hidden;border:1px solid rgba(8,127,104,.07)}.tour-visual:before,.tour-visual:after{content:'';position:absolute;border-radius:50%;background:rgba(18,173,145,.1)}.tour-visual:before{width:180px;height:180px;right:-65px;top:-80px}.tour-visual:after{width:120px;height:120px;left:-40px;bottom:-55px}.tour-icon{width:74px;height:74px;border-radius:25px;display:grid;place-items:center;background:rgba(255,255,255,.86);box-shadow:0 12px 30px rgba(8,127,104,.13);font-size:30px;color:var(--p-primary);position:relative;z-index:1}.tour-body h3{margin:0 0 8px;font-size:21px;line-height:1.4;color:var(--p-ink);font-weight:900}.tour-body p{margin:0;color:#697773;font-size:12px;line-height:1.95;font-weight:600}.tour-count{text-align:center;color:#98a5a1;font-size:9px;font-weight:800;margin-top:13px}.tour-actions{display:flex;gap:9px;padding:13px 20px 19px;background:#fff;border-top:1px solid #e8eeeb}.tour-actions button{min-height:50px;border:0;border-radius:16px;font-size:12px;font-weight:900}.tour-next{flex:1;background:linear-gradient(145deg,var(--p-primary2),var(--p-primary));color:#fff;box-shadow:0 10px 24px rgba(8,127,104,.22)}.tour-skip{width:92px;background:#eef2f0;color:#4e5c58}
  @media(max-width:600px){#appTour{padding:0}.tour-card{width:100%;max-height:96dvh;border-radius:30px 30px 0 0}.tour-visual{height:145px}.tour-body{padding:18px 17px 14px}.tour-top{padding:18px 17px 10px}.tour-actions{padding:11px 17px calc(14px + env(safe-area-inset-bottom))}}
  `;
  function inject(){if(document.getElementById('premiumUiCss'))return;const s=document.createElement('style');s.id='premiumUiCss';s.textContent=css;document.head.appendChild(s)}
  function ripple(e){const b=e.currentTarget;if(b.classList.contains('modal-close'))return;const r=document.createElement('span');r.className='premium-ripple';r.style.left=(e.clientX||innerWidth/2)+'px';r.style.top=(e.clientY||innerHeight/2)+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),600)}
  function bindRipples(){document.querySelectorAll('button').forEach(b=>{if(b.dataset.pRipple)return;b.dataset.pRipple='1';b.addEventListener('pointerdown',ripple,{passive:true})})}
  const steps=[
    {icon:'⌂',title:'أهلاً بك في مكتب المجد العقاري',text:'تجربة عقارية بسيطة وسريعة. استكشف الخريطة، ابحث عن العقارات، وافتح تفاصيل أي إعلان بلمسة واحدة.'},
    {icon:'⌕',title:'ابحث واستكشف',text:'استخدم البحث والتصنيفات للوصول إلى العقار الذي تبحث عنه، والتنقل على الخريطة لرؤية المواقع مباشرة.'},
    {icon:'＋',title:'أضف عقارك بسهولة',text:'من القائمة اختر «إضافة عقار». أولاً حدد موقع العقار على الخريطة، ثم تابع لإدخال السعر والاسم والصور والتفاصيل.'},
    {icon:'✦',title:'المساعد العقاري',text:'ستجد المساعد داخل القائمة. اسأله عن العقارات المنشورة، الأسعار، البيع أو الإيجار، ويمكنك طلب مقارنة النتائج.'},
    {icon:'▣',title:'تفاصيل الإعلان',text:'اضغط على أي عقار لرؤية الصور والسعر والموقع والتفاصيل وبيانات التواصل المتاحة.'},
    {icon:'✓',title:'أنت جاهز',text:'كل شيء مصمم ليكون سريعاً وواضحاً على الهاتف. يمكنك إعادة هذا الشرح لاحقاً من قائمة التطبيق.'}
  ];
  function ensureTour(){let el=document.getElementById('appTour');if(el)return el;el=document.createElement('div');el.id='appTour';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.innerHTML='<div class="tour-card"><div class="tour-top"><div class="tour-brand">مكتب المجد العقاري</div><div class="tour-title">دليل استخدام التطبيق</div><div class="tour-progress"></div></div><div class="tour-body"><div class="tour-visual"><div class="tour-icon"></div></div><h3></h3><p></p><div class="tour-count"></div></div><div class="tour-actions"><button class="tour-skip" type="button">تخطي</button><button class="tour-next" type="button">التالي</button></div></div>';document.body.appendChild(el);return el}
  function openTour(mark=true){inject();const el=ensureTour();let i=0;const prog=el.querySelector('.tour-progress'),icon=el.querySelector('.tour-icon'),title=el.querySelector('h3'),text=el.querySelector('p'),count=el.querySelector('.tour-count'),next=el.querySelector('.tour-next');prog.innerHTML=steps.map((_,n)=>`<i data-n="${n}"></i>`).join('');const render=()=>{const x=steps[i];icon.textContent=x.icon;title.textContent=x.title;text.textContent=x.text;count.textContent=`${i+1} من ${steps.length}`;prog.querySelectorAll('i').forEach((p,n)=>p.classList.toggle('on',n<=i));next.textContent=i===steps.length-1?'فهمت، ابدأ الاستكشاف':'التالي'};const finish=()=>{el.classList.remove('show');if(mark)try{localStorage.setItem(KEY,'1')}catch(_){}};el.querySelector('.tour-skip').onclick=finish;next.onclick=()=>{if(i<steps.length-1){i++;render()}else finish()};el.onclick=e=>{if(e.target===el)finish()};render();el.classList.add('show');bindRipples()}
  function maybe(){try{if(localStorage.getItem(KEY)==='1')return}catch(_){}setTimeout(()=>openTour(true),1100)}
  window.openAppTutorial=()=>openTour(false);
  window.markAppTutorialSeen=()=>{try{localStorage.setItem(KEY,'1')}catch(_){}};
  inject();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',maybe,{once:true});else maybe();
  const observer=new MutationObserver(()=>bindRipples());observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(bindRipples,300);
})();
