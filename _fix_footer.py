path = r'D:\Work\ContentStudio\clients\german-auto-doctor\hub-extensions\audi\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find footer start
footer_start = content.find('\n<!-- Footer -->')
if footer_start == -1:
    footer_start = content.rfind('\n<footer')

new_footer = (
    '\n<!-- Footer injected from shared snippet -->\n'
    '<div id="gad-footer-mount"></div>\n\n'
    '<script>\n'
    "const SNIPPETS = '../../snippets/';\n"
    'async function loadSnippet(url, mountId) {\n'
    '  try {\n'
    '    const r = await fetch(url);\n'
    '    document.getElementById(mountId).innerHTML = await r.text();\n'
    '  } catch(e) { console.warn("Snippet load failed:", url); }\n'
    '}\n'
    "loadSnippet(SNIPPETS + 'gad-header.html', 'gad-header-mount');\n"
    "loadSnippet(SNIPPETS + 'gad-footer.html', 'gad-footer-mount');\n"
    '</script>\n'
    '</body>\n'
    '</html>\n'
)

new_content = content[:footer_start] + new_footer
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Done. Total lines:', len(new_content.splitlines()))
