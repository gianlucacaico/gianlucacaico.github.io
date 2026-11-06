  (function(){
    var buttons = document.querySelectorAll('.filters button');
    var cards = document.querySelectorAll('.eng');
    var status = document.querySelector('.filter-status');
    var labels = {growth:'commercial growth', ai:'agentic AI', platform:'platforms & systems'};

    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        var f = btn.getAttribute('data-filter');
        var shown = 0;
        buttons.forEach(function(b){ b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        cards.forEach(function(card){
          var tags = card.getAttribute('data-tags').split(' ');
          var match = f === 'all' || tags.indexOf(f) !== -1;
          card.hidden = !match;
          if (match) shown++;
        });
        status.textContent = f === 'all'
          ? 'Showing all ' + cards.length + ' engagements'
          : 'Showing ' + shown + ' of ' + cards.length + ' engagements with ' + labels[f] + ' outcomes';
      });
    });
  })();

  (function(){
    var nodes = document.querySelectorAll('.m-node');
    var panels = document.querySelectorAll('.m-panel');
    if (!nodes.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(id, scroll){
      nodes.forEach(function(n){ n.setAttribute('aria-pressed', n.getAttribute('aria-controls') === id ? 'true' : 'false'); });
      panels.forEach(function(p){ p.hidden = p.id !== id; });
      if (scroll && window.innerWidth < 1000){
        document.getElementById(id).scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'nearest'});
      }
    }
    nodes.forEach(function(n){ n.addEventListener('click', function(){ show(n.getAttribute('aria-controls'), true); }); });
    show('mp-bd', false);
  })();

  (function(){
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.fw-step'));
    if (!tabs.length) return;
    var panels = tabs.map(function(t){ return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus){
      tabs.forEach(function(t, j){
        var on = i === j;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ select(i); });
      t.addEventListener('keydown', function(e){
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); select((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
      });
    });
    document.querySelectorAll('.fw-next').forEach(function(b){
      b.addEventListener('click', function(){ select(parseInt(b.getAttribute('data-go'), 10), true); });
    });
    select(0);
  })();

  (function(){
    var run = document.querySelector('.v-run');
    if (!run) return;
    var row = document.querySelector('.c-row.is-new');
    var views = document.querySelectorAll('.v-view');
    var on = false;
    run.addEventListener('click', function(){
      on = !on;
      row.hidden = !on;
      views.forEach(function(v){
        v.classList.remove('pulse');
        void v.offsetWidth;
        if (on) v.classList.add('pulse');
        v.querySelector('span').textContent = on ? 'Regenerated just now' : 'Rendered from the ledger';
      });
      run.textContent = on ? 'Reset' : 'Add a new store visit note';
    });
  })();

  (function(){
    var nodes = document.querySelectorAll('.orbit-node');
    if (!nodes.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hubK = document.querySelector('.hub-k'), hubName = document.querySelector('.hub-name'), hubHint = document.querySelector('.hub-hint');
    var infoK = document.querySelector('.info-k'), infoName = document.querySelector('.info-name'), infoRole = document.querySelector('.info-role');
    var info = document.querySelector('.orbit-info');
    function pick(n){
      nodes.forEach(function(x){ x.setAttribute('aria-pressed', x === n ? 'true' : 'false'); });
      var c = n.style.getPropertyValue('--c');
      hubK.textContent = n.getAttribute('data-phase'); hubK.style.color = c;
      hubName.textContent = n.getAttribute('data-name');
      infoK.textContent = n.getAttribute('data-step') + ' \u00b7 ' + n.getAttribute('data-phase'); infoK.style.color = c;
      infoName.textContent = n.getAttribute('data-name');
      infoRole.textContent = n.getAttribute('data-role');
    }
    nodes.forEach(function(n){
      n.addEventListener('click', function(){
        pick(n);
        hubHint.textContent = 'Tap another node';
        if (window.innerWidth < 1000) info.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'nearest'});
      });
    });
    pick(nodes[0]);
  })();

  (function(){
    var btns = document.querySelectorAll('.work-filter button');
    var cards = document.querySelectorAll('.work-card');
    var status = document.querySelector('.work-status');
    var labels = {fs:'financial services', health:'health', energy:'energy', sport:'sport', saas:'SaaS'};
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        var f = b.getAttribute('data-filter'), shown = 0;
        btns.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cards.forEach(function(c){ var m = f === 'all' || c.getAttribute('data-industry') === f; c.hidden = !m; if (m) shown++; });
        status.textContent = f === 'all' ? 'Showing all ' + cards.length + ' projects' : 'Showing ' + shown + ' of ' + cards.length + ' projects in ' + labels[f];
      });
    });
  })();

  (function(){
    function place(container, active){
      var lens = container.querySelector(':scope > .lens');
      if (!lens) return;
      if (!active || !container.getClientRects().length){ lens.style.opacity = '0'; return; }
      lens.style.opacity = '1';
      lens.style.width = active.offsetWidth + 'px';
      lens.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    }
    function all(){
      document.querySelectorAll('.nav-links, .tabbar').forEach(function(c){ place(c, c.querySelector('[aria-current="page"]')); });
      document.querySelectorAll('.seg').forEach(function(c){ place(c, c.querySelector('button[aria-pressed="true"]')); });
    }
    document.querySelectorAll('.seg').forEach(function(seg){
      seg.addEventListener('click', function(e){ if (e.target.closest('button')) requestAnimationFrame(all); });
    });
    window.addEventListener('viewchange', function(){ requestAnimationFrame(all); });
    window.addEventListener('resize', all);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
    all();
  })();

  (function(){
    var bars = document.querySelectorAll('.nav-capsule, .tabbar');
    var darks = document.querySelectorAll('[data-tone="dark"]');
    var topbar = document.querySelector('.topbar');
    var ticking = false;
    function update(){
      ticking = false;
      topbar.classList.toggle('scrolled', window.scrollY > 24);
      bars.forEach(function(bar){
        var r = bar.getBoundingClientRect();
        if (!r.width) return;
        var y = r.top + r.height / 2, dark = false;
        darks.forEach(function(d){ var dr = d.getBoundingClientRect(); if (dr.height && y >= dr.top && y <= dr.bottom) dark = true; });
        bar.classList.toggle('on-dark', dark);
      });
    }
    window.addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }, {passive: true});
    window.addEventListener('viewchange', function(){ requestAnimationFrame(update); });
    update();
  })();

  (function(){
    var mains = document.querySelectorAll('main[data-view]');
    var navLinks = document.querySelectorAll('[data-nav]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var current = null;
    function show(id){
      if (id === current) return false;
      var target = document.getElementById(id);
      mains.forEach(function(m){ m.hidden = m !== target; });
      current = id;
      var key = target.getAttribute('data-view');
      if (key === 'post') key = 'blog';
      navLinks.forEach(function(a){ if (a.getAttribute('data-nav') === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      document.title = target.getAttribute('data-title') || document.title;
      window.dispatchEvent(new Event('viewchange'));
      return true;
    }
    function parse(h){
      if (!h || h === '#' || h === '#/') return {id: 'view-home'};
      if (h.indexOf('#/work') === 0) return {id: 'view-work'};
      if (h === '#/blog') return {id: 'view-blog'};
      if (h.indexOf('#/blog/') === 0){
        var id = 'post-' + h.slice(7);
        return {id: document.getElementById(id) ? id : 'view-blog'};
      }
      if (h === '#contact') return {id: current || 'view-home', target: 'contact'};
      return {id: 'view-home', target: h.slice(1)};
    }
    function go(r, smooth){
      var changed = show(r.id);
      var el = r.target && document.getElementById(r.target);
      if (el){
        requestAnimationFrame(function(){ el.scrollIntoView({behavior: (changed || reduce || !smooth) ? 'instant' : 'smooth'}); });
      } else if (changed){
        window.scrollTo({top: 0, behavior: 'instant'});
      }
    }
    var here = null;
    function remember(h){
      // Update the address bar where the host allows it. Previews and sandboxes may refuse; the page still works.
      try {
        var base = String(location.href).split('#')[0];
        if (location.hash !== h) history.pushState({h: h}, '', base + h);
      } catch (err) {}
    }
    function navigate(h, push){
      var r = parse(h);
      var same = (h === here);
      here = h;
      if (push) remember(h);
      if (same && !r.target){ window.scrollTo({top: 0, behavior: reduce ? 'instant' : 'smooth'}); return; }
      go(r, true);
    }
    // Handle every in-page link in script, so the browser never resolves "#/work" against another address.
    document.addEventListener('click', function(e){
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      navigate(a.getAttribute('href'), true);
    }, true);
    window.addEventListener('popstate', function(e){
      var h = (e.state && e.state.h) || location.hash || '#/';
      here = h; go(parse(h), false);
    });
    window.addEventListener('hashchange', function(){
      if (location.hash === here) return;
      here = location.hash; go(parse(location.hash), true);
    });
    here = location.hash || '#/';
    go(parse(here), false);
  })();
  (function(){
    var root = document.getElementById('ix');
    if (!root || !root.animate) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var S = [
      {gate: 'Set intent', agent: 'Drafting the research plan'},
      {gate: 'Interpret', agent: 'Classifying the claim, finding corroboration'},
      {gate: 'Prioritise', agent: 'Writing acceptance criteria'},
      {gate: 'Judge and craft', agent: 'Generating variants from design tokens'},
      {gate: 'Own and assure', agent: 'Drafting code and tests'},
      {gate: 'Govern and decide', agent: 'Watching live metrics'}
    ];
    var AGENT = 2900, WAIT = 1300, OK = 1100, DUR = AGENT + WAIT + OK, HOLD = 3400;
    var cards = root.querySelectorAll('.ix-card');
    var steps = root.querySelectorAll('.ix-steps button');
    var fills = root.querySelectorAll('.ix-steps .bar i');
    var chips = root.querySelectorAll('.ix-chip');
    var agentSwap = root.querySelector('[data-swap="agent"]');
    var gateSwap = root.querySelector('[data-swap="gate"]');
    var gate = root.querySelector('.ix-gate');
    var clock = root.querySelector('.ix-clock');
    var toggle = root.querySelector('.ix-toggle');
    var i = -1, phase = '', anim = null, raf = 0, inView = false, userPaused = reduce, ending = false, leaveTimer = 0;

    function running(){ return inView && !userPaused && !document.hidden; }

    function swap(el, text){
      var cur = el.lastElementChild;
      if (cur && cur.textContent === text) return;
      var n = document.createElement('span');
      n.textContent = text;
      n.className = 'in';
      el.appendChild(n);
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ n.className = ''; }); });
      if (cur){
        cur.className = 'out';
        setTimeout(function(){ if (cur.parentNode) cur.parentNode.removeChild(cur); }, 650);
      }
    }

    function setFill(f, v, smooth){
      f.getAnimations().forEach(function(a){ a.cancel(); });
      f.style.transition = smooth ? 'transform .7s cubic-bezier(.22,1,.36,1)' : 'none';
      f.style.transform = 'scaleX(' + v + ')';
    }

    function setPhase(p){
      if (p === phase) return;
      phase = p;
      root.setAttribute('data-phase', p);
      gate.setAttribute('data-state', p);
      var s = S[i];
      if (p === 'agent'){ swap(agentSwap, 'Agent: ' + s.agent); swap(gateSwap, 'Human gate: ' + s.gate); }
      if (p === 'wait'){ swap(agentSwap, 'Agent: ' + s.agent + ', ready for review'); swap(gateSwap, 'Awaiting sign-off: ' + s.gate); }
      if (p === 'ok'){
        swap(gateSwap, 'Approved: ' + s.gate);
        var c = chips[i];
        c.classList.remove('is-next'); c.classList.add('is-earned', 'pop');
        setTimeout(function(){ c.classList.remove('pop'); }, 700);
      }
      if (p === 'end'){ swap(agentSwap, 'Traceable from the customer to the code'); swap(gateSwap, 'Every gate approved'); }
    }

    function startClock(duration, target, keyframes){
      if (anim) anim.cancel();
      anim = target.animate(keyframes, {duration: duration, easing: 'linear', fill: 'forwards'});
      if (!running()) anim.pause();
    }

    function setStage(k){
      var prev = i;
      i = k; ending = false; phase = '';
      clearTimeout(leaveTimer);
      cards.forEach(function(c, n){
        var on = n === k;
        c.classList.toggle('is-active', on);
        c.classList.toggle('is-leaving', n === prev && !on);
        c.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      leaveTimer = setTimeout(function(){ cards.forEach(function(c){ c.classList.remove('is-leaving'); }); }, 1000);
      steps.forEach(function(b, n){
        b.classList.toggle('is-current', n === k);
        b.classList.toggle('is-done', n < k);
        if (n === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      fills.forEach(function(f, n){ if (n !== k) setFill(f, n < k ? 1 : 0, true); });
      chips.forEach(function(c, n){
        c.classList.toggle('is-earned', n < k);
        c.classList.toggle('is-next', n === k);
      });
      setFill(fills[k], 0, false);
      startClock(DUR, fills[k], [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}]);
      setPhase('agent');
    }

    function end(){
      ending = true;
      chips.forEach(function(c){ c.classList.remove('is-next'); c.classList.add('is-earned'); });
      steps.forEach(function(b){ b.classList.remove('is-current'); b.classList.add('is-done'); });
      setPhase('end');
      startClock(HOLD, clock, [{opacity: 0}, {opacity: 0}]);
    }

    function tick(){
      raf = requestAnimationFrame(tick);
      if (!anim) return;
      var finished = anim.playState === 'finished';
      if (ending){ if (finished) setStage(0); return; }
      var t = anim.currentTime || 0;
      setPhase(t < AGENT ? 'agent' : t < AGENT + WAIT ? 'wait' : 'ok');
      if (finished){ if (i < S.length - 1) setStage(i + 1); else end(); }
    }

    function sync(){
      var run = running();
      if (anim){
        if (run && anim.playState === 'paused') anim.play();
        if (!run && anim.playState === 'running') anim.pause();
      }
      root.classList.toggle('is-paused', !run);
      if (run && !raf) raf = requestAnimationFrame(tick);
      if (!run && raf){ cancelAnimationFrame(raf); raf = 0; }
    }

    toggle.addEventListener('click', function(){
      userPaused = !userPaused;
      toggle.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      toggle.setAttribute('aria-label', userPaused ? 'Play animation' : 'Pause animation');
      sync();
    });
    steps.forEach(function(b, n){ b.addEventListener('click', function(){ setStage(n); sync(); }); });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){ inView = entries[0].isIntersecting; sync(); }, {threshold: 0.3}).observe(root);
    } else { inView = true; }

    if (userPaused){ toggle.setAttribute('aria-pressed', 'true'); toggle.setAttribute('aria-label', 'Play animation'); }
    setStage(0);
    sync();
  })();

