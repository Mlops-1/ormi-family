
import os
import re

types_dir = "src/types"

def convert_types_to_interface():
    for root, dirs, files in os.walk(types_dir):
        for file in files:
            if file.endswith(".ts") or file.endswith(".tsx"):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Regex to find: export type Name = { ... }
                # We want to change it to: export interface Name { ... }
                # But we have to be careful about union types or other complex types which can't be interfaces.
                # Interfaces only work for object shapes.
                
                # Pattern: export type Name = {  (multiline supported)
                # Note: This is a simplistic regex and might need refinement.
                # It looks for "export type [Name] = {" and replaces with "export interface [Name] {"
                
                new_content = re.sub(
                    r"export type\s+([a-zA-Z0-9_]+)\s*=\s*{",
                    r"export interface \1 {",
                    content
                )
                
                if new_content != content:
                    print(f"Refactoring {path}")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

if __name__ == "__main__":
    convert_types_to_interface()
