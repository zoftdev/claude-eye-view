    /* ============================================================
       Hover explain (claude-eye-view mod) — show a node's authored explanation on
       pointer hover or keyboard focus, no click. The box sits in the
       viewport corner farthest from the node and skips any corner whose
       box would cover the node.
       ============================================================ */
    Archify.hoverExplain = (function () {
      var container = document.querySelector('.diagram-container');
      if (!container) return null;
      var box = null;
      var currentId = null;
      var MARGIN = 16;

      function explanationFor(id) {
        return Archify.explanations && typeof Archify.explanations.node === 'function'
          ? Archify.explanations.node(id) : null;
      }
      function ensureBox() {
        if (box) return box;
        box = document.createElement('div');
        box.id = 'archify-hover-explain';
        box.className = 'archify-hover-explain';
        box.setAttribute('role', 'tooltip');
        box.setAttribute('data-export-ignore', 'true');
        box.hidden = true;
        document.body.appendChild(box);
        return box;
      }
      function overlaps(a, b) {
        return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      }
      function obstacles() {
        var list = [];
        document.querySelectorAll('.header, .toolbar, .diagram-nav, .focus-chip').forEach(function (el) {
          if (el.hidden || el.offsetParent === null) return;
          var r = el.getBoundingClientRect();
          if (r.width && r.height) list.push(r);
        });
        return list;
      }
      // Slide a corner box vertically off any chrome it covers: top corners
      // move down, bottom corners move up.
      function nudge(r, fromTop, blocks) {
        for (var pass = 0; pass < 4; pass += 1) {
          var moved = false;
          blocks.forEach(function (b) {
            if (!overlaps(r, b)) return;
            var shift = fromTop ? (b.bottom + 8 - r.top) : (b.top - 8 - r.bottom);
            r.top += shift; r.bottom += shift; moved = true;
          });
          if (!moved) break;
        }
        return r;
      }
      function place(nodeRect) {
        var w = box.offsetWidth;
        var h = box.offsetHeight;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var cx = nodeRect.left + nodeRect.width / 2;
        var cy = nodeRect.top + nodeRect.height / 2;
        var blocks = obstacles();
        var corners = [
          { left: MARGIN, top: MARGIN, fromTop: true },
          { left: vw - w - MARGIN, top: MARGIN, fromTop: true },
          { left: MARGIN, top: vh - h - MARGIN, fromTop: false },
          { left: vw - w - MARGIN, top: vh - h - MARGIN, fromTop: false }
        ].map(function (c) {
          var r = nudge({ left: c.left, top: c.top, right: c.left + w, bottom: c.top + h }, c.fromTop, blocks);
          var inside = r.top >= 0 && r.bottom <= vh;
          var dx = (r.left + w / 2) - cx;
          var dy = (r.top + h / 2) - cy;
          return { left: r.left, top: r.top, bad: overlaps(r, nodeRect) || !inside, dist: dx * dx + dy * dy };
        });
        corners.sort(function (a, b) {
          if (a.bad !== b.bad) return a.bad ? 1 : -1;
          return b.dist - a.dist;
        });
        box.style.left = Math.max(MARGIN, corners[0].left) + 'px';
        box.style.top = Math.max(MARGIN, Math.min(vh - h - MARGIN, corners[0].top)) + 'px';
      }
      function show(node) {
        var id = node.getAttribute('data-node-id');
        var text = explanationFor(id);
        if (!text) { hide(); return; }
        ensureBox();
        if (currentId !== id) {
          while (box.firstChild) box.removeChild(box.firstChild);
          var title = document.createElement('div');
          title.className = 'archify-hover-explain-title';
          title.textContent = node.getAttribute('data-node-label') || id;
          box.appendChild(title);
          String(text).split(/\n\s*\n/).forEach(function (paragraph) {
            var trimmed = paragraph.trim();
            if (!trimmed) return;
            var p = document.createElement('p');
            p.textContent = trimmed;
            box.appendChild(p);
          });
          currentId = id;
        }
        box.hidden = false;
        place(node.getBoundingClientRect());
      }
      function hide() {
        currentId = null;
        if (box) box.hidden = true;
      }
      function nodeFrom(target) {
        return target && target.closest ? target.closest('[data-node-id]') : null;
      }
      container.addEventListener('pointerover', function (event) {
        var node = nodeFrom(event.target);
        if (node) show(node);
      }, true);
      container.addEventListener('pointerout', function (event) {
        var node = nodeFrom(event.target);
        if (!node) return;
        if (node.contains(event.relatedTarget)) return;
        hide();
      }, true);
      container.addEventListener('focusin', function (event) {
        var node = nodeFrom(event.target);
        if (node) show(node);
      });
      container.addEventListener('focusout', function () { hide(); });
      document.addEventListener('keydown', function (event) { if (event.key === 'Escape') hide(); });
      window.addEventListener('resize', hide);
      container.addEventListener('wheel', hide, { passive: true });
      return { hide: hide };
    })();
