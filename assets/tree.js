/* ============================================================
   Radial research-tree renderer (D3 v7)
   Design: growth-rings / Image Wheels motif.
   Data schema (JSON):
     { meta:{...}, root:{ id, type, label:{zh,en}, summary:{zh,en},
       status?:{zh,en}, dates?:{zh,en}, links?:[{label,url}],
       files?:[{label,path}], lessons?:[..], todos?:[..], notes?:[..],
       children?:[ ...same... ] } }
   ============================================================ */
(function () {
  'use strict';

  var TYPE_COLOR = {
    root: '#0f1b2d', research_line: '#2f55d4', project: '#0d9488',
    paper: '#7c3aed', method: '#d97706', experiment: '#0891b2',
    finding: '#b45309', skill: '#3f6212', achievement: '#a16207',
    direction: '#64748b', education: '#475569',
    lesson: '#b91c1c', todo: '#78716c', contact: '#be185d',
    file: '#92400e', default: '#94a3b8'
  };
  var TYPE_LABEL = {
    en: { root: 'Root', research_line: 'Research line', project: 'Project', paper: 'Publication', method: 'Method', experiment: 'Experiment', finding: 'Finding', skill: 'Skill', achievement: 'Achievement', direction: 'Direction', education: 'Education', lesson: 'Lesson', todo: 'To do', contact: 'Contact', file: 'File', default: 'Node' },
    zh: { root: '根', research_line: '研究线', project: '项目', paper: '论文', method: '方法', experiment: '实验', finding: '发现', skill: '技能', achievement: '成就', direction: '方向', education: '教育', lesson: '教训', todo: '待办', contact: '联系', file: '文件', default: '节点' }
  };
  var FALLBACK_STR = {
    en: { links: 'Links', files: 'Files', lessons: 'Lessons', todos: 'To do', notes: 'Notes', children: 'Contains', hint: 'Click a node · expand branches · search to focus' },
    zh: { links: '链接', files: '文件', lessons: '教训', todos: '待办', notes: '备注', children: '包含', hint: '点击节点 · 展开分支 · 搜索聚焦' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pick(obj, lang) { return (obj && obj[lang]) || (obj && obj.en) || (obj && obj.zh) || String(obj || ''); }
  function hasKids(d) { return d.children && d.children.length; }

  window.TreeTypes = { colors: TYPE_COLOR, labels: TYPE_LABEL };

  window.RenderTree = function (opts) {
    var svg = d3.select(opts.container);
    var detailEl = document.querySelector(opts.detail);
    var langFn = opts.lang || function () { return 'en'; };
    var dataUrl = opts.dataUrl;
    var RADIUS = 300;
    var root = null;
    var query = '';
    var first = true;

    var g = svg.append('g');
    var zoom = d3.zoom().scaleExtent([0.25, 3]).on('zoom', function (ev) {
      g.attr('transform', ev.transform);
    });
    svg.call(zoom).on('dblclick.zoom', null);
    svg.on('click', function () { if (root) showDetail(root); });

    function colorOf(d) { return TYPE_COLOR[d.data.type] || TYPE_COLOR.default; }
    function nodeRadius(d) {
      var base = d.depth === 0 ? 9 : d.depth === 1 ? 7 : 4.5;
      return base + (hasKids(d) ? 2 : 0);
    }
    function t(key) {
      var lang = langFn();
      if (window.I18N && window.I18N.t) {
        var v = window.I18N.t(key);
        if (v !== key) return v;
      }
      return (FALLBACK_STR[lang] && FALLBACK_STR[lang][key]) || key;
    }
    function typeLabel(type, lang) {
      var m = TYPE_LABEL[lang] || TYPE_LABEL.en;
      return m[type] || m.default;
    }

    function relayout() {
      root.each(function (d) {
        d._visible = (d === root) || (d.parent._visible && d.parent._expanded);
      });
      var vis = root.descendants().filter(function (d) { return d._visible; });
      var rootId = root.data._id;
      var map = new Map();
      vis.forEach(function (d) { map.set(d.data._id, { orig: d, children: [] }); });
      vis.forEach(function (d) {
        if (d !== root) {
          var p = map.get(d.parent.data._id);
          if (p) p.children.push(map.get(d.data._id));
        }
      });
      var h = d3.hierarchy({ id: rootId, children: [map.get(rootId)] }, function (d) {
        return d.children && d.children.length ? d.children : null;
      });
      var laid = d3.tree().size([2 * Math.PI, RADIUS])(h);
      laid.descendants().forEach(function (n) {
        var o = n.data.orig;
        o._angle = n.x; o._radius = n.y;
      });
      return vis;
    }

    function pos(d) { return [d._radius * Math.sin(d._angle), -d._radius * Math.cos(d._angle)]; }

    function redraw() {
      var vis = relayout();
      var linkGen = d3.linkRadial().angle(function (d) { return d.x; }).radius(function (d) { return d.y; });
      var links = vis.filter(function (d) { return d !== root; }).map(function (d) {
        return { source: d.parent, target: d };
      });

      var link = g.selectAll('path.tree-link').data(links, function (d) { return d.target.data._id; });
      link.exit().remove();
      link.enter().append('path').attr('class', 'tree-link')
        .merge(link)
        .attr('d', function (d) {
          return linkGen({
            source: { x: d.source._angle, y: d.source._radius },
            target: { x: d.target._angle, y: d.target._radius }
          });
        })
        .attr('class', function (d) { return 'tree-link' + (d.target._matched ? ' hot' : ''); });

      var node = g.selectAll('g.tree-node').data(vis, function (d) { return d.data._id; });
      node.exit().remove();
      var nodeEnter = node.enter().append('g').attr('class', 'tree-node');
      nodeEnter.each(function () {
        var el = d3.select(this);
        el.append('circle').attr('r', 0);
        el.append('circle').attr('class', 'ring-hint');
        el.append('text').attr('class', 'tree-node-label');
      });
      var merged = nodeEnter.merge(node);
      var labelBudget = vis.length <= 60;

      merged.each(function (d) {
        var el = d3.select(this);
        var p = pos(d);
        var r = nodeRadius(d);
        el.attr('transform', 'translate(' + p[0] + ',' + p[1] + ')');
        el.select('circle:first-of-type')
          .attr('r', r)
          .attr('fill', colorOf(d));
        el.select('circle.ring-hint')
          .attr('r', r + 4.5)
          .style('display', hasKids(d) ? null : 'none');
        var showLabel = labelBudget || d.depth <= 1 || d._matched;
        var flip = Math.cos(d._angle) < 0;
        el.select('text')
          .attr('class', 'tree-node-label' + (d._matched ? '' : ' dim'))
          .attr('x', showLabel ? (flip ? -(r + 7) : (r + 7)) : 0)
          .attr('y', 3)
          .attr('text-anchor', flip ? 'end' : 'start')
          .text(showLabel ? pick(d.data.label, langFn()) : '')
          .style('font-weight', d._matched ? 600 : 400);
        el.classed('matched', !!d._matched);
        el.on('click', function (ev) {
          ev.stopPropagation();
          if (hasKids(d)) {
            d._expanded = !d._expanded;
            redraw();
          }
          showDetail(d);
        });
      });

      if (first) {
        first = false;
        g.selectAll('.tree-link, .tree-node')
          .attr('opacity', 0)
          .transition().duration(500)
          .attr('opacity', 1);
      }
    }

    function showDetail(d) {
      if (!detailEl) return;
      var lang = langFn();
      var altLang = lang === 'en' ? 'zh' : 'en';
      var data = d.data;
      var html = '';
      html += '<span class="p-type">' + esc(typeLabel(data.type, lang)) + '</span>';
      html += '<h4>' + esc(pick(data.label, lang)) + '</h4>';
      var altLabel = pick(data.label, altLang);
      if (altLabel && altLabel !== pick(data.label, lang)) {
        html += '<p class="p-alt">' + esc(altLabel) + '</p>';
      }
      if (data.status) html += '<span class="p-status">' + esc(pick(data.status, lang)) + '</span>';
      if (data.dates) html += '<p class="p-alt">' + esc(pick(data.dates, lang)) + '</p>';
      if (data.summary) {
        html += '<p class="p-summary">' + esc(pick(data.summary, lang)) + '</p>';
        var altSum = pick(data.summary, altLang);
        if (altSum && altSum !== pick(data.summary, lang)) {
          html += '<p class="p-alt-summary">' + esc(altSum) + '</p>';
        }
      }
      if (data.links && data.links.length) {
        html += '<h5>' + esc(t('links')) + '</h5><ul>';
        data.links.forEach(function (l) {
          html += '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a></li>';
        });
        html += '</ul>';
      }
      if (data.files && data.files.length) {
        html += '<h5>' + esc(t('files')) + '</h5><ul>';
        data.files.forEach(function (f) {
          html += '<li class="p-file">' + esc(f.path || f) + (f.label ? ' — ' + esc(f.label) : '') + '</li>';
        });
        html += '</ul>';
      }
      if (data.lessons && data.lessons.length) {
        html += '<h5>' + esc(t('lessons')) + '</h5><ul>';
        data.lessons.forEach(function (x) { html += '<li>' + esc(pick(x, lang)) + '</li>'; });
        html += '</ul>';
      }
      if (data.todos && data.todos.length) {
        html += '<h5>' + esc(t('todos')) + '</h5><ul>';
        data.todos.forEach(function (x) { html += '<li>' + esc(pick(x, lang)) + '</li>'; });
        html += '</ul>';
      }
      if (data.notes && data.notes.length) {
        html += '<h5>' + esc(t('notes')) + '</h5><p class="p-summary">';
        data.notes.forEach(function (x, i) {
          if (i) html += '<br>';
          html += esc(pick(x, lang));
        });
        html += '</p>';
      }
      if (hasKids(d)) {
        html += '<h5>' + esc(t('children')) + '</h5><ul>';
        d.children.forEach(function (c) {
          html += '<li>' + esc(pick(c.data.label, lang)) + '</li>';
        });
        html += '</ul>';
      }
      if (!html) html = '<p class="p-empty">—</p>';
      detailEl.innerHTML = html;
    }

    function setQuery(q) {
      query = (q || '').trim().toLowerCase();
      root.each(function (d) {
        d._matched = false;
        if (query) {
          var hay = [pick(d.data.label, 'zh'), pick(d.data.label, 'en'),
            pick(d.data.summary, 'zh'), pick(d.data.summary, 'en'), d.data.type]
            .join(' ').toLowerCase();
          if (hay.indexOf(query) !== -1) {
            d._matched = true;
            var p = d;
            while (p) { p._expanded = true; p = p.parent; }
          }
        }
      });
      redraw();
    }

    fetch(dataUrl)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        root = d3.hierarchy(data.root, function (d) { return hasKids(d) ? d.children : null; });
        var i = 0;
        root.descendants().forEach(function (d) {
          if (!d.data._id) d.data._id = 'n' + (i++);
          d._expanded = d.depth <= 1;
          d._matched = false;
        });
        redraw();
        showDetail(root);
      })
      .catch(function (e) {
        if (detailEl) detailEl.innerHTML = '<p class="p-empty">' + esc(e.message) + '</p>';
      });

    return { setLang: redraw, setQuery: setQuery };
  };
})();
