'use strict';
const DATA=JSON.parse(document.getElementById('graph-data').textContent);
const ITEMS=DATA.items,PAPERS=DATA.papers;
const groupNames={Appraisal:'CPM · 评价',Motivation:'CPM · 动机',Expression:'CPM · 表达',Feeling:'CPM · 主观感受',Physiology:'CPM · 生理感受','Discrete Emotion':'离散情绪'};
const order=['Appraisal','Motivation','Expression','Feeling','Physiology','Discrete Emotion'];
const sources=document.getElementById('sources'),studies=document.getElementById('studies'),canvas=document.getElementById('canvas'),edges=document.getElementById('edges');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active='all';
function source(id,title,description){return `<div class="source" id="source-${id}" data-source="${id}"><strong>${esc(title)}</strong><small>${esc(description)}</small></div>`;}
sources.innerHTML=source('fmri','fMRI · 30人观看14部电影','BOLD脑活动，TR=1.3秒；另有静息态。各论文按自身标准处理或排除。')+'<div class="data-heading">50项连续共识评分 <small>· 14部电影 · 1 Hz</small></div>'+order.map(g=>{
 const list=ITEMS.filter(i=>i.group===g);
 return `<section class="group" data-group="${g}" id="group-${g.replaceAll(' ','-')}"><div class="group-header"><span>${groupNames[g]}</span><span>${list.length}项</span></div><div class="items-grid">${list.map(i=>`<button class="item" data-item="${i.id}" aria-label="查看${esc(i.cn)}的量尺和原始说明"><span class="cn">${esc(i.cn)}</span><span class="en">${i.id}</span></button>`).join('')}</div></section>`;
}).join('')+'<div class="data-heading">其他可复用数据</div>'+source('physiology','实际生理记录','脉搏、呼吸、皮电；与上方的主观生理感觉分开。')+source('questionnaires','个体差异问卷','大五人格、焦虑等问卷分数；不是连续的50项情绪评分。')+source('video','电影画面','实际视听刺激；视觉建模研究另提取图像帧。');
studies.innerHTML=PAPERS.map((p,n)=>{
 const top=105+n*305;
 return `<button class="paper" data-paper="${p.id}" id="paper-${p.id}" style="top:${top}px" aria-pressed="false"><span class="year">${esc(p.year)}</span><h2>${esc(p.label)}</h2><span class="english">${esc(p.english)}</span><p class="selection">${esc(p.selection)}</p><p class="method">${esc(p.method)}</p></button><article class="result" data-result="${p.id}" style="top:${top}px"><h3>这项分析支持的判断</h3><p class="finding">${esc(p.finding)}</p><p class="metric">${esc(p.metric)}</p><p class="caution">${esc(p.caution)}</p><a class="read-link" href="#reading" data-read="${p.id}">阅读这篇的完整解释 ↓</a></article>`;
}).join('');
const controls=document.getElementById('controls');
for(const p of [...PAPERS].reverse()){
 const b=document.createElement('button');b.dataset.select=p.id;b.setAttribute('aria-pressed','false');b.textContent=p.label;controls.children[0].after(b);
}
const selected=(p,i)=>p.all_items||p.select.includes(i.id);
function select(id){
 active=id;const p=PAPERS.find(p=>p.id===id);document.getElementById('read-current').hidden=!p;
 for(const b of document.querySelectorAll('[data-select]'))b.setAttribute('aria-pressed',String(b.dataset.select===id));
 for(const b of document.querySelectorAll('[data-paper]')){
  b.classList.toggle('active',id===b.dataset.paper);b.classList.toggle('dimmed',id!=='all'&&id!==b.dataset.paper);b.setAttribute('aria-pressed',String(id===b.dataset.paper));
 }
 for(const r of document.querySelectorAll('[data-result]')){r.classList.toggle('active',id===r.dataset.result);r.classList.toggle('dimmed',id!=='all'&&id!==r.dataset.result);}
 for(const el of document.querySelectorAll('[data-item]')){
  const i=ITEMS.find(i=>i.id===el.dataset.item),yes=!!p&&selected(p,i),target=yes&&((p.id==='appraisal'&&i.system==='Discrete')||p.id==='map');
  el.classList.toggle('active',yes);el.classList.toggle('target',target);el.classList.toggle('dimmed',!!p&&!yes);
 }
 for(const el of document.querySelectorAll('[data-group]'))el.classList.toggle('dimmed',!!p&&!ITEMS.some(i=>i.group===el.dataset.group&&selected(p,i)));
 for(const el of document.querySelectorAll('[data-source]')){const yes=!!p&&p.source.includes(el.dataset.source);el.classList.toggle('active',yes);el.classList.toggle('dimmed',!!p&&!yes);}
 renderReading(p);draw();if(history.replaceState)history.replaceState(null,'',id==='all'?location.pathname:'#'+id);
}
function renderReading(p){
 const el=document.getElementById('reading');
 if(!p){el.innerHTML='<div class="eyebrow">READ THE CONNECTIONS</div><h2>先选一篇论文，沿引线看它实际使用的数据。</h2><p>总览完整保留50项。选中论文后，未使用的项目变淡；橙色标出成分分析和认知地图研究中作为预测对象的评分。每行右侧给出结果与解释边界，完整方法和来源会在这里展开。</p><p>例如：<b>情绪认知地图</b>只选了13项离散情绪和4项主观感受；<b>脑—心耦合</b>使用的是仪器记录的心率，并没有使用上方的Heartrate自报评分。</p>';return;}
 el.innerHTML=`<div class="eyebrow">SELECTED STUDY · ${esc(p.route)}</div><h2>${esc(p.title)}</h2><p class="status">${esc(p.year)} · ${esc(p.status)}</p><p class="question">${esc(p.question)}</p><dl><dt>选取的数据</dt><dd>${esc(p.data)}</dd><dt>分析怎么做</dt><dd>${esc(p.analysis)}</dd><dt>得到的结果</dt><dd>${esc(p.result)}</dd></dl><p class="boundary"><b>解读边界：</b>${esc(p.boundary)}</p><p class="status">核对位置：${esc(p.anchor)}</p><p><a href="${esc(p.url)}" target="_blank" rel="noopener">原始论文／作者公开稿 ↗</a>${p.extra?` · <a href="${esc(p.extra)}" target="_blank" rel="noopener">另核对的公开来源 ↗</a>`:''}</p>`;
}
function draw(){
 canvas.style.height=Math.max(1970,sources.offsetHeight+135)+'px';
 const cr=canvas.getBoundingClientRect(),scale=cr.width/canvas.offsetWidth;
 const box=el=>{const r=el.getBoundingClientRect();return {left:(r.left-cr.left)/scale,right:(r.right-cr.left)/scale,top:(r.top-cr.top)/scale,height:r.height/scale,cy:(r.top-cr.top+r.height/2)/scale};};
 edges.setAttribute('viewBox',`0 0 ${canvas.offsetWidth} ${canvas.offsetHeight}`);
 let s='<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#527e94"/></marker></defs>';
 for(const p of PAPERS){
  if(active!=='all'&&active!==p.id)continue;
  const target=box(document.getElementById('paper-'+p.id)),selectedGroups=order.filter(g=>ITEMS.some(i=>i.group===g&&selected(p,i)));
  const inputs=[...selectedGroups.map(g=>({el:document.getElementById('group-'+g.replaceAll(' ','-')),label:ITEMS.filter(i=>i.group===g&&selected(p,i)).length+'项',target:(p.id==='map'||(p.id==='appraisal'&&g==='Discrete Emotion'))})),...p.source.filter(x=>x!=='annotations').map(id=>({el:document.getElementById('source-'+id),label:'',target:false}))];
  inputs.forEach((input,n)=>{
   const a=box(input.el),ty=target.top+55+n*Math.min(20,150/Math.max(1,inputs.length-1)),color=input.target?'#b58d67':'#527e94';
   s+=`<path data-edge-paper="${p.id}" d="M${a.right+2},${a.cy} C${a.right+65},${a.cy} ${target.left-62},${ty} ${target.left-3},${ty}" fill="none" stroke="${color}" stroke-width="${active==='all'?1.35:2}" opacity="${active==='all'?.22:.82}"/>`;
   if(active!=='all'&&input.label)s+=`<text x="${a.right+8}" y="${a.cy-8}" fill="${color}" font-family="Atlas,sans-serif" font-size="12">${input.label}</text>`;
  });
  const output=box(document.querySelector(`[data-result="${p.id}"]`));
  s+=`<path d="M${target.right+3},${target.cy} C${target.right+38},${target.cy} ${output.left-38},${output.cy} ${output.left-7},${output.cy}" stroke="#527e94" stroke-width="${active==='all'?1.5:2.3}" fill="none" marker-end="url(#arrow)"/>`;
 }
 edges.innerHTML=s;
}
function showItem(id){
 const i=ITEMS.find(i=>i.id===id);document.getElementById('item-content').innerHTML=`<div class="eyebrow">${esc(groupNames[i.group])} · ${i.id}</div><h2>${esc(i.cn)}</h2><p class="poles">${esc(i.lower_cn)} ↔ ${esc(i.upper_cn)}</p><p>量尺判读：<b>${i.scale.startsWith('B')?'双极':'单极'}${i.scale.includes('*')?'，需保留解释条件':''}</b>。图中低值到高值从左到右；这里的箭头仅表示同一滑杆的两端。</p><p class="raw">补表原始端点：${esc(i.lower_original)} → ${esc(i.upper_original)}</p>${i.note?`<p>${esc(i.note)}</p>`:''}<blockquote>${esc(i.instructions)}</blockquote><p class="raw">扫描组48项片后验证：${i.validation_included?'包含':'未包含'}。该项属于预设测量项目，不是从数据中发现的独立潜在维度。</p><a href="reference.html#${i.id}" target="_blank" rel="noopener">查看逐项核对表 ↗</a>`;document.getElementById('item-dialog').showModal();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-select],[data-paper],[data-item],[data-read]');if(!b)return;
 if(b.dataset.select)select(b.dataset.select);else if(b.dataset.paper)select(b.dataset.paper);else if(b.dataset.item)showItem(b.dataset.item);else if(b.dataset.read){e.preventDefault();select(b.dataset.read);document.getElementById('reading').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
});
document.getElementById('close-dialog').onclick=()=>document.getElementById('item-dialog').close();
document.getElementById('item-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){let r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();}});
document.getElementById('read-current').onclick=()=>document.getElementById('reading').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
document.getElementById('actual').onclick=()=>{canvas.style.zoom='1';draw();};
function fit(){canvas.style.zoom=Math.min(1,(document.getElementById('viewport').clientWidth-10)/1480);draw();}
document.getElementById('fit').onclick=fit;
window.addEventListener('resize',()=>requestAnimationFrame(draw));
document.fonts.ready.then(()=>{select(PAPERS.some(p=>p.id===location.hash.slice(1))?location.hash.slice(1):'all');if(innerWidth>=900)fit();else draw();});
