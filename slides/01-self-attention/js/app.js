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
  const countEl = document.getElementById('deck-count');
  if(!deck || !slides.length) return;
  const manifest = [
    {
      label:'Before the Transformer',
      slides:[
        ['slides/00-before-transformers/01-recurrence.html','Recurrence'],
        ['slides/00-before-transformers/02-sequential.html','Sequential computation'],
        ['slides/00-before-transformers/03-path-length.html','Path length'],
        ['slides/00-before-transformers/04-what-2014-fixed.html','What 2014 fixed'],
      ]
    },
    {
      label:'How Translation AI Works',
      slides:[
        ['slides/01-self-attention/01-encoder-decoder.html','Encoder–Decoder model'],
        ['slides/01-self-attention/02-word-vectors.html','Word vectors'],
        ['slides/01-self-attention/03-contextual-meaning.html','Contextual meaning'],
        ['slides/01-self-attention/04-matrix-transformation.html','Matrix transformation'],
        ['slides/01-self-attention/05-transformer-architecture.html','Transformer architecture'],
        ['slides/01-self-attention/06-token-embeddings.html','Token embeddings'],
        ['slides/01-self-attention/07-positional-encoding.html','Positional encoding'],
        ['slides/01-self-attention/08-similarity-matrix.html','Similarity matrix'],
        ['slides/01-self-attention/09-attention-architecture.html','Attention architecture'],
        ['slides/01-self-attention/10-softmax-weights.html','Softmax weights'],
        ['slides/01-self-attention/11-weighted-sum.html','Weighted sum'],
        ['slides/01-self-attention/12-context-outcomes.html','Context outcomes'],
        ['slides/01-self-attention/13-query-key-value.html','Query, Key, Value'],
        ['slides/01-self-attention/14-qk-transpose.html','QK transpose'],
        ['slides/01-self-attention/15-similarity.html','Similarity scores'],
        ['slides/01-self-attention/16-softmax.html','Softmax'],
        ['slides/01-self-attention/17-scaling.html','Scaling'],
        ['slides/01-self-attention/18-attention-summary.html','Attention summary'],
        ['slides/01-self-attention/19-masked-attention.html','Causal mask'],
        ['slides/01-self-attention/19-context-update.html','Context update'],
        ['slides/01-self-attention/20-vector-mixing.html','Mixing value vectors'],
        ['slides/01-self-attention/21-weighted-vector-lab.html','Weighted vector lab'],
        ['slides/01-self-attention/22-multi-head-attention.html','Multi-head attention'],
        ['slides/01-self-attention/23-five-changes.html','Five multi-head changes'],
        ['slides/01-self-attention/24-branch-and-project.html','Branch and project'],
        ['slides/01-self-attention/25-why-learn-projections.html','Why learn projections'],
        ['slides/01-self-attention/26-attention-per-head.html','Attention in every head'],
        ['slides/01-self-attention/27-concat-output-projection.html','Concat and output projection'],
        ['slides/01-self-attention/22-results.html','Results, simplified'],
        ['slides/01-self-attention/23-significance.html','Why it mattered'],
      ]
    },
    {
      label:'Quiz',
      slides:[['slides/99-quiz/index.html','Attention Is All You Need - Quiz']]
    }
  ];
  const flatSlides=manifest.flatMap(section=>section.slides.map(slide=>({...slide,path:slide[0],title:slide[1],section:section.label})));
  const pathName=window.location.pathname.replace(/\\/g,'/');
  const slidesAt=pathName.lastIndexOf('/slides/');
  const currentPath=slidesAt>=0?pathName.slice(slidesAt+1):pathName.replace(/^\//,'');
  const globalIndex=flatSlides.findIndex(slide=>currentPath.endsWith(slide.path));
  const currentSection=manifest.find(section=>section.slides.some(([path])=>currentPath.endsWith(path)));
  const sectionSlides=currentSection?currentSection.slides:[];
  const sectionIndex=sectionSlides.findIndex(([path])=>currentPath.endsWith(path));
  const pageIndex=sectionIndex>=0?sectionIndex+1:Number(document.body.dataset.slideIndex||1);
  const pageCount=sectionSlides.length||Number(document.body.dataset.slideCount||slides.length);
  const repoHref=(path)=>{
    const depth=currentPath.split('/').length-1;
    return '../'.repeat(depth)+path;
  };
  const nav=document.getElementById('deck-nav');
  if(nav&&sectionSlides.length){
    nav.innerHTML='';
    sectionSlides.forEach(([path,title],index)=>{
      const link=document.createElement('a');
      link.href=repoHref(path);
      link.setAttribute('aria-label',`Go to slide ${index+1}: ${title}`);
      if(index===sectionIndex){ link.className='active'; link.setAttribute('aria-current','page'); }
      nav.appendChild(link);
    });
  }
  if(countEl) countEl.textContent = String(pageIndex).padStart(2,'0') + ' / ' + String(pageCount).padStart(2,'0');

  const prev=globalIndex>0?repoHref(flatSlides[globalIndex-1].path):'';
  const next=globalIndex>=0&&globalIndex<flatSlides.length-1?repoHref(flatSlides[globalIndex+1].path):'';
  const toolbar=document.createElement('header');
  toolbar.className='deck-toolbar';
  toolbar.setAttribute('aria-label','Slide navigation');
  const pager = document.createElement('nav');
  pager.className = 'deck-pager';
  pager.setAttribute('aria-label', 'Previous and next slide');
  pager.innerHTML = `
    ${prev ? `<a href="${prev}" rel="prev">← Previous</a>` : '<span aria-disabled="true">← Previous</span>'}
    <div class="deck-pager-identity">
      <strong>${pageIndex} / ${pageCount}</strong>
      <span>${currentSection?.label||'How Translation AI Works'}</span>
    </div>
    ${next ? `<a href="${next}" rel="next">Next →</a>` : '<span aria-disabled="true">Next →</span>'}
  `;
  const jump=document.createElement('div');
  jump.className='deck-jump';
  jump.innerHTML='<span class="deck-jump-label">Jump to</span>';
  const select=document.createElement('select');
  select.id='deck-jump-select';
  select.setAttribute('aria-label','Jump to any section or slide');
  manifest.forEach(section=>{
    const group=document.createElement('optgroup');
    group.label=section.label;
    section.slides.forEach(([path,title],index)=>{
      const option=document.createElement('option');
      option.value=repoHref(path);
      option.textContent=`${index+1}. ${title}`;
      option.selected=currentPath.endsWith(path);
      group.appendChild(option);
    });
    select.appendChild(group);
  });
  select.addEventListener('change',()=>{ if(select.value) window.location.href=select.value; });
  jump.appendChild(select);
  toolbar.appendChild(pager);
  toolbar.appendChild(jump);
  document.body.insertBefore(toolbar,document.body.firstChild);

  document.addEventListener('keydown', (e)=>{
    if(['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    if((e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') && next){
      e.preventDefault();
      window.location.href = next;
    } else if((e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') && prev){
      e.preventDefault();
      window.location.href = prev;
    }
  });
})();

// Slide 27: collect heads, concatenate them, then apply the output projection.
(()=>{
  const track=document.getElementById('s27-track');
  const prev=document.getElementById('s27-prev');
  const next=document.getElementById('s27-next');
  const label=document.getElementById('s27-step-label');
  const title=document.getElementById('s27-step-title');
  const pages=[...document.querySelectorAll('[data-s27-page]')];
  const dots=[...document.querySelectorAll('[data-s27-step]')];
  if(!track||!prev||!next||!label||!title||pages.length!==3) return;
  const titles=[
    'Collect the eight Head outputs',
    'Place them side by side and concatenate',
    'Mix the concatenated features with Wᴼ'
  ];
  let current=0;
  function show(index){
    current=Math.max(0,Math.min(2,index));
    track.style.transform=`translateX(-${current*(100/3)}%)`;
    pages.forEach((page,i)=>{
      page.classList.toggle('active',i===current);
      page.classList.remove('is-animating');
      if(i===current){ void page.offsetWidth; page.classList.add('is-animating'); }
    });
    dots.forEach((dot,i)=>dot.classList.toggle('active',i===current));
    label.textContent=`STEP ${current+1} / 3`;
    title.textContent=titles[current];
    prev.disabled=current===0;
    next.disabled=current===2;
  }
  prev.addEventListener('click',()=>show(current-1));
  next.addEventListener('click',()=>show(current+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
  show(0);
})();

// Slide 24: horizontal Step 1 / Step 2 flow with responsive connectors.
(()=>{
  const track=document.getElementById('s24-track');
  const prev=document.getElementById('s24-prev');
  const next=document.getElementById('s24-next');
  const label=document.getElementById('s24-step-label');
  const title=document.getElementById('s24-step-title');
  const pages=[...document.querySelectorAll('[data-s24-page]')];
  const dots=[...document.querySelectorAll('[data-s24-step]')];
  if(!track||!prev||!next||!label||!title||pages.length!==3) return;
  const titles=['Send H to every head','Create Q, K, and V in every head','Select Head 1 and enlarge it'];
  let current=0,frame=0;

  function point(rect,root,side){
    return {x:(side==='right'?rect.right:rect.left)-root.left,y:rect.top+rect.height/2-root.top};
  }
  function curve(start,end){
    const span=Math.max(20,end.x-start.x),bend=Math.min(76,span*.45);
    return `M${start.x} ${start.y} C${start.x+bend} ${start.y} ${end.x-bend} ${end.y} ${end.x} ${end.y}`;
  }
  function setSvg(svg,rootRect){
    svg.setAttribute('viewBox',`0 0 ${rootRect.width} ${rootRect.height}`);
    svg.setAttribute('preserveAspectRatio','none');
    svg.innerHTML='';
  }
  function addPath(svg,d,className=''){
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',d); if(className) path.setAttribute('class',className); svg.appendChild(path);
  }
  function draw(){
    const branch=document.getElementById('s24-branch-diagram');
    const branchSvg=document.getElementById('s24-branch-lines');
    const h=document.getElementById('s24-h-source');
    const heads=[...document.querySelectorAll('[data-s24-head]')];
    if(branch&&branchSvg&&h&&heads.length){
      const root=branch.getBoundingClientRect(); setSvg(branchSvg,root);
      const start=point(h.getBoundingClientRect(),root,'right');
      heads.forEach(head=>addPath(branchSvg,curve(start,point(head.getBoundingClientRect(),root,'left'))));
    }
    const project=document.getElementById('s24-project-diagram');
    const projectSvg=document.getElementById('s24-project-lines');
    const projectH=document.getElementById('s24-project-h');
    const ws=[...document.querySelectorAll('[data-s24-projection]')];
    const outputs=[...document.querySelectorAll('[data-s24-output]')];
    if(project&&projectSvg&&projectH&&ws.length===3&&outputs.length===3){
      const root=project.getBoundingClientRect(); setSvg(projectSvg,root);
      const source=point(projectH.getBoundingClientRect(),root,'right');
      ws.forEach((w,index)=>{
        const className=['q','k','v'][index];
        addPath(projectSvg,curve(source,point(w.getBoundingClientRect(),root,'left')),className);
        addPath(projectSvg,curve(point(w.getBoundingClientRect(),root,'right'),point(outputs[index].getBoundingClientRect(),root,'left')),className);
      });
    }
  }
  function scheduleDraw(){ cancelAnimationFrame(frame); frame=requestAnimationFrame(draw); }
  function show(index){
    current=Math.max(0,Math.min(2,index));
    track.style.transform=`translateX(-${current*(100/3)}%)`;
    pages.forEach((page,i)=>{
      page.classList.toggle('active',i===current);
      page.classList.remove('is-animating');
      if(i===current){ void page.offsetWidth; page.classList.add('is-animating'); }
    });
    dots.forEach((dot,i)=>dot.classList.toggle('active',i===current));
    label.textContent=`STEP ${current+1} / 3`; title.textContent=titles[current];
    prev.disabled=current===0; next.disabled=current===2;
    scheduleDraw();
  }
  prev.addEventListener('click',()=>show(current-1));
  next.addEventListener('click',()=>show(current+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
  window.addEventListener('resize',scheduleDraw,{passive:true});
  if('ResizeObserver' in window) [document.getElementById('s24-branch-diagram'),document.getElementById('s24-project-diagram')].filter(Boolean).forEach(el=>new ResizeObserver(scheduleDraw).observe(el));
  show(0);
})();

// Slide 20: pair apple-weight cells with V cells and land products directly in V rows.
(()=>{
  const stage=document.getElementById('s20-mix');
  const replay=document.getElementById('s20-replay');
  const nextStep=document.getElementById('s20-next');
  const attentionCells=[...document.querySelectorAll('.s20v3-attention i')];
  const valueCells=[...document.querySelectorAll('.s20v3-value i')];
  const factorRows=[...document.querySelectorAll('.s20v3-factor-row')];
  const final=document.querySelector('.s20v3-final');
  if(!stage||!replay||!nextStep||!final||attentionCells.length!==25||valueCells.length!==25||factorRows.length!==5) return;
  const weights=['.04','.10','.03','.48','.35'];
  const tokens=['I','ate','a','juicy','apple'];
  const dimensions=['d₁','d₂','d₃','d₄…d₅₁₁','d₅₁₂'];
  let timers=[];
  let directCells=[];
  const later=(fn,delay)=>{const id=setTimeout(fn,delay);timers.push(id);return id;};
  const clear=()=>{
    timers.forEach(clearTimeout);timers=[];
    stage.querySelectorAll('.s20v3-fly').forEach(el=>el.remove());
    stage.classList.remove('has-products','cells-complete','is-grouping');
    [...attentionCells,...valueCells].forEach(cell=>cell.classList.remove('source-active'));
    directCells=[];
    factorRows.forEach((row,rowIndex)=>{
      row.classList.remove('active','factor-weight','factor-arrow','factor-result','group-vector','factored');
      const destination=row.querySelector('div');
      destination.replaceChildren();
      for(let column=0;column<5;column++){
        const cell=document.createElement('i');
        cell.className='s20v3-direct-cell';
        cell.style.setProperty('--cell-index',column);
        cell.style.setProperty('--cell-delay',`${column*.09}s`);
        cell.setAttribute('aria-label',`${weights[rowIndex]} × V_${tokens[rowIndex]}[${dimensions[column]}]`);
        destination.appendChild(cell);
        directCells.push(cell);
      }
    });
    nextStep.disabled=true;
    nextStep.classList.remove('ready');
    nextStep.textContent='Next: factor rows →';
    final.classList.remove('active');
  };
  const fly=(source,target,text,kind,duration,offsetX)=>{
    const root=stage.getBoundingClientRect();
    const from=source.getBoundingClientRect();
    const to=target.getBoundingClientRect();
    const startX=from.left+from.width/2-root.left;
    const startY=from.top+from.height/2-root.top;
    const endX=to.left+to.width/2-root.left+offsetX;
    const endY=to.top+to.height/2-root.top;
    const chip=document.createElement('span');
    chip.className=`s20v3-fly ${kind}`;
    chip.textContent=text;
    chip.style.left=`${startX}px`;chip.style.top=`${startY}px`;
    chip.style.setProperty('--fly-time',`${duration}ms`);
    chip.style.transform='translate(-50%,-50%)';
    stage.appendChild(chip);
    requestAnimationFrame(()=>{chip.style.transform=`translate(calc(-50% + ${endX-startX}px),calc(-50% + ${endY-startY}px)) scale(.72)`;});
    later(()=>chip.remove(),duration+40);
  };
  const revealCell=(row,column,duration)=>{
    const weightCell=attentionCells[20+row];
    const valueCell=valueCells[row*5+column];
    const target=directCells[row*5+column];
    weightCell.classList.add('source-active');
    valueCell.classList.add('source-active');
    fly(weightCell,target,weights[row],'weight',duration,-19);
    fly(valueCell,target,`V_${tokens[row]}[${dimensions[column]}]`,'value',duration,12);
    later(()=>{
      fillDirectCell(target,row,column);
      target.classList.add('filled');
      weightCell.classList.remove('source-active');
      valueCell.classList.remove('source-active');
    },duration*.78);
  };
  const fillDirectCell=(cell,row,column)=>{
    const weight=document.createElement('span');
    const times=document.createElement('span');
    const value=document.createElement('span');
    weight.className='s20v3-cell-weight';weight.textContent=weights[row];
    times.className='s20v3-cell-times';times.textContent='×';
    value.className='s20v3-cell-value';value.textContent=`V_${tokens[row]}[${dimensions[column]}]`;
    cell.replaceChildren(weight,times,value);
  };
  const completeStepOne=()=>{
    stage.classList.add('has-products','cells-complete');
    nextStep.disabled=false;
    nextStep.classList.add('ready');
  };
  const factorRowsOnRequest=()=>{
    if(nextStep.disabled) return;
    nextStep.disabled=true;
    nextStep.classList.remove('ready');
    nextStep.textContent='Step 2: grouping rows…';
    stage.classList.remove('cells-complete');
    stage.classList.add('is-grouping');
    const rowDuration=2400;
    factorRows.forEach((factor,row)=>{
      const start=row*rowDuration;
      later(()=>factor.classList.add('factor-weight'),start);
      later(()=>factor.classList.add('factor-arrow'),start+500);
      later(()=>factor.classList.add('factor-result'),start+950);
      later(()=>factor.classList.add('group-vector'),start+1250);
      later(()=>factor.classList.add('factored'),start+2160);
    });
    later(()=>{final.classList.add('active');nextStep.textContent='Step 2 complete';},factorRows.length*rowDuration+120);
  };
  const run=()=>{
    clear();
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
      directCells.forEach((cell,index)=>{const row=Math.floor(index/5),column=index%5;fillDirectCell(cell,row,column);cell.classList.add('filled');});
      completeStepOne();return;
    }
    let elapsed=120;
    for(let column=0;column<5;column++){
      for(let row=0;row<5;row++){
        const duration=column===0?260:115;
        later(()=>revealCell(row,column,duration),elapsed);
        elapsed+=column===0?330:135;
      }
    }
    later(completeStepOne,elapsed+220);
  };
  replay.addEventListener('click',run);
  nextStep.addEventListener('click',factorRowsOnRequest);
  run();
  const slide=document.getElementById('slide-vector-mixing');
  if('IntersectionObserver' in window&&slide){
    let visibleBefore=true;
    new IntersectionObserver(entries=>{
      const visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.55;
      if(visible&&!visibleBefore) run();
      visibleBefore=visible;
    },{threshold:[.55]}).observe(slide);
  }
})();

// Slide 21: interactive Softmax-weighted mixing of three Value vectors.
(()=>{
  const lab=document.getElementById('s21-lab');
  const plot=document.getElementById('s21-plot');
  const svg=document.getElementById('s21-lines');
  const output=document.getElementById('s21-output');
  const equation=document.getElementById('s21-equation');
  const sumEl=document.getElementById('s21-weight-sum');
  const sliders=[...document.querySelectorAll('.s21-slider')];
  const keys=['ate','juicy','apple'];
  if(!lab||!plot||!svg||!output||!equation||!sumEl||sliders.length!==3) return;

  const points={ate:{x:22,y:25,color:'rgba(143,179,255,.85)'},juicy:{x:26,y:76,color:'rgba(126,217,154,.85)'},apple:{x:78,y:49,color:'rgba(255,138,101,.85)'}};
  const nodes=Object.fromEntries(keys.map(key=>[key,document.querySelector(`.s21-vector-node[data-key="${key}"]`)]));
  const scoreEls=Object.fromEntries(keys.map(key=>[key,document.getElementById(`s21-score-${key}`)]));
  const weightEls=Object.fromEntries(keys.map(key=>[key,document.getElementById(`s21-weight-${key}`)]));
  const barEls=Object.fromEntries(keys.map(key=>[key,document.getElementById(`s21-bar-${key}`)]));
  const nodeWeightEls=Object.fromEntries(keys.map(key=>[key,document.getElementById(`s21-node-weight-${key}`)]));
  let currentWeights={ate:0,juicy:0,apple:0};
  let drawFrame=0;

  const scoreText=value=>`${value>=0?'+':''}${value.toFixed(1)}`;
  const softmax=scores=>{
    const max=Math.max(...scores);
    const exp=scores.map(value=>Math.exp(value-max));
    const sum=exp.reduce((total,value)=>total+value,0);
    return exp.map(value=>value/sum);
  };
  const polygon=(centers)=>{
    const shape=document.createElementNS('http://www.w3.org/2000/svg','polygon');
    shape.setAttribute('points',centers.map(point=>`${point.x},${point.y}`).join(' '));
    shape.setAttribute('fill','rgba(79,209,197,.035)');
    shape.setAttribute('stroke','rgba(79,209,197,.14)');
    shape.setAttribute('stroke-width','1');
    svg.appendChild(shape);
  };
  const draw=()=>{
    sizeSvgToContainer(svg,plot);
    svg.replaceChildren();
    const centers=keys.map(key=>centerOf(nodes[key],plot));
    polygon(centers);
    const end=centerOf(output,plot);
    const original=centerOf(nodes.apple,plot);
    svgLine(svg,original.x,original.y,end.x,end.y,{stroke:'rgba(255,255,255,.32)',width:1.2,dash:'4,4',opacity:.8});
    keys.forEach((key,index)=>{
      const start=centers[index];
      const weight=currentWeights[key];
      svgLine(svg,start.x,start.y,end.x,end.y,{stroke:points[key].color,width:1.2+weight*6,opacity:.22+weight*.72});
    });
  };
  const animateLines=()=>{
    cancelAnimationFrame(drawFrame);
    const started=performance.now();
    const tick=now=>{
      draw();
      if(now-started<480) drawFrame=requestAnimationFrame(tick);
    };
    drawFrame=requestAnimationFrame(tick);
  };
  const render=()=>{
    const scores=Object.fromEntries(sliders.map(slider=>[slider.dataset.key,Number(slider.value)]));
    const normalized=softmax(keys.map(key=>scores[key]));
    currentWeights=Object.fromEntries(keys.map((key,index)=>[key,normalized[index]]));
    let x=0,y=0;
    keys.forEach(key=>{x+=currentWeights[key]*points[key].x;y+=currentWeights[key]*points[key].y;});
    output.style.left=`${x}%`;output.style.top=`${y}%`;
    const strongest=keys.reduce((best,key)=>currentWeights[key]>currentWeights[best]?key:best,keys[0]);
    sliders.forEach(slider=>{
      const key=slider.dataset.key;
      const score=scores[key];
      const weight=currentWeights[key];
      const min=Number(slider.min),max=Number(slider.max);
      slider.style.setProperty('--range',`${(score-min)/(max-min)*100}%`);
      scoreEls[key].textContent=scoreText(score);
      weightEls[key].textContent=weight.toFixed(3);
      barEls[key].style.width=`${weight*100}%`;
      nodeWeightEls[key].textContent=`${Math.round(weight*100)}%`;
      nodes[key].classList.toggle('dominant',key===strongest);
    });
    sumEl.textContent=`Σ = ${keys.reduce((sum,key)=>sum+currentWeights[key],0).toFixed(3)}`;
    equation.innerHTML=`apple′ = ${currentWeights.ate.toFixed(3)}V<sub>ate</sub> + ${currentWeights.juicy.toFixed(3)}V<sub>juicy</sub> + ${currentWeights.apple.toFixed(3)}V<sub>apple</sub>`;
    animateLines();
  };
  sliders.forEach(slider=>slider.addEventListener('input',render));
  window.addEventListener('resize',draw,{passive:true});
  if('ResizeObserver' in window) new ResizeObserver(draw).observe(plot);
  render();
})();

// Slide 21 v2: two independently interactive examples in a horizontal carousel.
(()=>{
  const track=document.getElementById('s21-track');
  const pages=[...document.querySelectorAll('.s21-page')];
  const caseButtons=[...document.querySelectorAll('.s21-case-btn')];
  const previous=document.getElementById('s21-case-prev');
  const next=document.getElementById('s21-case-next');
  if(!track||pages.length!==2||caseButtons.length!==2||!previous||!next) return;

  const configs=[
    {root:'s21-lab',prefix:'s21',keys:['ate','juicy','apple'],labels:{ate:'ate',juicy:'juicy',apple:'apple'},outputName:'apple′',originalKey:'apple',points:{ate:{x:22,y:25,color:'rgba(143,179,255,.85)'},juicy:{x:26,y:76,color:'rgba(126,217,154,.85)'},apple:{x:78,y:49,color:'rgba(255,138,101,.85)'}}},
    {root:'s21-company-lab',prefix:'s21-company',keys:['bought','laptop','apple'],labels:{bought:'bought',laptop:'laptop',apple:'Apple'},outputName:'Apple′',originalKey:'apple',points:{bought:{x:31,y:72,color:'rgba(167,139,250,.85)'},laptop:{x:24,y:22,color:'rgba(143,179,255,.9)'},apple:{x:78,y:49,color:'rgba(255,138,101,.85)'}}}
  ];
  const scoreText=value=>`${value>=0?'+':''}${value.toFixed(1)}`;
  const softmax=scores=>{
    const max=Math.max(...scores);
    const exp=scores.map(value=>Math.exp(value-max));
    const sum=exp.reduce((total,value)=>total+value,0);
    return exp.map(value=>value/sum);
  };

  const initialize=config=>{
    const root=document.getElementById(config.root);
    const plot=document.getElementById(`${config.prefix}-plot`);
    const svg=document.getElementById(`${config.prefix}-lines`);
    const output=document.getElementById(`${config.prefix}-output`);
    const equation=document.getElementById(`${config.prefix}-equation`);
    const sumEl=document.getElementById(`${config.prefix}-weight-sum`);
    const sliders=[...root.querySelectorAll('.s21-slider')];
    const nodes=Object.fromEntries(config.keys.map(key=>[key,root.querySelector(`.s21-vector-node[data-key="${key}"]`)]));
    const scoreEls=Object.fromEntries(config.keys.map(key=>[key,document.getElementById(`${config.prefix}-score-${key}`)]));
    const weightEls=Object.fromEntries(config.keys.map(key=>[key,document.getElementById(`${config.prefix}-weight-${key}`)]));
    const barEls=Object.fromEntries(config.keys.map(key=>[key,document.getElementById(`${config.prefix}-bar-${key}`)]));
    const nodeWeightEls=Object.fromEntries(config.keys.map(key=>[key,document.getElementById(`${config.prefix}-node-weight-${key}`)]));
    if(!root||!plot||!svg||!output||!equation||!sumEl||sliders.length!==3||Object.values(nodes).some(node=>!node)) return null;
    let currentWeights=Object.fromEntries(config.keys.map(key=>[key,0]));
    let drawFrame=0;
    const draw=()=>{
      sizeSvgToContainer(svg,plot);
      svg.replaceChildren();
      const centers=config.keys.map(key=>centerOf(nodes[key],plot));
      const shape=document.createElementNS('http://www.w3.org/2000/svg','polygon');
      shape.setAttribute('points',centers.map(point=>`${point.x},${point.y}`).join(' '));
      shape.setAttribute('fill','rgba(79,209,197,.035)');shape.setAttribute('stroke','rgba(79,209,197,.14)');shape.setAttribute('stroke-width','1');
      svg.appendChild(shape);
      const end=centerOf(output,plot);
      const original=centerOf(nodes[config.originalKey],plot);
      svgLine(svg,original.x,original.y,end.x,end.y,{stroke:'rgba(255,255,255,.32)',width:1.2,dash:'4,4',opacity:.8});
      config.keys.forEach((key,index)=>{
        const start=centers[index],weight=currentWeights[key];
        svgLine(svg,start.x,start.y,end.x,end.y,{stroke:config.points[key].color,width:1.2+weight*6,opacity:.22+weight*.72});
      });
    };
    const animateLines=()=>{
      cancelAnimationFrame(drawFrame);
      const started=performance.now();
      const tick=now=>{draw();if(now-started<480) drawFrame=requestAnimationFrame(tick);};
      drawFrame=requestAnimationFrame(tick);
    };
    const render=()=>{
      const scores=Object.fromEntries(sliders.map(slider=>[slider.dataset.key,Number(slider.value)]));
      const normalized=softmax(config.keys.map(key=>scores[key]));
      currentWeights=Object.fromEntries(config.keys.map((key,index)=>[key,normalized[index]]));
      let x=0,y=0;
      config.keys.forEach(key=>{x+=currentWeights[key]*config.points[key].x;y+=currentWeights[key]*config.points[key].y;});
      output.style.left=`${x}%`;output.style.top=`${y}%`;
      const strongest=config.keys.reduce((best,key)=>currentWeights[key]>currentWeights[best]?key:best,config.keys[0]);
      sliders.forEach(slider=>{
        const key=slider.dataset.key,score=scores[key],weight=currentWeights[key];
        slider.style.setProperty('--range',`${(score-Number(slider.min))/(Number(slider.max)-Number(slider.min))*100}%`);
        scoreEls[key].textContent=scoreText(score);weightEls[key].textContent=weight.toFixed(3);barEls[key].style.width=`${weight*100}%`;nodeWeightEls[key].textContent=`${Math.round(weight*100)}%`;
        nodes[key].classList.toggle('dominant',key===strongest);
      });
      sumEl.textContent=`Σ = ${config.keys.reduce((sum,key)=>sum+currentWeights[key],0).toFixed(3)}`;
      equation.innerHTML=`${config.outputName} = ${config.keys.map(key=>`${currentWeights[key].toFixed(3)}V<sub>${config.labels[key]}</sub>`).join(' + ')}`;
      animateLines();
    };
    sliders.forEach(slider=>slider.addEventListener('input',render));
    if('ResizeObserver' in window) new ResizeObserver(draw).observe(plot);
    render();
    return {draw,animateLines};
  };

  const labs=configs.map(initialize);
  if(labs.some(lab=>!lab)) return;
  let current=0;
  const show=index=>{
    current=Math.max(0,Math.min(pages.length-1,index));
    track.style.transform=`translateX(-${current*100}%)`;
    pages.forEach((page,pageIndex)=>page.classList.toggle('active',pageIndex===current));
    caseButtons.forEach((button,buttonIndex)=>button.classList.toggle('active',buttonIndex===current));
    previous.disabled=current===0;next.disabled=current===pages.length-1;
    requestAnimationFrame(labs[current].animateLines);
    setTimeout(labs[current].draw,580);
  };
  previous.addEventListener('click',()=>show(current-1));
  next.addEventListener('click',()=>show(current+1));
  caseButtons.forEach((button,index)=>button.addEventListener('click',()=>show(index)));
  window.addEventListener('resize',()=>labs.forEach(lab=>lab.draw()),{passive:true});
  show(0);
})();

// Slide 21 v3: two control groups drive two outputs in one shared meaning space.
(()=>{
  const plot=document.getElementById('s21-shared-plot');
  const svg=document.getElementById('s21-shared-lines');
  const fruitOutput=document.getElementById('s21-shared-fruit-output');
  const companyOutput=document.getElementById('s21-shared-company-output');
  const fruitEquation=document.getElementById('s21-shared-fruit-equation');
  const companyEquation=document.getElementById('s21-shared-company-equation');
  const fruitRoot=document.getElementById('s21-lab');
  const companyRoot=document.getElementById('s21-company-lab');
  if(!plot||!svg||!fruitOutput||!companyOutput||!fruitEquation||!companyEquation||!fruitRoot||!companyRoot) return;

  const points={
    ate:{x:30,y:58,color:'rgba(143,179,255,.85)'},juicy:{x:18,y:80,color:'rgba(126,217,154,.9)'},
    bought:{x:70,y:38,color:'rgba(167,139,250,.88)'},laptop:{x:82,y:18,color:'rgba(143,179,255,.92)'},
    apple:{x:50,y:50,color:'rgba(255,138,101,.88)'}
  };
  const nodes=Object.fromEntries(Object.keys(points).map(key=>[key,plot.querySelector(`[data-shared-key="${key}"]`)]));
  const contexts={
    fruit:{root:fruitRoot,keys:['ate','juicy','apple'],labels:{ate:'ate',juicy:'juicy',apple:'apple'},output:fruitOutput,equation:fruitEquation,name:'apple′',accent:'rgba(126,217,154,.85)'},
    company:{root:companyRoot,keys:['bought','laptop','apple'],labels:{bought:'bought',laptop:'laptop',apple:'Apple'},output:companyOutput,equation:companyEquation,name:'Apple′',accent:'rgba(143,179,255,.9)'}
  };
  const states={fruit:null,company:null};
  let drawFrame=0;
  const softmax=scores=>{const max=Math.max(...scores),exp=scores.map(value=>Math.exp(value-max)),sum=exp.reduce((total,value)=>total+value,0);return exp.map(value=>value/sum);};
  const badge=(id,text)=>{const el=document.getElementById(id);if(el) el.textContent=text;};
  const addPolygon=(keys,fill,stroke)=>{
    const shape=document.createElementNS('http://www.w3.org/2000/svg','polygon');
    shape.setAttribute('points',keys.map(key=>{const point=centerOf(nodes[key],plot);return `${point.x},${point.y}`;}).join(' '));
    shape.setAttribute('fill',fill);shape.setAttribute('stroke',stroke);shape.setAttribute('stroke-width','1');svg.appendChild(shape);
  };
  const draw=()=>{
    sizeSvgToContainer(svg,plot);svg.replaceChildren();
    addPolygon(contexts.fruit.keys,'rgba(126,217,154,.035)','rgba(126,217,154,.18)');
    addPolygon(contexts.company.keys,'rgba(143,179,255,.035)','rgba(143,179,255,.18)');
    for(const [contextName,config] of Object.entries(contexts)){
      const state=states[contextName];if(!state) continue;
      const end=centerOf(config.output,plot),origin=centerOf(nodes.apple,plot);
      svgLine(svg,origin.x,origin.y,end.x,end.y,{stroke:config.accent,width:1.3,dash:'4,4',opacity:.72});
      config.keys.forEach(key=>{const start=centerOf(nodes[key],plot),weight=state.weights[key];svgLine(svg,start.x,start.y,end.x,end.y,{stroke:points[key].color,width:1.1+weight*5.5,opacity:.18+weight*.72});});
    }
  };
  const animateLines=()=>{cancelAnimationFrame(drawFrame);const started=performance.now();const tick=now=>{draw();if(now-started<480) drawFrame=requestAnimationFrame(tick);};drawFrame=requestAnimationFrame(tick);};
  const renderContext=contextName=>{
    const config=contexts[contextName],sliders=[...config.root.querySelectorAll('.s21-slider')];
    const scores=Object.fromEntries(sliders.map(slider=>[slider.dataset.key,Number(slider.value)]));
    const normalized=softmax(config.keys.map(key=>scores[key]));
    const weights=Object.fromEntries(config.keys.map((key,index)=>[key,normalized[index]]));
    let x=0,y=0;config.keys.forEach(key=>{x+=weights[key]*points[key].x;y+=weights[key]*points[key].y;});
    config.output.style.left=`${x}%`;config.output.style.top=`${y}%`;
    config.equation.innerHTML=`${config.name} = ${config.keys.map(key=>`${weights[key].toFixed(3)}V<sub>${config.labels[key]}</sub>`).join(' + ')}`;
    states[contextName]={weights,x,y};
    const strongest=config.keys.reduce((best,key)=>weights[key]>weights[best]?key:best,config.keys[0]);
    config.keys.forEach(key=>nodes[key].classList.toggle(`${contextName}-dominant`,key===strongest));
    if(contextName==='fruit'){
      badge('s21-shared-weight-ate',`F ${Math.round(weights.ate*100)}%`);badge('s21-shared-weight-juicy',`F ${Math.round(weights.juicy*100)}%`);badge('s21-shared-fruit-weight-apple',`F ${Math.round(weights.apple*100)}%`);
    }else{
      badge('s21-shared-weight-bought',`C ${Math.round(weights.bought*100)}%`);badge('s21-shared-weight-laptop',`C ${Math.round(weights.laptop*100)}%`);badge('s21-shared-company-weight-apple',`C ${Math.round(weights.apple*100)}%`);
    }
    animateLines();
  };
  for(const [contextName,config] of Object.entries(contexts)){
    config.root.querySelectorAll('.s21-slider').forEach(slider=>slider.addEventListener('input',()=>renderContext(contextName)));
    renderContext(contextName);
  }
  window.addEventListener('resize',draw,{passive:true});
  if('ResizeObserver' in window) new ResizeObserver(draw).observe(plot);
  draw();
})();

/* ---------------------------------------------------------
   SLIDE 4 : A matrix transforms Apple's vector
--------------------------------------------------------- */
(function(){
  if(!document.getElementById('s3b-matrix')) return;
  const examples = {
    fruit: {
      matrix:[1.00,0.50,-0.80,0.70], result:'[−0.28, +0.52]', note:'built from “ate” + “juicy”',
      caption:'<b>Fruit context —</b> A context-dependent transformation moves Apple toward the fruit region, matching slide 03.'
    },
    company: {
      matrix:[1.20,-0.80,0.50,0.40], result:'[+0.54, +0.08]', note:'built from “bought” + “laptop”',
      caption:'<b>Company context —</b> A different transformation moves the same initial Apple toward the tech region, matching slide 03.'
    }
  };
  const matrix = document.getElementById('s3b-matrix');
  const point = document.getElementById('s3b-output-point');
  const region = document.getElementById('s3b-region');
  const result = document.getElementById('s3b-output-vector');
  const note = document.getElementById('s3b-matrix-note');
  const caption = document.getElementById('s3b-caption');
  const buttons = [...document.querySelectorAll('#s3b-toggle .ctx-btn')];
  function render(key){
    const ex = examples[key];
    buttons.forEach(b=>b.classList.toggle('active',b.dataset.ctx===key));
    matrix.className = 's3b-matrix ' + key;
    matrix.innerHTML = ex.matrix.map(v=>`<span>${fmt(v)}</span>`).join('');
    point.className = 's3b-point ' + key;
    region.className = 's3b-region ' + key;
    result.textContent = ex.result;
    note.textContent = ex.note;
    caption.innerHTML = ex.caption;
  }
  buttons.forEach(b=>b.addEventListener('click',()=>render(b.dataset.ctx)));
  render('fruit');
})();

/* ---------------------------------------------------------
   SLIDE 1 : Encoder - Decoder
--------------------------------------------------------- */
(function(){
  if(!document.getElementById('s1-tokens')) return;
  const tokens = ['The','cat','ate','the','fish'];
  const outputTokens = ['猫','は','魚','を','食べた'];
  const wordAlignment = [
    { source:1, target:0 }, // cat -> 猫
    { source:2, target:4 }, // ate -> 食べた
    { source:4, target:2 }, // fish -> 魚
  ];
  const captions = [
    '<b>Step 0 —</b> The sentence to translate is fed into the encoder.',
    '<b>Step 1 —</b> ① The text is split into words (tokens).',
    '<b>Step 2 —</b> ② Each word becomes an initial vector (a list of numbers).',
    '<b>Step 3 —</b> ③ Each vector is updated using the vectors of surrounding words (this is Attention). This is the encoder\'s job.',
    '<b>Step 4 —</b> The encoder creates a numeric representation of the whole sentence: who did what to whom.',
    '<b>Step 5 —</b> The decoder generates Japanese in Japanese word order. The crossing lines show why translation is not sequential word replacement.'
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
  const alignmentEl = document.getElementById('s1-alignment');
  const alignmentMapEl = document.getElementById('s1-alignment-map');
  const alignmentLinesEl = document.getElementById('s1-alignment-lines');
  const sourceRowEl = document.getElementById('s1-source-row');
  const targetRowEl = document.getElementById('s1-target-row');

  function buildAlignment(){
    sourceRowEl.innerHTML = '';
    targetRowEl.innerHTML = '';

    tokens.forEach((word,index)=>{
      const token = document.createElement('span');
      token.className = 'alignment-token ' + (wordAlignment.some(pair=>pair.source===index) ? 'mapped' : 'omitted');
      token.textContent = word;
      sourceRowEl.appendChild(token);
    });

    outputTokens.forEach((word,index)=>{
      const token = document.createElement('span');
      token.className = 'alignment-token ' + (wordAlignment.some(pair=>pair.target===index) ? 'mapped' : 'added');
      token.textContent = word;
      targetRowEl.appendChild(token);
    });
  }

  function drawAlignmentLines(){
    alignmentLinesEl.innerHTML = '';
    if(step < 5) return;
    sizeSvgToContainer(alignmentLinesEl, alignmentMapEl);
    const sourceTokens = [...sourceRowEl.children];
    const targetTokens = [...targetRowEl.children];
    wordAlignment.forEach((pair,index)=>{
      const from = centerOf(sourceTokens[pair.source], alignmentMapEl);
      const to = centerOf(targetTokens[pair.target], alignmentMapEl);
      svgLine(alignmentLinesEl, from.x, from.y + 8, to.x, to.y - 8, {
        stroke:index===1 ? 'var(--coral)' : 'rgba(79,209,197,.72)',
        width:index===1 ? 2 : 1.5,
        opacity:.9,
      });
    });
  }

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

    alignmentEl.classList.toggle('show', step>=5);

    requestAnimationFrame(()=>{
      drawAttentionLines();
      drawAlignmentLines();
    });
  }

  prevBtn.addEventListener('click', ()=>{ if(step>0){ step--; render(); }});
  nextBtn.addEventListener('click', ()=>{ if(step<totalSteps-1){ step++; render(); }});
  window.addEventListener('resize', ()=>{
    drawAttentionLines();
    drawAlignmentLines();
  });

  buildAlignment();
  render();
})();

/* ---------------------------------------------------------
   SLIDE 2 : word2vec  (2D vector matches plotted x,y)
--------------------------------------------------------- */
(function(){
  if(!document.getElementById('s2-plot')) return;
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
  if(!document.getElementById('s3-plot')) return;
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
    neutral: neutralPos,
    fruit:   { x:28, y:66 },
    company: { x:72, y:24 },
  };
  const ctxWords = {
    neutral: [],
    fruit:   [ {w:'ate', x:42, y:74, weight:.85}, {w:'juicy', x:20, y:46, weight:.5} ],
    company: [ {ref:'laptop', weight:.9}, {w:'bought', x:58, y:36, weight:.55} ],
  };
  const captions = {
    neutral: '<b>Initial vector —</b> Before attention, Apple has the same context-free starting position.',
    fruit: '<b>Attention —</b> "ate" and "juicy" pull Apple\'s vector toward the fruit cluster.',
    company: '<b>Attention —</b> "laptop" and "bought" pull Apple\'s vector toward the tech cluster.'
  };

  const plot = document.getElementById('s3-plot');
  const linesSvg = document.getElementById('s3-lines');
  const appleEl = document.getElementById('s3-apple');
  const vecBefore = document.getElementById('s3-vec-before');
  const vecAfter = document.getElementById('s3-vec-after');
  const buttons = [...document.querySelectorAll('#s3-toggle .ctx-btn')];
  const captionEl = document.getElementById('s3-caption');
  const afterLabelEl = document.getElementById('s3-after-label');
  const neutralEl = document.getElementById('s3-neutral');

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
  let activeLineTargets = [];

  function render(ctxKey){
    buttons.forEach(b=> b.classList.toggle('active', b.dataset.ctx === ctxKey));
    captionEl.innerHTML = captions[ctxKey];

    appleEl.classList.remove('fruit','company');
    if(ctxKey !== 'neutral') appleEl.classList.add(ctxKey);
    neutralEl.classList.toggle('current', ctxKey === 'neutral');
    afterLabelEl.textContent = ctxKey === 'neutral' ? 'INITIAL VECTOR' : 'AFTER ATTENTION UPDATE';
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
    activeLineTargets = lineTargets;

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
    if(ctxKey !== 'neutral'){
      svgLine(linesSvg, neutralCenter.x, neutralCenter.y, appleCenter.x, appleCenter.y, {
        stroke:'rgba(255,255,255,0.28)', width:1.2, dash:'3,4', opacity:0.8
      });
    }
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
    if(active) drawLines(active.dataset.ctx, activeLineTargets);
  });

  render('neutral');
})();

/* ---------------------------------------------------------
   SLIDE 4 : Token embeddings — same word, same starting point
--------------------------------------------------------- */
(function(){
  const plot = document.getElementById('s4-plot');
  const caption = document.getElementById('s4-caption');
  const buttons = [...document.querySelectorAll('#s4-toggle .ctx-btn')];
  if(!plot || !caption) return;

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
  const contextToggle = document.getElementById('s5-toggle');

  // Slide 07 is intentionally a single, static overview now.
  if(!dotsEl || !prevBtn || !nextBtn) return;

  const stepCaptions = [
    '<b>Initial vector —</b> We are here, just before self-attention begins.',
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
    contextToggle.style.display = step===0 ? 'none' : '';

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
  if(!barsEl || !caption) return;

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
   SLIDE 7 : interactive positional encoding
--------------------------------------------------------- */
(function(){
  const slider = document.getElementById('s12-position-slider');
  const graphMarker = document.getElementById('s12-graph-marker');
  const vectorBox = document.getElementById('s12-vector-box');
  const tracePath = document.getElementById('s12-trace-path');
  const tracePoint = document.getElementById('s12-trace-point');
  const valuesEl = document.getElementById('s12-vector-values');
  const positionEl = document.getElementById('s12-position-value');
  const curveEls = [
    document.getElementById('s12-curve-a'),
    document.getElementById('s12-curve-b'),
    document.getElementById('s12-curve-c'),
  ];
  const dotEls = [
    document.getElementById('s12-dot-a'),
    document.getElementById('s12-dot-b'),
    document.getElementById('s12-dot-c'),
  ];
  const axisEls = {
    xNeg: document.getElementById('s12-axis-x-neg'), xPos: document.getElementById('s12-axis-x-pos'),
    yNeg: document.getElementById('s12-axis-y-neg'), yPos: document.getElementById('s12-axis-y-pos'),
    zNeg: document.getElementById('s12-axis-z-neg'), zPos: document.getElementById('s12-axis-z-pos'),
  };
  const axisLabelEls = {
    xNeg: document.getElementById('s12-label-x-neg'), xPos: document.getElementById('s12-label-x-pos'),
    yNeg: document.getElementById('s12-label-y-neg'), yPos: document.getElementById('s12-label-y-pos'),
    zNeg: document.getElementById('s12-label-z-neg'), zPos: document.getElementById('s12-label-z-pos'),
  };
  if(!slider || !graphMarker || !vectorBox || !tracePath || !tracePoint || !valuesEl || !positionEl || curveEls.some(el=>!el)) return;

  const plot = { left:42, right:600, top:18, bottom:170, centerY:94 };
  const origin = { x:160, y:108 };
  const axisLength = 82;
  let yaw = -Math.PI / 4;
  let pitch = Math.PI / 4;
  let currentPosition = 0;
  let dragStart = null;
  let autoRotate = true;
  let resumeTimer = null;
  const channels = [
    position => Math.sin(position * 0.9),
    position => Math.cos(position * 0.9),
    position => Math.sin(position * 0.22),
  ];
  const signed = value => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
  const encoding = position => channels.map(channel => channel(position));

  function project(point){
    const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
    const rotatedX = cosYaw * point[0] + sinYaw * point[2];
    const rotatedZ = -sinYaw * point[0] + cosYaw * point[2];
    const projectedY = cosPitch * point[1] - sinPitch * rotatedZ;
    const depth = sinPitch * point[1] + cosPitch * rotatedZ;
    return { x:origin.x + rotatedX * axisLength, y:origin.y - projectedY * axisLength, depth };
  }

  function setLine(line, from, to, depth){
    line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x); line.setAttribute('y2', to.y);
    line.style.opacity = (0.26 + (depth + 1) * 0.18).toFixed(2);
  }

  function setLabel(label, point, depth){
    label.setAttribute('x', point.x + (point.x >= origin.x ? 6 : -17));
    label.setAttribute('y', point.y + (point.y >= origin.y ? 13 : -6));
    label.style.opacity = (0.42 + (depth + 1) * 0.22).toFixed(2);
  }

  function encodingPoint(position){
    return [channels[0](position), channels[1](position), (position / Number(slider.max)) * 2 - 1];
  }

  function renderScene(position){
    const center = project([0,0,0]);
    const axes = [
      ['xNeg','xPos',[-1,0,0],[1,0,0]],
      ['yNeg','yPos',[0,-1,0],[0,1,0]],
      ['zNeg','zPos',[0,0,-1],[0,0,1]],
    ];
    axes.forEach(([negativeKey, positiveKey, negative, positive])=>{
      const neg = project(negative), pos = project(positive);
      setLine(axisEls[negativeKey], center, neg, neg.depth);
      setLine(axisEls[positiveKey], center, pos, pos.depth);
      setLabel(axisLabelEls[negativeKey], neg, neg.depth);
      setLabel(axisLabelEls[positiveKey], pos, pos.depth);
    });
    const points = [];
    const steps = Math.max(2, Math.ceil(position * 8));
    for(let i=0;i<=steps;i++){
      const point = project(encodingPoint(position * (i / steps)));
      points.push(`${i===0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`);
    }
    tracePath.setAttribute('d', points.join(' '));
    const current = project(encodingPoint(position));
    tracePoint.setAttribute('cx', current.x); tracePoint.setAttribute('cy', current.y);
  }

  function curvePath(channel){
    const points = [];
    for(let i=0;i<=120;i++){
      const position = (i / 120) * Number(slider.max);
      const x = plot.left + (position / Number(slider.max)) * (plot.right - plot.left);
      const y = plot.centerY - channel(position) * 76;
      points.push(`${i===0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ');
  }

  function update(){
    const position = Number(slider.value);
    const values = encoding(position);
    const x = plot.left + (position / Number(slider.max)) * (plot.right - plot.left);

    curveEls.forEach((curve, index)=> curve.setAttribute('d', curvePath(channels[index])));
    graphMarker.setAttribute('x1', x); graphMarker.setAttribute('x2', x);
    dotEls.forEach((dot, index)=>{
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', plot.centerY - values[index] * 76);
    });

    currentPosition = position;
    renderScene(position);

    valuesEl.textContent = `[${values.map(signed).join(', ')}]`;
    positionEl.textContent = position.toFixed(1).replace('.0','');
  }

  slider.addEventListener('input', update);
  vectorBox.addEventListener('pointerdown', event=>{
    autoRotate = false;
    clearTimeout(resumeTimer);
    dragStart = { x:event.clientX, y:event.clientY, yaw, pitch };
    vectorBox.classList.add('is-dragging');
    vectorBox.setPointerCapture(event.pointerId);
  });
  vectorBox.addEventListener('pointermove', event=>{
    if(!dragStart) return;
    yaw = dragStart.yaw + (event.clientX - dragStart.x) * 0.012;
    pitch = Math.max(-1.15, Math.min(1.15, dragStart.pitch + (event.clientY - dragStart.y) * 0.012));
    renderScene(currentPosition);
  });
  const endDrag = event=>{
    if(!dragStart) return;
    dragStart = null;
    vectorBox.classList.remove('is-dragging');
    if(event.pointerId !== undefined && vectorBox.hasPointerCapture(event.pointerId)) vectorBox.releasePointerCapture(event.pointerId);
    resumeTimer = setTimeout(()=>{ autoRotate = true; }, 1600);
  };
  vectorBox.addEventListener('pointerup', endDrag);
  vectorBox.addEventListener('pointercancel', endDrag);
  update();
  let previousFrame = performance.now();
  function animate(now){
    const elapsed = Math.min(40, now - previousFrame);
    previousFrame = now;
    if(autoRotate && !dragStart){
      yaw += elapsed * 0.00045;
      renderScene(currentPosition);
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();

/* ---------------------------------------------------------
   SLIDE 7 : application — word vectors plus precomputed position
--------------------------------------------------------- */
(function(){
  const viewButtons = [...document.querySelectorAll('[data-s12-view]')];
  const encodingView = document.getElementById('s12-encoding-view');
  const applicationView = document.getElementById('s12-application-view');
  const appItems = document.getElementById('s12-application-items');
  const orderButtons = [...document.querySelectorAll('[data-s12-order]')];
  if(!viewButtons.length || !encodingView || !applicationView || !appItems || !orderButtons.length) return;

  const actualVectors = {
    you:   [-0.34,  0.28],
    eat:   [ 0.16, -0.18],
    salad: [ 0.42,  0.32],
  };
  const positionVectors = [
    [ 0.00,  0.42],
    [-0.36,  0.05],
    [ 0.28, -0.28],
  ];
  const orders = {
    'you-eat-salad': ['you','eat','salad'],
    'salad-eat-you': ['salad','eat','you'],
    'you-salad-eat': ['you','salad','eat'],
  };
  const colors = { you:'var(--teal)', eat:'var(--purple)', salad:'var(--gold)' };
  const origin = { x:310, y:119 };
  const scale = 120;

  function point(vector){ return { x:origin.x + vector[0] * scale, y:origin.y - vector[1] * scale }; }
  function svgEl(tag, attrs){
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));
    return el;
  }

  function renderApplication(orderKey){
    const order = orders[orderKey];
    appItems.innerHTML = '';
    order.forEach((word, positionIndex)=>{
      const actual = actualVectors[word];
      const positional = positionVectors[positionIndex];
      const placed = [actual[0] + positional[0], actual[1] + positional[1]];
      const from = point(actual), to = point(placed);
      const group = svgEl('g', { class:'s12-app-item', 'data-word':word });
      const line = svgEl('line', { class:'s12-app-shift', x1:from.x, y1:from.y, x2:to.x, y2:to.y });
      const ghost = svgEl('circle', { class:'s12-app-actual', cx:from.x, cy:from.y, r:4 });
      const final = svgEl('circle', { class:'s12-app-placed', cx:to.x, cy:to.y, r:7 });
      final.style.color = colors[word];
      ghost.style.color = colors[word];
      const label = svgEl('text', { class:'s12-app-word', x:to.x + 10, y:to.y - 9 });
      label.style.fill = colors[word];
      label.textContent = `[${word}]`;
      group.append(line, ghost, final, label);
      appItems.appendChild(group);
    });
    orderButtons.forEach(button=>{
      const active = button.dataset.s12Order === orderKey;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }

  function selectView(view){
    const application = view === 'application';
    encodingView.hidden = application;
    applicationView.hidden = !application;
    viewButtons.forEach(button=>{
      const active = button.dataset.s12View === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }

  viewButtons.forEach(button=>button.addEventListener('click',()=>selectView(button.dataset.s12View)));
  orderButtons.forEach(button=>button.addEventListener('click',()=>renderApplication(button.dataset.s12Order)));
  renderApplication('you-eat-salad');
  selectView('encoding');
})();

/* ---------------------------------------------------------
   SLIDE 7 : Actually blending the vectors (weighted sum)
--------------------------------------------------------- */
(function(){
  const carousel = document.getElementById('s10-carousel');
  const buttons = [...document.querySelectorAll('[data-s10-view]')];
  if(!carousel || !buttons.length) return;
  function select(index){
    carousel.scrollTo({ left: carousel.clientWidth * index, behavior:'smooth' });
    buttons.forEach((button,i)=>button.classList.toggle('active',i===index));
  }
  buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
  carousel.addEventListener('scroll',()=>{
    const index = Math.round(carousel.scrollLeft / Math.max(1,carousel.clientWidth));
    buttons.forEach((button,i)=>button.classList.toggle('active',i===index));
  },{passive:true});
})();

(function(){
  const plot = document.getElementById('s7-plot');
  const linesSvg = document.getElementById('s7-lines');
  const blendEl = document.getElementById('s7-apple-blend');
  const caption = document.getElementById('s7-caption');
  const buttons = [...document.querySelectorAll('#s7-toggle .ctx-btn')];
  if(!plot || !linesSvg || !blendEl || !caption) return;

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
  if(!plot || !linesSvg || !vecFruitEl || !vecCompanyEl) return;

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

/* ---------------------------------------------------------
   SLIDE 11 : interactive dot-product lab
--------------------------------------------------------- */
(function(){
  const carousel = document.getElementById('s11-carousel');
  const viewButtons = [...document.querySelectorAll('[data-s11-view]')];
  const plane = document.getElementById('s11-drag-plane');
  if(!carousel || !plane) return;

  viewButtons.forEach((button,index)=>button.addEventListener('click',()=>{
    carousel.scrollTo({left:carousel.clientWidth*index,behavior:'smooth'});
    viewButtons.forEach((b,i)=>b.classList.toggle('active',i===index));
  }));
  carousel.addEventListener('scroll',()=>{
    const index=Math.round(carousel.scrollLeft/Math.max(1,carousel.clientWidth));
    viewButtons.forEach((b,i)=>b.classList.toggle('active',i===index));
  },{passive:true});

  const lineA=document.getElementById('s11-vector-a');
  const lineB=document.getElementById('s11-vector-b');
  const labelA=document.getElementById('s11-label-a');
  const labelB=document.getElementById('s11-label-b');
  const hitA=document.getElementById('s11-hit-a');
  const hitB=document.getElementById('s11-hit-b');
  const handleA=document.getElementById('s11-handle-a');
  const handleB=document.getElementById('s11-handle-b');
  const coordsA=document.getElementById('s11-a-coords');
  const coordsB=document.getElementById('s11-b-coords');
  const angleDiff=document.getElementById('s11-angle-diff');
  const formula=document.getElementById('s11-dot-formula');
  const result=document.getElementById('s11-dot-result');
  const caption=document.getElementById('s11-lab-caption');
  const origin={x:210,y:165}, scale=125;
  const signed=v=>(v>=0?'+':'')+v.toFixed(2);
  const vectors={a:{x:1.00,y:0.58},b:{x:0.61,y:1.02}};

  function endpoint(vector){ return {x:origin.x+vector.x*scale,y:origin.y-vector.y*scale}; }
  function setVector(key){
    const vector=vectors[key], point=endpoint(vector);
    const line=key==='a'?lineA:lineB, hit=key==='a'?hitA:hitB, handle=key==='a'?handleA:handleB, label=key==='a'?labelA:labelB;
    line.setAttribute('x2',point.x); line.setAttribute('y2',point.y);
    hit.setAttribute('x2',point.x); hit.setAttribute('y2',point.y);
    handle.setAttribute('cx',point.x); handle.setAttribute('cy',point.y);
    label.setAttribute('x',point.x+(vector.x>=0?12:-24)); label.setAttribute('y',point.y+(vector.y>=0?-10:22));
  }
  function update(){
    setVector('a'); setVector('b');
    const a=vectors.a,b=vectors.b;
    coordsA.textContent=`[${signed(a.x)}, ${signed(a.y)}]`;
    coordsB.textContent=`[${signed(b.x)}, ${signed(b.y)}]`;
    const dot=a.x*b.x+a.y*b.y;
    const magA=Math.hypot(a.x,a.y),magB=Math.hypot(b.x,b.y);
    const cosine=Math.max(-1,Math.min(1,dot/Math.max(.0001,magA*magB)));
    const diff=Math.round(Math.acos(cosine)*180/Math.PI);
    angleDiff.textContent=`${diff}°`;
    result.textContent=signed(dot);
    formula.textContent=`(${signed(a.x)} × ${signed(b.x)}) + (${signed(a.y)} × ${signed(b.y)}) = ${signed(dot)}`;
    const state=cosine>0.7?['Similar directions:','the dot product is large.']:cosine<-0.2?['Opposite directions:','the dot product is negative.']:['Different directions:','the dot product is small.'];
    caption.innerHTML=`<b>${state[0]}</b> ${state[1]}`;
  }
  let dragging=null;
  function pointerPoint(event){
    const point=plane.createSVGPoint(); point.x=event.clientX; point.y=event.clientY;
    return point.matrixTransform(plane.getScreenCTM().inverse());
  }
  function startDrag(key,event){
    dragging=key; (key==='a'?handleA:handleB).classList.add('dragging');
    plane.setPointerCapture(event.pointerId); event.preventDefault();
  }
  [handleA,hitA].forEach(el=>el.addEventListener('pointerdown',event=>startDrag('a',event)));
  [handleB,hitB].forEach(el=>el.addEventListener('pointerdown',event=>startDrag('b',event)));
  plane.addEventListener('pointermove',event=>{
    if(!dragging) return;
    const point=pointerPoint(event);
    vectors[dragging].x=Math.max(-1.35,Math.min(1.35,(point.x-origin.x)/scale));
    vectors[dragging].y=Math.max(-1.10,Math.min(1.10,(origin.y-point.y)/scale));
    update();
  });
  function endDrag(event){
    if(!dragging) return;
    (dragging==='a'?handleA:handleB).classList.remove('dragging'); dragging=null;
    if(plane.hasPointerCapture(event.pointerId)) plane.releasePointerCapture(event.pointerId);
  }
  plane.addEventListener('pointerup',endDrag); plane.addEventListener('pointercancel',endDrag); update();
})();

// Slide 16: replay row-wise softmax normalization.
(()=>{
  const stage=document.getElementById('s16-flow');
  const replay=document.getElementById('s16-replay');
  if(!stage||!replay) return;
  const words=['I','ate','a','juicy','apple'];
  const scores=[[1,.42,.18,.35,.28],[.42,1,.22,.61,.49],[.18,.22,1,.27,.31],[.35,.61,.27,1,.78],[.28,.49,.31,.78,1]];
  const sourceCells=[...stage.querySelectorAll('.raw-grid i')];
  const targetCells=[...stage.querySelectorAll('.soft-weight')];
  const collector=[...stage.querySelectorAll('.s16-collector i')];
  const rowTotal=document.getElementById('s16-row-total');
  const rowLabel=document.getElementById('s16-row-label');
  const numerator=document.getElementById('s16-numerator');
  const denominatorValue=document.getElementById('s16-denominator-value');
  const divisionResult=document.getElementById('s16-division-result');
  const sourceOutline=stage.querySelector('.source-outline');
  const targetOutline=stage.querySelector('.target-outline');
  let timers=[];
  const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
  function flyValue(source,slot,label,done){
    const stageRect=stage.getBoundingClientRect(),a=source.getBoundingClientRect(),b=slot.getBoundingClientRect();
    const chip=document.createElement('div');
    chip.className='s16-flying-chip'; chip.textContent=label;
    Object.assign(chip.style,{left:`${a.left-stageRect.left}px`,top:`${a.top-stageRect.top}px`,width:`${a.width}px`,height:`${a.height}px`});
    stage.appendChild(chip); void chip.offsetWidth;
    chip.style.transform=`translate(${b.left-a.left}px,${b.top-a.top}px) scale(.65)`;
    later(()=>{chip.remove();done();},440);
  }
  function runRow(row){
    if(row>=5) return;
    const top=42+row*48;
    sourceOutline.style.top=`${top}px`; targetOutline.style.top=`${top}px`;
    sourceOutline.querySelector('span').textContent=`${words[row]} row`;
    targetOutline.querySelector('span').textContent=`${words[row]} distributes 100%`;
    rowLabel.textContent=`Convert positive + add the whole ${words[row]} row`;
    numerator.textContent='each value'; denominatorValue.textContent='Σe^score'; divisionResult.textContent='weight';
    sourceCells.forEach((cell,i)=>cell.classList.toggle('active-row',Math.floor(i/5)===row));
    collector.forEach(slot=>slot.textContent=''); rowTotal.textContent='0.00';
    const positives=scores[row].map(Math.exp),sum=positives.reduce((a,b)=>a+b,0);
    let running=0;
    function collect(col){
      if(col>=5){ later(()=>fill(0),420); return; }
      const source=sourceCells[row*5+col],slot=collector[col];
      flyValue(source,slot,source.textContent,()=>{
        running+=positives[col]; slot.textContent=positives[col].toFixed(2); rowTotal.textContent=running.toFixed(2);
        later(()=>collect(col+1),170);
      });
    }
    function fill(col){
      if(col>=5){ later(()=>runRow(row+1),650); return; }
      const weight=(positives[col]/sum).toFixed(2),cell=targetCells[row*5+col];
      const rawCell=sourceCells[row*5+col];
      flyValue(rawCell,numerator,rawCell.textContent,()=>{
        numerator.textContent=`e^${rawCell.textContent} = ${positives[col].toFixed(2)}`;
        denominatorValue.textContent=`Σe^score = ${sum.toFixed(2)}`;
        divisionResult.textContent=weight;
        later(()=>flyValue(divisionResult,cell,weight,()=>{
          cell.textContent=weight; cell.classList.add('filled');
          later(()=>fill(col+1),180);
        }),420);
      });
    }
    collect(0);
  }
  const play=()=>{
    timers.forEach(clearTimeout); timers=[];
    stage.querySelectorAll('.s16-flying-chip').forEach(el=>el.remove());
    targetCells.forEach(cell=>{cell.textContent='';cell.classList.remove('filled');});
    sourceCells.forEach(cell=>cell.classList.remove('active-row'));
    collector.forEach(slot=>slot.textContent=''); rowTotal.textContent='0.00';
    numerator.textContent='each value'; denominatorValue.textContent='Σe^score'; divisionResult.textContent='weight';
    stage.classList.remove('is-playing');
    void stage.offsetWidth;
    stage.classList.add('is-playing');
    later(()=>runRow(0),900);
  };
  replay.addEventListener('click',play);
  const slide=document.getElementById('slide-softmax');
  if('IntersectionObserver' in window&&slide){
    let visibleBefore=false;
    new IntersectionObserver(entries=>{
      const visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.55;
      if(visible&&!visibleBefore) play();
      visibleBefore=visible;
    },{threshold:[.55]}).observe(slide);
  }
})();

// Slide 16: replay the context-weighted vector update.
(()=>{
  const stage=document.getElementById('s15-cases');
  const replay=document.getElementById('s15-replay');
  if(!stage||!replay) return;
  const play=()=>{
    stage.classList.remove('is-playing');
    void stage.offsetWidth;
    stage.classList.add('is-playing');
  };
  replay.addEventListener('click',play);
  const slide=document.getElementById('slide-context-update');
  if('IntersectionObserver' in window&&slide){
    let visibleBefore=false;
    new IntersectionObserver(entries=>{
      const visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.55;
      if(visible&&!visibleBefore) play();
      visibleBefore=visible;
    },{threshold:[.55]}).observe(slide);
  }
})();

// Slide 19: replay attention-weights times V multiplication.
(()=>{
  const equation=document.getElementById('s19-equation');
  const replay=document.getElementById('s19-replay');
  const trace=document.getElementById('s19-trace');
  const track=document.getElementById('s19-trace-track');
  const prev=document.getElementById('s19-trace-prev');
  const next=document.getElementById('s19-trace-next');
  const pages=[...document.querySelectorAll('.s19-trace-page')];
  const dots=[...document.querySelectorAll('#s19-trace-dots button')];
  const weightMatrix=equation?.querySelector('.s19-weight-matrix');
  const valueMatrix=equation?.querySelector('.s19-value-matrix');
  const outputCells=[...document.querySelectorAll('.s19-output-matrix i')];
  const weightCells=[...document.querySelectorAll('.s19-weight-matrix i')];
  const valueCells=[...document.querySelectorAll('.s19-value-matrix i')];
  const fastRows=[...document.querySelectorAll('.s19-fast-rows b')];
  if(!equation||!trace||!track||!prev||!next||!replay||!weightMatrix||!valueMatrix||pages.length!==6||weightCells.length!==25||valueCells.length!==25||outputCells.length!==25) return;
  const rowOutline=document.createElement('span');
  const columnOutline=document.createElement('span');
  rowOutline.className='s19-scan-outline row';
  columnOutline.className='s19-scan-outline column';
  weightMatrix.appendChild(rowOutline);
  valueMatrix.appendChild(columnOutline);
  let scanTimers=[];
  const clearScan=()=>{
    scanTimers.forEach(clearTimeout);
    scanTimers=[];
    rowOutline.classList.remove('active');
    columnOutline.classList.remove('active');
    outputCells.forEach(cell=>cell.classList.remove('s19-scan-filled'));
    fastRows.forEach(row=>row.classList.remove('done'));
  };
  const placeOutline=(outline,matrix,cells)=>{
    const root=matrix.getBoundingClientRect();
    const boxes=cells.map(cell=>cell.getBoundingClientRect());
    const left=Math.min(...boxes.map(box=>box.left))-root.left-2;
    const top=Math.min(...boxes.map(box=>box.top))-root.top-2;
    const right=Math.max(...boxes.map(box=>box.right))-root.left+2;
    const bottom=Math.max(...boxes.map(box=>box.bottom))-root.top+2;
    Object.assign(outline.style,{left:`${left}px`,top:`${top}px`,width:`${right-left}px`,height:`${bottom-top}px`});
    outline.classList.add('active');
  };
  const startFastScan=()=>{
    clearScan();
    let step=0;
    const advance=()=>{
      if(current!==5||step>=20){
        if(step>=20){rowOutline.classList.remove('active');columnOutline.classList.remove('active');}
        return;
      }
      const row=Math.floor(step/5)+1;
      const column=step%5;
      placeOutline(rowOutline,weightMatrix,weightCells.slice(row*5,row*5+5));
      placeOutline(columnOutline,valueMatrix,[0,1,2,3,4].map(index=>valueCells[index*5+column]));
      const output=outputCells[row*5+column];
      scanTimers.push(setTimeout(()=>{
        output.classList.add('s19-scan-filled');
        if(column===4) fastRows[row-1]?.classList.add('done');
      },85));
      step+=1;
      scanTimers.push(setTimeout(advance,155));
    };
    advance();
  };
  let current=0;
  const show=index=>{
    clearScan();
    current=Math.max(0,Math.min(pages.length-1,index));
    equation.className='s19-equation';
    trace.className='s19-trace';
    track.style.transform=`translateX(-${current*100}%)`;
    pages.forEach((page,i)=>page.classList.toggle('active',i===current));
    dots.forEach((dot,i)=>dot.classList.toggle('active',i===current));
    prev.disabled=current===0;
    next.disabled=current===pages.length-1;
    void equation.offsetWidth;
    equation.classList.add(`stage-${current}`,'is-playing');
    trace.classList.add(`stage-${current}`,'is-playing');
    if(current===5) requestAnimationFrame(startFastScan);
  };
  prev.addEventListener('click',()=>show(current-1));
  next.addEventListener('click',()=>show(current+1));
  replay.addEventListener('click',()=>show(current));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
  show(0);
  const slide=document.getElementById('slide-context-update');
  if('IntersectionObserver' in window&&slide){
    let visibleBefore=false;
    new IntersectionObserver(entries=>{
      const visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.55;
      if(visible&&!visibleBefore) show(0);
      visibleBefore=visible;
    },{threshold:[.55]}).observe(slide);
  }
})();

// Slide 15: horizontal matrix/scatter explanation carousel.
(()=>{
  const carousel=document.getElementById('s14-carousel');
  const buttons=[...document.querySelectorAll('[data-s14-view]')];
  if(!carousel||!buttons.length) return;
  function select(index){
    carousel.scrollTo({left:carousel.clientWidth*index,behavior:'smooth'});
    buttons.forEach((button,i)=>button.classList.toggle('active',i===index));
  }
  buttons.forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.s14View))));
  let settle;
  carousel.addEventListener('scroll',()=>{
    clearTimeout(settle);
    settle=setTimeout(()=>{
      const index=Math.round(carousel.scrollLeft/Math.max(1,carousel.clientWidth));
      buttons.forEach((button,i)=>button.classList.toggle('active',i===index));
    },80);
  },{passive:true});
})();

// Slide 14: replay K transpose and Q × Kᵀ dot-product animation.
(()=>{
  const stage=document.getElementById('s13-animation');
  const replay=document.getElementById('s13-replay');
  if(!stage||!replay) return;
  const words=['I','ate','a','juicy','apple'];
  const scores=[
    [1.00,.42,.18,.35,.28],
    [.42,1.00,.22,.61,.49],
    [.18,.22,1.00,.27,.31],
    [.35,.61,.27,1.00,.78],
    [.28,.49,.31,.78,1.00]
  ];
  const rows=[...stage.querySelectorAll('.s13-row')];
  const cols=[...stage.querySelectorAll('.s13-columns i')];
  const cells=[...stage.querySelectorAll('.s13-score-grid i')];
  const qWord=document.getElementById('s13-q-word');
  const kWord=document.getElementById('s13-k-word');
  const formula=document.getElementById('s13-live-formula');
  const liveScore=document.getElementById('s13-live-score');
  let timers=[];
  const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
  function showPair(index){
    const r=Math.floor(index/5),c=index%5;
    rows.forEach((el,i)=>el.classList.toggle('target',i===r));
    cols.forEach((el,i)=>el.classList.toggle('target',i===c));
    cells.forEach(el=>el.classList.remove('current'));
    qWord.textContent=words[r]; kWord.textContent=words[c];
    formula.textContent=`q(${words[r]}) · k(${words[c]})`;
    liveScore.textContent=`= ${scores[r][c].toFixed(2)}`;
    const cell=cells[index];
    cell.textContent=scores[r][c].toFixed(2);
    cell.classList.add('computed','current');
    if(index<24) later(()=>showPair(index+1),index<4?720:190);
  }
  const play=()=>{
    timers.forEach(clearTimeout); timers=[];
    rows.forEach(el=>el.classList.remove('target'));
    cols.forEach(el=>el.classList.remove('target'));
    cells.forEach(el=>{el.classList.remove('computed','current');el.textContent='';});
    qWord.textContent='I'; kWord.textContent='I';
    formula.textContent='q(I) · k(I)'; liveScore.textContent='= 1.00';
    stage.classList.remove('is-playing');
    void stage.offsetWidth;
    stage.classList.add('is-playing');
    later(()=>showPair(0),3150);
  };
  replay.addEventListener('click',play);
  const slide=document.getElementById('slide-qkt');
  if('IntersectionObserver' in window&&slide){
    let visibleBefore=false;
    new IntersectionObserver(entries=>{
      const visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.55;
      if(visible&&!visibleBefore) play();
      visibleBefore=visible;
    },{threshold:[.55]}).observe(slide);
  }
})();

// Slide 13: replay the conceptual H → Q, K, V branching animation.
(()=>{
  const stage=document.getElementById('s12-animation');
  const replay=document.getElementById('s12-replay');
  if(!stage||!replay) return;
  const play=()=>{
    stage.classList.remove('is-playing');
    void stage.offsetWidth;
    stage.classList.add('is-playing');
  };
  replay.addEventListener('click',play);
  const slide=document.getElementById('slide-qkv');
  if('IntersectionObserver' in window&&slide){
    let wasVisible=false;
    new IntersectionObserver(entries=>{
      const visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.55;
      if(visible&&!wasVisible) play();
      wasVisible=visible;
    },{threshold:[.55]}).observe(slide);
  }
})();

// Slide 18: synchronize architecture, matrices, and formula highlights.
(()=>{
  const stage=document.getElementById('s18-animation');
  const prev=document.getElementById('s18-prev');
  const next=document.getElementById('s18-next');
  const number=document.getElementById('s18-step-number');
  const title=document.getElementById('s18-step-title');
  const caption=document.getElementById('s18-formula-caption');
  const phase=document.getElementById('s18-phase-label');
  const panel=stage?.closest('.s18-panel');
  const dots=[...document.querySelectorAll('.s18-progress button')];
  if(!stage||!prev||!next||!number||!title||!caption||!phase||!panel) return;
  const scenes=stage.querySelector('.s18-scenes');
  const branch=stage.querySelector('.s18-branch');
  const hMatrix=stage.querySelector('.s18-h-matrix');
  const qkvCards=[...stage.querySelectorAll('.s18-carry-qkv > div')];

  // Keep the branch attached to the rendered boxes instead of fixed SVG coordinates.
  function drawBranch(){
    if(!scenes||!branch||!hMatrix||qkvCards.length!==3) return;
    const root=scenes.getBoundingClientRect();
    const source=hMatrix.getBoundingClientRect();
    if(!root.width||!root.height||!source.width) return;
    branch.setAttribute('viewBox',`0 0 ${root.width} ${root.height}`);
    branch.setAttribute('preserveAspectRatio','none');
    const start={x:source.right-root.left,y:source.top+source.height/2-root.top};
    [...branch.querySelectorAll('path')].forEach((path,index)=>{
      const target=qkvCards[index].getBoundingClientRect();
      const end={x:target.left-root.left,y:target.top+target.height/2-root.top};
      const distance=Math.max(18,end.x-start.x);
      const bend=Math.min(72,distance*.48);
      path.setAttribute('d',`M${start.x} ${start.y} C${start.x+bend} ${start.y} ${end.x-bend} ${end.y} ${end.x} ${end.y}`);
    });
  }
  let branchFrame=0;
  function scheduleBranch(){
    cancelAnimationFrame(branchFrame);
    branchFrame=requestAnimationFrame(drawBranch);
  }
  const steps=[
    ['Create Q, K, and V','Q, K, and V enter the calculation as three learned views of the input.'],
    ['Compare every Query with every Key','QKᵀ is active; V waits until the attention weights are ready.'],
    ['Scale the dot-product scores','Dividing QKᵀ by √dₖ controls the score magnitude before softmax.'],
    ['Mask every future position','Future-token scores become −∞, so causal self-attention cannot look ahead.'],
    ['Normalize each row with softmax','Softmax converts each scaled score row into attention weights that sum to 1.'],
    ['Next: Use the weights to mix V','This final MatMul is what we explain next: the attention weights mix the Value vectors into contextualized output.']
  ];
  let current=0;
  function show(index){
    const previous=current;
    current=Math.max(0,Math.min(steps.length-1,index));
    if(current!==previous+1){
      stage.className='s18-columns';
      void stage.offsetWidth;
    }
    stage.className=`s18-columns stage-${current}`;
    const isNext=current===5;
    number.textContent=isNext?'NEXT · STEP 6 / 6':`RECAP · STEP ${current+1} / 5`;
    title.textContent=steps[current][0];
    caption.textContent=steps[current][1];
    phase.textContent=isNext?'WHAT COMES NEXT':'WHAT WE HAVE COVERED';
    panel.classList.toggle('is-next',isNext);
    dots.forEach((dot,i)=>dot.classList.toggle('active',i===current));
    prev.disabled=current===0;
    next.disabled=current===steps.length-1;
    scheduleBranch();
  }
  prev.addEventListener('click',()=>show(current-1));
  next.addEventListener('click',()=>show(current+1));
  dots.forEach((dot,index)=>dot.addEventListener('click',()=>show(index)));
  window.addEventListener('resize',scheduleBranch,{passive:true});
  if('ResizeObserver' in window&&scenes) new ResizeObserver(scheduleBranch).observe(scenes);
  scheduleBranch();
  const slide=document.getElementById('slide-attention-summary');
  if('IntersectionObserver' in window&&slide){
    let visibleBefore=false;
    new IntersectionObserver(entries=>{
      const visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.55;
      if(visible&&!visibleBefore) show(0);
      visibleBefore=visible;
    },{threshold:[.55]}).observe(slide);
  }
})();
