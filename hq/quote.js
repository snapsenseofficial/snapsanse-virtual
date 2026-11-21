// SnapSense HQ — Sebut Harga (quotation) module. Owner: Hafiz (Account Manager).
// List of quotes + editor with live A4 preview, PDF download and WhatsApp message.
(function () {
  'use strict';
  const HQ = window.HQ;
  const esc = HQ.esc;

  const ICON = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h5"/></svg>';
  const STATUSES = ['draf', 'dihantar', 'diterima', 'ditolak', 'dibayar'];
  const ST = {
    draf: { label: 'Draf', tone: 'muted', act: 'Tanda draf' },
    dihantar: { label: 'Dihantar', tone: 'info', act: 'Tanda dihantar' },
    diterima: { label: 'Diterima', tone: 'good', act: 'Tanda diterima' },
    ditolak: { label: 'Ditolak', tone: 'bad', act: 'Tanda ditolak' },
    dibayar: { label: 'Dibayar', tone: 'accent', act: 'Tanda dibayar' },
  };
  const CATS = [['wedding', 'Perkahwinan'], ['konvo', 'Konvokesyen'], ['potret', 'Potret & Pre-wedding'], ['produk', 'Produk'],
    ['auto', 'Automotif'], ['content', 'Content Bulanan'], ['event', 'Event'], ['addon', 'Add-on']];
  const DOC_W = 794; // A4 @ 96dpi
  const DOC_H = 1123;

  // ---------- module state ----------
  let root = null;
  let view = 'list'; // 'list' | 'edit'
  let filter = 'semua';
  let query = '';
  let draft = null; // working copy in the editor
  let editId = null; // null = not saved yet
  let dirty = false;
  let noTouched = false;
  let pane = 'form'; // phone: 'form' | 'preview'
  let pending = null; // prefill from HQ.newQuote
  let rafId = 0;
  let ro = null;

  // ---------- helpers ----------
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const money = (n) => (Number(n) || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const company = () => HQ.company() || {};
  const prefix = () => String(company().quotePrefix || 'SS-Q').trim() || 'SS-Q';
  const $ = (id) => document.getElementById(id);
  const pill = (s) => { const st = ST[s] || ST.draf; return `<span class="pill" data-tone="${st.tone}">${esc(st.label)}</span>`; };
  const qtyText = (it) => { const q = HQ.num(it.qty); return `${q.toLocaleString('en-MY', { maximumFractionDigits: 2 })}${it.unit ? ' ' + it.unit : ''}`; };
  const igHandle = (s) => { s = String(s || '').trim(); if (!s) return '@snapsenseofficial'; s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, ''); return s.startsWith('@') ? s : '@' + s; };

  function defaultTerms(pct) {
    return [
      `Deposit ${pct}% daripada jumlah diperlukan untuk mengesahkan tarikh tempahan.`,
      'Baki bayaran perlu dijelaskan sebelum penghantaran hasil kerja atau pada hari acara.',
      'Deposit tidak dikembalikan, namun tarikh boleh ditukar sekali tertakluk kepada kekosongan.',
      'Caj perjalanan dikenakan untuk lokasi di luar daerah.',
      'Tempoh penghantaran hasil kerja adalah mengikut pakej yang dipilih.',
      'Semua harga dalam Ringgit Malaysia (RM).',
    ].join('\n');
  }
  function companyTerms(pct) {
    const t = String(company().terms || '').split('\n').map((s) => s.trim()).filter(Boolean);
    return t.length ? t.join('\n') : defaultTerms(pct);
  }

  function nextNo(ymd, exceptId) {
    const ym = (ymd || HQ.today()).slice(2, 7).replace('-', '');
    const pre = `${prefix()}-${ym}-`;
    let max = 0; let count = 0;
    HQ.list('quotes').forEach((q) => {
      if (q.id === exceptId || !String(q.no || '').startsWith(pre)) return;
      count++;
      const n = parseInt(String(q.no).slice(pre.length), 10);
      if (n > max) max = n;
    });
    return pre + String(Math.max(max, count) + 1).padStart(3, '0');
  }

  function lineFromPkg(p) {
    const detail = [p.cover, (p.inc || []).join(', ')].filter(Boolean).join(' · ');
    return { desc: p.name || '', detail, qty: p.min || 1, unit: p.unit || '', price: HQ.num(p.price) };
  }
  const normItem = (it) => ({ desc: it.desc || '', detail: it.detail || '', qty: it.qty == null ? 1 : it.qty, unit: it.unit || '', price: it.price == null ? 0 : it.price });

  // totals from a draft (discMode/discVal) or a stored doc
  function calc(d) {
    const subtotal = r2((d.items || []).reduce((s, it) => s + HQ.num(it.qty) * HQ.num(it.price), 0));
    const pctMode = d.discMode ? d.discMode === 'pct' : !!d.discountPct;
    const raw = d.discMode ? HQ.num(d.discVal) : (pctMode ? HQ.num(d.discountPct) : HQ.num(d.discount));
    const discountPct = pctMode ? Math.min(100, Math.max(0, raw)) : 0;
    const discount = Math.min(subtotal, pctMode ? r2(subtotal * discountPct / 100) : r2(Math.max(0, raw)));
    const total = r2(subtotal - discount);
    const depositPct = Math.min(100, Math.max(0, HQ.num(d.depositPct)));
    const deposit = r2(total * depositPct / 100);
    return { subtotal, discount, discountPct, total, depositPct, deposit, balance: r2(total - deposit) };
  }

  function blankDraft(p) {
    p = p || {};
    const c = company();
    const date = p.date || HQ.today();
    const depositPct = p.depositPct != null ? p.depositPct : (HQ.num(c.depositPct) || 30);
    const items = (p.items || []).map(normItem);
    (p.packageIds || []).forEach((id) => { const pk = HQ.get('packages', id); if (pk) items.push(lineFromPkg(pk)); });
    return {
      no: p.no || nextNo(date),
      date,
      validDays: p.validDays || HQ.num(c.validDays) || 14,
      status: 'draf',
      client: { name: '', company: '', phone: '', email: '', address: '', ...(p.client || {}) },
      event: { title: '', date: '', location: '', ...(p.event || {}) },
      items,
      discMode: p.discountPct ? 'pct' : 'rm',
      discVal: p.discountPct || p.discount || '',
      depositPct,
      notes: p.notes || '',
      terms: p.terms || companyTerms(depositPct),
    };
  }

  function fromDoc(q) {
    const d = JSON.parse(JSON.stringify(q));
    delete d.id;
    d.client = { name: '', company: '', phone: '', email: '', address: '', ...(d.client || {}) };
    d.event = { title: '', date: '', location: '', ...(d.event || {}) };
    d.items = (d.items || []).map(normItem);
    d.date = d.date || HQ.today();
    d.validDays = d.validUntil ? Math.max(0, HQ.diffDays(d.validUntil, d.date)) : (HQ.num(company().validDays) || 14);
    d.discMode = d.discountPct ? 'pct' : 'rm';
    d.discVal = d.discountPct ? d.discountPct : (d.discount || '');
    d.depositPct = d.depositPct == null ? (HQ.num(company().depositPct) || 30) : d.depositPct;
    d.status = d.status || 'draf';
    return d;
  }

  function toDoc(d) {
    const t = calc(d);
    const date = d.date || HQ.today();
    const doc = {
      no: String(d.no || '').trim() || nextNo(date, editId),
      date,
      validUntil: HQ.addDays(date, Math.max(0, Math.round(HQ.num(d.validDays)))),
      status: d.status || 'draf',
      client: { ...d.client },
      event: { ...d.event },
      items: d.items.map((it) => ({ desc: String(it.desc || ''), detail: String(it.detail || ''), qty: HQ.num(it.qty), unit: String(it.unit || ''), price: r2(HQ.num(it.price)) })),
      discount: t.discount,
      depositPct: t.depositPct,
      notes: d.notes || '',
      terms: d.terms || '',
      subtotal: t.subtotal,
      total: t.total,
      deposit: t.deposit,
    };
    if (d.discMode === 'pct' && t.discountPct) doc.discountPct = t.discountPct;
    ['createdAt', 'updatedAt', 'sentAt', 'acceptedAt', 'paidAt', 'rejectedAt'].forEach((k) => { if (d[k]) doc[k] = d[k]; });
    return doc;
  }

  // ---------- CSS ----------
  HQ.css('quote', `
.qt-kpis .kpi-value { font-size: clamp(22px, 2.4vw, 30px); }
.qt-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.qt-search { max-width: 300px; }
.qt-chip-n { font-family: var(--font-mono); font-size: 11px; opacity: .65; }
.qt-row { cursor: pointer; }
.qt-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.qt-small { font-size: 12px; color: var(--muted); }
.qt-strong { font-weight: 600; }
.qt-nowrap { white-space: nowrap; }
.qt-expired { color: var(--warn); font-weight: 700; }
.qt-tbl td.qt-wide { min-width: 150px; }
.qt-nomatch { padding: 28px 16px; text-align: center; color: var(--muted); }
@media (max-width: 600px) { .qt-search { max-width: none; flex: 1 1 100%; } }

.qt-edit > * + * { margin-top: 16px; }
.qt-back { margin-left: -10px; }
.qt-edit .page-head { margin-bottom: 0; }
.qt-edit .page-head .sub { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: center; }
.qt-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 12px; }
.qt-bar .qt-bar-label { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-right: 4px; }
.qt-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); flex: none; }
.qt-dot[data-tone="info"] { background: var(--info); } .qt-dot[data-tone="good"] { background: var(--good); }
.qt-dot[data-tone="bad"] { background: var(--bad); } .qt-dot[data-tone="accent"] { background: var(--accent); }
.qt-pane-toggle { display: none; }
.qt-cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.12fr); gap: 20px; align-items: start; }
.qt-form > .card .card-body { display: flex; flex-direction: column; gap: 14px; }
.qt-lines { display: flex; flex-direction: column; gap: 10px; }
.qt-line { display: grid; gap: 8px; padding: 10px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface-2); }
.qt-line-top { display: flex; gap: 4px; align-items: center; }
.qt-line-top .input { flex: 1 1 auto; font-weight: 600; }
.qt-line-no { width: 22px; flex: none; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
.qt-line .icon-btn { width: 32px; height: 32px; font-size: 14px; }
.qt-line textarea.input { min-height: 54px; font-size: 13px; }
.qt-line-nums { display: grid; grid-template-columns: 84px 110px minmax(0, 1fr) auto; gap: 8px; align-items: end; }
.qt-line-nums .field > label { font-size: 11.5px; color: var(--muted); }
.qt-line-total { font-family: var(--font-mono); font-weight: 700; text-align: right; white-space: nowrap; padding-bottom: 11px; min-width: 96px; }
.qt-items-empty { padding: 18px; text-align: center; color: var(--muted); border: 1.5px dashed var(--line-strong); border-radius: var(--radius-sm); }
.qt-sum { display: grid; gap: 6px; font-size: 14px; padding: 12px 14px; border-radius: var(--radius-sm); background: var(--surface-2); border: 1px solid var(--line); }
.qt-sum > div { display: flex; justify-content: space-between; gap: 12px; }
.qt-sum > div > span:last-child { font-family: var(--font-mono); font-variant-numeric: tabular-nums; white-space: nowrap; }
.qt-sum .qt-sum-total { font-weight: 800; font-size: 16px; border-top: 1px solid var(--line-strong); padding-top: 8px; margin-top: 2px; }
.qt-sum .qt-sum-soft { color: var(--muted); }
.qt-disc { display: flex; gap: 8px; align-items: center; }
.qt-disc .tabs-inline { flex: none; }
.qt-prev-sticky { position: sticky; top: 84px; max-height: calc(100vh - 100px); overflow-y: auto; overflow-x: hidden; padding: 2px 2px 12px; }
.qt-prev-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; }
.qt-prev-head .kpi-label { margin: 0; }
.qt-paper { position: relative; overflow: hidden; border-radius: 3px; box-shadow: var(--shadow-lg); outline: 1px solid var(--line); }
.qt-scale { width: ${DOC_W}px; transform-origin: 0 0; }
.qt-pdf-host { position: absolute; left: -12000px; top: 0; width: ${DOC_W}px; pointer-events: none; }
@media (max-width: 899.98px) {
  .qt-pane-toggle { display: inline-flex; }
  .qt-cols { grid-template-columns: minmax(0, 1fr); }
  .qt-cols[data-pane="form"] .qt-prev { display: none; }
  .qt-cols[data-pane="preview"] .qt-form { display: none; }
  .qt-prev-sticky { position: static; max-height: none; overflow: visible; }
}
@media (max-width: 560px) {
  .qt-line-nums { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .qt-line-total { grid-column: 1 / -1; padding: 0; }
  .qt-edit .page-head .actions .btn { flex: 1 1 auto; }
}

.qt-cat-list { display: flex; flex-direction: column; gap: 18px; margin-top: 14px; }
.qt-cat-group h4 { font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
.qt-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; }
.qt-pk { display: flex; flex-direction: column; gap: 4px; text-align: left; padding: 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font: inherit; cursor: pointer; transition: border-color .15s ease, background-color .15s ease; }
.qt-pk:hover, .qt-pk:focus-visible { border-color: var(--accent); background: var(--accent-bg); }
.qt-pk-top { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
.qt-pk-name { font-weight: 700; }
.qt-pk-price { font-family: var(--font-mono); font-weight: 700; white-space: nowrap; font-size: 13px; }
.qt-pk-price small { font-weight: 500; color: var(--muted); }
.qt-pk-cover { font-size: 12.5px; color: var(--muted); }
.qt-pk-inc { font-size: 12px; color: var(--muted); line-height: 1.4; }
.qt-fu { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface-2); cursor: pointer; }
.qt-fu input { margin-top: 2px; }

/* ---------- A4 document (always white paper, fixed ink) ---------- */
.qt-doc { width: ${DOC_W}px; min-height: ${DOC_H}px; display: flex; flex-direction: column; background: #ffffff; color: #15171c; font-family: var(--font-body); font-size: 12px; line-height: 1.5; text-align: left; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
.qt-doc * { box-sizing: border-box; }
.qt-d-band { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; padding: 34px 56px 28px; background: #15171c; color: #ffffff; }
.qt-d-logo { display: block; height: 22px; width: auto; max-width: none; }
.qt-d-wordmark { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: .02em; color: #ffffff; line-height: 1; }
.qt-d-tag { margin-top: 10px; font-family: var(--font-mono); font-size: 9px; font-weight: 700; letter-spacing: .26em; color: #ffb400; }
.qt-d-title { text-align: right; }
.qt-d-title b { display: block; font-family: var(--font-display); font-size: 28px; font-weight: 800; letter-spacing: .03em; line-height: 1; color: #ffffff; }
.qt-d-title span { display: block; margin-top: 8px; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .34em; color: #9ba2ae; }
.qt-d-stripe { height: 4px; background: #ffb400; }
.qt-d-body { padding: 28px 56px 24px; display: flex; flex-direction: column; gap: 24px; }
.qt-d-label { font-family: var(--font-mono); font-size: 8.5px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
.qt-d-head { display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 32px; align-items: start; }
.qt-d-co { color: #6b7280; font-size: 11px; line-height: 1.6; }
.qt-d-co b { display: block; color: #15171c; font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.qt-d-meta { border-top: 1.5px solid #15171c; }
.qt-d-meta div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
.qt-d-meta span { color: #6b7280; }
.qt-d-meta b { font-family: var(--font-mono); font-weight: 700; font-size: 11px; color: #15171c; }
.qt-d-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 16px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
.qt-d-party { font-size: 11.5px; color: #374151; line-height: 1.6; }
.qt-d-party b { display: block; font-size: 13px; color: #15171c; font-weight: 700; }
.qt-d-muted { color: #6b7280; }
.qt-d-items { width: 100%; border-collapse: collapse; }
.qt-d-items th { padding: 0 8px 8px; font-family: var(--font-mono); font-size: 8.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #6b7280; text-align: left; border-bottom: 1.5px solid #15171c; white-space: nowrap; }
.qt-d-items td { padding: 11px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-size: 12px; }
.qt-d-items th:first-child, .qt-d-items td:first-child { padding-left: 0; width: 34px; }
.qt-d-items th:last-child, .qt-d-items td:last-child { padding-right: 0; }
.qt-d-items .qt-d-n { text-align: right; font-family: var(--font-mono); font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.qt-d-items .qt-d-bil { font-family: var(--font-mono); font-size: 10.5px; color: #6b7280; }
.qt-d-desc { font-weight: 700; color: #15171c; }
.qt-d-detail { margin-top: 3px; font-size: 10.5px; line-height: 1.5; color: #6b7280; white-space: pre-line; }
.qt-d-strong { font-weight: 700; color: #15171c; }
.qt-d-none { text-align: center; color: #6b7280; padding: 26px 0 !important; }
.qt-d-lower { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 32px; align-items: start; }
.qt-d-info { display: flex; flex-direction: column; gap: 16px; font-size: 11.5px; color: #374151; }
.qt-d-bank div { display: flex; gap: 10px; line-height: 1.7; }
.qt-d-bank span { width: 82px; flex: none; color: #6b7280; }
.qt-d-bank b { font-weight: 700; color: #15171c; }
.qt-d-mono { font-family: var(--font-mono); }
.qt-d-notes { white-space: pre-line; }
.qt-d-tot > div { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; font-size: 11.5px; border-bottom: 1px solid #e5e7eb; }
.qt-d-tot > div > b { font-family: var(--font-mono); font-weight: 500; font-size: 11.5px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.qt-d-tot .qt-d-grand { margin: 6px 0; padding: 12px 14px; border: 0; background: #15171c; color: #ffffff; border-radius: 2px; align-items: baseline; }
.qt-d-grand span { font-family: var(--font-mono); font-size: 9.5px; font-weight: 700; letter-spacing: .2em; color: #ffffff; }
.qt-d-tot .qt-d-grand b { font-size: 17px; font-weight: 700; color: #ffb400; }
.qt-d-tot .qt-d-dep b { font-weight: 700; }
.qt-d-terms ol { margin: 0; padding-left: 18px; font-size: 10.5px; line-height: 1.6; color: #374151; }
.qt-d-terms li { padding-left: 4px; margin-bottom: 2px; }
.qt-d-foot { margin-top: auto; padding: 18px 56px 26px; text-align: center; border-top: 1px solid #e5e7eb; }
.qt-d-thanks { font-size: 12px; color: #15171c; }
.qt-d-thanks b { font-family: var(--font-mono); font-size: 10px; letter-spacing: .2em; color: #15171c; }
.qt-d-contact { margin-top: 6px; font-family: var(--font-mono); font-size: 9.5px; color: #6b7280; letter-spacing: .04em; }
.qt-d-accent { display: inline-block; width: 6px; height: 6px; background: #ffb400; border-radius: 50%; margin: 0 8px 1px; vertical-align: middle; }
`);

  // ---------- A4 document ----------
  function docHTML(q) {
    const c = company();
    const t = calc(q);
    const client = q.client || {}; const ev = q.event || {};
    const logo = (document.querySelector('.brand-logo') || {}).src || '';
    const name = c.name || 'SnapSense';
    const phone = c.phone || '016-803 1153';
    const ig = igHandle(c.instagram);
    const tagline = c.tagline || 'TRIGGER YOUR SENSE';
    const items = q.items || [];
    const rows = items.length ? items.map((it, i) => `<tr data-brk>
        <td class="qt-d-bil">${String(i + 1).padStart(2, '0')}</td>
        <td><div class="qt-d-desc">${esc(it.desc || '—')}</div>${it.detail ? `<div class="qt-d-detail">${esc(it.detail)}</div>` : ''}</td>
        <td class="qt-d-n">${esc(qtyText(it))}</td>
        <td class="qt-d-n">${money(it.price)}</td>
        <td class="qt-d-n qt-d-strong">${money(HQ.num(it.qty) * HQ.num(it.price))}</td></tr>`).join('')
      : '<tr><td colspan="5" class="qt-d-none">Belum ada item.</td></tr>';
    const coLines = [
      c.legalName && c.legalName !== name ? esc(c.legalName) + (c.regNo ? ` <span class="qt-d-mono">(${esc(c.regNo)})</span>` : '') : (c.regNo ? `No. pendaftaran <span class="qt-d-mono">${esc(c.regNo)}</span>` : ''),
      c.address ? esc(c.address).replace(/\n/g, '<br>') : '',
      [esc(phone), c.email ? esc(c.email) : ''].filter(Boolean).join(' · '),
      [esc(ig), c.website ? esc(c.website) : ''].filter(Boolean).join(' · '),
    ].filter(Boolean).map((l) => `<div>${l}</div>`).join('');
    const terms = String(q.terms || '').split('\n').map((s) => s.trim().replace(/^(\d+[.)]|[-•*])\s*/, '')).filter(Boolean);
    const bank = c.bankName || c.bankAccount;
    const party = (bTxt, lines) => `${bTxt ? `<b>${esc(bTxt)}</b>` : '<b class="qt-d-muted">—</b>'}${lines.filter(Boolean).map((l) => `<div>${l}</div>`).join('')}`;
    return `<div class="qt-doc">
  <div class="qt-d-band" data-brk>
    <div>${logo ? `<img class="qt-d-logo" src="${esc(logo)}" alt="${esc(name)}">` : `<div class="qt-d-wordmark">${esc(name)}</div>`}<div class="qt-d-tag">${esc(tagline.toUpperCase())}</div></div>
    <div class="qt-d-title"><b>SEBUT HARGA</b><span>QUOTATION</span></div>
  </div>
  <div class="qt-d-stripe"></div>
  <div class="qt-d-body">
    <div class="qt-d-head" data-brk>
      <div class="qt-d-co"><b>${esc(name)}</b>${coLines}</div>
      <div class="qt-d-meta">
        <div><span>No.</span><b>${esc(q.no || '')}</b></div>
        <div><span>Tarikh</span><b>${esc(HQ.fmtDate(q.date))}</b></div>
        <div><span>Sah hingga</span><b>${esc(HQ.fmtDate(q.validUntil))}</b></div>
      </div>
    </div>
    <div class="qt-d-parties" data-brk>
      <div class="qt-d-party"><div class="qt-d-label">Kepada</div>${party(client.name, [
        client.company ? esc(client.company) : '', client.address ? esc(client.address).replace(/\n/g, '<br>') : '',
        [client.phone ? esc(client.phone) : '', client.email ? esc(client.email) : ''].filter(Boolean).join(' · ')])}</div>
      <div class="qt-d-party"><div class="qt-d-label">Projek</div>${party(ev.title, [
        ev.date ? esc(HQ.fmtDateLong(ev.date)) + ` <span class="qt-d-muted">(${esc(HQ.DAYS[HQ.weekday(ev.date)])})</span>` : '',
        ev.location ? esc(ev.location) : ''])}</div>
    </div>
    <table class="qt-d-items">
      <thead><tr data-brk><th>Bil</th><th>Perkara</th><th class="qt-d-n">Kuantiti</th><th class="qt-d-n">Harga seunit (RM)</th><th class="qt-d-n">Jumlah (RM)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="qt-d-lower" data-brk>
      <div class="qt-d-info">
        ${bank ? `<div class="qt-d-bank"><div class="qt-d-label">Maklumat bayaran</div>
          ${c.bankName ? `<div><span>Bank</span><b>${esc(c.bankName)}</b></div>` : ''}
          ${c.bankAccount ? `<div><span>No. akaun</span><b class="qt-d-mono">${esc(c.bankAccount)}</b></div>` : ''}
          ${c.bankHolder ? `<div><span>Nama akaun</span><b>${esc(c.bankHolder)}</b></div>` : ''}</div>` : ''}
        ${q.notes ? `<div><div class="qt-d-label">Nota</div><div class="qt-d-notes">${esc(q.notes)}</div></div>` : ''}
      </div>
      <div class="qt-d-tot">
        <div><span>Subjumlah</span><b>${HQ.rm(t.subtotal)}</b></div>
        ${t.discount ? `<div><span>Diskaun${t.discountPct ? ` (${t.discountPct}%)` : ''}</span><b>− ${HQ.rm(t.discount)}</b></div>` : ''}
        <div class="qt-d-grand"><span>JUMLAH</span><b>${HQ.rm(t.total)}</b></div>
        <div class="qt-d-dep"><span>Deposit (${t.depositPct}%) — sahkan tarikh</span><b>${HQ.rm(t.deposit)}</b></div>
        <div><span>Baki</span><b>${HQ.rm(t.balance)}</b></div>
      </div>
    </div>
    ${terms.length ? `<div class="qt-d-terms"><div class="qt-d-label" data-brk>Terma &amp; syarat</div><ol>${terms.map((s) => `<li data-brk>${esc(s)}</li>`).join('')}</ol></div>` : ''}
  </div>
  <div class="qt-d-foot" data-brk>
    <div class="qt-d-thanks">Terima kasih kerana memilih ${esc(name)} — <b>${esc(tagline.toUpperCase())}</b></div>
    <div class="qt-d-contact">${esc(phone)}<span class="qt-d-accent"></span>${esc(ig)}${c.email ? `<span class="qt-d-accent"></span>${esc(c.email)}` : ''}</div>
  </div>
</div>`;
  }

  // ---------- PDF ----------
  const waitImages = (el) => Promise.all([...el.querySelectorAll('img')].map((img) => (img.complete ? null
    : new Promise((res) => { img.onload = res; img.onerror = res; }))));

  // Returns a jsPDF instance for a quote doc (stored shape or toDoc output).
  async function buildPdf(q) {
    if (!window.html2canvas || !window.jspdf || !window.jspdf.jsPDF) throw new Error('Pustaka PDF tidak dimuat');
    const host = HQ.h('<div class="qt-pdf-host" aria-hidden="true"></div>');
    host.innerHTML = docHTML(q);
    document.body.appendChild(host);
    try {
      const el = host.firstElementChild;
      await waitImages(el);
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* ignore */ } }
      const top = el.getBoundingClientRect().top;
      const domH = el.offsetHeight;
      const breaks = [...el.querySelectorAll('[data-brk]')].map((n) => n.getBoundingClientRect().bottom - top).sort((a, b) => a - b);
      const canvas = await window.html2canvas(el, {
        scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true,
        width: DOC_W, height: domH, windowWidth: DOC_W, scrollX: 0, scrollY: -window.scrollY,
      });
      const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ptPerPx = pw / DOC_W; // css px -> pt
      const k = canvas.width / DOC_W; // css px -> canvas px
      const pageCss = ph / ptPerPx;
      const addSlice = (start, end, yCss) => {
        const sh = Math.max(1, Math.min(canvas.height, Math.round(end * k)) - Math.round(start * k));
        const c2 = document.createElement('canvas');
        c2.width = canvas.width; c2.height = sh;
        const ctx = c2.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c2.width, sh);
        ctx.drawImage(canvas, 0, Math.round(start * k), canvas.width, sh, 0, 0, canvas.width, sh);
        pdf.addImage(c2.toDataURL('image/jpeg', 0.93), 'JPEG', 0, yCss * ptPerPx, pw, (sh / k) * ptPerPx, undefined, 'FAST');
      };
      if (domH <= pageCss + 2) {
        addSlice(0, domH, 0);
      } else {
        const TOP = 40; const BOTTOM = 36;
        let start = 0; let page = 0;
        while (start < domH - 1 && page < 30) {
          const avail = pageCss - (page ? TOP : 0) - BOTTOM;
          let end = start + avail;
          if (end >= domH) end = domH;
          else {
            const cand = breaks.filter((b) => b > start + 60 && b <= end);
            if (cand.length) end = cand[cand.length - 1];
          }
          if (page) pdf.addPage();
          addSlice(start, end, page ? TOP : 0);
          start = end; page++;
        }
        const n = pdf.getNumberOfPages();
        for (let i = 1; i <= n; i++) {
          pdf.setPage(i);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(107, 114, 128);
          pdf.text(`${q.no || ''}  ·  Halaman ${i}/${n}`, pw - 40, ph - 16, { align: 'right' });
        }
      }
      return pdf;
    } finally {
      host.remove();
    }
  }
  HQ.quotePdf = buildPdf;

  async function downloadPdf() {
    const q = toDoc(draft);
    const dl = await HQ.capability('downloads');
    if (!dl) { HQ.toast('Muat turun tidak tersedia di sini', 'bad'); return; }
    const btn = $('qt-pdf');
    if (btn) { btn.disabled = true; btn.textContent = 'Menyediakan PDF…'; }
    try {
      const pdf = await buildPdf(q);
      const client = (q.client.company || q.client.name || 'Klien').replace(/[\\/:*?"<>|]+/g, '').trim();
      await dl.save({ filename: `${q.no} ${client}.pdf`, data: pdf.output('blob') });
      HQ.toast('PDF dimuat turun ✓', 'good');
    } catch (e) {
      if (e && e.code === 'declined') HQ.toast('Muat turun dibatalkan');
      else { console.error(e); HQ.toast('PDF gagal dibuat' + (e && e.code ? ` (${e.code})` : ''), 'bad'); }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Muat turun PDF'; }
    }
  }

  // ---------- WhatsApp ----------
  function waText(q) {
    const c = company();
    const t = calc(q);
    const name = (q.client.name || '').trim();
    const ev = q.event || {};
    const L = [];
    L.push(`Assalamualaikum & salam sejahtera ${name || 'tuan/puan'},`);
    L.push('');
    let intro = `Terima kasih kerana berminat dengan ${c.name || 'SnapSense'}! Berikut sebut harga *${q.no}*`;
    intro += ev.title ? ` untuk *${ev.title}*` : '';
    intro += ev.date ? ` pada ${HQ.fmtDateLong(ev.date)}` : '';
    intro += ev.location ? ` di ${ev.location}` : '';
    L.push(intro + ':');
    L.push('');
    q.items.forEach((it, i) => {
      const qty = HQ.num(it.qty);
      const breakdown = qty !== 1 ? ` (${qtyText(it)} × ${HQ.rm(it.price)})` : '';
      L.push(`${i + 1}. ${it.desc || 'Item'}${breakdown} — ${HQ.rm(qty * HQ.num(it.price))}`);
    });
    L.push('');
    if (t.discount) {
      L.push(`Subjumlah: ${HQ.rm(t.subtotal)}`);
      L.push(`Diskaun${t.discountPct ? ` ${t.discountPct}%` : ''}: −${HQ.rm(t.discount)}`);
    }
    L.push(`*Jumlah: ${HQ.rm(t.total)}*`);
    L.push(`Deposit ${t.depositPct}% (${HQ.rm(t.deposit)}) untuk sahkan tarikh, baki ${HQ.rm(t.balance)} sebelum penghantaran / pada hari acara.`);
    if (c.bankName || c.bankAccount) L.push(`Bayaran boleh dibuat ke ${[c.bankName, c.bankAccount, c.bankHolder].filter(Boolean).join(' · ')}.`);
    if (q.validUntil) L.push(`Sebut harga ini sah sehingga ${HQ.fmtDateLong(q.validUntil)}.`);
    L.push('');
    L.push('PDF sebut harga dilampirkan. Kalau ada soalan atau nak ubah apa-apa, beritahu saja ya. Kami sedia membantu!');
    L.push('');
    L.push('— Hafiz, SnapSense');
    L.push(c.phone || '016-803 1153');
    return L.join('\n');
  }

  // ---------- list view ----------
  function mountList() {
    view = 'list';
    disconnectRO();
    root.innerHTML = `<div class="page-head">
        <h1>Sebut Harga</h1>
        <p class="sub">Sediakan, hantar dan susul sebut harga klien — PDF siap untuk WhatsApp.</p>
        <div class="actions"><button class="btn primary" id="qt-new" type="button">+ Sebut harga baru</button></div>
      </div>
      <div class="grid cols-4 kpis-2up qt-kpis" id="qt-kpis"></div>
      <div class="qt-filters">
        <div class="tabs-inline" id="qt-chips" role="group" aria-label="Tapis ikut status"></div>
        <input class="input qt-search" id="qt-search" type="search" placeholder="Cari klien atau no. sebut harga…" aria-label="Cari sebut harga" value="${esc(query)}">
      </div>
      <div id="qt-listbody"></div>`;
    $('qt-new').onclick = () => openEditor(null);
    $('qt-search').addEventListener('input', (e) => { query = e.target.value; renderList(); });
    $('qt-chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      filter = b.dataset.f; renderList();
    });
    const body = $('qt-listbody');
    body.addEventListener('click', (e) => {
      if (e.target.closest('[data-new]')) { openEditor(null); return; }
      const tr = e.target.closest('tr[data-id]'); if (tr) openEditor(tr.dataset.id);
    });
    body.addEventListener('keydown', (e) => {
      const tr = e.target.closest('tr[data-id]');
      if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openEditor(tr.dataset.id); }
    });
    renderList();
  }

  function renderList() {
    if (view !== 'list' || !$('qt-kpis')) return;
    const all = HQ.list('quotes');
    const today = HQ.today();
    const month = today.slice(0, 7);
    const by = (s) => all.filter((q) => q.status === s);
    const sent = by('dihantar');
    const expired = sent.filter((q) => q.validUntil && q.validUntil < today);
    const won = all.filter((q) => q.status === 'diterima' || q.status === 'dibayar');
    const wonMonth = won.filter((q) => String(q.acceptedAt || q.paidAt || q.date || '').slice(0, 7) === month);
    const decided = won.length + by('ditolak').length;
    const sum = (arr) => arr.reduce((s, q) => s + HQ.num(q.total), 0);
    const [y, m] = month.split('-').map(Number);
    const kpi = (label, value, foot) => `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-foot">${foot}</div></div>`;
    $('qt-kpis').innerHTML = [
      kpi('Draf', by('draf').length, 'belum dihantar'),
      kpi('Menunggu jawapan', sent.length, `${HQ.rm0(sum(sent))}${expired.length ? ` · <span class="qt-expired">${expired.length} tamat tempoh</span>` : ''}`),
      kpi('Diterima bulan ini', HQ.rm0(sum(wonMonth)), `${wonMonth.length} sebut harga · ${HQ.MONTHS_SHORT[m - 1]} ${y}`),
      kpi('Kadar menang', decided ? Math.round(won.length / decided * 100) + '%' : '—', decided ? `${won.length} daripada ${decided} diputuskan` : 'belum ada keputusan'),
    ].join('');

    $('qt-chips').innerHTML = [['semua', 'Semua', all.length], ...STATUSES.map((s) => [s, ST[s].label, by(s).length])]
      .map(([f, l, n]) => `<button type="button" class="chip ${filter === f ? 'on' : ''}" data-f="${f}" aria-pressed="${filter === f}">${esc(l)} <span class="qt-chip-n">${n}</span></button>`).join('');

    const body = $('qt-listbody');
    if (!all.length) {
      body.innerHTML = `<div class="empty">
        <div class="empty-ico">${ICON}</div>
        <p class="empty-title">Belum ada sebut harga</p>
        <p class="empty-text">Buat sebut harga pertama — pilih pakej dari katalog, semak jumlah dan deposit, kemudian muat turun PDF atau salin mesej WhatsApp untuk klien.</p>
        <button class="btn primary" type="button" data-new>+ Sebut harga baru</button></div>`;
      return;
    }
    const s = query.trim().toLowerCase();
    const rows = all
      .filter((q) => filter === 'semua' || q.status === filter)
      .filter((q) => !s || [q.no, q.client && q.client.name, q.client && q.client.company, q.event && q.event.title].join(' ').toLowerCase().includes(s))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.no || '').localeCompare(String(a.no || '')));
    if (!rows.length) {
      body.innerHTML = `<div class="card qt-nomatch">Tiada sebut harga sepadan dengan tapisan ini.</div>`;
      return;
    }
    body.innerHTML = `<div class="card"><div class="table-wrap"><table class="table qt-tbl">
      <thead><tr><th>No</th><th>Tarikh</th><th>Klien</th><th>Projek</th><th class="num">Jumlah</th><th>Status</th><th>Sah hingga</th></tr></thead>
      <tbody>${rows.map((q) => {
        const c = q.client || {}; const ev = q.event || {};
        const exp = q.status === 'dihantar' && q.validUntil && q.validUntil < today;
        return `<tr class="qt-row" data-id="${esc(q.id)}" tabindex="0" aria-label="Buka ${esc(q.no || '')}">
          <td class="mono qt-nowrap">${esc(q.no || '—')}</td>
          <td class="qt-nowrap">${esc(HQ.fmtDate(q.date))}</td>
          <td class="qt-wide"><div class="qt-strong">${esc(c.name || '—')}</div>${c.company ? `<div class="qt-small">${esc(c.company)}</div>` : ''}</td>
          <td class="qt-wide"><div>${esc(ev.title || '—')}</div>${ev.date ? `<div class="qt-small">${esc(HQ.fmtDate(ev.date))}</div>` : ''}</td>
          <td class="num">${HQ.rm(q.total)}</td>
          <td>${pill(q.status)}</td>
          <td class="qt-nowrap ${exp ? 'qt-expired' : ''}">${esc(HQ.fmtDate(q.validUntil))}${exp ? ' · tamat' : ''}</td></tr>`;
      }).join('')}</tbody></table></div></div>`;
  }

  // ---------- editor ----------
  function openEditor(id, prefill) {
    if (id) {
      const q = HQ.get('quotes', id);
      if (!q) { HQ.toast('Sebut harga tidak dijumpai', 'bad'); return; }
      draft = fromDoc(q); editId = id; dirty = false;
    } else {
      draft = blankDraft(prefill); editId = null;
      dirty = !!(prefill && Object.keys(prefill).length);
    }
    noTouched = false;
    pane = 'form';
    view = 'edit';
    renderEditor();
    window.scrollTo(0, 0);
  }

  const field = (id, label, path, value, o = {}) => {
    const ph = o.ph ? ` placeholder="${esc(o.ph)}"` : '';
    const ctrl = o.textarea
      ? `<textarea class="input" id="${id}" data-p="${path}" rows="${o.rows || 2}"${ph}>${esc(value)}</textarea>`
      : `<input class="input" id="${id}" data-p="${path}" type="${o.type || 'text'}" value="${esc(value)}"${ph}${o.attrs ? ' ' + o.attrs : ''}>`;
    return `<div class="field${o.span ? ' span-2' : ''}"><label for="${id}">${esc(label)}</label>${ctrl}${o.hint != null ? `<div class="hint"${o.hintId ? ` id="${o.hintId}"` : ''}>${o.hint}</div>` : ''}</div>`;
  };

  function renderEditor() {
    disconnectRO();
    const d = draft;
    root.innerHTML = `<div class="qt-edit">
      <button class="btn ghost sm qt-back" id="qt-back" type="button">← Kembali</button>
      <div class="page-head">
        <h1 id="qt-h1"></h1>
        <p class="sub" id="qt-sub"></p>
        <div class="actions">
          <button class="btn" id="qt-wa" type="button">Salin mesej WhatsApp</button>
          <button class="btn" id="qt-pdf" type="button">Muat turun PDF</button>
          <button class="btn primary" id="qt-save" type="button">Simpan</button>
        </div>
      </div>
      <div class="card qt-bar" id="qt-bar"></div>
      <div class="tabs-inline qt-pane-toggle" id="qt-pane" role="group" aria-label="Paparan">
        <button type="button" class="chip" id="qt-pane-form" data-pane="form">Borang</button>
        <button type="button" class="chip" id="qt-pane-preview" data-pane="preview">Pratonton</button>
      </div>
      <div class="qt-cols" id="qt-cols" data-pane="${pane}">
        <div class="qt-form stack" id="qt-form">
          <section class="card"><div class="card-head"><h3>Butiran</h3></div><div class="card-body"><div class="form-grid">
            ${field('qt-no', 'No. sebut harga', 'no', d.no, { attrs: 'autocomplete="off" spellcheck="false"' })}
            ${field('qt-date', 'Tarikh', 'date', d.date, { type: 'date' })}
            ${field('qt-valid', 'Sah selama (hari)', 'validDays', d.validDays, { type: 'number', attrs: 'min="0" step="1" inputmode="numeric"', hintId: 'qt-valid-hint', hint: '' })}
          </div></div></section>
          <section class="card"><div class="card-head"><h3>Klien</h3></div><div class="card-body"><div class="form-grid">
            ${field('qt-c-name', 'Nama', 'client.name', d.client.name, { ph: 'cth. Nurul Aina', attrs: 'autocomplete="off"' })}
            ${field('qt-c-company', 'Syarikat', 'client.company', d.client.company, { ph: 'Jika ada' })}
            ${field('qt-c-phone', 'Telefon', 'client.phone', d.client.phone, { type: 'tel', ph: '01x-xxx xxxx' })}
            ${field('qt-c-email', 'Emel', 'client.email', d.client.email, { type: 'email' })}
            ${field('qt-c-address', 'Alamat', 'client.address', d.client.address, { textarea: true, span: true })}
          </div></div></section>
          <section class="card"><div class="card-head"><h3>Projek</h3></div><div class="card-body"><div class="form-grid">
            ${field('qt-e-title', 'Tajuk', 'event.title', d.event.title, { span: true, ph: 'cth. Majlis Nikah & Sanding Aina & Hakim' })}
            ${field('qt-e-date', 'Tarikh acara', 'event.date', d.event.date, { type: 'date' })}
            ${field('qt-e-location', 'Lokasi', 'event.location', d.event.location, { ph: 'cth. Dewan Seri Melati, Shah Alam' })}
          </div></div></section>
          <section class="card"><div class="card-head"><h3>Item</h3><div class="row">
              <button class="btn sm" id="qt-add-cat" type="button">+ Tambah dari katalog</button>
              <button class="btn sm ghost" id="qt-add-blank" type="button">+ Item kosong</button></div></div>
            <div class="card-body"><div class="qt-lines" id="qt-items"></div></div></section>
          <section class="card"><div class="card-head"><h3>Harga &amp; bayaran</h3></div><div class="card-body">
            <div class="form-grid">
              <div class="field"><label for="qt-discount">Diskaun</label>
                <div class="qt-disc"><div class="tabs-inline" role="group" aria-label="Jenis diskaun">
                  <button type="button" class="chip" id="qt-disc-rm" data-disc="rm">RM</button>
                  <button type="button" class="chip" id="qt-disc-pct" data-disc="pct">%</button></div>
                  <input class="input" id="qt-discount" data-p="discVal" type="number" min="0" step="any" inputmode="decimal" value="${esc(d.discVal)}" placeholder="0"></div></div>
              ${field('qt-deposit', 'Deposit (%)', 'depositPct', d.depositPct, { type: 'number', attrs: 'min="0" max="100" step="1" inputmode="numeric"' })}
            </div>
            <div class="qt-sum" id="qt-totals" aria-live="polite"></div>
          </div></section>
          <section class="card"><div class="card-head"><h3>Nota &amp; terma</h3>
              <button class="btn sm ghost" id="qt-terms-reset" type="button">Set semula terma</button></div><div class="card-body">
            ${field('qt-notes', 'Nota (dipaparkan dalam sebut harga)', 'notes', d.notes, { textarea: true, rows: 3, ph: 'cth. Termasuk 2 jam tambahan untuk sesi keluarga.' })}
            ${field('qt-terms', 'Terma & syarat', 'terms', d.terms, { textarea: true, rows: 7, hint: 'Satu terma setiap baris — dinomborkan automatik dalam PDF.' })}
          </div></section>
        </div>
        <div class="qt-prev" aria-label="Pratonton A4">
          <div class="qt-prev-sticky">
            <div class="qt-prev-head"><span class="kpi-label">Pratonton A4</span><span class="qt-small" id="qt-prev-note">Dikemas kini secara langsung</span></div>
            <div class="qt-paper" id="qt-paper"><div class="qt-scale" id="qt-scale"></div></div>
          </div>
        </div>
      </div>
    </div>`;
    bindEditor();
    renderItems();
    renderHead();
    refresh(true);
    if (window.ResizeObserver) { ro = new ResizeObserver(() => fitPreview()); ro.observe($('qt-paper')); }
  }

  function disconnectRO() { if (ro) { ro.disconnect(); ro = null; } }

  function renderHead() {
    if (view !== 'edit' || !$('qt-h1')) return;
    $('qt-h1').textContent = editId ? draft.no : 'Sebut harga baru';
    const who = draft.client.name || draft.client.company;
    $('qt-sub').innerHTML = `${pill(draft.status)}${who ? `<span>${esc(who)}</span>` : ''}${dirty ? '<span class="pill" data-tone="warn">Belum disimpan</span>' : ''}`;
    const acts = ['dihantar', 'diterima', 'ditolak', 'dibayar'].filter((s) => s !== draft.status)
      .map((s) => `<button type="button" class="btn sm" data-st="${s}" id="qt-st-${s}"><span class="qt-dot" data-tone="${ST[s].tone}"></span>${esc(ST[s].act)}</button>`).join('');
    $('qt-bar').innerHTML = `<span class="qt-bar-label">Status</span>${acts}<span class="spacer"></span>
      <button type="button" class="btn sm ghost" id="qt-dup">Duplikasi</button>
      <button type="button" class="btn sm ghost" id="qt-del">Padam</button>`;
    $('qt-disc-rm').classList.toggle('on', draft.discMode !== 'pct');
    $('qt-disc-pct').classList.toggle('on', draft.discMode === 'pct');
    $('qt-disc-rm').setAttribute('aria-pressed', String(draft.discMode !== 'pct'));
    $('qt-disc-pct').setAttribute('aria-pressed', String(draft.discMode === 'pct'));
    ['form', 'preview'].forEach((p) => { const b = $('qt-pane-' + p); b.classList.toggle('on', pane === p); b.setAttribute('aria-pressed', String(pane === p)); });
  }

  function setDirty() {
    if (dirty) return;
    dirty = true; renderHead();
  }

  function renderItems() {
    const box = $('qt-items');
    if (!draft.items.length) {
      box.innerHTML = '<div class="qt-items-empty">Belum ada item. Tambah pakej dari katalog atau item kosong.</div>';
      return;
    }
    const n = draft.items.length;
    box.innerHTML = draft.items.map((it, i) => `<div class="qt-line">
      <div class="qt-line-top">
        <span class="qt-line-no">${i + 1}</span>
        <input class="input" id="qt-i-${i}-desc" data-i="${i}" data-k="desc" value="${esc(it.desc)}" placeholder="Perkara / pakej" aria-label="Perkara item ${i + 1}">
        <button type="button" class="icon-btn" data-act="up" data-i="${i}" aria-label="Naikkan" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="icon-btn" data-act="down" data-i="${i}" aria-label="Turunkan" ${i === n - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" class="icon-btn" data-act="del" data-i="${i}" aria-label="Buang item">✕</button>
      </div>
      <textarea class="input" id="qt-i-${i}-detail" data-i="${i}" data-k="detail" rows="2" placeholder="Butiran (pilihan)" aria-label="Butiran item ${i + 1}">${esc(it.detail)}</textarea>
      <div class="qt-line-nums">
        <div class="field"><label for="qt-i-${i}-qty">Kuantiti</label><input class="input" id="qt-i-${i}-qty" data-i="${i}" data-k="qty" type="number" min="0" step="any" inputmode="decimal" value="${esc(it.qty)}"></div>
        <div class="field"><label for="qt-i-${i}-unit">Unit</label><input class="input" id="qt-i-${i}-unit" data-i="${i}" data-k="unit" value="${esc(it.unit)}" placeholder="pakej"></div>
        <div class="field"><label for="qt-i-${i}-price">Harga seunit (RM)</label><input class="input" id="qt-i-${i}-price" data-i="${i}" data-k="price" type="number" min="0" step="any" inputmode="decimal" value="${esc(it.price)}"></div>
        <div class="qt-line-total" id="qt-i-${i}-total">${HQ.rm(HQ.num(it.qty) * HQ.num(it.price))}</div>
      </div></div>`).join('');
  }

  function refresh(now) {
    if (view !== 'edit' || !draft) return;
    const t = calc(draft);
    const until = HQ.addDays(draft.date || HQ.today(), Math.max(0, Math.round(HQ.num(draft.validDays))));
    const hint = $('qt-valid-hint'); if (hint) hint.textContent = `Sah hingga ${HQ.fmtDate(until, true)}`;
    $('qt-totals').innerHTML = `<div><span>Subjumlah</span><span>${HQ.rm(t.subtotal)}</span></div>
      <div><span>Diskaun${t.discountPct ? ` (${t.discountPct}%)` : ''}</span><span>− ${HQ.rm(t.discount)}</span></div>
      <div class="qt-sum-total"><span>Jumlah</span><span>${HQ.rm(t.total)}</span></div>
      <div class="qt-sum-soft"><span>Deposit ${t.depositPct}%</span><span>${HQ.rm(t.deposit)}</span></div>
      <div class="qt-sum-soft"><span>Baki</span><span>${HQ.rm(t.balance)}</span></div>`;
    if (now) { renderPreview(); return; }
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(renderPreview);
  }

  function renderPreview() {
    const sc = $('qt-scale'); if (!sc || !draft) return;
    sc.innerHTML = docHTML(toDoc(draft));
    fitPreview();
  }

  function fitPreview() {
    const paper = $('qt-paper'); const sc = $('qt-scale');
    if (!paper || !sc || !sc.firstElementChild) return;
    const w = paper.clientWidth; if (!w) return;
    const s = Math.min(1, w / DOC_W);
    sc.style.transform = `scale(${s})`;
    paper.style.height = Math.ceil(sc.firstElementChild.offsetHeight * s) + 'px';
  }

  function setPath(obj, path, v) {
    const ks = path.split('.'); let o = obj;
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = v;
  }

  function bindEditor() {
    const form = $('qt-form');
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.p) {
        const p = t.dataset.p;
        setPath(draft, p, t.value);
        if (p === 'no') noTouched = true;
        if (p === 'date' && !editId && !noTouched) { draft.no = nextNo(draft.date); $('qt-no').value = draft.no; }
        if (p === 'client.name') t.removeAttribute('aria-invalid');
        if (p === 'client.name' || p === 'client.company') { setDirty(); renderHead(); }
      } else if (t.dataset.i != null) {
        const i = +t.dataset.i; const it = draft.items[i]; if (!it) return;
        it[t.dataset.k] = t.value;
        const tot = $(`qt-i-${i}-total`); if (tot) tot.textContent = HQ.rm(HQ.num(it.qty) * HQ.num(it.price));
      } else return;
      setDirty();
      refresh();
    });
    form.addEventListener('click', (e) => {
      const disc = e.target.closest('[data-disc]');
      if (disc) {
        if (draft.discMode === disc.dataset.disc) return;
        draft.discMode = disc.dataset.disc; draft.discVal = ''; $('qt-discount').value = '';
        setDirty(); renderHead(); refresh(); $('qt-discount').focus();
        return;
      }
      const b = e.target.closest('[data-act]'); if (!b) return;
      const i = +b.dataset.i; const items = draft.items;
      if (b.dataset.act === 'del') items.splice(i, 1);
      else if (b.dataset.act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
      else if (b.dataset.act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
      setDirty(); renderItems(); refresh();
      const again = document.querySelector(`#qt-items [data-act="${b.dataset.act}"][data-i="${b.dataset.act === 'up' ? i - 1 : b.dataset.act === 'down' ? i + 1 : i}"]`);
      if (again && !again.disabled) again.focus();
    });
    $('qt-add-cat').onclick = openCatalog;
    $('qt-add-blank').onclick = () => {
      draft.items.push({ desc: '', detail: '', qty: 1, unit: '', price: '' });
      setDirty(); renderItems(); refresh();
      const el = $(`qt-i-${draft.items.length - 1}-desc`); if (el) el.focus();
    };
    $('qt-terms-reset').onclick = () => {
      draft.terms = companyTerms(HQ.num(draft.depositPct) || 30); $('qt-terms').value = draft.terms;
      setDirty(); refresh(); HQ.toast('Terma ditetapkan semula');
    };
    $('qt-back').onclick = goBack;
    $('qt-save').onclick = () => save();
    $('qt-wa').onclick = () => HQ.copy(waText(toDoc(draft)));
    $('qt-pdf').onclick = downloadPdf;
    $('qt-pane').addEventListener('click', (e) => {
      const b = e.target.closest('[data-pane]'); if (!b) return;
      pane = b.dataset.pane; $('qt-cols').dataset.pane = pane; renderHead(); fitPreview();
      requestAnimationFrame(fitPreview);
    });
    $('qt-bar').addEventListener('click', (e) => {
      const st = e.target.closest('[data-st]');
      if (st) { setStatus(st.dataset.st); return; }
      if (e.target.closest('#qt-dup')) duplicate();
      else if (e.target.closest('#qt-del')) del();
    });
  }

  async function goBack() {
    if (dirty && !(await HQ.confirm('Ada perubahan yang belum disimpan. Keluar tanpa simpan?', 'Keluar tanpa simpan'))) return;
    dirty = false; draft = null; editId = null;
    mountList();
    window.scrollTo(0, 0);
  }

  async function save(silent) {
    if (!String(draft.client.name || '').trim()) {
      if (pane !== 'form') { pane = 'form'; $('qt-cols').dataset.pane = 'form'; renderHead(); }
      const el = $('qt-c-name'); el.setAttribute('aria-invalid', 'true'); el.focus();
      HQ.toast('Isi nama klien dahulu', 'bad');
      return false;
    }
    if (!String(draft.no || '').trim() || HQ.list('quotes').some((q) => q.id !== editId && q.no === String(draft.no).trim())) {
      const old = draft.no;
      draft.no = nextNo(draft.date, editId); $('qt-no').value = draft.no;
      if (old) HQ.toast(`No. ${old} sudah digunakan — ditukar ke ${draft.no}`);
    }
    const id = editId || HQ.uid('qt');
    const now = HQ.nowISO();
    draft.createdAt = draft.createdAt || now;
    draft.updatedAt = now;
    const doc = toDoc(draft);
    try { await HQ.set('quotes', id, doc); } catch (e) { return false; }
    editId = id; dirty = false;
    renderHead();
    if (!silent) HQ.toast('Sebut harga disimpan ✓', 'good');
    return true;
  }

  function askFollowUp() {
    return new Promise((resolve) => {
      let done = false;
      HQ.modal({
        title: 'Tanda sebagai dihantar',
        body: `<p class="muted" style="margin-top:0">Sebut harga <b class="mono">${esc(draft.no)}</b> akan ditanda sebagai sudah dihantar kepada klien.</p>
          <label class="qt-fu" for="qt-fu"><input type="checkbox" class="input" id="qt-fu" checked>
          <span><b>Tambah peringatan follow-up dalam To-Do (3 hari)</b><br><span class="qt-small">“Follow up sebut harga ${esc(draft.no)} — ${esc(draft.client.name)}” · ${esc(HQ.fmtDate(HQ.addDays(HQ.today(), 3), true))} · Hafiz</span></span></label>`,
        actions: [
          { label: 'Batal', kind: 'ghost', onClick: () => { done = true; resolve(null); } },
          { label: 'Tanda dihantar', kind: 'primary', onClick: (close, body) => { done = true; resolve({ todo: body.querySelector('#qt-fu').checked }); } },
        ],
        onClose: () => { if (!done) resolve(null); },
      });
    });
  }

  async function setStatus(s) {
    if (!String(draft.client.name || '').trim()) { save(); return; }
    let followUp = false;
    if (s === 'dihantar' && typeof HQ.todoQuickAdd === 'function') {
      const r = await askFollowUp();
      if (!r) return;
      followUp = r.todo;
    }
    const prev = { status: draft.status, sentAt: draft.sentAt, acceptedAt: draft.acceptedAt, paidAt: draft.paidAt, rejectedAt: draft.rejectedAt };
    const today = HQ.today();
    draft.status = s;
    if (s === 'dihantar') draft.sentAt = draft.sentAt || today;
    if (s === 'diterima') draft.acceptedAt = today;
    if (s === 'dibayar') { draft.paidAt = today; draft.acceptedAt = draft.acceptedAt || today; }
    if (s === 'ditolak') draft.rejectedAt = today;
    if (!(await save(true))) { Object.assign(draft, prev); renderHead(); return; }
    HQ.toast(`Status: ${ST[s].label} ✓`, 'good');
    if (followUp) {
      try {
        await HQ.todoQuickAdd(`Follow up sebut harga ${draft.no} — ${draft.client.name}`, {
          due: HQ.addDays(today, 3), category: 'Klien', assignee: 'navy', priority: 'sederhana',
          notes: `${draft.event.title || ''}${draft.client.phone ? `\nTelefon: ${draft.client.phone}` : ''}`.trim(),
        });
        HQ.toast('Peringatan follow-up ditambah ke To-Do ✓', 'good');
      } catch (e) { console.error(e); }
    }
  }

  async function duplicate() {
    if (dirty && !(await HQ.confirm('Perubahan pada sebut harga ini belum disimpan dan tidak akan disimpan. Teruskan duplikasi?', 'Teruskan'))) return;
    const copy = JSON.parse(JSON.stringify(draft));
    ['createdAt', 'updatedAt', 'sentAt', 'acceptedAt', 'paidAt', 'rejectedAt'].forEach((k) => delete copy[k]);
    copy.status = 'draf';
    copy.date = HQ.today();
    editId = null;
    copy.no = nextNo(copy.date);
    draft = copy; dirty = true; noTouched = false;
    renderEditor();
    window.scrollTo(0, 0);
    HQ.toast('Salinan dibuat — semak dan simpan');
  }

  async function del() {
    if (!editId) {
      if (!dirty || await HQ.confirm('Buang sebut harga baru ini? Ia belum disimpan.', 'Buang')) { dirty = false; mountList(); }
      return;
    }
    if (!(await HQ.confirm(`Padam sebut harga ${draft.no}${draft.client.name ? ' untuk ' + draft.client.name : ''}? Tindakan ini tidak boleh dibatalkan.`, 'Padam'))) return;
    const id = editId;
    try { await HQ.remove('quotes', id); } catch (e) { return; }
    dirty = false; editId = null; draft = null;
    HQ.toast('Sebut harga dipadam');
    mountList();
  }

  // ---------- catalogue picker ----------
  function openCatalog() {
    const pkgs = HQ.list('packages');
    const body = HQ.h(`<div>
      <input class="input" id="qt-cat-search" type="search" placeholder="Cari pakej… (cth. nikah, konvo, reel)" aria-label="Cari pakej">
      <div class="qt-cat-list" id="qt-cat-list"></div></div>`);
    const list = body.querySelector('#qt-cat-list');
    const draw = () => {
      const s = body.querySelector('#qt-cat-search').value.trim().toLowerCase();
      if (!pkgs.length) { list.innerHTML = '<p class="muted">Katalog pakej masih kosong. Anda boleh guna “+ Item kosong” dahulu.</p>'; return; }
      const match = pkgs.filter((p) => !s || [p.name, p.cover, (p.inc || []).join(' ')].join(' ').toLowerCase().includes(s));
      const known = CATS.map((c) => c[0]);
      const groups = [...CATS, ['__other', 'Lain-lain']].map(([id, label]) => [label, match.filter((p) => (id === '__other' ? !known.includes(p.cat) : p.cat === id))]).filter(([, a]) => a.length);
      list.innerHTML = groups.length ? groups.map(([label, arr]) => `<div class="qt-cat-group"><h4>${esc(label)}</h4><div class="qt-cat-grid">${arr.map((p) => `
        <button type="button" class="qt-pk" data-pk="${esc(p.id)}" id="qt-pk-${esc(p.id)}">
          <span class="qt-pk-top"><span class="qt-pk-name">${esc(p.name)}</span><span class="qt-pk-price">${HQ.rm0(p.price)}${p.unit ? `<small> / ${esc(p.unit)}</small>` : ''}</span></span>
          ${p.cover ? `<span class="qt-pk-cover">${esc(p.cover)}${p.popular ? ' · <b>Popular</b>' : ''}</span>` : ''}
          ${(p.inc || []).length ? `<span class="qt-pk-inc">${esc(p.inc.join(' · '))}</span>` : ''}
        </button>`).join('')}</div></div>`).join('') : '<p class="muted">Tiada pakej sepadan.</p>';
    };
    const m = HQ.modal({ title: 'Tambah dari katalog', body, wide: true });
    body.querySelector('#qt-cat-search').addEventListener('input', draw);
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pk]'); if (!b) return;
      const p = pkgs.find((x) => x.id === b.dataset.pk); if (!p) return;
      draft.items.push(lineFromPkg(p));
      setDirty(); renderItems(); refresh();
      m.close();
      HQ.toast(`${p.name} ditambah`, 'good');
    });
    draw();
  }

  // ---------- data watchers ----------
  function onQuotes() {
    if (view === 'list') { renderList(); return; }
    if (view === 'edit' && editId && !dirty) {
      const q = HQ.get('quotes', editId);
      if (!q) { HQ.toast('Sebut harga ini telah dipadam'); draft = null; editId = null; mountList(); return; }
      if (q.updatedAt && q.updatedAt !== draft.updatedAt) { draft = fromDoc(q); renderEditor(); }
    }
  }
  function onSettings() { if (view === 'edit') refresh(); }

  async function consumePending() {
    if (!pending || !root) return;
    const p = pending; pending = null;
    if (view === 'edit' && dirty && !(await HQ.confirm('Sebut harga semasa belum disimpan. Buang perubahan dan mula sebut harga baru?', 'Buang & teruskan'))) return;
    openEditor(null, p);
  }

  // Open a new quote from anywhere: HQ.newQuote({ client:{...}, event:{...}, items:[...], packageIds:[...] })
  HQ.newQuote = (prefill) => {
    pending = prefill || {};
    HQ.go('quote'); // mount/onShow consume it
  };

  HQ.tab('quote', {
    label: 'Sebut Harga',
    icon: ICON,
    mount(r) {
      root = r;
      mountList();
      HQ.watch('quotes', onQuotes);
      HQ.watch('settings', onSettings);
      window.addEventListener('resize', fitPreview);
    },
    onShow() {
      consumePending();
      requestAnimationFrame(fitPreview);
    },
  });
})();
