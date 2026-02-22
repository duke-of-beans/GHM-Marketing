import re

with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\_source.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find the nav menu
nav_start = html.find('<ul id="et-top-navigation"')
if nav_start == -1:
    nav_start = html.find('id="et-top-navigation"')
print('Nav start pos:', nav_start)

# Find the full header section (everything from top-header to end of nav/header)
header_full_start = html.find('<div id="top-header"')
header_full_end = html.find('</header>') + len('</header>')
header_full = html[header_full_start:header_full_end]
print('Full header length:', len(header_full))

# Save it
with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\_raw_header_full.html','w',encoding='utf-8') as f:
    f.write(header_full)

# Also check for schedule bar after header
post_header = html[header_full_end:header_full_end+500]
print('\nPost-header snippet:')
print(post_header[:300])
