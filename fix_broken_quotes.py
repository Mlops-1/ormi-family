
import os
import re

files_to_fix = [
    "src/routes/index.tsx",
    "src/routes/login.tsx",
    "src/routes/map.tsx",
    "src/routes/ormi-team.tsx",
    "src/routes/signup.tsx",
    "src/routes/user-info.tsx",
    "src/routes/user.tsx",
    "src/routes/__root.tsx",
    "src/routes/auth/callback.tsx",
    "src/routes/settings/profile.tsx"
]

def fix_file(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    modified = False
    
    for line in lines:
        # Check for imports from @/components that might be missing a closing quote
        # They likely look like: from "@/components/..."
        # And are missing the closing " or '
        
        # Regex: matches from "path but no closing quote before ; or newline
        # matching: from (quote) (content) (end of line or ;)
        # We need to see if the quote matches.
        
        match = re.search(r'from (["\'])(@/components/[a-zA-Z0-9_/]+)(?![/a-zA-Z0-9])', line)
        if match:
            # Check if there is a closing quote
            # The regex matched the start. Let's see the rest of the line.
            # If the character after the path is NOT the quote, we fix it.
            
            full_match = match.group(0)
            quote = match.group(1)
            path = match.group(2)
            
            # Index where path ends
            idx = line.find(path) + len(path)
            
            # Check char at idx
            if idx >= len(line) or line[idx] not in ['"', "'"]:
                # Missing quote!
                # We need to insert the quote at idx
                line = line[:idx] + quote + line[idx:]
                modified = True
        
        new_lines.append(line)

    if modified:
        print(f"Fixed quotes in {path}")
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)

for f in files_to_fix:
    fix_file(f)
