/* ---------------------------------------------------------
   Utilities
--------------------------------------------------------- */
function hashStr(s){
  let h = 2166136261;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededVector(seed, n){
  let h = hashStr(seed);
  const out = [];
  for(let i=0;i<n;i++){
    h ^= h << 13; h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5; h >>>= 0;
    const v = ((h % 200) - 100) / 100;
    out.push(v);
  }
  return out;
}
function toVec2D(x, y){
  const vx = ((x/100) - 0.5) * 2;
  const vy = (0.5 - (y/100)) * 2;
  return [vx, vy];
}
function fmt(v){ return (v>=0?'+':'') + v.toFixed(2); }

function svgLine(svg, x1,y1,x2,y2, opts){
  const ns = 'http://www.w3.org/2000/svg';
  const line = document.createElementNS(ns,'line');
  line.setAttribute('x1',x1); line.setAttribute('y1',y1);
  line.setAttribute('x2',x2); line.setAttribute('y2',y2);
  line.setAttribute('stroke', opts.stroke || 'rgba(255,255,255,0.2)');
  line.setAttribute('stroke-width', opts.width || 1);
  if(opts.dash) line.setAttribute('stroke-dasharray', opts.dash);
  line.setAttribute('opacity', opts.opacity!==undefined ? opts.opacity : 1);
  svg.appendChild(line);
  return line;
}
function centerOf(el, containerEl){
  const c = containerEl.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width/2 - c.left, y: r.top + r.height/2 - c.top };
}
function sizeSvgToContainer(svg, containerEl){
  const c = containerEl.getBoundingClientRect();
  svg.setAttribute('width', c.width);
  svg.setAttribute('height', c.height);
  svg.setAttribute('viewBox', `0 0 ${c.width} ${c.height}`);
}

/* ---------------------------------------------------------
   Shared example sentences + self-attention math (slides 4-8)
   "apple" / "Apple" always starts at the same point in both
   sentences — the pre-attention, context-free embedding.
   similarity() is a REAL dot product of each token's 2D vector
   (the same numbers slide 4 plots), so slide 5's worked example
   and the matrix always agree with each other.
--------------------------------------------------------- */
const sentences = {
  fruit: {
    label: 'Sentence ① — "I ate a juicy apple."',
    tokens: [
      {w:'I',     x:44, y:56},
      {w:'ate',   x:48, y:60},
      {w:'a',     x:60, y:42},
      {w:'juicy', x:95, y:42},
      {w:'apple', x:55, y:45, focus:true},
    ]
  },
  company: {
    label: 'Sentence ② — "I bought an Apple laptop."',
    tokens: [
      {w:'I',      x:44, y:56},
      {w:'bought', x:48, y:60},
      {w:'an',     x:60, y:42},
      {w:'Apple',  x:55, y:45, focus:true},
      {w:'laptop', x:58, y:5},
    ]
  }
};
function focusIndex(key){ return sentences[key].tokens.findIndex(t=>t.focus); }
function similarity(a, b, key){
  const toks = sentences[key].tokens;
  const t1 = toks.find(t=>t.w===a);
  const t2 = toks.find(t=>t.w===b);
  const v1 = toVec2D(t1.x, t1.y);
  const v2 = toVec2D(t2.x, t2.y);
  return v1[0]*v2[0] + v1[1]*v2[1]; // real dot product, no hardcoding
}
function buildMatrix(key){
  const toks = sentences[key].tokens;
  return toks.map(t1 => toks.map(t2 => similarity(t1.w, t2.w, key)));
}
function softmaxRow(row, temp){
  temp = temp || 6;
  const scaled = row.map(v => v * temp);
  const max = Math.max(...scaled);
  const exps = scaled.map(v => Math.exp(v - max));
  const sum = exps.reduce((a,b)=>a+b, 0);
  return exps.map(v => v/sum);
}
function blendedPosition(key){
  const toks = sentences[key].tokens;
  const matrix = buildMatrix(key);
  const fi = focusIndex(key);
  const weights = softmaxRow(matrix[fi]);
  let bx = 0, by = 0;
  toks.forEach((t,i)=>{ bx += weights[i]*t.x; by += weights[i]*t.y; });
  return { x: bx, y: by, weights, matrix };
}

/* ---------------------------------------------------------
   Deck navigation
--------------------------------------------------------- */
(function(){
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const navBtns = [...document.querySelectorAll('#deck-nav button')];
  const countEl = document.getElementById('deck-count');

  navBtns.forEach(b=>{
    b.addEventListener('click', ()=>{
      document.getElementById(b.dataset.target).scrollIntoView({behavior:'smooth'});
    });
  });

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting && e.intersectionRatio > 0.5){
        const idx = slides.indexOf(e.target);
        navBtns.forEach(b=>b.classList.remove('active'));
        navBtns[idx].classList.add('active');
        countEl.textContent = String(idx+1).padStart(2,'0') + ' / 08';
      }
    });
  }, { root: deck, threshold: [0.5] });
  slides.forEach(s=>io.observe(s));

  document.addEventListener('keydown', (e)=>{
    const activeIdx = navBtns.findIndex(b=>b.classList.contains('active'));
    if(e.key === 'ArrowDown' || e.key === 'PageDown'){
      e.preventDefault();
      if(activeIdx < slides.length-1) slides[activeIdx+1].scrollIntoView({behavior:'smooth'});
    } else if(e.key === 'ArrowUp' || e.key === 'PageUp'){
      e.preventDefault();
      if(activeIdx > 0) slides[activeIdx-1].scrollIntoView({behavior:'smooth'});
    }
  });
})();

/* ---------------------------------------------------------
   SLIDE 1 : Encoder - Decoder
--------------------------------------------------------- */
(function(){
  const tokens = ['猫','が','魚','を','食べた'];
  const outputTokens = ['The','cat','ate','the','fish'];
  const captions = [
    '<b>Step 0 —</b> The sentence to translate is fed into the encoder.',
    '<b>Step 1 —</b> ① The text is split into words (tokens).',
    '<b>Step 2 —</b> ② Each word becomes an initial vector (a list of numbers).',
    '<b>Step 3 —</b> ③ Each vector is updated using the vectors of surrounding words (this is Attention). This is the encoder\'s job.',
    '<b>Step 4 —</b> The encoder outputs one large vector summarizing the meaning of the whole sentence.',
    '<b>Step 5 —</b> The decoder uses that vector to generate the translated words one at a time.'
  ];
  const totalSteps = captions.length;
  let step = 0;

  const tokensEl = document.getElementById('s1-tokens');
  const captionEl = document.getElementById('s1-caption');
  const dotsEl = document.getElementById('s1-dots');
  const meaningGrid = document.getElementById('s1-meaning-grid');
  const outputEl = document.getElementById('s1-output');
  const encoderEl = document.getElementById('s1-encoder');
  const decoderEl = document.getElementById('s1-decoder');
  const linesSvg = document.getElementById('s1-lines');
  const rowEl = document.getElementById('s1-row');
  const arrow1 = document.getElementById('arrow-1');
  const arrow2 = document.getElementById('arrow-2');
  const arrow3 = document.getElementById('arrow-3');
  const prevBtn = document.getElementById('s1-prev');
  const nextBtn = document.getElementById('s1-next');

  for(let i=0;i<totalSteps;i++){
    const d = document.createElement('span');
    dotsEl.appendChild(d);
  }

  function drawAttentionLines(){
    sizeSvgToContainer(linesSvg, rowEl.parentElement);
    linesSvg.innerHTML = '';
    if(step < 3) return;
    const chips = [...tokensEl.querySelectorAll('.token-chip')];
    const container = rowEl.parentElement;
    for(let i=0;i<chips.length;i++){
      for(let j=i+1;j<chips.length;j++){
        const a = centerOf(chips[i], container);
        const b = centerOf(chips[j], container);
        svgLine(linesSvg, a.x, a.y, b.x, b.y, { stroke:'rgba(167,139,250,0.35)', width:1, opacity:1 });
      }
    }
  }

  function render(){
    captionEl.innerHTML = captions[step];
    [...dotsEl.children].forEach((d,i)=> d.classList.toggle('on', i===step));
    prevBtn.disabled = step===0;
    nextBtn.disabled = step===totalSteps-1;

    arrow1.classList.toggle('on', step>=1);
    arrow2.classList.toggle('on', step>=4);
    arrow3.classList.toggle('on', step>=5);

    encoderEl.classList.toggle('active-border', step>=1 && step<=3);
    decoderEl.classList.toggle('active-border', step>=5);

    tokensEl.innerHTML = '';
    if(step>=1){
      tokens.forEach(tk=>{
        const chip = document.createElement('div');
        chip.className = 'token-chip';
        if(step>=2) chip.classList.add('as-vector');
        if(step>=3) chip.classList.add('updated');
        const vec = seededVector(tk + (step>=3?'-updated':''), 3);
        chip.innerHTML = `
          <div class="tk-word">${tk}</div>
          <div class="tk-vec">${vec.map(v=>`<span>${fmt(v)}</span>`).join('')}</div>
        `;
        tokensEl.appendChild(chip);
      });
    }

    meaningGrid.classList.toggle('show', step>=4);

    outputEl.innerHTML = '';
    if(step>=5){
      outputTokens.forEach((w,i)=>{
        const span = document.createElement('span');
        span.className = 'token-out';
        span.textContent = w;
        span.style.animationDelay = (i*0.15)+'s';
        outputEl.appendChild(span);
      });
    }

    requestAnimationFrame(drawAttentionLines);
  }

  prevBtn.addEventListener('click', ()=>{ if(step>0){ step--; render(); }});
  nextBtn.addEventListener('click', ()=>{ if(step<totalSteps-1){ step++; render(); }});
  window.addEventListener('resize', ()=> drawAttentionLines());

  render();
})();

/* ---------------------------------------------------------
   SLIDE 2 : word2vec  (2D vector matches plotted x,y)
--------------------------------------------------------- */
(function(){
  const words = [
    {w:'cat', x:15, y:22, c:'animal'},
    {w:'dog', x:24, y:15, c:'animal'},
    {w:'lion', x:9, y:36, c:'animal'},
    {w:'apple', x:47, y:62, c:'fruit'},
    {w:'banana', x:58, y:70, c:'fruit'},
    {w:'grape', x:39, y:76, c:'fruit'},
    {w:'Japan', x:80, y:16, c:'geo'},
    {w:'Tokyo', x:88, y:30, c:'geo'},
    {w:'France', x:68, y:42, c:'geo'},
    {w:'Paris', x:77, y:56, c:'geo'},
  ];

  const plot = document.getElementById('s2-plot');
  const linesSvg = document.getElementById('s2-lines');
  const detail = document.getElementById('s2-detail');
  const analogyBtn = document.getElementById('s2-analogy-btn');
  const analogyCaption = document.getElementById('s2-analogy-caption');
  let analogyOn = false;

  const nodeEls = {};
  words.forEach(item=>{
    const el = document.createElement('div');
    el.className = 'word-node';
    el.dataset.c = item.c;
    el.style.left = item.x + '%';
    el.style.top = item.y + '%';
    el.innerHTML = `<div class="dot"></div><div class="lbl">${item.w}</div>`;
    el.addEventListener('click', ()=> selectWord(item, el));
    plot.appendChild(el);
    nodeEls[item.w] = el;
  });

  function selectWord(item, el){
    [...plot.querySelectorAll('.word-node')].forEach(n=>n.classList.remove('selected'));
    el.classList.add('selected');
    const vec = toVec2D(item.x, item.y);
    const labels = ['x','y'];
    detail.innerHTML = `
      <div class="s2-detail-word">${item.w}</div>
      <div class="s2-detail-sub">This word's position in the 2D space on the left</div>
      <div class="vec-row">
        ${vec.map((v,i)=>`
          <div class="vec-cell">
            <div class="vec-label">${labels[i]}</div>
            <div class="vec-bar-track"><div class="vec-bar" style="width:${(Math.abs(v)*100).toFixed(0)}%; background:${v>=0?'var(--teal)':'var(--coral)'};"></div></div>
            <div class="vec-num">${fmt(v)}</div>
          </div>`).join('')}
      </div>
      <div class="s2-dim-note">This toy example uses just <b>2 numbers</b> so it can be plotted directly. Real embedding models (e.g. OpenAI text-embedding-3-large) use <b>3072 numbers</b> to represent one word or sentence — far more dimensions than a flat map can show, which is how they capture much finer nuance.</div>
    `;
    drawAnalogy();
  }

  function drawAnalogy(){
    sizeSvgToContainer(linesSvg, plot);
    linesSvg.innerHTML = '';
    if(!analogyOn) return;
    const pairs = [['Japan','Tokyo'], ['France','Paris']];
    const ns='http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns,'defs');
    defs.innerHTML = `<marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--gold)"/></marker>`;
    linesSvg.appendChild(defs);
    pairs.forEach(([a,b], idx)=>{
      const pa = centerOf(nodeEls[a], plot);
      const pb = centerOf(nodeEls[b], plot);
      const line = svgLine(linesSvg, pa.x, pa.y, pb.x, pb.y, { stroke: idx===0 ? 'var(--gold)' : 'var(--purple)', width:2, opacity:0.85 });
      line.setAttribute('marker-end', 'url(#arrowhead)');
    });
  }

  analogyBtn.addEventListener('click', ()=>{
    analogyOn = !analogyOn;
    analogyBtn.textContent = analogyOn ? '✕ Hide relationship' : '🔎 See how "Japan → Tokyo" and "France → Paris" relate';
    analogyCaption.textContent = analogyOn
      ? 'When two word pairs share the same kind of relationship (country → capital), their vector difference — the arrow\'s direction and length — tends to be similar too. This is one of word2vec\'s most famous properties.'
      : '';
    drawAnalogy();
  });

  window.addEventListener('resize', drawAnalogy);
})();

/* ---------------------------------------------------------
   SLIDE 3 : Attention — Apple's point moves between clusters
--------------------------------------------------------- */
(function(){
  const fruitCluster = [
    {w:'banana', x:14, y:78},
    {w:'orange', x:26, y:85},
    {w:'grape',  x:8,  y:64},
    {w:'mango',  x:22, y:58},
  ];
  const techCluster = [
    {w:'laptop',    x:82, y:18},
    {w:'computer',  x:90, y:30},
    {w:'Google',    x:74, y:10},
    {w:'Microsoft', x:86, y:40},
  ];
  const neutralPos = { x:50, y:48 };
  const targets = {
    fruit:   { x:28, y:66 },
    company: { x:72, y:24 },
  };
  const ctxWords = {
    fruit:   [ {w:'ate', x:42, y:74, weight:.85}, {w:'juicy', x:20, y:46, weight:.5} ],
    company: [ {ref:'laptop', weight:.9}, {w:'bought', x:58, y:36, weight:.55} ],
  };
  const captions = {
    fruit: '<b>Attention —</b> "ate" and "juicy" pull Apple\'s vector toward the fruit cluster.',
    company: '<b>Attention —</b> "laptop" and "bought" pull Apple\'s vector toward the tech cluster.'
  };

  const plot = document.getElementById('s3-plot');
  const linesSvg = document.getElementById('s3-lines');
  const appleEl = document.getElementById('s3-apple');
  const vecBefore = document.getElementById('s3-vec-before');
  const vecAfter = document.getElementById('s3-vec-after');
  const buttons = [...document.querySelectorAll('.ctx-btn')];
  const captionEl = document.getElementById('s3-caption');

  const clusterEls = {};
  function addClusterDots(list, type){
    list.forEach(item=>{
      const el = document.createElement('div');
      el.className = 'cluster-node';
      el.dataset.c = type;
      el.style.left = item.x + '%';
      el.style.top = item.y + '%';
      el.innerHTML = `<div class="dot"></div><div class="lbl">${item.w}</div>`;
      plot.appendChild(el);
      clusterEls[item.w] = el;
    });
  }
  addClusterDots(fruitCluster, 'fruit');
  addClusterDots(techCluster, 'tech');

  const beforeVec = toVec2D(neutralPos.x, neutralPos.y);
  vecBefore.innerHTML = beforeVec.map(v=>`<span>${fmt(v)}</span>`).join('');

  let transientEls = [];

  function render(ctxKey){
    buttons.forEach(b=> b.classList.toggle('active', b.dataset.ctx === ctxKey));
    captionEl.innerHTML = captions[ctxKey];

    appleEl.classList.remove('fruit','company');
    appleEl.classList.add(ctxKey);
    const target = targets[ctxKey];
    appleEl.style.left = target.x + '%';
    appleEl.style.top = target.y + '%';

    transientEls.forEach(el=>el.remove());
    transientEls = [];
    Object.values(clusterEls).forEach(el=>el.classList.remove('highlight'));

    const lineTargets = [];
    ctxWords[ctxKey].forEach(item=>{
      if(item.ref){
        const el = clusterEls[item.ref];
        el.classList.add('highlight');
        lineTargets.push({ el, weight:item.weight });
      } else {
        const el = document.createElement('div');
        el.className = 'ctx-node';
        el.style.left = item.x + '%';
        el.style.top = item.y + '%';
        el.textContent = item.w;
        el.style.opacity = 0.55 + item.weight*0.45;
        plot.appendChild(el);
        transientEls.push(el);
        lineTargets.push({ el, weight:item.weight });
      }
    });

    const afterVec = toVec2D(target.x, target.y);
    vecAfter.className = 's3-compare-vec ' + ctxKey;
    vecAfter.innerHTML = afterVec.map(v=>`<span>${fmt(v)}</span>`).join('');

    setTimeout(()=> drawLines(ctxKey, lineTargets), 30);
    setTimeout(()=> drawLines(ctxKey, lineTargets), 400);
  }

  function drawLines(ctxKey, lineTargets){
    sizeSvgToContainer(linesSvg, plot);
    linesSvg.innerHTML = '';
    const appleCenter = centerOf(appleEl, plot);
    const neutralCenter = centerOf(document.getElementById('s3-neutral'), plot);
    svgLine(linesSvg, neutralCenter.x, neutralCenter.y, appleCenter.x, appleCenter.y, {
      stroke:'rgba(255,255,255,0.28)', width:1.2, dash:'3,4', opacity:0.8
    });
    const color = ctxKey === 'fruit' ? 'rgba(126,217,154,0.65)' : 'rgba(143,179,255,0.65)';
    lineTargets.forEach(({el, weight})=>{
      const p = centerOf(el, plot);
      svgLine(linesSvg, appleCenter.x, appleCenter.y, p.x, p.y, {
        stroke:color, width: 1 + weight*3, opacity: 0.4 + weight*0.5
      });
    });
  }

  buttons.forEach(b=>{
    b.addEventListener('click', ()=> render(b.dataset.ctx));
  });
  window.addEventListener('resize', ()=>{
    const active = buttons.find(b=>b.classList.contains('active'));
    if(active) drawLines(active.dataset.ctx, []);
  });

  render('fruit');
})();

/* ---------------------------------------------------------
   SLIDE 4 : Token embeddings — same word, same starting point
--------------------------------------------------------- */
(function(){
  const plot = document.getElementById('s4-plot');
  const caption = document.getElementById('s4-caption');
  const buttons = [...document.querySelectorAll('#s4-toggle .ctx-btn')];

  function render(key){
    buttons.forEach(b=> b.classList.toggle('active', b.dataset.ctx===key));
    caption.textContent = sentences[key].label;
    plot.querySelectorAll('.word-node').forEach(n=>n.remove());
    sentences[key].tokens.forEach(t=>{
      const el = document.createElement('div');
      el.className = 'word-node' + (t.focus ? ' focus' : '');
      el.style.left = t.x + '%';
      el.style.top = t.y + '%';
      el.innerHTML = `<div class="dot"></div><div class="lbl">${t.w}</div>`;
      plot.appendChild(el);
    });
  }
  buttons.forEach(b=> b.addEventListener('click', ()=> render(b.dataset.ctx)));
  render('fruit');
})();

/* ---------------------------------------------------------
   SLIDE 5 : coordinates -> one dot product -> the full matrix
--------------------------------------------------------- */
(function(){
  const captionEl = document.getElementById('s5-caption');
  const buttons = [...document.querySelectorAll('#s5-toggle .ctx-btn')];
  const step0 = document.getElementById('s5-step0');
  const step1 = document.getElementById('s5-step1');
  const step2 = document.getElementById('s5-step2');
  const vecRow = document.getElementById('s5-vec-row');
  const formulaEl = document.getElementById('s5-formula');
  const matrixEl = document.getElementById('s5-matrix');
  const info = document.getElementById('s5-cell-info');
  const dotsEl = document.getElementById('s5-dots');
  const prevBtn = document.getElementById('s5-prev');
  const nextBtn = document.getElementById('s5-next');

  const stepCaptions = [
    'Step 1 — Start from each token\'s 2D vector, taken straight from the last slide.',
    'Step 2 — Pick a pair, multiply matching components, and add them up: that\'s the dot product.',
    'Step 3 — Repeat that for every pair of tokens, and you get the full similarity matrix.',
  ];
  const totalSteps = stepCaptions.length;
  let step = 0;
  let ctxKey = 'fruit';

  for(let i=0;i<totalSteps;i++){ dotsEl.appendChild(document.createElement('span')); }

  function bestPartner(key){
    const toks = sentences[key].tokens;
    const fi = focusIndex(key);
    let best = -1, bestScore = -Infinity;
    toks.forEach((t,i)=>{
      if(i===fi) return;
      const s = similarity(toks[fi].w, t.w, key);
      if(s > bestScore){ bestScore = s; best = i; }
    });
    return { index: best, score: bestScore };
  }

  function headerCell(text, focus){
    const el = document.createElement('div');
    el.className = 's5-cell header' + (focus ? ' focus-row focus-col' : '');
    el.textContent = text;
    return el;
  }

  function renderStep0(){
    const toks = sentences[ctxKey].tokens;
    vecRow.innerHTML = '';
    toks.forEach(t=>{
      const v = toVec2D(t.x, t.y);
      const chip = document.createElement('div');
      chip.className = 's5-vec-chip' + (t.focus ? ' focus' : '');
      chip.innerHTML = `<div class="s5-vec-word">${t.w}</div><div class="s5-vec-nums">(${v[0].toFixed(2)}, ${v[1].toFixed(2)})</div>`;
      vecRow.appendChild(chip);
    });
  }

  function renderStep1(){
    const toks = sentences[ctxKey].tokens;
    const fi = focusIndex(ctxKey);
    const { index: bi } = bestPartner(ctxKey);
    const t1 = toks[fi], t2 = toks[bi];
    const v1 = toVec2D(t1.x, t1.y);
    const v2 = toVec2D(t2.x, t2.y);
    const score = v1[0]*v2[0] + v1[1]*v2[1];

    vecRow.innerHTML = '';
    toks.forEach((t,i)=>{
      const v = toVec2D(t.x, t.y);
      const chip = document.createElement('div');
      chip.className = 's5-vec-chip' + (i===fi ? ' focus' : (i===bi ? ' emphasis' : ''));
      chip.style.opacity = (i===fi || i===bi) ? '1' : '0.35';
      chip.innerHTML = `<div class="s5-vec-word">${t.w}</div><div class="s5-vec-nums">(${v[0].toFixed(2)}, ${v[1].toFixed(2)})</div>`;
      vecRow.appendChild(chip);
    });

    formulaEl.innerHTML = `
      <div class="s5-formula-line">score(<span class="hl">${t1.w}</span>, <span class="hl">${t2.w}</span>) = (x&#8321; &times; x&#8322;) + (y&#8321; &times; y&#8322;)</div>
      <div class="s5-formula-line">= (${v1[0].toFixed(2)} &times; ${v2[0].toFixed(2)}) + (${v1[1].toFixed(2)} &times; ${v2[1].toFixed(2)})</div>
      <div class="s5-formula-line">= ${(v1[0]*v2[0]).toFixed(3)} + ${(v1[1]*v2[1]).toFixed(3)}</div>
      <div class="s5-formula-line">= <span class="result">${score.toFixed(3)}</span></div>
    `;
  }

  function renderStep2(){
    const toks = sentences[ctxKey].tokens;
    const n = toks.length;
    const matrix = buildMatrix(ctxKey);
    const fi = focusIndex(ctxKey);
    const { index: bi } = bestPartner(ctxKey);

    let min = Infinity, max = -Infinity;
    matrix.forEach(row => row.forEach(v=>{ min = Math.min(min, v); max = Math.max(max, v); }));
    const range = (max - min) || 1;

    matrixEl.style.gridTemplateColumns = `repeat(${n+1}, minmax(0,1fr))`;
    matrixEl.innerHTML = '';
    matrixEl.appendChild(headerCell(''));
    toks.forEach((t,j)=> matrixEl.appendChild(headerCell(t.w, j===fi)));

    toks.forEach((t,i)=>{
      matrixEl.appendChild(headerCell(t.w, i===fi));
      toks.forEach((t2,j)=>{
        const score = matrix[i][j];
        const norm = (score - min) / range;
        const cell = document.createElement('div');
        const isWorkedPair = (i===fi && j===bi) || (i===bi && j===fi);
        cell.className = 's5-cell' + (i===fi?' focus-row':'') + (j===fi?' focus-col':'') + (isWorkedPair?' pulse':'');
        cell.style.background = `rgba(79,209,197,${(0.12 + norm*0.68).toFixed(2)})`;
        cell.textContent = score.toFixed(2);
        cell.addEventListener('click', ()=>{
          info.innerHTML = `<b>${t.w}</b> × <b>${t2.w}</b> = ${score.toFixed(2)}`;
        });
        matrixEl.appendChild(cell);
      });
    });
    info.textContent = 'Hover or tap a cell to see its score.';
  }

  function render(){
    captionEl.innerHTML = stepCaptions[step];
    [...dotsEl.children].forEach((d,i)=> d.classList.toggle('on', i===step));
    prevBtn.disabled = step===0;
    nextBtn.disabled = step===totalSteps-1;

    step0.style.display = step===0 ? '' : 'none';
    step1.style.display = step===1 ? '' : 'none';
    step2.style.display = step===2 ? '' : 'none';

    if(step===0) renderStep0();
    else if(step===1) renderStep1();
    else renderStep2();
  }

  buttons.forEach(b=> b.addEventListener('click', ()=>{
    ctxKey = b.dataset.ctx;
    buttons.forEach(x=> x.classList.toggle('active', x===b));
    render();
  }));
  prevBtn.addEventListener('click', ()=>{ if(step>0){ step--; render(); }});
  nextBtn.addEventListener('click', ()=>{ if(step<totalSteps-1){ step++; render(); }});

  render();
})();

/* ---------------------------------------------------------
   SLIDE 6 : Softmax blend-weight bars
--------------------------------------------------------- */
(function(){
  const barsEl = document.getElementById('s6-bars');
  const caption = document.getElementById('s6-caption');
  const buttons = [...document.querySelectorAll('#s6-toggle .ctx-btn')];

  function render(key){
    buttons.forEach(b=> b.classList.toggle('active', b.dataset.ctx===key));
    const { tokens } = sentences[key];
    const fi = focusIndex(key);
    caption.innerHTML = `Blend weights for <b>${tokens[fi].w}</b>'s row — every bar adds up to 100%.`;

    const { weights } = blendedPosition(key);
    const maxW = Math.max(...weights);
    barsEl.innerHTML = '';
    tokens.forEach((t,i)=>{
      const row = document.createElement('div');
      row.className = 's6-bar-row';
      const pct = weights[i]*100;
      row.innerHTML = `
        <div class="s6-bar-label">${t.w}</div>
        <div class="s6-bar-track"><div class="s6-bar-fill${weights[i]===maxW?' dominant':''}" style="width:${pct.toFixed(1)}%"></div></div>
        <div class="s6-bar-pct">${pct.toFixed(0)}%</div>
      `;
      barsEl.appendChild(row);
    });
  }
  buttons.forEach(b=> b.addEventListener('click', ()=> render(b.dataset.ctx)));
  render('fruit');
})();

/* ---------------------------------------------------------
   SLIDE 7 : Actually blending the vectors (weighted sum)
--------------------------------------------------------- */
(function(){
  const plot = document.getElementById('s7-plot');
  const linesSvg = document.getElementById('s7-lines');
  const blendEl = document.getElementById('s7-apple-blend');
  const caption = document.getElementById('s7-caption');
  const buttons = [...document.querySelectorAll('#s7-toggle .ctx-btn')];

  function drawLines(key, tokens, weights, fi){
    sizeSvgToContainer(linesSvg, plot);
    linesSvg.innerHTML = '';
    const nodes = [...plot.querySelectorAll('.word-node')];
    if(nodes.length !== tokens.length) return;
    const blendCenter = centerOf(blendEl, plot);
    const origCenter = centerOf(nodes[fi], plot);
    svgLine(linesSvg, origCenter.x, origCenter.y, blendCenter.x, blendCenter.y, { stroke:'rgba(255,255,255,0.3)', width:1.2, dash:'3,4', opacity:0.85 });
    const color = key === 'fruit' ? 'rgba(126,217,154,0.6)' : 'rgba(143,179,255,0.6)';
    tokens.forEach((t,i)=>{
      const p = centerOf(nodes[i], plot);
      svgLine(linesSvg, blendCenter.x, blendCenter.y, p.x, p.y, { stroke:color, width: 1+weights[i]*4, opacity: 0.3+weights[i]*0.6 });
    });
  }

  function render(key){
    buttons.forEach(b=> b.classList.toggle('active', b.dataset.ctx===key));
    const { tokens } = sentences[key];
    const fi = focusIndex(key);
    caption.innerHTML = `<b>${tokens[fi].w}</b> (original) → blended vector, weighted toward ${key==='fruit' ? '"juicy"' : '"laptop"'}.`;

    plot.querySelectorAll('.word-node').forEach(n=>n.remove());
    tokens.forEach(t=>{
      const el = document.createElement('div');
      el.className = 'word-node' + (t.focus ? ' focus' : '');
      el.style.left = t.x+'%'; el.style.top = t.y+'%';
      el.innerHTML = `<div class="dot"></div><div class="lbl">${t.w}</div>`;
      plot.appendChild(el);
    });

    const { x, y, weights } = blendedPosition(key);
    blendEl.classList.remove('fruit','company');
    blendEl.classList.add(key);
    blendEl.style.left = x + '%';
    blendEl.style.top = y + '%';

    setTimeout(()=> drawLines(key, tokens, weights, fi), 30);
    setTimeout(()=> drawLines(key, tokens, weights, fi), 420);
  }

  buttons.forEach(b=> b.addEventListener('click', ()=> render(b.dataset.ctx)));
  window.addEventListener('resize', ()=>{
    const active = buttons.find(b=>b.classList.contains('active'));
    if(active){
      const key = active.dataset.ctx;
      const { weights } = blendedPosition(key);
      drawLines(key, sentences[key].tokens, weights, focusIndex(key));
    }
  });
  render('fruit');
})();

/* ---------------------------------------------------------
   SLIDE 8 : Both sentences at once — same start, two outcomes
--------------------------------------------------------- */
(function(){
  const plot = document.getElementById('s8-plot');
  const linesSvg = document.getElementById('s8-lines');
  const vecFruitEl = document.getElementById('s8-vec-fruit');
  const vecCompanyEl = document.getElementById('s8-vec-company');

  function draw(){
    plot.querySelectorAll('.word-node').forEach(n=>n.remove());

    const originEl = document.createElement('div');
    originEl.className = 'word-node focus';
    originEl.style.left = '50%'; originEl.style.top = '48%';
    originEl.innerHTML = `<div class="dot"></div><div class="lbl">apple / Apple</div>`;
    plot.appendChild(originEl);

    const fruitRes = blendedPosition('fruit');
    const companyRes = blendedPosition('company');

    const fruitEl = document.createElement('div');
    fruitEl.className = 'word-node';
    fruitEl.dataset.c = 'fruit';
    fruitEl.style.left = fruitRes.x+'%'; fruitEl.style.top = fruitRes.y+'%';
    fruitEl.innerHTML = `<div class="dot"></div><div class="lbl">Sentence ①</div>`;
    plot.appendChild(fruitEl);

    const companyEl = document.createElement('div');
    companyEl.className = 'word-node';
    companyEl.dataset.c = 'tech';
    companyEl.style.left = companyRes.x+'%'; companyEl.style.top = companyRes.y+'%';
    companyEl.innerHTML = `<div class="dot"></div><div class="lbl">Sentence ②</div>`;
    plot.appendChild(companyEl);

    sizeSvgToContainer(linesSvg, plot);
    linesSvg.innerHTML = '';
    const originC = centerOf(originEl, plot);
    const fruitC = centerOf(fruitEl, plot);
    const companyC = centerOf(companyEl, plot);

    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns,'defs');
    defs.innerHTML = `
      <marker id="arrow-fruit" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--fruit)"/></marker>
      <marker id="arrow-tech" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--company)"/></marker>
    `;
    linesSvg.appendChild(defs);
    const l1 = svgLine(linesSvg, originC.x, originC.y, fruitC.x, fruitC.y, { stroke:'var(--fruit)', width:2, opacity:0.85 });
    l1.setAttribute('marker-end','url(#arrow-fruit)');
    const l2 = svgLine(linesSvg, originC.x, originC.y, companyC.x, companyC.y, { stroke:'var(--company)', width:2, opacity:0.85 });
    l2.setAttribute('marker-end','url(#arrow-tech)');

    const fv = toVec2D(fruitRes.x, fruitRes.y);
    const cv = toVec2D(companyRes.x, companyRes.y);
    vecFruitEl.innerHTML = fv.map(v=>`<span>${fmt(v)}</span>`).join('');
    vecCompanyEl.innerHTML = cv.map(v=>`<span>${fmt(v)}</span>`).join('');
  }
  draw();
  window.addEventListener('resize', draw);
})();
