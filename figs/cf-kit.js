/* 簡報用的 Colorfigures 共用小工具（接在 cf-core.js 後面載入）
   - cfCallouts / cfTag：和引擎的 xrCallouts / tag 一樣排兩欄、引線不交叉，但中文字寬算 1 個字、英數算 0.62 個字
   - cfWire：電線、管線切成短段，每段有自己的 box，才能和實體零件正確排前後
   - cfShell：半透明的腔體壁：背面幾面先畫、裡面的東西、再畫朝向觀眾的幾面
   - cfSeg：時間軸上 a→b 這一段的進度（0–1，已加緩動）
   - cfPause / cfNote / cfTagAct：暫停鍵、提示列、點標籤看說明（見檔案最後） */
/* 前後排序：引擎的 byDepth 用 sort 比較函式，零件一多、比較不遞移時會排錯（例：機殼蓋到鏡筒）。
   這裡改成：畫面上會重疊、而且 box 沿某一軸分得開的兩件，當成硬性先後；其餘照距離。用拓撲排序排出順序。 */
function cfDepth(parts){
  const it = parts.filter(Boolean), n = it.length;
  const sb = it.map(p => { const xs = [], ys = [];
    if (!p.box){ const q = P(...p.at); return [q[0], q[1], q[0], q[1]]; }
    for (const x of [p.box[0][0], p.box[1][0]]) for (const y of [p.box[0][1], p.box[1][1]]) for (const z of [p.box[0][2], p.box[1][2]]){ const q = P(x, y, z); xs.push(q[0]); ys.push(q[1]); }
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; });
  const dep = it.map(p => depthOf(p.at || boxMid(p.box)));
  const nxt = it.map(() => []), indeg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++){
    const a = sb[i], b = sb[j];
    if (a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]) continue;
    const s = sepOrder(it[i], it[j]);
    if (s < 0){ nxt[i].push(j); indeg[j]++; } else if (s > 0){ nxt[j].push(i); indeg[i]++; }
  }
  const done = new Array(n).fill(false), out = [];
  for (let c = 0; c < n; c++){
    let best = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (best < 0 || dep[i] < dep[best])) best = i;
    if (best < 0) for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || dep[i] < dep[best])) best = i;   // 有環：挑最遠的先畫
    done[best] = true; out.push(it[best].svg);
    for (const j of nxt[best]) indeg[j]--;
  }
  return out.join('');
}
const cfLen = s =>[...String(s)].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e7f ? 1.04 : .62), 0);
const cfSeg = (t, a, b) => ease(Math.max(0, Math.min(1, (t - a) / (b - a))));
const cfLerp = (a, b, k) => a + (b - a) * k;
// 圓柱側面上「正對觀眾」的那一點（標籤的落點，轉到哪裡都不會指到背面）
const cfNear = (cx, cy, r, z) => [cx + r * Math.cos(YAW * Math.PI / 180), cy + r * Math.sin(YAW * Math.PI / 180), z];

function cfPill(c, side, k, u, fs, hgt, w, px){
  const ex = px - side*w/2, D = window.CF_DESC;
  c = { ...c, on: c.on || window.CF_PICK === c.text };   // 剛點過的標籤也亮起來
  return `<g class="tag${c.on ? ' on' : ''}" data-n="${c.n}" data-t="${c.text}"${D && D[c.text] ? ' data-act="tag"' : ''}><path d="M${f(c.X)} ${f(c.Y)}L${f(ex + side*-4*k)} ${f(c.py)}L${f(ex)} ${f(c.py)}" fill="none" stroke="${INK}" stroke-width="1"/>`
    + `<circle cx="${f(c.X)}" cy="${f(c.Y)}" r="${f(1.4*k)}" fill="${INK}"/>`
    + `<rect x="${f(px - w/2)}" y="${f(c.py - hgt/2)}" width="${f(w)}" height="${f(hgt)}" rx="${f(hgt/2)}" fill="${c.on ? 'var(--accent,#f4b829)' : '#fff4d6'}" stroke="${INK}" stroke-width="1.2"/>`
    + `<text x="${f(px)}" y="${f(c.py + fs*.36)}" font-size="${f(fs)}" text-anchor="middle" font-weight="800" fill="${INK}">${u ? c.n : c.text}</text></g>`;
}
function cfCallouts(items, B){
  const pts = []; for (const x of [B[0], B[1]]) for (const y of [B[2], B[3]]) for (const z of [B[4], B[5]]) pts.push(P(x, y, z));
  const xmin = Math.min(...pts.map(p => p[0])), xmax = Math.max(...pts.map(p => p[0])), cx = (xmin + xmax)/2;
  const k = INK_K, u = window.LBL_U ? LBL_U() : 0, fs = u ? 10*u : 9.4*k*(window.CF_LBL || 1), hgt = u ? 17*u : fs*1.75, gap = hgt + (u ? 3*u : 3*k);
  const Lc = [], Rc = [];
  const svgEl = document.getElementById('fig'), vb = svgEl.viewBox.baseVal, btn = document.getElementById('btns');
  const wOf = t => u ? hgt*1.3 : cfLen(t)*fs + fs*1.4;
  const wMax = Math.max(...items.map(it => wOf(it.text))) + 12*k;
  const roomL = xmin - vb.x >= wMax, roomR = vb.x + vb.width - xmax >= wMax;
  for (const it of items){ const [X, Y] = P(...it.at); ((X < cx && roomL) || !roomR ? Lc : Rc).push({ ...it, X, Y }); }
  let s = '';
  const top = { [-1]: fs, [1]: fs + 30*k };
  if (btn && svgEl.getScreenCTM()){ const r = btn.getBoundingClientRect(), q = new DOMPoint(r.right, r.bottom + 14).matrixTransform(svgEl.getScreenCTM().inverse());
    if (q.y > 0) top[-1] = q.y + hgt; }
  const vs = document.querySelector('.vset');
  if (vs && svgEl.getScreenCTM()){ const r = vs.getBoundingClientRect(), q = new DOMPoint(r.left, r.bottom + 10).matrixTransform(svgEl.getScreenCTM().inverse());
    if (q.y > 0) top[1] = Math.max(top[1], q.y + hgt/2); }
  // 右上角的數字（stats）比較寬時，右欄標籤從它下面開始，免得疊在一起
  const sts = document.getElementById('stats');
  if (sts && sts.offsetHeight && svgEl.getScreenCTM()){ const r = sts.getBoundingClientRect(), M = svgEl.getScreenCTM().inverse();
    const q = new DOMPoint(r.left, r.bottom + 10).matrixTransform(M), pillL = Math.min(xmax + 10*k, vb.x + vb.width - wMax - 2*k);
    if (pillL + wMax > q.x && q.y > 0) top[1] = Math.max(top[1], q.y + hgt/2); }
  for (const [col, side] of [[Lc, -1], [Rc, 1]]){
    col.sort((a, b) => a.Y - b.Y);
    let y = -1e9; for (const c of col){ c.py = Math.max(c.Y, y + gap, top[side]); y = c.py; }
    const bot = vb.y + vb.height - hgt/2 - 2*k, over = col.length ? col[col.length - 1].py - bot : 0;
    if (over > 0){ let lim = bot; for (let i = col.length - 1; i >= 0; i--){ col[i].py = Math.min(col[i].py, lim); lim = col[i].py - gap; } }
    for (const c of col){
      c.n = ((window.__ln || (window.__ln = {}))[c.text] || (__ln[c.text] = Object.keys(__ln).length + 1));
      const w = wOf(c.text);
      let px = side < 0 ? xmin - 10*k - w/2 : xmax + 10*k + w/2; px = Math.max(vb.x + w/2 + 2*k, Math.min(vb.x + vb.width - w/2 - 2*k, px));
      s += cfPill(c, side, k, u, fs, hgt, w, px);
    }
  }
  return s;
}

// 電線／管子：轉角做圓弧，再切成短段（每段 box 自己算），粗細 w 是模型單位
function cfWire(pts, col, w = .5, L = 6){
  const bend = (p, r = 2) => { if (p.length < 3) return p; const out = [p[0]];
    for (let i = 1; i < p.length - 1; i++){ const [a, b, c] = [p[i - 1], p[i], p[i + 1]];
      const la = Math.hypot(...a.map((v, j) => v - b[j])), lc = Math.hypot(...c.map((v, j) => v - b[j])), d = Math.min(r, la/2.2, lc/2.2);
      if (d < 1e-3){ out.push(b); continue; }
      const q0 = a.map((v, j) => b[j] + (v - b[j]) * d/la), q1 = c.map((v, j) => b[j] + (v - b[j]) * d/lc);
      for (let s = 0; s <= 4; s++){ const t = s/4; out.push([0,1,2].map(j => (1-t)*(1-t)*q0[j] + 2*(1-t)*t*b[j] + t*t*q1[j])); } }
    out.push(p[p.length - 1]); return out; };
  const q = bend(pts), out = [];
  for (let i = 0; i < q.length - 1; ){
    let j = i + 1, len = 0; while (j < q.length - 1 && len < L){ len += Math.hypot(...q[j].map((v, k) => v - q[j - 1][k])); j++; }
    if (len < L) while (j < q.length - 1) j++;
    const seg = q.slice(i, j + 1), d = pd(seg, false);
    out.push({ box: [[0,1,2].map(k => Math.min(...seg.map(p => p[k])) - w), [0,1,2].map(k => Math.max(...seg.map(p => p[k])) + w)],
      svg: `<path d="${d}" fill="none" stroke="${INK}" style="stroke-width:${f(2*w*CAM_K + .9*INK_K)}" stroke-linecap="round" stroke-linejoin="round"/>`
        + `<path d="${d}" fill="none" stroke="${col}" style="stroke-width:${f(2*w*CAM_K)}" stroke-linecap="round" stroke-linejoin="round"/>` });
    i = j; }
  return out;
}

// 半透明的箱形腔體：背面幾面（淡）→ 裡面的東西 → 朝向觀眾的幾面（更淡＋邊線）
function cfShell(x0, y0, z0, x1, y1, z1, col, inner){
  const F = [
    [[0,1,0],  [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]],
    [[1,0,0],  [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]]],
    [[0,-1,0], [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]],
    [[-1,0,0], [[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]]],
    [[0,0,1],  [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]],
    [[0,0,-1], [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]]] ];
  let far = '', near = '';
  for (const [n, q] of F){
    if (facing(n)) near += fill(pd(q), col, 'fill-opacity=".10"') + ink(pd(q), .7);
    else far += fill(pd(q), mix(col, '#ffffff', .25), 'fill-opacity=".45"') + ink(pd(q), .45);
  }
  return far + inner + near;
}

// 有中孔的線圈（電磁透鏡）：銅色圓柱＋幾圈繞線＋頂面的孔
function cfCoil(cx, cy, z0, z1, r, M, bore = 2.4){
  let s = cyl(cx, cy, z0, z1, r, M, toneI, .8, 36);
  const [a0, a1] = nearHalf();
  for (let z = z0 + 1.2; z < z1 - .6; z += 1.6){
    const arc = []; for (let i = 0; i <= 18; i++){ const a = (a0 + (a1 - a0)*i/18) * Math.PI/180; arc.push([cx + r*Math.cos(a), cy + r*Math.sin(a), z]); }
    s += `<path d="${pd(arc, false)}" fill="none" stroke="${M.d}" stroke-width=".5"/>`;
  }
  return s + fill(pd(on(PZ(z1 + .03), ellUV(cx, cy, bore, bore, 16))), '#2b2523');
}

/* 暫停與說明（簡報用）
   - cfPause(ui, loop)：按鈕列裡標「暫停」的那顆變成暫停／繼續。st.paused 為真時，figure 的時鐘迴圈要停下（return false）；
     loop() 是 figure 重新啟動時鐘的函式。停住時提示列一直留著這一步的說明（st.cue）。
   - cfNote(ui, text)：顯示一段提示，停留時間照字數算；暫停中的話，提示結束後把暫停的說明放回來。
   - 標籤：figure 設 window.CF_DESC = { 標籤文字: 說明 }，acts 加上 tag: cfTagAct，點標籤就跳出說明。
   - cfNow(st)：畫面上一直在跑的小東西（電子）用的時間；暫停時停在按下暫停的那一刻。 */
let cfNoteT = 0;
const cfNow = st => st.paused && st.pauseAt ? st.pauseAt : performance.now();
const cfHold = ui => ui.flash(ui.st.cue || '已暫停，按「繼續」接著做', 864e5);
function cfNote(ui, text, ms){
  ms = ms || 1800 + 90 * cfLen(text);
  ui.flash(text, ms); clearTimeout(cfNoteT);
  cfNoteT = setTimeout(() => { window.CF_PICK = null; if (ui.st.paused) cfHold(ui); ui.render(); }, ms - 50);
}
const cfTagAct = (st, el, ui) => { const t = el.dataset.t; window.CF_PICK = t; cfNote(ui, '【' + t + '】' + CF_DESC[t]); };
function cfPause(ui, loop){
  const st = ui.st, b = [...document.querySelectorAll('#btns .act')].find(e => e.textContent === '暫停');
  const css = document.createElement('style');
  css.textContent = ".act.pause::before{content:'';display:inline-block;box-sizing:content-box;width:.18em;height:.66em;border:solid currentColor;border-width:0 .2em;margin-right:.5em;vertical-align:-.04em}"
    + ".act.pause.on::before{width:0;height:0;border-width:.36em 0 .36em .6em;border-color:transparent transparent transparent currentColor}"
    + ".act.pause.on{background:var(--accent,#f4b829)}.act.pause.idle{opacity:.4}";
  document.head.appendChild(css);
  if (b){ b.classList.add('pause'); b.parentElement.style.marginTop = '6px'; }
  const r0 = ui.render;
  ui.render = () => { r0(); if (!b) return; const t = st.paused ? '繼續' : '暫停'; if (b.textContent !== t) b.textContent = t;
    b.classList.toggle('on', !!st.paused); b.classList.toggle('idle', st.phase === 'idle'); };
  ui.render();
  return {
    toggle(){
      if (st.phase === 'idle') return cfNote(ui, '現在沒有動作在跑；按上面的步驟開始');
      st.paused = !st.paused;
      if (st.paused){ st.pauseAt = performance.now(); cfHold(ui); } else { cfNote(ui, st.cue || '繼續', 1200); loop(); }
    },
    busy(){ cfNote(ui, st.paused ? '已暫停：先按「繼續」' : '機台正在動作，等它做完', 1600); },
  };
}
