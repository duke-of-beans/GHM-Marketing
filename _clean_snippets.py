import re

def clean_nitro(html):
    # Replace nitro-lazy-src with src, remove base64 placeholder srcs
    # Pattern: src="data:image/svg+xml;nitro-empty-id=...;base64,..." nitro-lazy-src="REAL_URL"
    # We want src="REAL_URL"
    
    # First: replace src="data:...base64..." with src="" where nitro-lazy-src exists nearby
    # Strategy: for each <img> tag, if nitro-lazy-src present, use it as src
    def fix_img(m):
        tag = m.group(0)
        # Extract nitro-lazy-src value
        lazy = re.search(r'nitro-lazy-src=["\']([^"\']+)["\']', tag)
        if lazy:
            real_src = lazy.group(1)
            # Replace src="data:..." with src="REAL_URL"
            tag = re.sub(r'\s*src=["\'][^"\']*nitro-empty[^"\']*["\']', '', tag)
            tag = re.sub(r'\s*nitro-lazy-src=["\'][^"\']+["\']', '', tag)
            tag = re.sub(r'\s*nitro-lazy-empty', '', tag)
            tag = re.sub(r'\s*class=["\']nitro-lazy["\']', '', tag)
            tag = re.sub(r'(<img\b)', r'\1 src="' + real_src + '"', tag)
        return tag
    
    html = re.sub(r'<img\b[^>]+>', fix_img, html, flags=re.DOTALL)
    
    # Clean nitro-lazy class from <a> tags
    html = re.sub(r'\s*class=["\']nitro-lazy["\']', '', html)
    
    # Remove decoding="async" and nitro attrs
    html = re.sub(r'\s*decoding=["\']async["\']', '', html)
    html = re.sub(r'\s*nitro-lazy-empty', '', html)
    html = re.sub(r'\s*data-height-onload=["\'][^"\']*["\']', '', html)
    html = re.sub(r'\s*data-height-percentage=["\'][^"\']*["\']', '', html)
    
    return html

# Load and clean header
with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\_raw_header_full.html', 'r', encoding='utf-8') as f:
    header_html = f.read()

with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\_raw_footer.html', 'r', encoding='utf-8') as f:
    footer_html = f.read()

clean_header = clean_nitro(header_html)
clean_footer = clean_nitro(footer_html)

# Add schedule bar (not in header tag, comes after in source)
schedule_bar = '<div id="et-main-area"><div id="main-content">'  # not what we want

# Save cleaned versions
with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\gad-header.html', 'w', encoding='utf-8') as f:
    f.write('<!-- GAD HEADER: Extracted from live site + cleaned. Re-run _extract2.py to update. -->\n')
    f.write(clean_header)
    f.write('\n<!-- Schedule bar -->\n')
    f.write('<div id="gad-schedule-bar" style="background:#000;text-align:center;padding:14px 0;">')
    f.write('<a href="https://germanautodoctorsimivalley.com/schedule-appointment/" style="color:#fff;font-family:\'Roboto Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">SCHEDULE APPOINTMENT</a>')
    f.write('</div>')

with open(r'D:\Work\ContentStudio\clients\german-auto-doctor\snippets\gad-footer.html', 'w', encoding='utf-8') as f:
    f.write('<!-- GAD FOOTER: Extracted from live site + cleaned. Re-run _extract2.py to update. -->\n')
    f.write(clean_footer)

print('Done. Header:', len(clean_header), 'Footer:', len(clean_footer))

# Preview first 500 chars of header to verify img tags
print('\n--- HEADER IMG CHECK ---')
for m in re.finditer(r'<img[^>]+>', clean_header[:3000]):
    print(m.group(0)[:200])
    print()
