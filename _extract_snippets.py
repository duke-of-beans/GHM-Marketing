import re

with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\_source.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract top-header div
m = re.search(r'(<div[^>]*id=["\']top-header["\'][^>]*>.*?</div>)\s*(<div|<header)', html, re.DOTALL)
top_bar = m.group(1) if m else None

# Extract main-header
m2 = re.search(r'(<(?:header|div)[^>]*id=["\']main-header["\'][^>]*>.*?</(?:header|div)>)\s*<(?:div|nav|section|main)', html, re.DOTALL)
header = m2.group(1) if m2 else None

# Extract footer
m3 = re.search(r'(<footer[\s\S]*?</footer>)', html)
footer = m3.group(1) if m3 else None

print('TOP BAR found:', bool(top_bar), 'length:', len(top_bar) if top_bar else 0)
print('HEADER found:', bool(header), 'length:', len(header) if header else 0)
print('FOOTER found:', bool(footer), 'length:', len(footer) if footer else 0)

if top_bar:
    with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\_raw_topbar.html','w',encoding='utf-8') as f: f.write(top_bar)
if header:
    with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\_raw_header.html','w',encoding='utf-8') as f: f.write(header)
if footer:
    with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\_raw_footer.html','w',encoding='utf-8') as f: f.write(footer)

print('Files written.')
