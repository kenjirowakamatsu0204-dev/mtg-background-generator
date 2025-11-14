(async function(){
  const userPanelEl = document.querySelector('.user-panel'); // 初期は hidden + display:none
  const galleryEl   = document.getElementById('gallery');
  const suggestEl   = document.getElementById('suggestList');
  const searchEl    = document.getElementById('searchInput');
  const uploadEl    = document.getElementById('uploadInput');

  const fields = {
    company: document.getElementById('companyField'),
    jpName:  document.getElementById('jpNameField'),
    title:   document.getElementById('titleField')
  };
  const applyBtn = document.getElementById('applyBtn');

  // 単一行強制
  Object.values(fields).forEach(inp=>{
    inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); }});
    inp.addEventListener('input', (e)=>{ e.target.value = e.target.value.replace(/[\r\n]+/g,' '); });
  });

  // データ取得
  const [images, people] = await Promise.allSettled([
    GoogleAPI.listDriveImages(), GoogleAPI.fetchPeopleFromSheet()
  ]).then(([a,b])=>[a.value||[], b.value||[]]);

  /** @type {{id:string, imgEl:HTMLImageElement, overlay:HTMLElement, textWrap:HTMLElement, hoverMask:HTMLElement, card:HTMLElement}[]} */
  const cards = [];

  let selectedPerson = null;
  let hasShownPanel = false;

  // ===== サジェスト =====
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
        <span class="badge">${(p.enName||p.jpName||'--').replace(/\s+/g,'').slice(0,2).toUpperCase()}</span>
        <div>
          <div>${p.jpName||''}</div>
          <div style="font-size:12px;color:#6b7280">${p.company||''}</div>
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
  searchEl.addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){
      const items = filterPeople(searchEl.value);
      if(items.length){ choosePerson(items[0]); suggestEl.classList.remove('show'); }
      e.preventDefault();
    }
  });

  // ===== オーバーレイ（プレビュー） =====
  function getFieldValues(){
    return {
      company: CanvasRenderer.ensureSingleLine(fields.company.value),
      jpName:  CanvasRenderer.ensureSingleLine(fields.jpName.value),
      title:   CanvasRenderer.ensureSingleLine(fields.title.value)
    };
  }
  function setOverlayContent(textWrap, values){
    textWrap.innerHTML = `
      <div class="ov-line jpName" >${values.jpName  || ''}</div>
      <div class="ov-line company">${values.company || ''}</div>
      <div class="ov-line title"  >${values.title   || ''}</div>
    `;
  }
  function showOverlays(values){
    cards.forEach(({overlay,textWrap})=>{
      setOverlayContent(textWrap, values);
      overlay.classList.add('show');
    });
  }
  function hideOverlays(){ cards.forEach(({overlay})=> overlay.classList.remove('show')); }

  // ===== ユーザー選択 =====
  function revealUserPanelOnce(){
    if(!hasShownPanel){
      userPanelEl.classList.remove('hidden');
      userPanelEl.style.display = '';
      userPanelEl.setAttribute('aria-hidden','false');
      hasShownPanel = true;
      //PendoにLocationAPIでURLを送信
      if (window.pendo?.location?.setUrl) {
        pendo.location.setUrl(
          `${location.origin}/mtg-background-generator/userPanel`
        );
      }
    }
  }
  function choosePerson(p){
    selectedPerson = p;
    revealUserPanelOnce();

    fields.company.value = p.company || '';
    fields.jpName.value  = p.jpName  || '';
    fields.title.value   = p.title   || '';
    searchEl.value = p.jpName || p.company || '';

    showOverlays(getFieldValues());
  }
  applyBtn.addEventListener('click', ()=>{ if(hasShownPanel) showOverlays(getFieldValues()); });

  // ===== 共通DL関数 =====
  async function triggerDownload(img){
    const values = getFieldValues();
    await CanvasRenderer.renderToCanvas(img, values);
    CanvasRenderer.downloadCanvas('MeetingBackground.jpg');
  }

  // ===== ギャラリー =====
  function createCard({id, url}){
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0'); // キーボード操作可

    const img = document.createElement('img');
    img.alt = '背景'; img.loading = 'lazy'; img.src = url;

    // 左半分グラデーション＋テキスト
    const overlay = document.createElement('div'); overlay.className = 'overlay';
    const textWrap = document.createElement('div'); textWrap.className = 'ov-wrap';
    overlay.appendChild(textWrap);

    // ホバー表示用マスク（白半透明 + 中央DLアイコン）
    const hoverMask = document.createElement('div');
    hoverMask.className = 'hover-mask';
    hoverMask.innerHTML = `<svg class="dl-icon"><use href="assets/icons.svg#download"></use></svg>`;

    // クリック（カード全面）
    const onDownload = ()=> triggerDownload(img);
    card.addEventListener('click', onDownload);
    card.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault(); onDownload();
      }
    });

    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(hoverMask);
    galleryEl.appendChild(card);

    const rec = { id, imgEl: img, overlay, textWrap, hoverMask, card };
    cards.push(rec);

    // 既に選択済みなら即反映
    if(selectedPerson){
      setOverlayContent(textWrap, getFieldValues());
      overlay.classList.add('show');
    }
    return rec;
  }

  images.forEach((f)=> createCard({id:f.id, url:f.thumbUrl || f.fullUrl}));

  // アップロード
  galleryEl.querySelector('.upload-card').addEventListener('click', ()=> uploadEl.click());
  uploadEl.addEventListener('change', (ev)=>{
    const file = ev.target.files?.[0]; if(!file) return;
    const url = URL.createObjectURL(file);
    const rec = createCard({id:'upload-'+Date.now(), url});
    const uploadTile = galleryEl.querySelector('.upload-card');
    galleryEl.insertBefore(rec.card, uploadTile.nextSibling);
    uploadEl.value = '';
  });

  hideOverlays();
})();
