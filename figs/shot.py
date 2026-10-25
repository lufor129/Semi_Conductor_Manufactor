"""立體圖截圖檢查：python3 figs/shot.py <名稱> <輸出資料夾> [查詢字串 ...]
每個查詢字串截一張（例：'yaw=110' 'xr=1&wafer=chuck&at=meas&beam=1&scan=.5'），印出 JS 錯誤與 html[data-errors]。
寬高可用 W=、H= 環境變數改（預設 900×640，接近簡報裡的圖框）；WAIT= 等待毫秒。"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright
name, out = sys.argv[1], pathlib.Path(sys.argv[2]); qs = sys.argv[3:] or ['']
out.mkdir(parents=True, exist_ok=True)
page_path = pathlib.Path(__file__).parent / 'out' / f'{name}.html'
W, H, WAIT = int(os.environ.get('W', 900)), int(os.environ.get('H', 640)), int(os.environ.get('WAIT', 900))
with sync_playwright() as p:
    b = p.chromium.launch()
    for q in qs:
        pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(page_path.as_uri() + ('?free=1&' + q if q else '?free=1'))
        pg.wait_for_timeout(WAIT)
        fn = out / f"{name}-{(q or 'default').replace('&', '_').replace('=', '-')[:80]}.png"
        pg.screenshot(path=str(fn))
        de = pg.evaluate("document.documentElement.dataset.errors || ''")
        nan = pg.evaluate("document.getElementById('art').innerHTML.includes('NaN')")
        print(fn.name, 'errors:', errs, de, 'NaN' if nan else '')
        pg.close()
    b.close()
