"""把 docs/qa-by-topic.md 轉成簡報附錄用的 js/qa-data.js。

用法：python3 gen-qa.py（改完 md 後重跑一次，再跑 build-artifact.py）
頁碼依目前頁序換成投影片 id，之後頁序變動，跳頁仍然正確。
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).parent
# 目前頁序（第 n 頁 = ORDER[n-1]）；頁序有變動時更新這裡
ORDER = ["cover", "agenda", "scale", "p1", "parts", "mosfet", "nfetpfet", "sce", "struct3d", "gatectl", "nodename", "timeline",
         "fabs", "cost", "p1sum", "p2", "loop", "litho1", "lithoL", "litho3", "litho3m", "litho4", "litho5", "litho6", "cmask",
         "etch1", "etch2", "etch3", "etch4", "depo4", "depo1", "depo2", "asd", "depo3", "dope1", "dope3", "hk1", "hk2", "cmp1",
         "cmp2", "cmp3", "gaaflow", "tcad1", "tcad2", "metro", "tem", "sem", "ocd", "p2sum", "p3", "pkg0", "pkg", "pkg2", "pkg4",
         "pkg3", "glass", "cowcmp", "cpo", "bsx", "bs3", "bs2", "bs4", "cfet", "roadmap", "summary", "refs"]


ALIAS = {'etch2': 'etch1', 'hk2': 'hk1'}  # 已合併的頁


def pages(cell):
    ids = [t for t in re.findall(r'[a-z][a-z0-9]+', cell)]  # 也可以直接寫投影片 id（不受頁序變動影響）
    nums = re.sub(r'[a-z][a-z0-9]+', ' ', cell)  # 投影片 id 裡的數字（litho1、tcad2）不是頁碼
    for a, b in re.findall(r'(\d+)(?:\s*[–-]\s*(\d+))?', nums):
        lo, hi = int(a), int(b or a)
        for n in range(lo, hi + 1):
            sid = ALIAS.get(ORDER[n - 1], ORDER[n - 1]) if 1 <= n <= len(ORDER) else None
            if sid and sid not in ids:
                ids.append(sid)
    return ids


groups, part, cur = [], '', None
for line in (ROOT / 'docs/qa-by-topic.md').read_text(encoding='utf-8').splitlines():
    if line.startswith('## '):
        part = line[3:].strip()
        if part.startswith('進階題'):
            cur = {'part': '進階', 'topic': '台下有業界人士時', 'items': []}
            groups.append(cur)
        elif part.startswith('臨場'):
            cur = None
    elif line.startswith('### '):
        topic = re.sub(r'（第.*?頁）', '', line[4:]).strip()
        cur = {'part': part.split('：')[0], 'topic': topic, 'items': []}
        groups.append(cur)
    elif cur is not None and line.startswith('| ') and line.split('|')[1].strip().isdigit():
        c = [x.strip() for x in line.strip().strip('|').split('|')]
        cur['items'].append({'n': int(c[0]), 'q': c[1], 'a': c[2], 'go': pages(c[3])})

out = '/* 由 gen-qa.py 從 docs/qa-by-topic.md 產生，請勿手改 */\nwindow.QA = ' + json.dumps(groups, ensure_ascii=False, indent=0) + ';\n'
(ROOT / 'js/qa-data.js').write_text(out, encoding='utf-8')
print(len(groups), 'topics,', sum(len(g['items']) for g in groups), 'questions')
