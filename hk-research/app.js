'use strict';

const $ = (id) => document.getElementById(id);
const escapeHTML = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data;
const state = {school:'cuhk', lab:'huang', topic:'全部', search:'', compare:['cuhk','cityu']};
const storageKey = 'hk-research-comparison-v1';
const safe = escapeHTML;
function external(url, label, cls='') {
  return `<a href="${safe(url)}" target="_blank" rel="noopener noreferrer"${cls ? ` class="${safe(cls)}"` : ''}>${safe(label)} ↗</a>`;
}
function sourceLink(id, label) {
  const s = data.sources[id];
  return s ? external(s.url, label || s.title) : '<span>来源待核</span>';
}
function searchable(s, l) {
  return [s.name,s.short,s.en,s.code,s.focus,s.program.title,s.program.dept,l.name,l.pi,l.question,...l.methods,...l.tags].join(' ').toLocaleLowerCase();
}
function matchingLabs(s) {
  const term=state.search.trim().toLocaleLowerCase();
  return s.labs.filter(l => (state.topic==='全部' || l.tags.includes(state.topic)) && (!term || searchable(s,l).includes(term)));
}
function matches() { return data.schools.filter(s=>matchingLabs(s).length); }
function currentSchool() { return data.schools.find(s=>s.id===state.school); }
function persistComparison() { try { localStorage.setItem(storageKey,JSON.stringify(state.compare)); } catch (_) { /* comparison still works without storage */ } }
function renderTopics() {
  $('topics').innerHTML=['全部',...data.topics].map(t=>`<button type="button" class="topic-button" data-topic="${safe(t)}" aria-pressed="${t===state.topic}">${safe(t)}</button>`).join('');
}
function renderSchools() {
  const schools=matches();
  const labCount=schools.reduce((n,s)=>n+matchingLabs(s).length,0);
  $('result-count').textContent=`${schools.length} 所大学 / ${labCount} 个实验室`;
  if (!schools.some(s=>s.id===state.school)) state.school=schools[0]?.id || '';
  $('empty').hidden=schools.length>0;
  $('path-view').hidden=schools.length===0;
  $('school-list').innerHTML=schools.map(s=>`<button class="school-button" type="button" data-school="${s.id}" aria-pressed="${s.id===state.school}" aria-label="${safe(s.name)}，QS 2027综合排名${safe(s.rankDisplay)}，展开研究路径"><span class="school-code">${safe(s.code)}</span><span class="school-name">${safe(s.short)}</span><span class="school-rank"><b>${safe(s.rankDisplay)}</b> QS 2027</span></button>`).join('');
  if(schools.length) renderPath();
}
function renderPath() {
  const s=currentSchool();
  const labs=matchingLabs(s);
  if(!labs.some(l=>l.id===state.lab)) state.lab=labs[0].id;
  const lab=labs.find(l=>l.id===state.lab);
  const selected=state.compare.includes(s.id);
  $('path-heading').innerHTML=`<p>${safe(s.focus)}</p><button type="button" class="compare-toggle" data-compare-school="${s.id}" aria-pressed="${selected}">${selected?'✓ 已加入比较':'＋ 加入横向比较'}</button>`;
  $('school-node').innerHTML=`<h3>${safe(s.name)}</h3><p class="node-english">${safe(s.en)}</p><p class="node-meta">QS 2027 综合 ${sourceLink(s.rankSource,s.rankDisplay)}${s.subject?`<br>${safe(s.subject.label)} ${sourceLink(s.subject.source,s.subject.rank)}`:''}</p>`;
  $('program-node').innerHTML=`<h3>${safe(s.program.title)}</h3><p>${safe(s.program.dept)}</p><p>${safe(s.program.route)}</p>`;
  $('lab-nodes').innerHTML=labs.map(l=>`<button type="button" class="lab-node" data-lab="${l.id}" aria-pressed="${l.id===state.lab}"><strong>${safe(l.pi)}</strong><span>${safe(l.name)}</span></button>`).join('');
  renderLab(lab);
  renderProgram(s);
  requestAnimationFrame(drawConnections);
}
function renderLab(lab) {
  $('lab-detail').innerHTML=`
    <div class="lab-top"><div><p class="lab-kicker">LAB / ${safe(currentSchool().code)}</p><h3>${safe(lab.pi)}</h3><p class="lab-en">${safe(lab.name)}</p><p class="position">${safe(lab.position)}</p></div><div class="lab-tags">${lab.tags.map(t=>`<span class="tag">${safe(t)}</span>`).join('')}</div></div>
    <p class="question">${safe(lab.question)}</p>
    <div class="lab-columns"><div><p class="detail-label">研究实力怎么看 / 证据摘要</p><h4 style="font-size:15px;margin-bottom:9px">${safe(lab.standing)}</h4><p>${safe(lab.evidence)}</p></div><div><p class="detail-label">进入实验室，可能学到什么</p><div class="method-list">${lab.methods.map(m=>`<span>${safe(m)}</span>`).join('')}</div><p>方法由公开研究线归纳，实际参与的设备、数据与课题需由导师确认。不能由论文数量或大学排名推定指导质量。</p></div></div>
    <div class="inference"><span class="label">C / 初步路径判断 · 不是录取预测</span><p><strong>适合的切入方式：</strong>${safe(lab.bridge)}</p><p><strong>要愿意投入的部分：</strong>${safe(lab.cost)}</p></div>
    <div class="projects-heading"><h4>把研究具象化：代表工作</h4><span>已有工作与项目示例，不是待分配博士课题</span></div>
    <div class="project-grid">${lab.projects.map(p=>`<section class="project"><div class="project-meta"><span class="project-status ${p.status==='预印本'?'preprint':''}">${safe(p.status)}</span><span>${safe(p.year)} · ${safe(p.venue)}</span></div><h4>${safe(p.title)}</h4><p><strong>问题：</strong>${safe(p.question)}</p><p><strong>做法：</strong>${safe(p.method)}</p><div class="project-source">${sourceLink(p.source,'查看研究来源')}</div><p class="reading">阅读深度：${safe(p.reading)}</p></section>`).join('')}</div>
    <div class="lab-bottom"><div class="recruitment"><p class="detail-label">公开招募信号</p><h4>${safe(lab.recruit.label)}</h4><p>${safe(lab.recruit.detail)}</p>${sourceLink(lab.recruit.source,'核对原始公告')}</div><div class="unknown"><h4>决定申请前，仍要问清</h4><ul>${lab.unknown.map(t=>`<li>${safe(t)}</li>`).join('')}</ul></div></div>
    <div class="timeline">${lab.timeline.map(t=>`<span>${safe(t)}</span>`).join('')}</div>
    <div class="lab-sources">${lab.sources.map(id=>sourceLink(id)).join('')}</div>`;
}
function renderProgram(s) {
  const p=s.program;
  $('program-content').innerHTML=`<div class="program-grid"><div><h4>学位与训练</h4><p>${safe(p.training)}</p></div><div><h4>资格门槛</h4><p>${safe(p.requirements)}</p></div><div><h4>申请材料与路径</h4><p>${safe(p.documents)}</p></div><div><h4>已核截止时间</h4>${p.deadlines.length?`<ul class="deadline-list">${p.deadlines.map(d=>`<li><strong>${safe(d.date)}</strong>${safe(d.label)}</li>`).join('')}</ul>`:'<p>本轮尚未逐项核定2027各轮日期；不能按其他学校或往届截止推算。</p>'}</div><div><h4>资助边界</h4><p>${safe(p.funding)}</p></div><div><h4>申请前的三项核查</h4><ul class="deadline-list">${p.gates.map(g=>`<li>${safe(g)}</li>`).join('')}</ul></div></div><div class="program-source">${[p.source,...(p.extraSources||[])].map(id=>sourceLink(id)).join('')}</div>`;
}
function drawConnections() {
  const svg=$('connections');
  if (!svg || window.innerWidth<=680 || $('path-view').hidden) { if(svg)svg.innerHTML=''; return; }
  const root=$('route').getBoundingClientRect();
  const school=$('school-node').getBoundingClientRect();
  const program=$('program-node').getBoundingClientRect();
  const curve=(a,b)=>{
    const x1=a.right-root.left, y1=a.top+a.height/2-root.top;
    const x2=b.left-root.left, y2=b.top+b.height/2-root.top;
    const mid=(x1+x2)/2;
    return `<path d="M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}"/>`;
  };
  svg.setAttribute('viewBox',`0 0 ${root.width} ${root.height}`);
  svg.innerHTML=curve(school,program)+[...$('lab-nodes').children].map(el=>curve(program,el.getBoundingClientRect())).join('');
}
function renderCompare() {
  $('compare-picker').innerHTML=data.schools.map(s=>`<label><input type="checkbox" value="${s.id}" ${state.compare.includes(s.id)?'checked':''}><span>${safe(s.short)}</span></label>`).join('');
  $('compare-status').textContent=`已选 ${state.compare.length} / 3 所学校。${state.compare.length===3?'已达到上限，移除一所即可更换。':'选择两所以上，便于对照研究与申请差异。'}`;
  const schools=state.compare.map(id=>data.schools.find(s=>s.id===id)).filter(Boolean);
  if (!schools.length) { $('compare-content').innerHTML='<p class="compare-empty">勾选上方学校，比较同一口径的排名、研究和申请路径。</p>'; return; }
  const rows=[
    ['大学综合排名',s=>`<span class="rank-number">${safe(s.rankDisplay)}</span>${sourceLink(s.rankSource,'QS 2027')}<small>大学整体；不代表认知/脑科学研究组名次</small>`],
    ['学科排名',s=>s.subject?`${sourceLink(s.subject.source,s.subject.rank)}<small>${safe(s.subject.label)}</small>`:'本轮未核同榜数据<small>不能解释为未上榜或学科较弱</small>'],
    ['实际学位',s=>`${safe(s.program.title)}<small>${safe(s.program.dept)}</small>`],
    ['本页研究组',s=>s.labs.map(l=>`<strong>${safe(l.pi)}</strong><small>${safe(l.question)}</small>`).join('<br>')],
    ['方法训练',s=>safe([...new Set(s.labs.flatMap(l=>l.methods))].join(' · '))],
    ['公开招募信号',s=>s.labs.map(l=>`${safe(l.pi)}<small>${safe(l.recruit.label)}</small>`).join('<br>')],
    ['最先核查的门槛',s=>`<ul>${s.program.gates.map(t=>`<li>${safe(t)}</li>`).join('')}</ul>`],
    ['已核2027截止',s=>s.program.deadlines.length?s.program.deadlines.map(d=>`${safe(d.date)}<small>${safe(d.label)}</small>`).join('<br>'):'本轮未核完整日期'],
    ['资助边界',s=>safe(s.program.funding)]
  ];
  $('compare-content').innerHTML=`<div class="table-scroll" tabindex="0" role="region" aria-label="学校比较表，可横向滚动"><table class="${schools.length===1?'one-col':schools.length===2?'two-col':''}"><caption>公开资料横向比较 · 核查至 ${safe(data.version)} · 手机可左右滑动</caption><thead><tr><th scope="col">比较维度</th>${schools.map(s=>`<th scope="col">${safe(s.short)}</th>`).join('')}</tr></thead><tbody>${rows.map(([name,fn])=>`<tr><th scope="row">${safe(name)}</th>${schools.map(s=>`<td>${fn(s)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const btn=document.querySelector('[data-compare-school]');
  if(btn) { const selected=state.compare.includes(btn.dataset.compareSchool);btn.setAttribute('aria-pressed',String(selected));btn.textContent=selected?'✓ 已加入比较':'＋ 加入横向比较'; }
}
function toggleCompare(id, checked) {
  if(checked && !state.compare.includes(id)) {
    if(state.compare.length>=3) {
      $('compare-status').textContent='最多比较三校。请先移除一所，再加入新的学校。';
      const checkbox=$('compare-picker').querySelector(`input[value="${id}"]`);if(checkbox)checkbox.checked=false;
      return;
    }
    state.compare.push(id);
  } else if(!checked) state.compare=state.compare.filter(x=>x!==id);
  persistComparison();renderCompare();
}
function reset() {
  state.topic='全部';state.search='';$('search').value='';renderTopics();renderSchools();
}
function renderSources() {
  const sources=Object.values(data.sources);
  $('source-count').textContent=`${sources.length} 个来源入口 · 记录阅读深度`;
  $('source-total').textContent=`${sources.length} SOURCES`;
  $('coverage-text').textContent=data.coverage;
  $('source-list').innerHTML=sources.map(s=>`<li id="source-${s.id}">${external(s.url,s.title)}<span>${safe(s.type)} · 核查 ${safe(s.checked)}<br>覆盖：${safe(s.coverage)}</span></li>`).join('');
}
function bindEvents() {
  $('topics').addEventListener('click',e=>{const b=e.target.closest('[data-topic]');if(!b)return;state.topic=b.dataset.topic;renderTopics();renderSchools();const replacement=[...$('topics').children].find(el=>el.dataset.topic===state.topic);replacement?.focus({preventScroll:true});});
  $('search').addEventListener('input',e=>{state.search=e.target.value;renderSchools();});
  $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',()=>{reset();$('search').focus({preventScroll:true});});
  $('school-list').addEventListener('click',e=>{const b=e.target.closest('[data-school]');if(!b)return;state.school=b.dataset.school;state.lab='';renderSchools();$('school-list').querySelector(`[data-school="${state.school}"]`)?.focus({preventScroll:true});});
  $('lab-nodes').addEventListener('click',e=>{const b=e.target.closest('[data-lab]');if(!b)return;state.lab=b.dataset.lab;renderPath();$('lab-nodes').querySelector(`[data-lab="${state.lab}"]`)?.focus({preventScroll:true});});
  $('path-heading').addEventListener('click',e=>{const b=e.target.closest('[data-compare-school]');if(b)toggleCompare(b.dataset.compareSchool,!state.compare.includes(b.dataset.compareSchool));});
  $('compare-picker').addEventListener('change',e=>{if(e.target.matches('input[type="checkbox"]')){const id=e.target.value;toggleCompare(id,e.target.checked);$('compare-picker').querySelector(`input[value="${id}"]`)?.focus({preventScroll:true});}});
  window.addEventListener('resize',drawConnections);
  document.fonts?.ready.then(drawConnections);
}
async function init() {
  try {
    const response=await fetch('data.json');
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    data=await response.json();
    try { const saved=JSON.parse(localStorage.getItem(storageKey));if(Array.isArray(saved))state.compare=[...new Set(saved.filter(id=>data.schools.some(s=>s.id===id)))].slice(0,3); } catch (_) { /* defaults remain */ }
    renderTopics();renderSchools();renderCompare();renderSources();bindEvents();
  } catch (error) {
    $('school-list').innerHTML='<div class="error" role="alert">资料暂未加载。请刷新页面，或查看下方GitHub公开数据。</div>';
    console.error('Research atlas loading failed:',error);
  }
}
init();
