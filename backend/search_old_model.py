import os

project_dir = r"c:\Users\sinchana k\OneDrive\Documents\my project"
target_str = "llama-3.3-70b-versatile"

found_files = []
for root, dirs, files in os.walk(project_dir):
    if "node_modules" in root or ".git" in root or "__pycache__" in root or "venv" in root:
        continue
    for file in files:
        if file.endswith((".py", ".env", ".js", ".jsx", ".json", ".md", ".txt", ".html")):
            fpath = os.path.join(root, file)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if target_str in content:
                        found_files.append(fpath)
            except Exception:
                pass

print(f"Files containing '{target_str}':")
for fp in found_files:
    print(f"  - {fp}")
