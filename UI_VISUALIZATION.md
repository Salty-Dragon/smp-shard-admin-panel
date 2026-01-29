# UI Changes Visualization

## Before and After Comparison

### BEFORE (Root Directory Only)
```
╔═══════════════════════════════════════════════════════════════╗
║  🔌 Plugin Management                                          ║
║  Manage server plugins - upload .jar files, edit configs...   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Upload Plugin                                                ║
║  [📤 Choose .jar File]                                        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Plugin Files (4)                              [🔄 Refresh]   ║
║  ─────────────────────────────────────────────────────────   ║
║  File              Size      Modified         Actions        ║
║  ─────────────────────────────────────────────────────────   ║
║  📁 PluginA        —         Jan 29, 2026    ✏️ Rename 🗑️ Delete
║  📁 PluginB        —         Jan 29, 2026    ✏️ Rename 🗑️ Delete
║  📁 PluginC        —         Jan 29, 2026    ✏️ Rename 🗑️ Delete
║  ☕ test.jar       2.5 MB    Jan 29, 2026    ✏️ Rename 🗑️ Delete
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Issues:
- ❌ Cannot navigate into folders
- ❌ Cannot access files in subdirectories
- ❌ No way to see folder contents
- ❌ Limited to root directory only
```

### AFTER (With Sub-folder Navigation)
```
╔═══════════════════════════════════════════════════════════════╗
║  🔌 Plugin Management                                          ║
║  Manage server plugins - upload .jar files, edit configs...   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Upload Plugin                                                ║
║  [📤 Choose .jar File]                                        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  📁 plugins / PluginA / config  ← Breadcrumb Navigation!      ║
║  ─────────────────────────────────────────────────────────   ║
║                                                               ║
║  Files (2)  [⬅️ Back]                          [🔄 Refresh]   ║
║  ─────────────────────────────────────────────────────────   ║
║  File              Size      Modified         Actions        ║
║  ─────────────────────────────────────────────────────────   ║
║  📝 settings.yml   156 B     Jan 29, 2026    ✏️ Edit ✏️ Rename 🗑️
║  📝 advanced.yml   89 B      Jan 29, 2026    ✏️ Edit ✏️ Rename 🗑️
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Features:
- ✅ Breadcrumb shows full path
- ✅ Click breadcrumbs to jump to any level
- ✅ Back button to parent directory
- ✅ Edit files at any depth
- ✅ Upload to subdirectories
- ✅ All operations work in subdirectories
```

## Navigation Flow Example

### Step 1: Root Directory
```
Location: /plugins

Files shown:
📁 PluginA     (clickable folder)
📁 PluginB     (clickable folder)  
📁 PluginC     (clickable folder)
☕ test.jar    (JAR file)

Actions:
- Click on "PluginA" folder → Navigate into PluginA
```

### Step 2: Inside PluginA
```
Location: /plugins/PluginA

Breadcrumb: 📁 plugins / PluginA
Back button: [⬅️ Back]

Files shown:
📁 config      (clickable folder)
📝 config.yml  (editable config file)

Actions:
- Click "config" folder → Navigate into config
- Click "plugins" in breadcrumb → Go back to root
- Click [⬅️ Back] → Go to root
- Click "✏️ Edit" on config.yml → Edit file at this location
```

### Step 3: Deep in PluginA/config
```
Location: /plugins/PluginA/config

Breadcrumb: 📁 plugins / PluginA / config
Back button: [⬅️ Back]

Files shown:
📝 settings.yml    (editable)
📝 advanced.yml    (editable)

Actions:
- Click "PluginA" in breadcrumb → Jump to PluginA
- Click "plugins" in breadcrumb → Jump to root
- Click [⬅️ Back] → Go to PluginA
- Edit any file at this depth
- Upload JAR files here
```

## UI Components Added

### 1. Breadcrumb Navigation
```typescript
// Visual example of breadcrumb rendering
<div className="breadcrumbs">
  [📁 plugins] / [PluginA] / [config]
   ^clickable    ^clickable   ^current
</div>

Features:
- Each segment is clickable
- Current location highlighted in green
- Slash separators between segments
- Folder icon on first segment
```

### 2. Clickable Folders
```typescript
// Before: Static text
<div>
  <span>📁</span>
  <span>PluginA</span>
</div>

// After: Interactive button
<button onClick={() => navigateToFolder('PluginA')}>
  <span>📁</span>
  <span>PluginA</span>  ← Clickable & highlighted on hover
</button>
```

### 3. Back Button
```typescript
// Only shown when in subdirectory
{currentPath && (
  <button onClick={navigateBack}>
    ⬅️ Back
  </button>
)}
```

### 4. Directory Size Display
```typescript
// Before: Shows "0 B" for directories
<td>{formatFileSize(file.size)}</td>

// After: Shows dash for directories
<td>{file.isDirectory ? '—' : formatFileSize(file.size)}</td>
```

## User Experience Flow

### Scenario: Edit a nested config file

1. **User starts at plugins page**
   - Sees list of plugins and folders

2. **User clicks "PluginA" folder**
   - Page updates to show PluginA contents
   - Breadcrumb shows: 📁 plugins / PluginA
   - Back button appears

3. **User clicks "config" folder** 
   - Page updates to show config folder contents
   - Breadcrumb shows: 📁 plugins / PluginA / config
   - Settings files are visible

4. **User clicks "✏️ Edit" on settings.yml**
   - Modal opens with file content
   - File path shown in modal title

5. **User edits and saves**
   - Changes saved to PluginA/config/settings.yml
   - Success message shown
   - Still in PluginA/config directory
   - File list refreshes

6. **User clicks "plugins" in breadcrumb**
   - Instantly jumps back to root directory
   - No need to click back multiple times

## Technical Implementation Highlights

### Path Handling
```typescript
// Old API call (root only)
fetch('/apanel44/api/files')

// New API call (with path support)
fetch('/apanel44/api/files?path=PluginA/config')

// File operation in subdirectory
fetch('/apanel44/api/files/settings.yml?path=PluginA/config')
```

### State Management
```typescript
// Track current directory
const [currentPath, setCurrentPath] = useState('');

// Navigate to folder
const navigateToFolder = (folderName: string) => {
  const newPath = currentPath 
    ? `${currentPath}/${folderName}` 
    : folderName;
  fetchFiles(newPath);
};

// Navigate back
const navigateBack = () => {
  const parts = currentPath.split('/');
  parts.pop();
  fetchFiles(parts.join('/'));
};
```

### Security Validation
```typescript
// Server-side path validation
export function sanitizePath(relativePath: string): string {
  // Remove leading/trailing slashes
  let normalized = relativePath.replace(/^\/+|\/+$/g, '');
  
  // Split and validate each segment
  const segments = normalized.split('/');
  
  // Block path traversal
  for (const segment of segments) {
    if (/^\.+$/.test(segment)) return '';  // Block . and ..
    if (/[<>:"|?*\0]/.test(segment)) return '';  // Block dangerous chars
  }
  
  return segments.join('/');
}
```

## Benefits

1. **User-Friendly**
   - Intuitive breadcrumb navigation
   - Clear visual feedback
   - One-click folder navigation

2. **Efficient**
   - Quick access to any directory level
   - No need for repeated navigation
   - Breadcrumb shortcuts save clicks

3. **Secure**
   - All paths validated server-side
   - Path traversal attacks blocked
   - Activity logged for audit

4. **Complete**
   - Works with all file operations
   - Supports unlimited nesting depth
   - Maintains context across actions

5. **Well-Documented**
   - Comprehensive API docs
   - Testing guide with 30+ test cases
   - Implementation summary
