import os, re

ROOT = r"D:\Work\ContentStudio\clients\german-auto-doctor\satellites\audi"
FAVICON = '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n'
SKIP = os.path.join(ROOT, "index.html")

for dirpath, _, files in os.walk(ROOT):
    for fname in files:
        if fname != "index.html":
            continue
        fpath = os.path.join(dirpath, fname)
        if fpath == SKIP:
            continue
        with open(fpath, encoding="utf-8") as f:
            content = f.read()
        if 'favicon' in content:
            print(f"SKIP (already has favicon): {fpath}")
            continue
        # Insert before <link rel="canonical"
        new = content.replace('<link rel="canonical"', FAVICON + '<link rel="canonical"', 1)
        if new == content:
            print(f"WARN (no canonical found): {fpath}")
        else:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new)
            print(f"OK: {fpath}")
