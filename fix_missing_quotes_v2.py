
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
    "src/routes/settings/profile.tsx"
]

def fix_file(path):
    if not os.path.exists(path):
        return

    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    modified = False
    
    for line in lines:
        # Check for imports like: from "@/components/Foo
        # (missing closing quote)
        # Regex: from (quote) (@/components/...) (end of line or space but no closing quote)
        
        # Matches: from "@..." where there is no " at the end
        match = re.search(r'from (["\'])(@/components[a-zA-Z0-9/_.-]+)(?!["\'])', line)
        
        if match:
            # Check if it really misses the quote
            # match.group(0) is `from "@...`
            # Look at what follows in the line
            full_match_str = match.group(0)
            rest_of_line = line[match.end():]
            
            # If rest_of_line doesn't start with closing quote
            if not rest_of_line.startswith(match.group(1)):
                # Fix it by appending the quote
                # We reconstruct the line
                # line = line[:match.end()] + match.group(1) + line[match.end():]
                # Actually, simply appending to match end might be safe
                
                # Careful not to double quote if I misdiagnosed
                # But my previous script blindly chopped the quote.
                
                # Let's just use replace
                old_import = match.group(2)
                quote = match.group(1)
                
                # e.g. from "@/components/Foo
                # We want from "@/components/Foo"
                
                # The line might be: import X from "@/components/Foo;\n"
                # split by quote?
                
                parts = line.split(quote)
                # parts[0] = import X from 
                # parts[1] = @/components/Foo; or @/components/Foo
                
                if len(parts) >= 2:
                    path_part = parts[1]
                    # If it ends with semicolon or newline without quote
                    # cleanup
                    path_clean = path_part.rstrip(';\n\r')
                    
                    if not path_clean.endswith(quote):
                        # It's broken.
                        # Rebuild line
                        # import ... from "path"
                        # We just add the quote before the semicolon/newline
                        
                        # Find where path ends
                        # It ends at first non-path char or newline
                        
                        # Simplest: Regex replacement
                        # Replace `from "path` with `from "path"`
                        
                        line = line.replace(f'from {quote}{path_clean}', f'from {quote}{path_clean}{quote}')
                        modified = True

        new_lines.append(line)

    if modified:
        print(f"Fixed {path}")
        with open(path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)

for f in files_to_fix:
    fix_file(f)
