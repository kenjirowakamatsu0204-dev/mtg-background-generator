(async function(){
  const userPanelEl = document.querySelector('.user-panel'); // 初期は hidden
  const galleryEl = document.getElementById('gallery');
  const suggestEl = document.getElementById('suggestList');
  const searchEl  = document.getElementById('searchInput');
  const uploadEl  = document.getElementById('uploadInput');

  const fields = {
    company: document.getElementById('companyField'),
    jpName:  document.getElementById('jpNameField'),
    enName:  document.getElementById('enNameField'),
    title:   document.getElementById('titleField'),
    email:   document.getElementById('emailField')
  };
  const applyBtn = document.getElementById('applyBtn');

  // 単一行強制
  Object.values(fields).forEach(inp=>{
    inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); }});
    inp.addEventListener('input', (e)=>{ e.target.value = e.target.value.replace(/[\r\n]+/g,' '); });
  });

  // データ取得（Drive/Sheets。モックでもOK）
  const [images, people] = await Promise.allSettled([
    GoogleAPI.listDriveImages(), GoogleAPI.fetchPeopleFromSheet()
  ]).then(([a,b])=>[a.value||[], b.value||[]]);

  // カード管理用
  /** @type {{id:string, imgEl:HTMLImageElement, overlay:HTMLElement, card:HTMLElement}[]} */
  const cards = [];

  let selectedPerson = null;
  let hasShownPanel = false;

  // ========= Suggestion =========
  function filterPeople(q){
    q = (q || '').trim().toLowerCase();
    if(!q) return [];
    const norm = s => (s||'').toLowerCase();
    return people
      .map(p=>[p, [norm(p.jpName), norm(p.enName)].some(n=>n.includes(q))])
      .filter(([_,ok])=>ok)
      .map(([p])=>p)
      .slice(0,8);
  }

  function renderSuggest(items){
    suggestEl.innerHTML = '';
    if(items.length===0){ suggestEl.classList.remove('show'); return; }
    items.forEach((p)=>{
      const li = document.createElement('li');
      li.className = 'suggest-item';
      li.setAttribute('role','option');
      li.innerHTML = `
        <span class="badge">${(p.enName||'--').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</span>
        <div>
          <div>${p.jpName||''}</div>
          <div style="font-size:12px;color:#6b7280">${p.enName||''}</div>
        </div>`;
      li.addEventListener('click', ()=>{ choosePerson(p); suggestEl.classList.remove('show'); });
      suggestEl.appendChild(li);
    });
    suggestEl.classList.add('show');
  }

  let suggestTimer;
  searchEl.addEventListener('input', ()=>{
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(()=> renderSuggest(filterPeople(searchEl.value)), 120);
  });
  document.addEventListener('click', (e)=>{
    if(!suggestEl.contains(e.target) && e.target!==searchEl) suggestEl.classList.remove('show');
  });
  // Enterで第一候補を選択
  searchEl.addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){
      const items = filterPeople(searchEl.value);
      if(items.length){ choosePerson(items[0]); suggestEl.classList.remove('show'); }
      e.preventDefault();
    }
  });

  // ========= Overlay Helpers =========
  function getFieldValues(){
    return {
      company: CanvasRenderer.ensureSingleLine(fields.company.value),
      jpName:  CanvasRenderer.ensureSingleLine(fields.jpName.value),
      enName:  CanvasRenderer.ensureSingleLine(fields.enName.value),
      title:   CanvasRenderer.ensureSingleLine(fields.title.value),
      email:   CanvasRenderer.ensureSingleLine(fields.email.value)
    };
  }

  function setOverlayContent(overlay, values){
    overlay.innerHTML = `
      <div class="ov-line company">${values.company || ''}</div>
      <div class="ov-line jpName">${values.jpName || ''}</div>
      <div class="ov-line enName">${values.enName || ''}</div>
      <div class="ov-line title">${values.title || ''}</div>
      <div class="ov-line email">${values.email || ''}</div>
    `;
  }

  function showOverlays(values){
    cards.forEach(({overlay})=>{
      setOverlayContent(overlay, values);
      overlay.classList.add('show');
    });
  }

  function hideOverlays(){
    cards.forEach(({overlay})=> overlay.classList.remove('show'));
  }

  // ========= Person selection =========
  function choosePerson(p){
    selectedPerson = p;

    // 初回ヒット時にユーザーパネルを表示
    if(!hasShownPanel){
      userPanelEl.classList.remove('hidden');
      hasShownPanel = true;
    }

    // 値を反映
    fields.company.value = p.company||'';
    fields.jpName.value  = p.jpName ||'';
    fields.enName.value  = p.enName ||'';
    fields.title.value   = p.title  ||'';
    fields.email.value   = p.email  ||'';
    searchEl.value = p.jpName || p.enName || '';

    // プレビュー（各サムネ左上の半透明パネル）に反映
    const values = getFieldValues();
    showOverlays(values);
  }

  // 更新ボタンで編集値をプレビューに反映
  applyBtn.addEventListener('click', ()=>{
    if(!hasShownPanel) return;
    showOverlays(getFieldValues());
  });

  // ========= Gallery =========
  function createCard({id, url}){
    const card = document.createElement('div');
    card.className = 'card';

    // base image
    const img = document.createElement('img');
    img.alt = '背景';
    img.loading = 'lazy';
    img.src = url;

    // preview overlay (左上)
    const overlay = document.createElement('div');
    overlay.className = 'overlay'; // .show は選択時に付与

    // download button
    const dl = document.createElement('button');
    dl.className = 'dl';
    dl.title = 'ダウンロード';
    dl.innerHTML = `<svg class="icon"><use href="assets/icons.svg#download"></use></svg>`;
    dl.addEventListener('click', async ()=>{
      // キャンバスに描画 → ダウンロード（canvasRendererは左上半透明ブロックを描画済み）
      const values = getFieldValues();
      await CanvasRenderer.renderToCanvas(img, values);
      const fname = (values.enName || 'MeetingBackground').replace(/[^\w.-]+/g,'_') + '_MeetingBackground.jpg';
      CanvasRenderer.downloadCanvas(fname);
    });

    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(dl);
    galleryEl.appendChild(card);

    const record = { id, imgEl: img, overlay, card };
    cards.push(record);
    return record;
  }

  // 初期カード（Drive or Mock）
  images.forEach((f)=> createCard({id:f.id, url:f.thumbUrl || f.fullUrl}));

  // アップロード → 新規カード作成（選択済なら即オーバーレイ反映）
  galleryEl.querySelector('.upload-card').addEventListener('click', ()=> uploadEl.click());
  uploadEl.addEventListener('change', (ev)=>{
    const file = ev.target.files?.[0]; if(!file) return;
    const url = URL.createObjectURL(file);

    // アップロードカードの直後に挿入
    const uploadTile = galleryEl.querySelector('.upload-card');
    const rec = createCard({id:'upload-'+Date.now(), url});
    galleryEl.insertBefore(rec.card, uploadTile.nextSibling);
    if(selectedPerson){
      setOverlayContent(rec.overlay, getFieldValues());
      rec.overlay.classList.add('show');
    }
    uploadEl.value = '';
  });

  // 初期状態：パネルは非表示、オーバーレイも非表示のまま
  hideOverlays();
})();
