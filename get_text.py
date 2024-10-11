import os
import glob
import pyperclip

folders = ['frontend/src/components']
files = ['frontend/src/SVGVolumeCurveEditor.jsx']

def get_file_content(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return ""

all_content = []

# Get content from folders
for folder in folders:
    for file_path in glob.glob(os.path.join(folder, '**'), recursive=True):
        if os.path.isfile(file_path):
            content = get_file_content(file_path)
            all_content.append(f"\n\n{'='*50}\nFile: {file_path}\n{'='*50}\n\n{content}")

# Get content from specific files
for file_path in files:
    content = get_file_content(file_path)
    all_content.append(f"\n\n{'='*50}\nFile: {file_path}\n{'='*50}\n\n{content}")

# Join all content
final_content = "\n".join(all_content)

# Copy to clipboard
pyperclip.copy(final_content)

# Print the content
print(final_content)

print("\nAll content has been copied to clipboard.")
