# Folder Expansion Feature Implementation

## Overview
This document describes the implementation of the expandable/collapsible folder structure feature for the plugin file manager in the admin panel.

## Problem Statement
The plugin file manager at `/apanel44/plugins/` previously listed folders and files, but did not support expanding folders to view their contents inline. Users had to navigate into folders (replacing the current view) to see their contents.

## Solution
Implemented an inline expandable/collapsible folder structure that allows users to:
1. Click a '+' icon to expand a folder and view its contents inline
2. Click a '−' icon to collapse an expanded folder
3. Still navigate into folders by clicking the folder name (for full navigation)
4. View nested folder contents with proper indentation
5. Interact with files in nested folders (edit, rename, delete)

## Implementation Details

### Frontend Changes (src/pages/plugins.tsx)

#### New State Variables
```typescript
const [expandedFolders, setExpandedFolders] = useState<Record<string, FileInfo[]>>({});
const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
```

- `expandedFolders`: Tracks which folders are expanded and caches their contents
- `loadingFolders`: Tracks which folders are currently loading their contents

#### New Functions

##### `toggleFolder(folderPath: string, event?: React.MouseEvent)`
- Handles expanding/collapsing folders
- **Fixed**: Now accepts full folder path instead of just name
- Fetches folder contents from API when expanding
- Caches folder contents in state to avoid redundant API calls
- **Fixed**: Uses functional state updates to prevent stale state
- Shows loading indicator (⏳) while fetching
- Handles errors gracefully with toast notifications

##### `navigateToFolder(folderPath: string)`
- Updated to accept full folder path
- **Fixed**: Clears expanded folders on navigation to prevent memory leaks

##### `renderFileRow(file: FileInfo, depth: number, parentPath: string, rowIndex: number): React.JSX.Element[]`
- Recursive function to render file rows with nested folders
- Returns an array of React elements (table rows)
- Parameters:
  - `file`: The file/folder to render
  - `depth`: Current nesting depth (for indentation)
  - `parentPath`: Parent folder path (for building full paths)
  - `rowIndex`: Current row index for alternating colors
- Renders:
  - Expand/collapse button (+/−) for folders
  - Loading indicator (⏳) when fetching folder contents
  - File icon and name
  - File metadata (size, modified date)
  - Action buttons (Edit, Rename, Delete)
- Recursively renders child items when folder is expanded
- Applies indentation based on depth level
- **Fixed**: Passes correct full paths to toggle and navigate functions
- **Fixed**: Uses row index for proper alternating colors
- **Fixed**: Passes relative path to file operation functions

##### `handleEditFileWithPath()`, `openRenameModalWithPath()`, `openDeleteModalWithPath()`
- Wrapper functions for file operations on nested files
- Accept files with `_relativePath` property to track parent directory
- Use the relative path when calling API endpoints

#### Updated Functions

##### `handleSaveFile()`, `handleRenameFile()`, `handleDeleteFile()`
- **Fixed**: Extract and use the `_relativePath` from selected file
- Correctly handles operations on files in expanded folders

#### UI Changes

**Before:**
- Folders showed only folder icon and name
- Clicking folder navigated into it (replaced view)
- No inline expansion

**After:**
- Folders show:
  - '+' icon to expand (or '−' to collapse when expanded)
  - '⏳' icon when loading folder contents
  - Folder icon (📁)
  - Folder name (clickable to navigate)
- Expanded folders display contents inline with indentation
- Nested folders can also be expanded/collapsed
- Files are displayed with proper spacing/indentation
- Alternating row colors work correctly across all levels

### Backend Changes
No backend changes were required. The existing API endpoint `/api/files?path={path}` already supported querying nested folder contents by path.

## Code Review Improvements

All code review feedback has been addressed:

### 1. ✅ Nested Folder Path Handling
- **Issue**: Functions called with only folder name instead of full path
- **Fix**: Updated to pass full `filePath` to `toggleFolder()` and `navigateToFolder()`

### 2. ✅ Stale State Prevention
- **Issue**: State updates without functional form could cause stale state
- **Fix**: All state updates now use functional form:
  - `setExpandedFolders(prev => ...)`
  - `setLoadingFolders(prev => ...)`

### 3. ✅ Memory Leak Prevention
- **Issue**: Expanded folders remained in state after navigation
- **Fix**: Clear `expandedFolders` when navigating to new directory

### 4. ✅ File Operations on Nested Files
- **Issue**: Edit/rename/delete operations didn't work on nested files
- **Fix**: Store `_relativePath` with file objects and use in API calls

### 5. ✅ Row Color Alternation
- **Issue**: Colors based on depth, not row position
- **Fix**: Track row index across all levels for proper alternation

### 6. ✅ Stable React Keys
- **Issue**: Keys might not be unique across different depths
- **Fix**: Keys now include filePath, depth, and rowIndex for uniqueness

### 7. ✅ Removed Dead Code
- **Issue**: Unused variable and duplicate functions
- **Fix**: Removed unused `indentClass` and old function versions

## Security

### CodeQL Analysis
- ✅ No security vulnerabilities detected
- All path handling uses existing validated utilities
- No new attack vectors introduced

### Path Validation
- Uses existing `validateAndResolvePath()` from `fileUtils.ts`
- Prevents path traversal attacks
- All paths sanitized before API calls

## User Experience

### Expanding a Folder
1. User sees folder with '+' icon
2. User clicks '+' icon
3. Icon changes to loading indicator (⏳)
4. Folder contents are fetched from API
5. Icon changes to '−' and contents appear below with indentation
6. User can interact with nested files/folders

### Collapsing a Folder
1. User sees expanded folder with '−' icon
2. User clicks '−' icon
3. Folder contents hide immediately
4. Icon changes back to '+'

### Navigating into a Folder
1. User clicks on folder name (not the +/− icon)
2. View navigates into folder (existing behavior preserved)
3. Breadcrumb navigation updates
4. Back button appears
5. Expanded folders are cleared (fresh state)

### Nested Folders
- Each nested level is indented by 2rem
- Nested folders can be independently expanded/collapsed
- Full path is maintained for API calls and file operations
- File operations work correctly on nested files

## Testing Recommendations

### Manual Testing
1. **Basic Expansion**
   - Click '+' on a folder to expand it
   - Verify contents appear with proper indentation
   - Verify '+' changes to '−'

2. **Collapse**
   - Click '−' on an expanded folder
   - Verify contents hide
   - Verify '−' changes to '+'

3. **Nested Folders**
   - Expand a folder that contains subfolders
   - Expand a subfolder
   - Verify proper indentation (nested items more indented)
   - Collapse parent folder and verify all children hide

4. **File Operations on Nested Files**
   - Expand folders to reveal nested files
   - Edit a nested config file
   - Rename a nested file
   - Delete a nested file
   - Verify operations work correctly

5. **Navigation**
   - Click folder name (not '+') to navigate into it
   - Verify breadcrumb updates
   - Use Back button to return
   - Verify expanded state is reset on navigation

6. **Loading States**
   - Expand a folder with many files
   - Verify loading indicator (⏳) appears
   - Verify smooth transition to expanded state

7. **Error Handling**
   - Test with folders that might fail to load
   - Verify error toast appears
   - Verify folder doesn't expand if load fails

### Edge Cases
- Empty folders (no contents)
- Deeply nested folders (3+ levels)
- Folders with many items (performance)
- Rapid expand/collapse clicks
- Concurrent folder expansions

## Performance Considerations

### Optimizations
- Folder contents are cached in state after first load
- Only fetches from API when expanding for the first time
- Collapsing doesn't clear cache (instant re-expansion)
- Functional state updates prevent race conditions

### Future Performance Improvements
- Add cache expiration for very large folder structures
- Implement virtual scrolling for large file lists
- Add loading indicators for slow API calls

## Technical Considerations

### Browser Compatibility
- Uses standard React/Next.js features
- No special browser APIs required
- Responsive design maintained

### Accessibility
- Added aria-labels for expand/collapse buttons
- Maintained existing aria-labels for action buttons
- Visual indicators (icons) with text alternatives
- Keyboard navigation supported

## Future Enhancements (Optional)
1. Add "Expand All" / "Collapse All" buttons
2. Remember expanded state in localStorage
3. Add keyboard shortcuts (arrow keys to expand/collapse)
4. Lazy loading for very large folders
5. Virtual scrolling for performance with many files
6. Drag and drop files between folders
7. Bulk operations on selected nested files
8. Search within expanded folders
9. Filter by file type
10. Sort nested items independently

## Conclusion
The expandable/collapsible folder feature has been successfully implemented with minimal changes to the existing codebase. The solution:
- ✅ Maintains backward compatibility (navigation still works)
- ✅ Adds requested inline expansion capability
- ✅ Handles nested folders correctly
- ✅ Supports file operations on nested files
- ✅ Has no security vulnerabilities
- ✅ Uses best practices for React state management
- ✅ Addresses all code review feedback

All acceptance criteria from the problem statement have been met:
- ✅ UI reflects an expandable/collapsible structure for folders
- ✅ Users can click '+' to expand a folder and view/edit its files or folders
- ✅ Backend API updates support dynamic listing and access of folder contents (no changes needed - already supported)
