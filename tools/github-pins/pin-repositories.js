/* Anmicky GitHub pins · one-time page tool · 2026-10-22
   Run only on https://github.com/Anmicky while signed in as Anmicky.
   Uses the current page's GitHub forms. No dependencies, API token or cookie export.
   Authenticated GitHub editor has not been end-to-end tested by the author.
*/
void (async function () {
  'use strict';
  const OWNER = 'Anmicky';
  const TARGETS = [
    {name: 'Dimensions-of-Vulnerability-in-Visual-Working-Memory', id: '1020161347', node: 'R_kgDOPM5tQw'},
    {name: 'anmicky.github.io', id: '1348188958', node: 'R_kgDOUFu7Hg'}
  ];
  const report = {tool: 'Anmicky pins 2026-10-22', stage: '检查页面', selectionSaved: false, orderSaved: false, ok: false};
  let panel, ownsLock = false;
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const visible = el => !!el && el.getClientRects().length > 0 && !el.closest('[hidden], [inert]');
  const fail = message => {throw new Error(message);};
  const say = message => {
    if (!panel) {
      document.getElementById('anmicky-pin-tool')?.remove();
      panel = document.createElement('section'); panel.id = 'anmicky-pin-tool';
      panel.setAttribute('role', 'status'); panel.setAttribute('aria-live', 'polite');
      Object.assign(panel.style, {position:'fixed',right:'16px',bottom:'16px',zIndex:'2147483647',width:'min(420px,calc(100vw - 32px))',background:'#fff',color:'#172c42',border:'1px solid #527e94',borderRadius:'10px',padding:'18px',font:'14px/1.65 system-ui,sans-serif',boxShadow:'0 8px 30px #0002',whiteSpace:'pre-wrap'});
      document.body.append(panel);
    }
    panel.textContent = 'GitHub 仓库置顶\n' + message;
  };
  const account = doc => doc.querySelector('meta[name="user-login"]')?.content || '';
  const sameAccount = doc => {
    if (account(doc).toLowerCase() !== OWNER.toLowerCase()) fail('当前登录账号无法确认为 Anmicky；已停止。请在已登录的本人主页运行。');
  };
  const formURL = form => {
    const raw = form.getAttribute('action'); if (!raw) fail('表单没有可核对的提交地址，已停止。');
    const url = new URL(raw, location.href);
    if (url.origin !== 'https://github.com' || !/^\//.test(url.pathname)) fail('表单提交地址不是 GitHub，已停止。');
    if ((form.getAttribute('method') || 'get').toLowerCase() !== 'post') fail('表单不是预期的 POST 提交，已停止。');
    if (!form.querySelector('input[name="authenticity_token"]')?.value) fail('没有找到 GitHub 当前表单的校验字段，已停止。');
    return url.href;
  };
  const waitFor = async fn => {
    const until = Date.now() + 16000;
    while (Date.now() < until) { const value = fn(); if (value) return value; await new Promise(r => setTimeout(r, 150)); }
    fail('等待 GitHub 置顶编辑界面超时；已停止，未猜测接口。');
  };
  const isSave = el => /^(save pins|save pinned items|保存置顶|保存置顶项目)$/i.test(norm(el.value || el.textContent));
  const chooseEditor = () => {
    const candidates = [...document.forms].map(form => ({form, button:[...form.querySelectorAll('button,input[type="submit"]')].find(el => visible(el) && isSave(el))})).filter(x => x.button && x.form.querySelector('input[type="checkbox"]'));
    if (candidates.length > 1) fail('发现多个置顶编辑表单，无法安全选择，已停止。');
    return candidates[0] || null;
  };
  const valueMatches = (value, target) => value === target.id || value === target.node || new RegExp('^(?:repository|repo)[:_-]' + target.id + '$', 'i').test(value);
  const checkboxMatches = (box, target) => {
    if (valueMatches(box.value, target)) return true;
    const labels = [...(box.labels || [])];
    const row = box.closest('li,.Box-row,.form-checkbox,label'); if (row) labels.push(row);
    const slug = (OWNER + '/' + target.name).toLowerCase();
    return labels.some(el => [...el.querySelectorAll('a[href]')].some(a => {
      const u = new URL(a.getAttribute('href'), location.href); return u.origin === location.origin && u.pathname.replace(/\/$/,'').toLowerCase() === '/' + slug;
    }));
  };
  const request = async (url, options) => {
    if (new URL(url, location.href).origin !== 'https://github.com') fail('请求目标不是 GitHub，已停止。');
    const response = await fetch(url, Object.assign({credentials:'same-origin',cache:'no-store',redirect:'follow'}, options));
    if (!response.ok || new URL(response.url || url, location.href).origin !== 'https://github.com' || /\/(login|session|sessions|two-factor)(?:\/|$)/.test(new URL(response.url || url, location.href).pathname)) fail('GitHub 请求未成功或需要重新登录，已停止。');
    return response;
  };
  const submit = async (form, submitter) => {
    const url = formURL(form), data = new FormData(form);
    if (submitter?.name && !data.has(submitter.name)) data.append(submitter.name, submitter.value || submitter.textContent || '');
    // This is the current GitHub page form, including its existing CSRF field.
    await request(url, {method:'POST',body:data,headers:{Accept:'text/html','X-Requested-With':'XMLHttpRequest','GitHub-Verified-Fetch':'true'}});
  };
  const freshProfile = async () => {
    const response = await request('https://github.com/' + OWNER, {headers:{Accept:'text/html'}});
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html'); sameAccount(doc); return doc;
  };
  const repoOf = row => {
    const matches = TARGETS.filter(target => [...row.querySelectorAll('a[href]')].some(a => new URL(a.getAttribute('href'), location.href).pathname.replace(/\/$/,'').toLowerCase() === '/' + (OWNER + '/' + target.name).toLowerCase()));
    return matches.length === 1 ? matches[0] : null;
  };
  const readPins = doc => {
    const list = doc.querySelector('.js-pinned-items-reorder-list');
    if (!list) fail('GitHub 没有返回可核对的原生置顶列表；请手动刷新确认，勿把本次当作成功。');
    const rows = [...list.children].filter(el => el.tagName === 'LI');
    if (rows.length !== 2 || rows.some(row => !repoOf(row))) fail('保存后列表不是预期的两个仓库，已停止后续排序。');
    return {list, rows, names:rows.map(row => repoOf(row).name)};
  };
  try {
    if (location.origin !== 'https://github.com' || location.pathname.replace(/\/$/,'').toLowerCase() !== '/anmicky') fail('请在 https://github.com/Anmicky 的本人主页运行，当前页面未作修改。');
    if (window.__anmickyPinToolRunning) fail('已有一次操作正在进行，请不要重复运行。');
    sameAccount(document); window.__anmickyPinToolRunning = true; ownsLock = true;
    say('正在检查原生置顶编辑界面……');
    let editor = chooseEditor();
    if (!editor) {
      const nodes = [...document.querySelectorAll('button,a,summary')].filter(el => visible(el) && /^(customize (?:your )?pins|edit pinned items|自定义置顶|编辑置顶项目)$/i.test(norm(el.textContent)));
      if (nodes.length !== 1) fail('没有找到唯一的 Customize your pins 按钮。请先手动打开该窗口，再运行脚本。');
      nodes[0].click(); editor = await waitFor(chooseEditor);
    }
    const {form} = editor; formURL(form);
    const boxes = [...form.querySelectorAll('input[type="checkbox"]')];
    const targets = TARGETS.map(target => {
      const found = boxes.filter(box => checkboxMatches(box, target));
      if (found.length !== 1) fail('无法唯一识别仓库 ' + target.name + '，没有提交任何选择。');
      return found[0];
    });
    if (!targets[0].name || targets[0].name !== targets[1].name) fail('两个仓库的表单字段不一致，已停止。');
    const choices = boxes.filter(box => box.name === targets[0].name);
    if (choices.some(box => !box.value)) fail('存在无法核对的置顶候选项，已停止。');
    const changes = choices.filter(box => box.checked !== targets.includes(box));
    if (changes.some(box => box.disabled)) fail('所需选项不可操作，已停止。');
    report.stage = '保存两个仓库'; say('已确认账号与两个仓库。\n正在保存论文仓库和个人网站……');
    for (const box of changes.filter(box => box.checked)) box.click();
    for (const box of changes.filter(box => !box.checked && targets.includes(box))) box.click();
    if (choices.some(box => box.checked !== targets.includes(box))) fail('页面未保持预期勾选状态，未提交。');
    if (changes.length) { await submit(form, editor.button); report.selectionSaved = true; }
    let doc = await freshProfile(), pins = readPins(doc);
    if (pins.names.join('|') !== TARGETS.map(x => x.name).join('|')) {
      report.stage = '调整顺序'; say('两个仓库已保存。\n正在把论文排到第一位……');
      const reorderForm = pins.list.closest('form.js-pinned-items-reorder-form');
      if (!reorderForm || pins.rows.some(row => !row.querySelector('input[name]'))) fail('置顶选择可能已保存，但排序表单结构不匹配；请手动调整顺序。');
      formURL(reorderForm);
      for (const target of TARGETS) pins.list.append(pins.rows.find(row => repoOf(row).name === target.name));
      await submit(reorderForm); report.orderSaved = true;
      doc = await freshProfile(); pins = readPins(doc);
    }
    if (pins.names.join('|') !== TARGETS.map(x => x.name).join('|')) fail('GitHub 回读的顺序仍不正确，不能确认完成。');
    report.ok = true; report.stage = '完成'; report.pins = pins.names;
    say('完成：GitHub 回读已确认\n1. 论文仓库\n2. anmicky.github.io\n\n请刷新主页查看。回到聊天告诉我“已运行”，我会再独立核验。');
  } catch (error) {
    report.error = error.message || String(error); report.failedStage = report.stage; report.stage = '停止';
    say('已停止：' + report.error + '\n\n' + (report.selectionSaved ? '两个仓库的选择已提交；后续步骤未全部确认。' : '脚本未确认操作成功。') + '\n请把这段提示告诉我。');
  } finally {
    window.__anmickyPinToolResult = report;
    if (ownsLock) window.__anmickyPinToolRunning = false;
    console.info('[Anmicky pins]', JSON.stringify(report));
  }
})();
