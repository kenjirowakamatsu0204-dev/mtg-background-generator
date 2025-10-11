/* app.js - SPA glue code */
(async function(){
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

  // Prevent multiline edits
  Object.values(fields).forEach(inp=>{
    inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); }});
    inp.addEventListener('input', (e)=>{ e.target.value = e.target.value.replace(/[\r\n]+/g,' '); });
  });

  // Load data
  const [images, people] = await Promise.allSettled([
    GoogleAPI.listDriveImages(), GoogleAPI.fetchPeopleFromSheet()
  ]).then(([a,b])=>[a.value||[], b.value||[]]);

  // In-memory state
  let selectedPerson = null;
  let imageCards = []; // {id, url, imgEl, overlayReady}

  // ------- Suggestions -------
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
    items.forEach((p, i)=>{
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
    suggestTimer = setTimeout(()=>{
      renderSuggest(filterPeople(searchEl.value));
    }, 120);
  });
  document.addEventListener('click', (e)=>{
    if(!suggestEl.contains(e.target) && e.target!==searchEl) suggestEl.classList.remove('show');
  });

  // ------- Person selection -------
  function choosePerson(p){
    selectedPerson = p;
    fields.company.value = p.company||'';
    fields.jpName.value  = p.jpName ||'';
    fields.enName.value  = p.enName ||'';
    fields.title.value   = p.title  ||'';
    fields.email.value   = p.email  ||'';
    searchEl.value = p.jpName || p.enName || '';
    // Re-render overlays on all cards
    refreshAllCards();
  }

  document.getElementById('applyBtn').addEventListener('click', refreshAllCards);

  function getFieldValues(){
    return {
      company: CanvasRenderer.ensureSingleLine(fields.company.value),
      jpName:  CanvasRenderer.ensureSingleLine(fields.jpName.value),
      enName:  CanvasRenderer.ensureSingleLine(fields.enName.value),
      title:   CanvasRenderer.ensureSingleLine(fields.title.value),
      email:   CanvasRenderer.ensureSingleLine(fields.email.value)
    };
  }

  // ------- Gallery -------
  function createCard({id, url}){
    const card = document.createElement('div');
    card.className = 'card';

    // base image
    const img = document.createElement('img');
    img.alt = '背景';
    img.loading = 'lazy';
    img.src = url;

    // download button
    const dl = document.createElement('button');
    dl.className = 'dl';
    dl.title = 'ダウンロード';
    dl.innerHTML = `<svg class="icon"><use href="assets/icons.svg#download"></use></svg>`;
    dl.addEventListener('click', async ()=>{
      const values = getFieldValues();
      // render onto canvas then download
      await CanvasRenderer.renderToCanvas(img, values);
      const fname = (values.enName || 'MeetingBackground').replace(/[^\w.-]+/g,'_') + '_MeetingBackground.jpg';
      CanvasRenderer.downloadCanvas(fname);
    });

    card.appendChild(img);
    card.appendChild(dl);
    galleryEl.appendChild(card);

    return { id, url, imgEl: img };
  }

  function refreshAllCards(){
    // No heavy work needed here; rendering happens at download time.
    // But we could preview overlays by drawing onto <canvas> and setting card bg as dataURL (optional).
  }

  // Initial cards from Drive (or mock)
  images.forEach((f)=> imageCards.push(createCard({id:f.id, url:f.thumbUrl || f.fullUrl})));

  // ------- Upload new background -------
  galleryEl.querySelector('.upload-card').addEventListener('click', ()=> uploadEl.click());
  uploadEl.addEventListener('change', async (ev)=>{
    const file = ev.target.files?.[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    imageCards.unshift(createCard({id:'upload-'+Date.now(), url}));
    uploadEl.value = '';
  });

  // ------- Demo: choose the first person automatically if exact typed ------
  searchEl.addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){
      const items = filterPeople(searchEl.value);
      if(items.length){ choosePerson(items[0]); suggestEl.classList.remove('show'); }
      e.preventDefault();
    }
  });
})();
