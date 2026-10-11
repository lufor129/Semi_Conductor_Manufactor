/* 第二部分 ④ 摻雜與磊晶（接在磊晶頁之後）：調整矽的導電性 */
(function () {
  const A = Deck.add.bind(Deck);
  const F = { chap: 4, eyebrow: '第二部分 · ④ 摻雜與磊晶' };

  /* 1. 為什麼摻雜＋離子佈植 */
  A(Object.assign({
    id: 'dope1', part: 2, minutes: 2.0, short: '摻雜：把雜質打進矽',
    title: '摻雜：把極少量的「雜質」打進矽裡，矽就會導電', en: 'Doping & Ion Implantation',
    thesis: '源極和汲極要能導電，但純矽幾乎不導電：摻一點磷變 n 型、摻一點硼變 p 型。傳統做法是用「離子佈植」像開槍一樣打進去，<b>再加熱讓雜質歸位</b>。',
    render: () => `<div class="s-body">
      <div class="col"><div class="controls">${U.seg('p1-e', ['磷 → n 型（多電子）', '硼 → p 型（多電洞）'], 0)}</div>
        ${U.figHTML('p1-cv', '離子佈植（剖面）', '')}
        <div class="controls">${U.range('p1-k', '發射力道', 1, 10, 1, 5, '')}<button class="btn primary" id="p1-an" type="button">🔥 加熱歸位（退火）</button></div></div>
      ${U.side({
        top: `<div class="card key"><h4>還記得第 5 頁的原子放大鏡嗎？</h4><p style="font-size:18px;margin:2px 0">磷多一個電子 → n 型；硼少一個電子（留下電洞）→ p 型。只要極少量，導電性就差很多。</p><button class="btn" type="button" data-go="parts" style="margin-top:6px">↩ 回看原子放大鏡</button></div>`,
        points: ['力道越大，打得越深', '光阻擋住的地方打不進去', '打完要加熱（退火），雜質才會歸位、開始導電', '今天仍用在井區、接觸區等很多步驟'],
        analogy: { icon: 'bullet', t: '比喻', p: '像對一塊果凍開槍：子彈力道越大，卡得越深；打得越多，那一區顏色越濃。' }
      })}</div>`,
    init(el, ctx) {
      U.$$(el, '[data-go]').forEach(b => b.onclick = () => Deck.goId(b.dataset.go));
      const { c, w, h } = U.canvas(U.$(el, '#p1-cv'));
      let e = 0, k = 5, hits = [], an = 0; // an：退火進度（0＝剛打完、亂七八糟；1＝歸位、開始導電）
      const reset = () => { hits = []; an = 0; };
      U.onSeg(el, 'p1-e', i => { e = i; reset(); });
      U.bind(el, 'p1-k', v => { k = v; reset(); }, v => ['', '很輕', '輕', '輕', '中', '中', '中', '強', '強', '很強', '最強'][v]);
      U.$(el, '#p1-an').onclick = () => { if (!an) an = 0.001; };
      const flying = [];
      let acc = 0;
      ctx.raf((dt, t) => {
        const col = e ? U.MAT.p : U.MAT.n;
        c.clearRect(0, 0, w, h);
        const top = h * 0.3, L = 30, R = w - 30, W = w * 0.36, cx = w / 2, bot = h - 20;
        U.box(c, 'si', L, top, R - L, bot - top);
        U.box(c, 'pr', L, top - 26, cx - W / 2 - L, 26); U.box(c, 'pr', cx + W / 2, top - 26, R - cx - W / 2, 26);
        U.tag(c, '光阻擋住的地方打不進去', L + 6, top - 36, { size: 14 });
        const depth = 20 + k * (bot - top - 70) / 10;
        if (an) an = Math.min(1, an + dt * 0.8);
        if (!an && hits.length < 260) { acc += dt * 30; while (acc > 1) { acc--; flying.push({ x: U.rand(L + 20, R - 20), y: 20 }); } }
        for (let q = flying.length - 1; q >= 0; q--) {
          const f = flying[q]; f.y += dt * 700;
          const blocked = (f.x < cx - W / 2 || f.x > cx + W / 2) && f.y > top - 26;
          const stopY = Math.min(bot - 10, top + depth + (Math.random() - .5) * depth * 0.6);
          if (blocked) { flying.splice(q, 1); continue; }
          if (f.y > stopY) { hits.push([U.clamp(f.x + U.rand(-10, 10), cx - W / 2 + 4, cx + W / 2 - 4), f.y]); flying.splice(q, 1); continue; }
          U.arrow(c, f.x, f.y - 14, f.x, f.y, col, 2);
        }
        if (an) { // 退火：雜質歸位，那一區變成導電的摻雜區
          const g = c.createLinearGradient(0, top, 0, Math.min(bot, top + depth * 1.5));
          g.addColorStop(0, col + '22'); g.addColorStop(0.65, col + 'aa'); g.addColorStop(1, col + '00');
          c.globalAlpha = an; c.fillStyle = g; c.fillRect(cx - W / 2, top, W, Math.min(bot, top + depth * 1.5) - top); c.globalAlpha = 1;
          c.fillStyle = `rgba(217,80,40,${0.18 * Math.sin(an * Math.PI)})`; c.fillRect(L, top, R - L, bot - top);
        }
        hits.forEach(([x, y]) => { const gx = Math.round(x / 14) * 14, gy = Math.round(y / 14) * 14; U.dot(c, U.lerp(x, gx, an), U.lerp(y, gy, an), 5, col); });
        c.setLineDash([5, 4]); c.strokeStyle = '#b3541e'; c.beginPath(); c.moveTo(cx - W / 2, top + depth); c.lineTo(cx + W / 2, top + depth); c.stroke(); c.setLineDash([]);
        U.tag(c, '平均深度', cx + W / 2 + 8, top + depth + 5, { size: 14, color: '#b3541e' });
        U.tag(c, an >= 1 ? '加熱後：雜質歸位，這一區開始導電 ✓' : hits.length >= 260 ? '打完了：雜質亂七八糟卡在裡面，還不太導電 → 按「加熱歸位」' : '離子打進去中…', w / 2, h - 4, { align: 'center', size: 15, color: an >= 1 ? '#1f7a4d' : '#3e4b5b' });
      });
    },
    notes: `進入第四章：摻雜與磊晶，先講摻雜、再講磊晶。先問一個問題：電晶體的源極和汲極要能導電，電流才進得去、出得來，可是純的矽幾乎不導電，怎麼辦？

要讓它導電，就要摻入極少量的雜質，這叫摻雜。

原理我們在第 5 頁的原子放大鏡看過了：磷多一個電子，就是 n 型；硼少一個電子，留下電洞，就是 p 型。只要極少量的雜質，導電性就差很多。右上角的按鈕可以跳回去複習。

怎麼把雜質放進去？用離子佈植，把雜質變成離子，用電場加速，像開槍一樣打進晶圓。光阻擋住的地方打不進去。拖動力道滑桿，力道越大，打得越深。平面電晶體時代的源極和汲極，就是這樣做出來的。打完之後，雜質會卡在亂七八糟的位置，晶格也被撞壞，這時還不太導電。按「加熱歸位」，極短暫地加熱，讓原子排回格子裡、雜質開始導電，這一步叫退火。

離子佈植今天仍然天天在用：井區、防止漏電的區域、接觸點底下，都還是靠打的。但源極汲極這一塊，到了鰭式和環繞式遇到困難：鰭和奈米片又高又密，離子從上面打下來會被擋住，還會把很薄的結構打壞。那怎麼辦？要先認識另一個工具：磊晶。`
  }, F));

  /* 3. 3D 結構的摻雜 */
  A(Object.assign({
    id: 'dope3', part: 2, minutes: 3, short: '選擇性磊晶長源汲極',
    title: '源汲極的新做法：選擇性磊晶，邊長邊摻', en: 'Selective Epitaxy · In-situ Doping',
    thesis: '到了 3D 結構，源汲極這一塊用離子打，<b>打不均勻、還會打壞</b>。解法是用上一頁的磊晶：<b>只在露出的矽上</b>長出源汲極，而且<b>長的時候就把雜質混進去</b>。三個分頁依序看。',
    render: () => `<div class="s-body">
      <div class="col"><div class="controls">${U.seg('p3-m', ['① 為什麼用打的不好', '② 選擇性：只長在矽上', '③ 邊長邊摻'], 0)}</div>${U.figHTML('p3-cv', '三根鰭（剖面）', '')}</div>
      ${U.side({
        top: `<div class="card key"><h4 id="p3-h"></h4><p id="p3-p" style="font-size:17px"></p></div>`,
        meters: [['p3-a', '摻雜均勻'], ['p3-b', '結構損傷']],
        extra: '<button class="btn" type="button" data-go="depo3">↩ 回看磊晶頁</button>',
        analogy: { icon: 'bread', t: '比喻', p: '與其做好麵包再打針灌餡（容易破），不如揉麵時就把餡料包進去。' }
      })}</div>`,
    init(el, ctx) {
      U.$$(el, "[data-go]").forEach(b => b.onclick = () => Deck.goId(b.dataset.go));
      const { c, w, h } = U.canvas(U.$(el, '#p3-cv'));
      let m = 0, g = 0;
      const TX = [
        ['為什麼用打的不好？', '離子要斜著打，才打得到鰭的側面。可是鰭又高又密，隔壁的鰭會擋住一大片（陰影區），左右兩側摻得不一樣；鰭只有幾奈米寬、奈米片只有幾奈米厚，離子一撞，原子排列就亂掉，加熱也很難完全修好。'],
        ['「選擇性」是怎麼做到的？', '矽上原子直接接著底下的格子排（有「空手」可牽），馬上就長；絕緣層上要先聚成小島，起步慢很多。同時混一點氯化氫：它兩邊都吃，但矽上「長得比吃得快」，絕緣層上剛冒頭的小島「吃得比長得快」，所以只有矽上長得起來。'],
        ['邊長邊摻', '長的時候，把含磷或含硼的氣體一起混進去，長出來的源汲極本身就已經摻好。長太短接觸不好，長太長會碰到隔壁的電晶體。pFET 用矽鍺，還能順便擠緊通道，讓電洞跑更快。']
      ];
      U.onSeg(el, 'p3-m', i => { m = i; g = 0; U.$(el, '#p3-h').textContent = TX[i][0]; U.$(el, '#p3-p').textContent = TX[i][1]; const ft = U.$(el, '#p3-cv').closest('.fig').querySelector('.fig-title span'); if (ft) ft.textContent = i === 1 ? '放大看表面（示意）：灰色圓點是氣體帶來的矽原子' : '三根鰭（剖面）'; });
      ctx.raf((dt, t) => {
        g = Math.min(1, g + dt * 0.35);
        c.clearRect(0, 0, w, h);
        const base = h * 0.8, fw = 50, fh = h * 0.45, xs = [w * 0.28, w * 0.5, w * 0.72];
        if (m === 1) { selZoom(c, w, h, t); U.setMeter(el, 'p3-a', .95, '均勻', 'good'); U.setMeter(el, 'p3-b', .05, '幾乎沒有', 'good'); return; }
        U.box(c, 'si', 30, base, w - 60, h - base - 20);
        U.box(c, 'ox', 30, base - 40, w - 60, 40);
        xs.forEach(x => U.box(c, 'si', x - fw / 2, base - fh, fw, fh));
        if (m === 0) {
          // 斜射的離子：被前一根鰭擋住，形成陰影區
          const tilt = 0.55, sh = (fh - 40) * tilt; // 陰影長度
          xs.forEach((x, i) => {
            const left = x - fw / 2;
            // 打得到的：鰭頂＋左側上半部；右側在陰影裡
            c.fillStyle = 'rgba(91,143,217,.85)';
            c.fillRect(left, base - fh, fw, 12 * g);
            c.fillRect(left, base - fh, 9 * g, (fh - 40) * (i === 0 ? 1 : 0.4) * g);
            if (i > 0) { c.fillStyle = 'rgba(23,32,43,.12)'; c.beginPath(); c.moveTo(xs[i - 1] + fw / 2, base - fh); c.lineTo(xs[i - 1] + fw / 2 + (fh - 40) * tilt, base - 40); c.lineTo(xs[i - 1] + fw / 2, base - 40); c.closePath(); c.fill(); }
            for (let k = 0; k < 6; k++) U.txt(c, '✕', left + 8 + (k % 3) * 14, base - fh + 34 + Math.floor(k / 3) * 16, { size: 12, color: '#b3261e' });
          });
          for (let k = 0; k < 9; k++) { const f = (t * 0.6 + k / 9) % 1, x0 = 60 + k * (w - 120) / 8, y = 20 + f * (base - fh - 20); const x = x0 - (base - fh) * tilt * 0.3 + y * tilt * 0.6; U.arrow(c, x - 6, y - 10, x, y, U.MAT.n, 1.8); }
          U.tag(c, '灰色三角：被前一根鰭擋住的陰影區，打不到', xs[1] + 30, base - 54, { size: 13 });
          U.tag(c, '紅叉：被打壞的晶格', xs[2] + 40, base - fh + 40, { size: 13, color: '#b3261e' });
          U.tag(c, '離子要斜著打才打得到側面，可是會被隔壁擋住', w / 2, 24, { align: 'center', size: 15 });
          U.setMeter(el, 'p3-a', .35, '不均勻', 'bad'); U.setMeter(el, 'p3-b', .7, '明顯', 'bad');
        } else {
          xs.forEach(x => {
            c.fillStyle = U.MAT.n;
            const r = 42 * g;
            c.beginPath(); c.moveTo(x, base - fh - r * 0.3); c.lineTo(x + fw / 2 + r, base - fh * 0.55); c.lineTo(x, base - 40 + 0); c.lineTo(x - fw / 2 - r, base - fh * 0.55); c.closePath(); c.fill();
            U.box(c, 'si', x - fw / 2, base - fh, fw, fh, { a: .35 });
            for (let k = 0; k < 5; k++) { const a = t * 2 + k * 1.3; U.dot(c, x + Math.cos(a) * (fw / 2 + r * 0.6), base - fh * 0.55 + Math.sin(a) * r * 0.5, 2.6, '#d9765b'); }
          });
          for (let k = 0; k < 14; k++) { const f = (t * 0.5 + k / 14) % 1; U.dot(c, 50 + ((k * 61) % (w - 100)), 20 + f * (base - fh - 40), 3, k % 3 ? '#a9bcd0' : '#d9765b'); }
          U.tag(c, '氣體裡同時有矽（灰）和磷／硼（紅）：一邊長、一邊摻', w / 2, 24, { align: 'center', size: 15 });
          U.tag(c, '黃色絕緣層上一顆都不長', w - 40, base - 52, { align: 'right', size: 13, color: '#1f7a4d' });
          if (g > .6) U.tag(c, 'pFET 用矽鍺：擠緊通道，電洞跑更快', w / 2, h - 10, { align: 'center', size: 14, color: '#1f7a4d' });
          U.setMeter(el, 'p3-a', .95, '均勻', 'good'); U.setMeter(el, 'p3-b', .05, '幾乎沒有', 'good');
        }
      });
      // 分頁②：放大看矽表面和絕緣層表面
      function selZoom(c, w, h, t) {
        const half = w / 2, base = h * 0.66;
        [[0, '露出的矽表面', U.MAT.si], [1, '絕緣層表面', U.MAT.ox]].forEach(([k, name, col]) => {
          const L = 30 + k * half, R = L + half - 50, W = R - L, n = 9, sp = W / n;
          U.txt(c, name, L + W / 2, 26, { align: 'center', size: 17, w: 700, color: k ? '#a8660a' : '#1f4fb5' });
          c.fillStyle = col; c.fillRect(L, base, W, h - base - 30);
          for (let i = 0; i < n; i++) {
            const x = L + (i + .5) * sp;
            if (!k) { c.strokeStyle = '#1f4fb5'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - 10); c.stroke(); }
            const f = ((t * 0.5 + i * 0.37) % 1), y = U.lerp(50, base - 16, Math.min(1, f * 1.4));
            if (!k) { const landed = f > 0.72; U.dot(c, x, landed ? base - 16 : y, 8, '#a9bcd0'); if (landed) { c.strokeStyle = '#17202b'; c.lineWidth = 1; c.beginPath(); c.arc(x, base - 16, 8, 0, 7); c.stroke(); } }
            else { const bounce = f > 0.72 ? (f - 0.72) * 3 : 0; U.dot(c, x + bounce * 20, f > 0.72 ? base - 16 - bounce * 120 : y, 8, `rgba(169,188,208,${f > 0.72 ? 1 - bounce : 1})`); }
          }
          U.txt(c, k ? '要先聚成小島才長得起來：原子多半落下又離開' : '藍色短線＝表面原子的「空手」：抓住落下的原子', L + W / 2, base + 40, { align: 'center', size: 13.5, color: '#17202b' });
        });
        U.txt(c, '氯化氫兩邊都吃：矽上長得比吃得快 → 淨成長；絕緣層上的小島吃得比長得快 → 長不起來', w / 2, h - 10, { align: 'center', size: 14, w: 700, color: '#1f7a4d' });
      }
    },
    notes: `上一頁認識了磊晶：照著底下的原子排列長出完美的晶體。這一頁用它來解決摻雜那一頁留下的問題：3D 結構的源汲極怎麼摻雜。三個分頁依序看。

第一個分頁，為什麼源汲極用打的不好。鰭是站著的，要摻到側面，離子得斜著打。可是鰭又高又密，前一根鰭會擋住後面一大片，灰色三角形就是打不到的陰影區，所以左右兩側摻得不一樣。而且鰭只有幾奈米寬、奈米片只有幾奈米厚，離子撞進去會把原子排列撞亂，紅色叉叉就是損傷，事後加熱也很難完全修好。

第二個分頁，換個想法：不用打的，用長的，而且只長在需要的地方，這就是選擇性磊晶。「選擇性」怎麼做到？放大來看：左邊是露出的矽表面，表面原子有「空手」，也就是還沒牽到別人的鍵，氣體帶來的矽原子一落下就被抓住，照著底下排好，馬上就長。右邊是絕緣層表面，原子要先聚成一小團、像小島，才長得起來，起步慢很多，大部分落下又離開。長的同時再混一點氯化氫這種蝕刻氣體。要注意，氯化氫不會挑地方，矽上和絕緣層上它都吃。差別在於：矽上原子一落下就接上去，長得比被吃得快，淨效果是一直長；絕緣層上剛冒頭的小島只有幾顆原子、還沒長穩，被吃得比長得快，淨效果是長不起來。工程師調整長和吃的比例，讓矽上淨成長是正的、絕緣層上是負的，選擇性就是這樣做出來的。

第三個分頁，邊長邊摻。長的時候，把含磷或含硼的氣體一起混進去，長出來的源汲極本身就已經摻好，不用再打。長的時間要剛好：太短接觸不好，太長會碰到隔壁的電晶體短路。材料選得好還有額外好處：pFET 用矽鍺，會把通道擠緊，讓電洞跑得更快。就像與其做好麵包再打針灌餡，不如揉麵時就把餡料包進去。

這一章的重點：摻雜決定導電性，磊晶負責長出晶體；到了 3D 電晶體，兩件事在同一步一起完成。`
  }, F));
})();
