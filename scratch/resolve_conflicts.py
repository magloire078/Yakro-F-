import os

def resolve_conflict(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    in_conflict = False
    keep_head = False # Change this to True to keep HEAD, False to keep the other side
    side = None # 'HEAD' or 'OTHER'
    
    for line in lines:
        if line.startswith('<<<<<<<'):
            in_conflict = True
            side = 'HEAD'
            continue
        elif line.startswith('======='):
            side = 'OTHER'
            continue
        elif line.startswith('>>>>>>>'):
            in_conflict = False
            side = None
            continue
        
        if in_conflict:
            if side == 'OTHER': # We want to keep the Elite version (the incoming change)
                new_lines.append(line)
        else:
            new_lines.append(line)
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

files_to_resolve = [
    r'c:\Users\HP EliteBook\Documents\GitHub\Yakro-F-\next.config.ts',
    r'c:\Users\HP EliteBook\Documents\GitHub\Yakro-F-\src\components\restaurant-card.tsx'
]

for file_path in files_to_resolve:
    if os.path.exists(file_path):
        resolve_conflict(file_path)
        print(f"Resolved {file_path}")
    else:
        print(f"File not found: {file_path}")
