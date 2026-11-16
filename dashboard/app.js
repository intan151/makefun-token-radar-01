// Token Radar dashboard: renders window.RADAR with no network.
//
// The board is filterable and sortable, every row opens a detail view with the model's
// maths and the protocol's farm plan, and the live-token protocols sit apart under
// "Already trading". The farm plan is rebuilt here from the row's own record (category,
// chains, TVL, age) with the same rules as lib/model.ts, so the page and board.json agree.
// State lives in the URL hash, so a view can be linked: #detail=<slug>, #cat=<category>,
// #scope=watchlist|early|all, #sort=implied|tvl|growth|age|name, #q=<text>.
(function () {
  'use strict';
  var D = window.RADAR;
  if (!D) { document.body.innerHTML = '<p class="empty">No radar data loaded.</p>'; return; }
  var watchlist = {};
  D.watchlist.forEach(function (s) { watchlist[s] = true; });

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function money(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e8 ? 0 : 1) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + Math.round(n);
  }
  function pct(n) {
    if (n === null || n === undefined) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function ageText(days) {
    if (days === null || days === undefined) return '—';
    if (days >= 365) return (days / 365).toFixed(1) + 'y';
    return days + 'd';
  }

  /* ---- the farm plan, same rules as lib/model.ts ---- */
  function chainOf(r) { return r.chains.length > 0 ? r.chains[0] : 'its main chain'; }
  function capitalFor(r) {
    if (r.tvl_usd >= 5e9) return 250;
    if (r.tvl_usd >= 1e9) return 150;
    if (r.tvl_usd >= 1e8) return 100;
    return 50;
  }
  function holdDaysFor(age) {
    if (age === null || age === undefined) return 30;
    if (age < 180) return 60;
    if (age < 365) return 45;
    return 30;
  }
  function actionFor(r, capital, chain) {
    var c = (r.category || '').toLowerCase();
    var name = r.name;
    if (c.indexOf('risk curator') >= 0 || c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('capital allocator') >= 0) {
      return 'Deposit $' + capital + ' of USDC into a ' + name + ' vault on ' + chain + ' and keep the shares for the whole season.';
    }
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) {
      return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ', borrow a small amount against it once, then repay it.';
    }
    if (c.indexOf('dex') >= 0) {
      return 'Provide $' + capital + ' of liquidity to ' + name + '\'s deepest pool on ' + chain + ' and keep the position in range.';
    }
    if (c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0) {
      return 'Deposit $' + capital + ' of USDC into ' + name + '\'s highest-TVL vault on ' + chain + ' and leave it compounding.';
    }
    if (c.indexOf('bridge') >= 0) {
      return 'Bridge $' + capital + ' of USDC through ' + name + ' to ' + chain + ' and use the bridged funds inside its app.';
    }
    if (c.indexOf('staking') >= 0 || c.indexOf('restak') >= 0) {
      return 'Stake $' + capital + ' of the chain\'s staking asset through ' + name + ' and keep the receipt token.';
    }
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) {
      return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open one small hedged position.';
    }
    if (c.indexOf('prediction') >= 0) {
      return 'Fund ' + name + ' with $' + capital + ' and place one position in an active market, then close it.';
    }
    if (c.indexOf('basis') >= 0) {
      return 'Deposit $' + capital + ' of USDC into ' + name + '\'s basis strategy on ' + chain + ' and hold the position.';
    }
    if (c.indexOf('stable') >= 0) {
      return 'Mint or deposit $' + capital + ' of the stable asset through ' + name + ' on ' + chain + ' and hold it.';
    }
    if (c.indexOf('rwa') >= 0) {
      return 'Mint $' + capital + ' of ' + name + '\'s yield-bearing asset on ' + chain + ' and hold it through one distribution.';
    }
    if (c.indexOf('insurance') >= 0) {
      return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy for its full term.';
    }
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function farmSteps(r) {
    var chain = chainOf(r);
    var capital = capitalFor(r);
    var hold = holdDaysFor(r.age_days);
    var gas = capital >= 150 ? 8 : 4;
    return [
      { text: 'Open a fresh wallet that holds only the funds you plan to farm with, and write its seed phrase on paper, offline.', cost: 'under $3 of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(r, capital, chain), cost: '$' + capital + ' of capital and about $' + gas + ' of gas', time: '15 minutes to set up' },
      { text: 'Do one qualifying action each week on ' + r.name + ', such as a deposit, a borrow, a swap or a vote in its app.', cost: 'about $2 of gas a week', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days, so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: 'Before you withdraw anything, open ' + r.name + '\'s own points or rewards page from the link the protocol itself publishes, and claim only there.', cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction hash in a farm log, so you can repeat the position or unwind it cleanly.', cost: 'nothing but the log', time: '5 minutes' },
    ];
  }

  /* ---- header, model table, live table ---- */
  document.getElementById('stats').innerHTML =
    '<span class="chip"><b>' + D.board_size + '</b> ranked</span>' +
    '<span class="chip"><b>' + D.watchlist_size + '</b> on the watchlist</span>' +
    '<span class="chip"><b>' + D.early_size + '</b> early finds below the floor</span>' +
    '<span class="chip"><b>' + D.live_size + '</b> already trading</span>';
  document.getElementById('meta').textContent =
    'Snapshot ' + D.as_of + ' · watchlist floor ' + money(D.floor_usd) + ' TVL · source: ' + D.source;
  document.querySelector('#comps tbody').innerHTML = D.comps.map(function (c) {
    return '<tr><td>' + esc(c.category) + '</td><td>' + c.multiple.toFixed(3) + '×</td><td>' + c.live_count + '</td></tr>';
  }).join('') + '<tr><td><i>Snapshot-wide median (fallback)</i></td><td>' + D.global_multiple.toFixed(3) + '×</td><td>—</td></tr>';
  document.getElementById('live-rows').innerHTML = D.live.map(function (p) {
    var g = p.change_7d === null ? '—' : '<span class="' + (p.change_7d >= 0 ? 'pos' : 'neg') + '">' + pct(p.change_7d) + '</span>';
    return '<tr><td><b>' + esc(p.name) + '</b><br><span class="sub">' + esc(p.slug) + '</span></td><td>' +
      esc(p.category || '—') + '</td><td class="num">' + money(p.tvl_usd) + '</td><td class="num">' +
      money(p.mcap_usd) + '</td><td class="num">' + g + '</td></tr>';
  }).join('');

  /* ---- controls ---- */
  var qEl = document.getElementById('q');
  var catEl = document.getElementById('cat');
  var chainEl = document.getElementById('chain');
  var sortEl = document.getElementById('sort');
  var cats = {}, chains = {};
  D.rows.forEach(function (r) {
    cats[r.category || 'Uncategorised'] = true;
    r.chains.forEach(function (c) { chains[c] = true; });
  });
  Object.keys(cats).sort().forEach(function (c) {
    var o = document.createElement('option'); o.value = c; o.textContent = c; catEl.appendChild(o);
  });
  Object.keys(chains).sort().forEach(function (c) {
    var o = document.createElement('option'); o.value = c; o.textContent = c; chainEl.appendChild(o);
  });

  function readHash() {
    var h = {};
    location.hash.slice(1).split('&').forEach(function (part) {
      var kv = part.split('=');
      if (kv[0]) h[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
    });
    return h;
  }
  function writeHash(state) {
    var parts = [];
    if (state.scope && state.scope !== 'all') parts.push('scope=' + encodeURIComponent(state.scope));
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (state.cat) parts.push('cat=' + encodeURIComponent(state.cat));
    if (state.chain) parts.push('chain=' + encodeURIComponent(state.chain));
    if (state.sort && state.sort !== 'implied') parts.push('sort=' + encodeURIComponent(state.sort));
    if (state.detail) parts.push('detail=' + encodeURIComponent(state.detail));
    var next = parts.length ? '#' + parts.join('&') : '#';
    if (location.hash !== next) history.replaceState(null, '', next);
  }

  var state = { scope: 'all', q: '', cat: '', chain: '', sort: 'implied', detail: '' };
  function applyHash() {
    var h = readHash();
    state.scope = h.scope || 'all';
    state.q = h.q || '';
    state.cat = h.cat || '';
    state.chain = h.chain || '';
    state.sort = h.sort || 'implied';
    state.detail = h.detail || '';
    qEl.value = state.q;
    catEl.value = state.cat;
    chainEl.value = state.chain;
    sortEl.value = state.sort;
    document.querySelectorAll('.scope button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.scope === state.scope ? 'true' : 'false');
    });
    render();
  }

  function filtered() {
    var q = state.q.toLowerCase();
    var rows = D.rows.filter(function (r) {
      if (state.scope === 'watchlist' && !watchlist[r.slug]) return false;
      if (state.scope === 'early' && watchlist[r.slug]) return false;
      if (state.cat && (r.category || 'Uncategorised') !== state.cat) return false;
      if (state.chain && r.chains.indexOf(state.chain) < 0) return false;
      if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var by = {
      implied: function (a, b) { return b.implied_value_usd - a.implied_value_usd; },
      tvl: function (a, b) { return b.tvl_usd - a.tvl_usd; },
      growth: function (a, b) { return (b.change_7d === null ? -1e9 : b.change_7d) - (a.change_7d === null ? -1e9 : a.change_7d); },
      age: function (a, b) { return (b.age_days === null ? -1 : b.age_days) - (a.age_days === null ? -1 : a.age_days); },
      name: function (a, b) { return a.name.localeCompare(b.name); },
    }[state.sort] || function (a, b) { return b.implied_value_usd - a.implied_value_usd; };
    return rows.sort(function (a, b) { return by(a, b) || (a.slug < b.slug ? -1 : 1); });
  }

  function rowHtml(r) {
    var g = r.change_7d === null ? '—' : '<span class="' + (r.change_7d >= 0 ? 'pos' : 'neg') + '">' + pct(r.change_7d) + '</span>';
    var chainTxt = r.chains.slice(0, 2).join(', ') + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '');
    var badge = watchlist[r.slug] ? ' <span class="tag">WATCHLIST</span>' : '';
    return '<tr data-slug="' + esc(r.slug) + '" tabindex="0"><td class="num">' + r.rank + '</td>' +
      '<td><span class="name">' + esc(r.name) + '</span>' + badge + '<br><span class="sub">' + esc(r.slug) + '</span></td>' +
      '<td>' + esc(r.category || '—') + '</td><td>' + esc(chainTxt) + '</td>' +
      '<td class="num">' + money(r.tvl_usd) + '</td><td class="num">' + g + '</td>' +
      '<td class="num">' + ageText(r.age_days) + '</td>' +
      '<td class="num val">' + money(r.implied_value_usd) + '</td></tr>';
  }

  function renderDetail() {
    var box = document.getElementById('detail');
    var body = document.getElementById('detail-body');
    if (!state.detail) { box.hidden = true; body.innerHTML = ''; return; }
    var r = null;
    D.rows.forEach(function (x) { if (x.slug === state.detail) r = x; });
    if (!r) { box.hidden = true; body.innerHTML = ''; return; }
    var base = r.tvl_usd * r.comps_multiple;
    var steps = farmSteps(r).map(function (s, i) {
      return '<li><b>Step ' + (i + 1) + '.</b> ' + esc(s.text) +
        '<br><span class="cost">Cost: ' + esc(s.cost) + ' · Time: ' + esc(s.time) + '</span></li>';
    }).join('');
    body.innerHTML =
      '<h2 id="detail-h">#' + r.rank + ' — ' + esc(r.name) + (watchlist[r.slug] ? ' <span class="tag">WATCHLIST</span>' : '') + '</h2>' +
      '<p>' + esc(r.category || 'Uncategorised') + ' · ' + esc(r.chains.join(', ') || 'no chain listed') +
      ' · tracked since ' + (r.listed_at || 'unknown date') + ' · records no token in DefiLlama\'s data.</p>' +
      '<div class="grid">' +
      '<div class="cell"><span>Implied value</span><b>' + money(r.implied_value_usd) + '</b></div>' +
      '<div class="cell"><span>TVL</span><b>' + money(r.tvl_usd) + '</b></div>' +
      '<div class="cell"><span>7-day change</span><b>' + pct(r.change_7d) + '</b></div>' +
      '<div class="cell"><span>Age with no token</span><b>' + ageText(r.age_days) + '</b></div>' +
      '<div class="cell"><span>Comps multiple</span><b>' + r.comps_multiple.toFixed(3) + '×</b></div>' +
      '</div>' +
      '<p class="math">base ' + money(base) + ' = TVL ' + money(r.tvl_usd) + ' × ' + r.comps_multiple.toFixed(3) +
      ' (' + esc(r.comps_basis) + ')<br>× growth ' + r.growth_multiplier.toFixed(4) +
      ' × maturity ' + r.maturity_multiplier.toFixed(4) + ' × chains ' + r.chain_multiplier.toFixed(4) +
      ' = <b>' + money(r.implied_value_usd) + '</b></p>' +
      '<h3>How to farm it</h3><ol>' + steps + '</ol>' +
      '<p class="cost">Plan assumes one position. Never pay to claim an airdrop; only use links the protocol itself publishes.</p>';
    box.hidden = false;
  }

  function render() {
    var rows = filtered();
    document.getElementById('count').textContent =
      rows.length + ' of ' + D.board_size + ' ranked protocols' +
      (state.scope === 'watchlist' ? ' · watchlist only' : state.scope === 'early' ? ' · early finds below the $50M floor' : '') +
      (state.cat ? ' · ' + state.cat : '') + (state.chain ? ' · ' + state.chain : '') +
      (state.q ? ' · matching "' + state.q + '"' : '');
    document.getElementById('rows').innerHTML = rows.length
      ? rows.map(rowHtml).join('')
      : '<tr><td colspan="8" class="empty">No protocols match these filters. Clear the search or pick another category.</td></tr>';
    renderDetail();
  }

  document.getElementById('rows').addEventListener('click', function (e) {
    var tr = e.target.closest ? e.target.closest('tr[data-slug]') : null;
    if (!tr) return;
    state.detail = tr.dataset.slug;
    writeHash(state);
    render();
    document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('rows').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var tr = e.target.closest ? e.target.closest('tr[data-slug]') : null;
    if (!tr) return;
    state.detail = tr.dataset.slug;
    writeHash(state);
    render();
  });
  document.getElementById('detail-close').addEventListener('click', function () {
    state.detail = '';
    writeHash(state);
    render();
    document.getElementById('board').scrollIntoView({ behavior: 'smooth' });
  });
  document.querySelectorAll('.scope button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.scope = b.dataset.scope;
      writeHash(state);
      render();
    });
  });
  qEl.addEventListener('input', function () { state.q = qEl.value; writeHash(state); render(); });
  catEl.addEventListener('change', function () { state.cat = catEl.value; writeHash(state); render(); });
  chainEl.addEventListener('change', function () { state.chain = chainEl.value; writeHash(state); render(); });
  sortEl.addEventListener('change', function () { state.sort = sortEl.value; writeHash(state); render(); });
  window.addEventListener('hashchange', applyHash);

  applyHash();
  if (state.detail) {
    var d = document.getElementById('detail');
    if (d && !d.hidden) d.scrollIntoView();
  }
  document.querySelector('main').setAttribute('aria-busy', 'false');
})();
