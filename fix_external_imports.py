
import os
import re

# Mapping of component name to its new subfolder in src/components
component_map = {
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

# Directories to scan
scan_dirs = ["src/routes", "src/hooks", "src/contexts", "src/pages"] # Add others if needed

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    def replacer(match):
        # match.group(1) is the opening quote
        # match.group(2) is the path content (e.g. ../../components/Button)
        quote = match.group(1)
        path = match.group(2)
        
        # We only care if it ends with one of our components
        # e.g. path ends with /Button
        parts = path.split('/')
        component_name = parts[-1]
        
        if component_name in component_map:
            subfolder = component_map[component_name]
            # Replace with absolute alias which is safer: @/components/subfolder/Component
            return f"from {quote}@/components/{subfolder}/{component_name}"
        
        return match.group(0)

    # Regex to find imports from relative paths ending with component name
    # e.g. from "../../components/Button"
    # match anything that looks like a relative path to components
    # (../)*components/Name
    
    # Strategy: Match any import string, check if it ends with a known component name
    content = re.sub(r"from (['\"])(.*?)(['\"])", replacer, content)
    
    if content != original_content:
        print(f"Fixed {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

for d in scan_dirs:
    if not os.path.exists(d): continue
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                fix_imports(os.path.join(root, file))
