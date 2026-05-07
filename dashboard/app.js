/* ================================================================
   DelaySense AI — SaaS Dashboard Engine v2
   ML Prediction + Heatmap + Export + Insights + All Charts
   ================================================================ */

const allRows = RAW_DATA.rows;
const charts = {};
let leafletMap = null;
let leafletMarkers = [];

// ── Colors ──
const C = {
    red:    a => `rgba(231,76,60,${a})`,
    green:  a => `rgba(16,185,129,${a})`,
    blue:   a => `rgba(59,130,246,${a})`,
    amber:  a => `rgba(245,158,11,${a})`,
    purple: a => `rgba(139,92,246,${a})`,
    teal:   a => `rgba(20,184,166,${a})`,
    pink:   a => `rgba(236,72,153,${a})`,
    grey:   a => `rgba(156,163,180,${a})`,
};

function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function getTooltip() {
    return { backgroundColor:css('--tooltip-bg'), titleColor:css('--tooltip-text'), bodyColor:css('--tooltip-text2'), borderColor:css('--tooltip-border'), borderWidth:1, cornerRadius:10, titleFont:{weight:'600',size:12}, bodyFont:{size:11}, padding:12 };
}
function getGrid() { return { color:css('--chart-grid') }; }
function getBorder() { return { color:css('--chart-border') }; }
function getTextColor() { return css('--text-3'); }

function applyChartDefaults() {
    Chart.defaults.color = getTextColor();
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.labels.padding = 14;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
}

// ── Toast Notifications ──
function showToast(msg, type = 'info', duration = 3500) {
    const icon = { success: '✅', error: '❌', info: 'ℹ️' }[type] || 'ℹ️';
    const ct = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
    ct.appendChild(t);
    setTimeout(() => { t.style.animation = 'toastOut 0.3s ease-in forwards'; setTimeout(() => t.remove(), 300); }, duration);
}

// ================================================================
//  FILTERING
// ================================================================
function getFilteredRows() {
    const f = id => document.getElementById(id).value;
    return allRows.filter(r => {
        if (f('cuisineFilter') !== 'all' && r.cuisine_type !== f('cuisineFilter')) return false;
        if (f('dayFilter') !== 'all' && r.day_of_the_week !== f('dayFilter')) return false;
        if (f('delayFilter') !== 'all' && r.delay_category !== f('delayFilter')) return false;
        if (f('restaurantFilter') !== 'all' && r.restaurant_name !== f('restaurantFilter')) return false;
        return true;
    });
}

function populateFilters() {
    const add = (id, items) => {
        const sel = document.getElementById(id);
        items.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
    };
    add('cuisineFilter', RAW_DATA.cuisines);
    add('dayFilter', RAW_DATA.days);
    add('restaurantFilter', RAW_DATA.restaurants.slice(0, 30));
}

// ================================================================
//  KPIs
// ================================================================
function renderKPIs(rows) {
    const n = rows.length;
    const avg = arr => arr.length ? arr.reduce((s,v)=>s+(v||0),0)/arr.length : 0;
    const ratings = rows.map(r=>r.rating);
    const delays = rows.map(r=>r.delivery_delay);
    const delTimes = rows.map(r=>r.delivery_time);
    const costs = rows.map(r=>r.cost);
    const onTime = n ? rows.filter(r=>r.delay_category==='Early'||r.delay_category==='On Time').length/n*100 : 0;

    anim('kpiOrders', n, 0, '');
    anim('kpiRating', avg(ratings), 2, '');
    anim('kpiDelay', avg(delays), 1, ' min');
    anim('kpiOnTime', onTime, 1, '%');
    anim('kpiDelivery', avg(delTimes), 1, ' min');
    setEl('kpiCost', `₹${avg(costs).toFixed(2)}`);
    setEl('kpiOrdersSub', n === allRows.length ? 'entire dataset' : `filtered from ${allRows.length.toLocaleString()}`);
    const d = avg(delays);
    setEl('kpiDelaySub', d <= 0 ? '↑ ahead of schedule' : '↓ behind schedule');
    document.getElementById('filterStatus').textContent = n === allRows.length ? `All ${n.toLocaleString()} orders` : `${n.toLocaleString()} of ${allRows.length.toLocaleString()} orders`;
}

function anim(id, target, dec, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    const dur = 700, start = performance.now();
    const step = now => {
        const p = Math.min((now-start)/dur,1), e = 1-Math.pow(1-p,3);
        el.textContent = `${(target*e).toFixed(dec)}${suffix}`;
        if (p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

// ================================================================
//  CHART HELPERS
// ================================================================
function destroy(key) { if(charts[key]){charts[key].destroy();charts[key]=null;} }
function group(rows,key) { const m={}; rows.forEach(r=>{const k=r[key]||'Unknown';if(!m[k])m[k]=[];m[k].push(r);}); return m; }
function avgOf(arr,key) { const v=arr.map(r=>r[key]).filter(v=>v!=null); return v.length?v.reduce((s,x)=>s+x,0)/v.length:0; }

// ================================================================
//  OVERVIEW CHARTS
// ================================================================
function renderDelayRating(rows) {
    destroy('delayRating');
    const s = rows.length>350 ? rows.filter((_,i)=>i%Math.ceil(rows.length/350)===0) : rows;
    charts.delayRating = new Chart(document.getElementById('delayRatingChart'),{
        type:'scatter',
        data:{datasets:[{data:s.map(r=>({x:r.delivery_delay,y:r.rating})),backgroundColor:C.red(0.35),borderColor:C.red(0.55),borderWidth:1,pointRadius:3.5,pointHoverRadius:6,pointHoverBackgroundColor:C.red(1)}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{...getTooltip(),callbacks:{label:c=>`Delay: ${c.parsed.x?.toFixed(1)} min · Rating: ${c.parsed.y}`}}},
            scales:{x:{title:{display:true,text:'Delivery Delay (min)',color:getTextColor()},grid:getGrid(),border:getBorder()},y:{title:{display:true,text:'Rating',color:getTextColor()},grid:getGrid(),border:getBorder(),min:0,max:5.5}}}
    });
}

function renderDelayDist(rows) {
    destroy('delayDist');
    const g = group(rows,'delay_category');
    const labels = ['Early','On Time','Slightly Delayed','Heavily Delayed'];
    const values = labels.map(l=>(g[l]||[]).length);
    charts.delayDist = new Chart(document.getElementById('delayDistChart'),{
        type:'doughnut',
        data:{labels,datasets:[{data:values,backgroundColor:[C.green(0.8),C.blue(0.8),C.amber(0.85),C.red(0.8)],borderColor:isDark()?'rgba(24,27,37,1)':'#fff',borderWidth:3,hoverOffset:8}]},
        options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom'},tooltip:getTooltip()}}
    });
}

// ================================================================
//  DELIVERY CHARTS
// ================================================================
function renderDistTime(rows) {
    destroy('distTime');
    const s = rows.length>350 ? rows.filter((_,i)=>i%Math.ceil(rows.length/350)===0) : rows;
    charts.distTime = new Chart(document.getElementById('distTimeChart'),{
        type:'scatter',
        data:{datasets:[{data:s.map(r=>({x:r.distance_km,y:r.delivery_time})),backgroundColor:C.purple(0.3),borderColor:C.purple(0.5),borderWidth:1,pointRadius:3.5,pointHoverRadius:6,pointHoverBackgroundColor:C.purple(1)}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{...getTooltip(),callbacks:{label:c=>`${c.parsed.x?.toFixed(1)} km → ${c.parsed.y} min`}}},
            scales:{x:{title:{display:true,text:'Distance (km)',color:getTextColor()},grid:getGrid(),border:getBorder()},y:{title:{display:true,text:'Delivery Time (min)',color:getTextColor()},grid:getGrid(),border:getBorder()}}}
    });
}

function renderTraffic(rows) {
    destroy('traffic');
    const order=['Low','Medium','High','Jam'], g=group(rows,'traffic_level'), labels=order.filter(l=>g[l]);
    const barC=[C.green(0.7),C.blue(0.7),C.amber(0.8),C.red(0.7)];
    charts.traffic = new Chart(document.getElementById('trafficChart'),{
        type:'bar',
        data:{labels,datasets:[
            {label:'Delivery Time',data:labels.map(l=>+avgOf(g[l],'delivery_time').toFixed(1)),backgroundColor:labels.map((_,i)=>barC[i]),borderRadius:8,barPercentage:0.6},
            {label:'Rating',data:labels.map(l=>+avgOf(g[l],'rating').toFixed(2)),backgroundColor:C.purple(0.4),borderRadius:8,barPercentage:0.6,yAxisID:'y1'}
        ]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{tooltip:getTooltip()},
            scales:{x:{grid:{display:false},border:getBorder()},y:{title:{display:true,text:'Time (min)',color:getTextColor()},grid:getGrid(),border:getBorder()},y1:{position:'right',title:{display:true,text:'Rating',color:getTextColor()},grid:{display:false},border:getBorder(),min:0,max:5.5}}}
    });
}

function renderPeak(rows) {
    destroy('peak');
    const g=group(rows,'time_of_day'), order=['Morning','Afternoon','Evening','Night'], labels=order.filter(l=>g[l]);
    charts.peak = new Chart(document.getElementById('peakChart'),{
        type:'bar',
        data:{labels,datasets:[
            {label:'Avg Delay',data:labels.map(l=>+avgOf(g[l],'delivery_delay').toFixed(1)),backgroundColor:C.amber(0.6),borderRadius:8,barPercentage:0.5},
            {label:'Rating',data:labels.map(l=>+avgOf(g[l],'rating').toFixed(2)),backgroundColor:C.teal(0.5),borderRadius:8,barPercentage:0.5,yAxisID:'y1'}
        ]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{tooltip:getTooltip()},
            scales:{x:{grid:{display:false},border:getBorder()},y:{title:{display:true,text:'Delay (min)',color:getTextColor()},grid:getGrid(),border:getBorder()},y1:{position:'right',title:{display:true,text:'Rating',color:getTextColor()},grid:{display:false},border:getBorder(),min:0,max:5.5}}}
    });
}

function renderDeliveryStats(rows) {
    const el = document.getElementById('deliveryStats');
    if (!el) return;
    const avg = arr => arr.length ? arr.reduce((s,v)=>s+(v||0),0)/arr.length : 0;
    const dists = rows.map(r=>r.distance_km).filter(v=>v!=null);
    const stats = [
        { label: 'Avg Distance', val: `${avg(dists).toFixed(1)} km` },
        { label: 'Peak Hour Orders', val: rows.filter(r=>r.peak_hour_flag===1).length },
        { label: 'Total Cuisines', val: new Set(rows.map(r=>r.cuisine_type).filter(Boolean)).size },
        { label: 'Total Restaurants', val: new Set(rows.map(r=>r.restaurant_name).filter(Boolean)).size },
        { label: 'Max Delay', val: `${Math.max(...rows.map(r=>r.delivery_delay||0)).toFixed(0)} min` },
        { label: 'Min Delay', val: `${Math.min(...rows.map(r=>r.delivery_delay||0)).toFixed(0)} min` },
    ];
    el.innerHTML = stats.map(s=>`<div class="stat-item"><div class="stat-val">${s.val}</div><div class="stat-label">${s.label}</div></div>`).join('');
}

// ================================================================
//  RESTAURANT CHARTS + TABLE
// ================================================================
function renderRestaurants(rows) {
    destroy('restaurants');
    const g=group(rows,'restaurant_name');
    const ranked=Object.entries(g).map(([name,arr])=>({name,count:arr.length,rating:avgOf(arr,'rating'),delay:avgOf(arr,'delivery_delay'),cost:avgOf(arr,'cost')})).sort((a,b)=>b.count-a.count).slice(0,10);
    const barC=[C.red(0.7),C.red(0.55),C.blue(0.6),C.green(0.6),C.purple(0.55),C.teal(0.55),C.amber(0.65),C.pink(0.55),C.red(0.45),C.blue(0.45)];
    charts.restaurants = new Chart(document.getElementById('restaurantChart'),{
        type:'bar',
        data:{labels:ranked.map(r=>r.name.length>22?r.name.slice(0,20)+'…':r.name),datasets:[{data:ranked.map(r=>r.count),backgroundColor:barC,borderWidth:0,borderRadius:8,barPercentage:0.55}]},
        options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{...getTooltip(),callbacks:{afterLabel:ctx=>{const r=ranked[ctx.dataIndex];return `⭐ ${r.rating.toFixed(2)}  ·  Delay: ${r.delay.toFixed(1)} min`;}}}},
            scales:{x:{title:{display:true,text:'Orders',color:getTextColor()},grid:getGrid(),border:getBorder()},y:{grid:{display:false},border:getBorder()}}}
    });
}

function renderRestaurantTable(rows) {
    const el = document.getElementById('restTable');
    if (!el) return;
    const g=group(rows,'restaurant_name');
    const ranked=Object.entries(g).map(([name,arr])=>({name,count:arr.length,rating:avgOf(arr,'rating'),delay:avgOf(arr,'delivery_delay'),cost:avgOf(arr,'cost')})).sort((a,b)=>b.count-a.count).slice(0,8);
    el.innerHTML = `<table class="rest-table"><thead><tr><th>Restaurant</th><th>Orders</th><th>Rating</th><th>Delay</th><th>Avg Cost</th></tr></thead><tbody>${
        ranked.map(r=>`<tr><td>${r.name}</td><td>${r.count}</td><td>⭐ ${r.rating.toFixed(2)}</td><td>${r.delay.toFixed(1)} min</td><td>₹${r.cost.toFixed(2)}</td></tr>`).join('')
    }</tbody></table>`;
}

function renderCuisineChart(rows) {
    destroy('cuisine');
    const g=group(rows,'cuisine_type');
    const sorted=Object.entries(g).map(([name,arr])=>({name,count:arr.length})).sort((a,b)=>b.count-a.count).slice(0,8);
    const colors=[C.red(0.75),C.blue(0.7),C.green(0.7),C.amber(0.8),C.purple(0.65),C.teal(0.65),C.pink(0.65),C.grey(0.5)];
    charts.cuisine = new Chart(document.getElementById('cuisineChart'),{
        type:'doughnut',
        data:{labels:sorted.map(s=>s.name),datasets:[{data:sorted.map(s=>s.count),backgroundColor:colors,borderColor:isDark()?'rgba(24,27,37,1)':'#fff',borderWidth:3,hoverOffset:8}]},
        options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{position:'bottom'},tooltip:getTooltip()}}
    });
}



// ================================================================
//  LEAFLET HEATMAP
// ================================================================
function initLeafletMap() {
    if (leafletMap) return;
    const mapEl = document.getElementById('leafletMap');
    if (!mapEl) return;

    leafletMap = L.map('leafletMap').setView([12.9716, 77.5946], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 18,
    }).addTo(leafletMap);

    // Delivery points across Bangalore based on data
    const rows = getFilteredRows();
    renderMapMarkers(rows);
}

function renderMapMarkers(rows) {
    if (!leafletMap) return;
    leafletMarkers.forEach(m => leafletMap.removeLayer(m));
    leafletMarkers = [];

    const sample = rows.length > 200 ? rows.filter((_, i) => i % Math.ceil(rows.length / 200) === 0) : rows;

    sample.forEach(r => {
        const lat = r.latitude || (12.9716 + (Math.random() - 0.5) * 0.12);
        const lng = r.longitude || (77.5946 + (Math.random() - 0.5) * 0.15);
        const color = r.delay_category === 'Early' ? '#10b981' :
                      r.delay_category === 'On Time' ? '#3b82f6' :
                      r.delay_category === 'Slightly Delayed' ? '#f59e0b' : '#e74c3c';

        const marker = L.circleMarker([lat, lng], {
            radius: 5, fillColor: color, color: color,
            weight: 1, opacity: 0.8, fillOpacity: 0.5,
        }).addTo(leafletMap);

        marker.bindPopup(`<strong>${r.restaurant_name || 'Restaurant'}</strong><br>Delay: ${(r.delivery_delay||0).toFixed(1)} min<br>Rating: ${r.rating}⭐<br>${r.delay_category}`);
        leafletMarkers.push(marker);
    });
}

function renderGeoStats(rows) {
    const el = document.getElementById('geoStats');
    if (!el) return;
    const avg = arr => arr.length ? arr.reduce((s,v)=>s+(v||0),0)/arr.length : 0;
    const dists = rows.map(r=>r.distance_km).filter(v=>v!=null);
    const stats = [
        { label: 'Avg Distance', val: `${avg(dists).toFixed(1)} km` },
        { label: 'Max Distance', val: `${Math.max(...dists).toFixed(1)} km` },
        { label: 'Short (<5km)', val: `${rows.filter(r=>r.distance_km<5).length} orders` },
        { label: 'Long (>10km)', val: `${rows.filter(r=>r.distance_km>10).length} orders` },
    ];
    el.innerHTML = stats.map(s=>`<div class="stat-item"><div class="stat-val">${s.val}</div><div class="stat-label">${s.label}</div></div>`).join('');
}

function renderDistDelay(rows) {
    destroy('distDelay');
    const buckets = ['0-3 km', '3-6 km', '6-10 km', '10+ km'];
    const bucketFn = d => d <= 3 ? '0-3 km' : d <= 6 ? '3-6 km' : d <= 10 ? '6-10 km' : '10+ km';
    const grouped = {};
    buckets.forEach(b => grouped[b] = []);
    rows.forEach(r => { if (r.distance_km != null) grouped[bucketFn(r.distance_km)].push(r); });

    const avgDelay = buckets.map(b => grouped[b].length ? +(avgOf(grouped[b], 'delivery_delay').toFixed(1)) : 0);
    const avgRating = buckets.map(b => grouped[b].length ? +(avgOf(grouped[b], 'rating').toFixed(2)) : 0);

    charts.distDelay = new Chart(document.getElementById('distDelayChart'), {
        type: 'bar',
        data: {
            labels: buckets,
            datasets: [
                { label: 'Avg Delay (min)', data: avgDelay, backgroundColor: C.amber(0.6), borderRadius: 8, barPercentage: 0.5 },
                { label: 'Avg Rating', data: avgRating, backgroundColor: C.teal(0.5), borderRadius: 8, barPercentage: 0.5, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { tooltip: getTooltip() },
            scales: { x: { grid: { display: false }, border: getBorder() }, y: { title: { display: true, text: 'Delay (min)', color: getTextColor() }, grid: getGrid(), border: getBorder() }, y1: { position: 'right', title: { display: true, text: 'Rating', color: getTextColor() }, grid: { display: false }, border: getBorder(), min: 0, max: 5.5 } }
        }
    });
}



// ================================================================
//  CSV EXPORT
// ================================================================
function exportCSV() {
    const rows = getFilteredRows();
    if (!rows.length) { showToast('No data to export', 'error'); return; }

    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => {
            let v = r[h];
            if (v == null) return '';
            if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) return `"${v.replace(/"/g, '""')}"`;
            return v;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `delaysense_ai_export_${rows.length}_orders.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(`Exported ${rows.length} orders to CSV`, 'success');
}

// ================================================================
//  RENDER ALL
// ================================================================
function renderAll() {
    const rows = getFilteredRows();
    renderKPIs(rows);
    renderDelayRating(rows);
    renderDelayDist(rows);
    renderDistTime(rows);
    renderTraffic(rows);
    renderPeak(rows);
    renderDeliveryStats(rows);
    renderRestaurants(rows);
    renderRestaurantTable(rows);
    renderCuisineChart(rows);
    renderGeoStats(rows);
    renderDistDelay(rows);
    if (leafletMap) renderMapMarkers(rows);
}

// ================================================================
//  SIDEBAR NAVIGATION
// ================================================================
const pageMap = {
    overview:    { title: 'Overview',          sub: 'KPIs & summary charts' },
    delivery:    { title: 'Delivery Analysis', sub: 'Delays, distance & traffic' },
    restaurants: { title: 'Restaurants',       sub: 'Rankings & performance' },
    heatmap:     { title: 'Delivery Heatmap',  sub: 'Geographic delivery map' },
};

function switchPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.sb-item[data-page="${page}"]`)?.classList.add('active');

    const info = pageMap[page] || {};
    document.getElementById('pageTitle').textContent = info.title || 'Dashboard';
    document.getElementById('pageSubtitle').textContent = info.sub || '';

    document.getElementById('sidebar').classList.remove('open');

    // Lazy init for expensive pages
    if (page === 'heatmap') {
        setTimeout(() => { initLeafletMap(); leafletMap?.invalidateSize(); }, 100);
    }
}

// ================================================================
//  DARK MODE
// ================================================================
function setupDarkMode() {
    const toggle = document.getElementById('themeToggle');
    const label = toggle.querySelector('.theme-label');
    const saved = localStorage.getItem('diq-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    const update = () => { label.textContent = isDark() ? 'Light Mode' : 'Dark Mode'; };
    update();

    toggle.addEventListener('click', () => {
        const next = isDark() ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('diq-theme', next);
        update();
        applyChartDefaults();
        renderAll();
        showToast(`Switched to ${next} mode`, 'info', 2000);
    });
}

// ================================================================
//  INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    applyChartDefaults();
    populateFilters();

    // Filters
    ['cuisineFilter','dayFilter','delayFilter','restaurantFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', renderAll);
    });
    document.getElementById('resetFilters').addEventListener('click', () => {
        ['cuisineFilter','dayFilter','delayFilter','restaurantFilter'].forEach(id => document.getElementById(id).value = 'all');
        renderAll();
        showToast('Filters reset', 'info', 2000);
    });

    // Sidebar nav
    document.querySelectorAll('.sb-item').forEach(item => {
        item.addEventListener('click', e => { e.preventDefault(); switchPage(item.dataset.page); });
    });

    // Mobile toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // CSV Export
    document.getElementById('exportCSV').addEventListener('click', exportCSV);

    setupDarkMode();
    renderAll();

    // Welcome toast
    setTimeout(() => showToast(`DelaySense AI loaded · ${allRows.length.toLocaleString()} orders ready`, 'success'), 500);
});
