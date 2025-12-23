
import os

dirs = ["src/components/modules", "src/components/view", "src/components/common"]

for d in dirs:
    if not os.path.exists(d): continue
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                for i, line in enumerate(lines):
                    if 'from' in line and '../' in line:
                        print(f"{path}:{i+1}: {line.strip()}")
