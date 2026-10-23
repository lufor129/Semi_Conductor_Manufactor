"""把 docs/qa-by-topic.md 轉成簡報附錄用的 js/qa-data.js。

用法：python3 gen-qa.py（改完 md 後重跑一次，再跑 build-artifact.py）
「頁」欄一律寫投影片 id（例如 mloop、wat），不寫頁碼；頁序調整也不會跳錯。寫到頁碼會直接報錯。
答案內文也不能寫死「第 N 頁」（頁序一調就錯，改靠跳頁按鈕），寫到也會直接報錯。
"""
import json, re, pathlib, sys

ROOT = pathlib.Path(__file__).parent
ALIAS = {'etch2': 'etch1', 'hk2': 'hk1'}  # 已合併的頁


def pages(cell, n):
    if re.search(r'(?<![A-Za-z0-9])\d+', cell):
        sys.exit(f'第 {n} 題的「頁」欄寫了頁碼：{cell}。請改寫投影片 id（見 index.html 的 Deck.move 或 docs/review-v5/_pages.md）')
    ids = []
    for t in re.findall(r'[a-z][A-Za-z0-9]+', cell):
        t = ALIAS.get(t, t)
        if t not in ids:
            ids.append(t)
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
        m = re.search(r'第\s*\d+\s*頁', c[2])
        if m:
            sys.exit(f'第 {c[0]} 題的答案寫死了頁碼「{m.group(0)}」。請刪掉，改在「頁」欄寫投影片 id，靠跳頁按鈕')
        cur['items'].append({'n': int(c[0]), 'q': c[1], 'a': c[2], 'go': pages(c[3], c[0])})

out = '/* 由 gen-qa.py 從 docs/qa-by-topic.md 產生，請勿手改 */\nwindow.QA = ' + json.dumps(groups, ensure_ascii=False, indent=0) + ';\n'
(ROOT / 'js/qa-data.js').write_text(out, encoding='utf-8')
print(len(groups), 'topics,', sum(len(g['items']) for g in groups), 'questions')
