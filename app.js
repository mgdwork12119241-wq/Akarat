const SUPABASE_URL = 'https://utvwvwlrsqoccqwxgfil.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bR3lG3PwdaX3XSyo6s3_uQ_25LWaOCC';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let listings = [];
const labels = { rent: 'للإيجار', sale: 'للبيع' };
const typeLabels = {
  apartment: 'شقة', house: 'منزل', villa: 'فيلا', land: 'أرض',
  shop: 'محل', office: 'مكتب', building: 'مبنى', other: 'أخرى'
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return 'السعر عند التواصل';
  return `${Number(price).toLocaleString('ar-SY')} ل.س`;
}

function formatDetails(item) {
  const parts = [];
  if (item.rooms !== null && item.rooms !== undefined) parts.push(`${item.rooms} غرف`);
  if (item.area !== null && item.area !== undefined) parts.push(`${Number(item.area).toLocaleString('ar-SY')} م²`);
  return parts.join(' · ') || 'التفاصيل متوفرة داخل الإعلان';
}

function normalizeListing(row) {
  const firstImage = row.property_images?.slice().sort((a, b) => a.sort_order - b.sort_order)[0];
  return {
    id: row.id,
    deal: row.deal_type,
    type: row.property_type,
    title: row.title,
    location: row.address || 'الموقع عند التواصل',
    details: formatDetails(row),
    price: formatPrice(row.price),
    image: firstImage?.image_url || '',
    latitude: row.latitude,
    longitude: row.longitude,
    images: row.property_images || []
  };
}

async function loadListings() {
  const status = document.getElementById('listingStatus');
  try {
    const { data, error } = await db
      .from('properties')
      .select(`id,title,description,property_type,deal_type,price,area,rooms,address,latitude,longitude,status,property_images(id,image_url,sort_order)`)
      .in('status', ['published', 'sold', 'rented'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    listings = (data || []).map(normalizeListing);
    status.classList.add('hidden');
    render(listings);
  } catch (error) {
    console.error('Supabase listings error:', error);
    status.textContent = 'تعذر تحميل العقارات حالياً. تأكد من اتصال قاعدة البيانات.';
    document.getElementById('emptyState').classList.add('hidden');
  }
}

function render(items = listings) {
  const grid = document.getElementById('listingGrid');
  const empty = document.getElementById('emptyState');

  grid.innerHTML = items.map(x => `
    <article class="listing">
      <div class="listing-img" ${x.image ? `style="background-image:url('${escapeHtml(x.image)}')"` : ''}>
        <span class="badge">${escapeHtml(labels[x.deal] || x.deal)}</span>
      </div>
      <div class="listing-body">
        <h3>${escapeHtml(x.title)}</h3>
        <div class="meta">📍 ${escapeHtml(x.location)}</div>
        <div class="meta">${escapeHtml(typeLabels[x.type] || x.type)} · ${escapeHtml(x.details)}</div>
        <div class="price">${escapeHtml(x.price)} <small>${x.deal === 'rent' ? 'شهرياً' : ''}</small></div>
      </div>
    </article>
  `).join('');

  empty.classList.toggle('hidden', items.length > 0);
}

function filterListings() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const deal = document.getElementById('dealFilter').value;
  const type = document.getElementById('typeFilter').value;
  render(listings.filter(x =>
    (deal === 'all' || x.deal === deal) &&
    (type === 'all' || x.type === type) &&
    (!q || `${x.title} ${x.location} ${x.details} ${typeLabels[x.type] || ''}`.toLowerCase().includes(q))
  ));
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('dealFilter').value = 'all';
  document.getElementById('typeFilter').value = 'all';
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip[data-deal="all"]')?.classList.add('active');
  render();
}

document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  document.getElementById('dealFilter').value = chip.dataset.deal;
  filterListings();
}));

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') filterListings();
});

function showToast(message) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

loadListings();
