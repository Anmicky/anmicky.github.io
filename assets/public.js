(() => {
'use strict';
const toggle=document.querySelector('#lang-toggle');
let lang='en'; try{const stored=localStorage.getItem('site-lang');if(['en','zh'].includes(stored))lang=stored;}catch(e){}
let topics=[];
function renderMap(){const parent=document.querySelector('#map-content');if(!parent)return;parent.replaceChildren();const grid=document.createElement('div');grid.className='map-grid';topics.forEach(topic=>{const detail=document.createElement('details');detail.className='map-topic';const summary=document.createElement('summary');summary.textContent=topic[lang];const text=document.createElement('p');text.textContent=topic['summary_'+lang];detail.append(summary,text);grid.append(detail)});parent.append(grid);}
function apply(){document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.querySelectorAll('[data-en][data-zh]').forEach(el=>{el.textContent=el.dataset[lang]});toggle.textContent=lang==='en'?'中文':'EN';toggle.setAttribute('aria-label',lang==='en'?'Switch to Chinese':'切换到英文');renderMap();document.querySelector('#cite-feedback').textContent='';}
toggle.addEventListener('click',()=>{lang=lang==='en'?'zh':'en';try{localStorage.setItem('site-lang',lang)}catch(e){}apply()});apply();
fetch('research_overview.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(data=>{topics=data.topics;renderMap()}).catch(()=>{document.querySelector('#map-content').textContent=lang==='en'?'The overview above includes these research topics.':'上面的研究经历已包含这些主题。'});
const citation='Cao, Y., Zou, J., Wei, C., & Liu, Q. (2025). Dimensions of Vulnerability in Visual Working Memory: An AI-Driven Approach to Perceptual Comparison. Proceedings of the Annual Meeting of the Cognitive Science Society, 47.';
document.querySelector('#cite-button').addEventListener('click',async()=>{const status=document.querySelector('#cite-feedback');try{await navigator.clipboard.writeText(citation);status.textContent=lang==='en'?'Citation copied.':'已复制引用。'}catch(e){status.textContent=citation}});
})();
