"""把 figs/ 裡的 Colorfigures 立體圖打包成簡報用的 js/widgets/cf-figs.js，並輸出單檔頁面到 figs/out/ 供截圖檢查。
用法：python3 figs/build-figs.py
- cf-core.js 是 Colorfigures 的繪圖引擎（April Zhu，MIT 授權；授權全文放在每一頁的引擎前面）
- cf-page-src.py 是 Colorfigures 的 build.py，只取它的 HEAD / TAIL（縮放、標籤、手機版面）
- EMBED：嵌在簡報裡的調整（藏掉配色、筆觸、標題列；按鈕改中文字型；翻頁鍵轉回簡報）"""
import ast, json, pathlib
here = pathlib.Path(__file__).parent
root = here.parent
FIGS = ['sem', 'tem']

src = (here / 'cf-page-src.py').read_text(encoding='utf-8')
consts = {}
for node in ast.parse(src).body:
    if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name) and node.targets[0].id in ('HEAD', 'TAIL'):
        consts[node.targets[0].id] = ast.literal_eval(node.value)
HEAD, TAIL = consts['HEAD'], consts['TAIL']

lic = (here / 'CF-LICENSE').read_text(encoding='utf-8')
core = '/* Colorfigures engine (assets/core.js) — https://april-zhu.com/colorfigures\n' + lic + '*/\n' \
    + (here / 'cf-core.js').read_text(encoding='utf-8') + '\n' + (here / 'cf-kit.js').read_text(encoding='utf-8')

CJK = '"PingFang TC","Noto Sans TC","Microsoft JhengHei","Heiti TC",sans-serif'
EMBED = f'''<style>
body{{padding:6px 8px 0!important}}
body>header,.controls,.made-with,.mcap,#readout,.zchip{{display:none!important}}
.stage,#fig{{max-width:none!important}}
/* 前面加 html：引擎的 CSS 和頁尾的 TAIL 都比這段晚載入，同等權重時會蓋掉這裡 */
html .act,html .chip,html .toast,html .stat .k,html #fig .tag text{{font-family:{CJK}!important}}
html .act{{font-size:16px;padding:5px 14px}} html .chip{{font-size:15px}} html .stat .k{{letter-spacing:.04em;font-size:13px}} html .stat .v{{font-size:28px}}
html .toast{{text-transform:none!important;font-size:16px!important;line-height:1.45!important;max-width:min(92%,600px)!important}}
</style>
<script>
window.GAME_KEYS = true;   // 方向鍵留給簡報翻頁，不拿來轉視角（拖曳一樣能轉）
window.CF_LBL = 1.3;       // 投影時標籤字放大
addEventListener('keydown', e => {{
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const nav = ['ArrowLeft','ArrowRight','PageUp','PageDown',' ','Home','End','Escape','b','B','n','N','o','O','t','T','p','P','f','F','l','L'];
  if (!nav.includes(e.key)) return;
  e.preventDefault(); e.stopImmediatePropagation();
  try {{ parent.postMessage({{ cfKey: e.key }}, '*'); }} catch (_) {{}}
}}, true);
addEventListener('load', () => {{
  const x = document.getElementById('xrb'), l = document.getElementById('lblb');
  if (x) x.textContent = '透視';
  if (l){{ l.textContent = '標籤'; if (document.documentElement.classList.contains('nolabels')) l.click(); }}
}});
</script>'''

def page(name, inline_core):
    html = (here / f'{name}.html').read_text(encoding='utf-8')
    for tag in ('<script src="core.js"></script>\n', '<script src="cf-kit.js"></script>\n'):
        assert tag in html, f'{name}.html 缺少 {tag.strip()}'
    html = html.replace('<script src="cf-kit.js"></script>\n', '')
    html = html.replace('<script src="core.js"></script>', ('<script>\n' + core + '\n</script>') if inline_core else '<!--CF_CORE-->')
    html = html.replace('</head>', HEAD + EMBED + '</head>', 1)
    i = html.rfind('</body>')
    return html[:i] + TAIL + html[i:]

(here / 'out').mkdir(exist_ok=True)
pages = {}
for n in FIGS:
    if not (here / f'{n}.html').exists(): continue
    (here / 'out' / f'{n}.html').write_text(page(n, True), encoding='utf-8')
    pages[n] = page(n, False)
esc = lambda s: json.dumps(s, ensure_ascii=False).replace('</', '<\\/')
js = ('/* 自動產生，請勿手改：python3 figs/build-figs.py\n'
      '   Colorfigures 立體機台圖（繪圖引擎：April Zhu，MIT 授權）。每張圖放進獨立的 iframe，程式和樣式不會和簡報互相干擾 */\n'
      f'window.CF = {{ core: {esc(core)},\n  pages: {{ ' + ',\n    '.join(f'{n}: {esc(p)}' for n, p in pages.items()) + ' },\n'
      "  page(name) { return this.pages[name].replace('<!--CF_CORE-->', () => '<script>' + this.core + '<\\/script>'); }\n};\n"
      '/* 圖框裡按的翻頁、備註等按鍵，轉回簡報 */\n'
      "window.addEventListener('message', e => {\n"
      '  const d = e.data; if (!d || !d.cfKey) return;\n'
      "  if (![...document.querySelectorAll('iframe.cf-frame')].some(fr => fr.contentWindow === e.source)) return;\n"
      "  document.dispatchEvent(new KeyboardEvent('keydown', { key: d.cfKey, bubbles: true }));\n"
      '});\n')
(root / 'js' / 'widgets' / 'cf-figs.js').write_text(js, encoding='utf-8')
print('wrote js/widgets/cf-figs.js', round(len(js) / 1024), 'KB;', ', '.join(f'figs/out/{n}.html' for n in pages))
