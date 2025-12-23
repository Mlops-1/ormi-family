import os
import re

# Mapping of filename (without extension) to its new folder relative to src/components
file_map = {
    # common
    "Button": "common",
    "Checkbox": "common",
    "DesktopNotice": "common",
    "ErrorBoundary": "common",
    "Input": "common",
    "LoadingScreen": "common",
    "Logo": "common",
    "ModeToggle": "common",
    "Notification": "common",
    "RadioGroup": "common",
    "SocialButton": "common",
    "ThemeToggle": "common",
    # view
    "AccessibilityInfo": "view",
    "BarrierFreeFilter": "view",
    "BottomNavigation": "view",
    "CategoryFilter": "view",
    "ChatbotContent": "view",
    "ChatbotPanel": "view",
    "CourseThumbnailMap": "view",
    "DogRiveAnimation": "view",
    "FavoriteMapModal": "view",
    "FavoritesBottomSheet": "view",
    "JejuPalettePreview": "view",
    "LocationPicker": "view",
    "LocationPickerModal": "view",
    "MapSideFilters": "view",
    "OnboardingOverlay": "view",
    "SideNavigation": "view",
    "SpotDetailModal": "view",
    "SpotInteractionSheet": "view",
    "SwipeableCardList": "view",
    "WeatherWidget": "view",
    # modules
    "BackgroundMap": "modules",
    "GeoLocation": "modules",
    "LocationManager": "modules",
    "ProtectedRoute": "modules",
    "RouteNavigation": "modules"
}

# Root directory
root_dir = "src"

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Fix absolute imports: '@/components/Filename' -> '@/components/folder/Filename'
    # Pattern: from ['"]@/components/Filename['"] or import ... from ...
    # We look for @/components/ followed by a filename in our map, followed by ' or " or /
    
    def replace_absolute(match):
        full_match = match.group(0) # e.g. '@/components/Button
        component_name = match.group(1)
        if component_name in file_map:
            new_folder = file_map[component_name]
            return f"@/components/{new_folder}/{component_name}"
        return full_match

    # Regex for @/components/Name where Name is in our map bounds
    # We assume Name is followed by quote or slash or end
    # Actually most imports are straight to file. e.g. @/components/Button
    # We match @/components/([a-zA-Z0-9]+) then check validity
    content = re.sub(r"@/components/([a-zA-Z0-9]+)", replace_absolute, content)

    # 2. Fix relative imports inside src/components/...
    # Only applicable if we are in src/components/subdir
    
    # Determine current file's category (folder)
    current_folder = None
    if "src/components/common" in file_path.replace("\\", "/"):
        current_folder = "common"
    elif "src/components/view" in file_path.replace("\\", "/"):
        current_folder = "view"
    elif "src/components/modules" in file_path.replace("\\", "/"):
        current_folder = "modules"

    if current_folder:
        def replace_relative(match):
            # match.group(1) is the quote
            # match.group(2) is the filename (e.g. Button)
            quote = match.group(1)
            component_name = match.group(2)
            
            if component_name in file_map:
                target_folder = file_map[component_name]
                if target_folder == current_folder:
                    return f"from {quote}./{component_name}"
                else:
                    return f"from {quote}../{target_folder}/{component_name}"
            return match.group(0)

        # Regex for: from './Filename' or from "./Filename"
        content = re.sub(r"from (['\"])\./([a-zA-Z0-9]+)", replace_relative, content)
    
    if content != original_content:
        print(f"Updating {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

# Walk through src
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Done.")
