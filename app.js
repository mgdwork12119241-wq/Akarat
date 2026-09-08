const listings=[
 {deal:'rent',type:'apartment',title:'شقة واسعة بإطلالة جميلة',location:'حماة · حي البعث',details:'3 غرف · 150 م² · الطابق 2',price:'1,200,000 ل.س',image:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80'},
 {deal:'sale',type:'house',title:'منزل مستقل للبيع',location:'حماة · حي الشريعة',details:'4 غرف · 210 م² · حديقة',price:'850,000,000 ل.س',image:'https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=900&q=80'},
 {deal:'rent',type:'shop',title:'محل تجاري على شارع رئيسي',location:'حماة · وسط المدينة',details:'واجهة زجاجية · 65 م²',price:'2,000,000 ل.س',image:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80'},
 {deal:'sale',type:'land',title:'قطعة أرض مناسبة للبناء',location:'ريف حماة',details:'500 م² · موقع جيد',price:'320,000,000 ل.س',image:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'},
 {deal:'rent',type:'apartment',title:'شقة مفروشة جاهزة للسكن',location:'حماة · حي النصر',details:'2 غرف · 100 م² · مفروشة',price:'1,500,000 ل.س',image:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80'},
 {deal:'sale',type:'apartment',title:'شقة حديثة التشطيب',location:'حماة · طريق حلب',details:'3 غرف · 135 م² · طابق 4',price:'620,000,000 ل.س',image:'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80'}
];
const labels={rent:'للإيجار',sale:'للبيع'};
const typeLabels={apartment:'شقة',house:'منزل',shop:'محل',land:'أرض'};
function render(items=listings){const grid=document.getElementById('listingGrid');const empty=document.getElementById('emptyState');grid.innerHTML=items.map(x=>`<article class="listing"><div class="listing-img" style="background-image:url('${x.image}')"><span class="badge">${labels[x.deal]}</span></div><div class="listing-body"><h3>${x.title}</h3><div class="meta">📍 ${x.location}</div><div class="meta">${typeLabels[x.type]} · ${x.details}</div><div class="price">${x.price} <small>${x.deal==='rent'?'شهرياً':''}</small></div></div></article>`).join('');empty.classList.toggle('hidden',items.length>0)}
function filterListings(){const q=document.getElementById('searchInput').value.trim().toLowerCase();const deal=document.getElementById('dealFilter').value;const type=document.getElementById('typeFilter').value;render(listings.filter(x=>(deal==='all'||x.deal===deal)&&(type==='all'||x.type===type)&&(!q||`${x.title} ${x.location} ${x.details}`.toLowerCase().includes(q))))}
function resetFilters(){document.getElementById('searchInput').value='';document.getElementById('dealFilter').value='all';document.getElementById('typeFilter').value='all';render()}
document.querySelectorAll('.chip').forEach(chip=>chip.addEventListener('click',()=>{document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');document.getElementById('dealFilter').value=chip.dataset.deal;filterListings()}));
document.getElementById('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')filterListings()});
function showToast(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
render();
