# Sub-folder Navigation - Testing Guide

## Overview
This document provides a comprehensive guide for testing the new sub-folder navigation feature in the plugin file management system.

## What Has Been Implemented

### Backend Changes
1. **Enhanced Path Handling**
   - Added `sanitizePath()` function for secure path sanitization
   - Updated `validateAndResolvePath()` to handle nested directory paths
   - Modified `listFiles()` to accept directory path parameter
   - All file operations (read, write, rename, delete) now support nested paths

2. **API Endpoints Updated**
   - `GET /apanel44/api/files?path=<directory>` - List files in subdirectory
   - `POST /apanel44/api/files` - Upload to subdirectory (with `path` field in FormData)
   - `GET /apanel44/api/files/[filename]?path=<directory>` - Read file from subdirectory
   - `PUT /apanel44/api/files/[filename]?path=<directory>` - Edit/rename file in subdirectory
   - `DELETE /apanel44/api/files/[filename]?path=<directory>` - Delete file from subdirectory

3. **Security Features**
   - Path traversal prevention (blocks `..`, `../..`, etc.)
   - Null byte filtering
   - Invalid character sanitization
   - Hidden file/folder filtering (leading dots)
   - All paths validated to stay within plugin directory

### Frontend Changes
1. **Breadcrumb Navigation**
   - Shows current path as clickable breadcrumbs
   - Click any breadcrumb to navigate to that level
   - Root directory shown as "📁 plugins"

2. **Folder Navigation**
   - Folders are displayed with folder icon (📁)
   - Click folder name to navigate into it
   - "Back" button appears when in subdirectory

3. **File Operations**
   - All operations (edit, rename, delete, upload) work in subdirectories
   - Context preserved when performing operations
   - Refresh returns to current directory

4. **UI Enhancements**
   - Directory size shows "—" instead of "0 B"
   - Folders are clickable and highlighted on hover
   - Current directory path shown in breadcrumbs

## Test Structure

A test directory structure has been created at `/opt/minecraft/dev/plugins/`:

```
plugins/
├── test-plugin.jar
├── PluginA/
│   ├── config.yml
│   └── config/
│       └── settings.yml
├── PluginB/
│   ├── data.json
│   └── data/
└── PluginC/
    └── lang/
        └── en_US.properties
```

## Manual Testing Checklist

### Basic Navigation Tests
- [ ] **View Root Directory**
  - Navigate to `/apanel44/plugins` page
  - Verify files and folders are listed
  - Confirm breadcrumb shows "📁 plugins"
  
- [ ] **Navigate Into Folder**
  - Click on "PluginA" folder
  - Verify subdirectory contents are shown
  - Confirm breadcrumb shows "📁 plugins / PluginA"
  - Verify "Back" button appears

- [ ] **Navigate Deeper**
  - From PluginA, click "config" folder
  - Verify settings.yml is shown
  - Confirm breadcrumb shows "📁 plugins / PluginA / config"

- [ ] **Breadcrumb Navigation**
  - Click "PluginA" in breadcrumb
  - Verify navigation to PluginA directory
  - Click "plugins" in breadcrumb
  - Verify navigation back to root

- [ ] **Back Button**
  - Navigate to PluginA/config
  - Click "Back" button
  - Verify navigation to PluginA
  - Click "Back" again
  - Verify navigation to root

### File Operation Tests

#### Read/View Operations
- [ ] **View File in Root**
  - In root directory, try to view a config file
  - Verify file content loads correctly

- [ ] **View File in Subdirectory**
  - Navigate to PluginA
  - Click "Edit" on config.yml
  - Verify file content displays correctly

- [ ] **View Nested File**
  - Navigate to PluginA/config
  - Click "Edit" on settings.yml
  - Verify file content displays correctly

#### Edit Operations
- [ ] **Edit File in Root**
  - Edit a config file in root directory
  - Save changes
  - Verify success message
  - Verify file remains in root directory after save

- [ ] **Edit File in Subdirectory**
  - Navigate to PluginA
  - Edit config.yml
  - Change some content and save
  - Verify success message
  - Verify still in PluginA directory after save

- [ ] **Edit Nested File**
  - Navigate to PluginA/config
  - Edit settings.yml
  - Save changes
  - Verify success message and correct directory

#### Rename Operations
- [ ] **Rename File in Root**
  - Rename a file in root directory
  - Verify success message
  - Verify file appears with new name

- [ ] **Rename File in Subdirectory**
  - Navigate to PluginA
  - Rename config.yml to config-backup.yml
  - Verify success message
  - Verify renamed file appears in same directory

#### Delete Operations
- [ ] **Delete File in Root**
  - Delete a test file from root
  - Confirm deletion
  - Verify file is removed from list

- [ ] **Delete File in Subdirectory**
  - Navigate to PluginA
  - Delete a file
  - Verify file is removed
  - Verify still in correct directory

#### Upload Operations
- [ ] **Upload to Root**
  - In root directory, upload a .jar file
  - Verify upload progress bar
  - Verify file appears in root list

- [ ] **Upload to Subdirectory**
  - Navigate to PluginA
  - Upload a .jar file
  - Verify file appears in PluginA directory
  - Verify file is actually in correct subdirectory on server

### Security Tests

#### Path Traversal Prevention
- [ ] **API Path Traversal Test**
  - Try to access: `GET /apanel44/api/files?path=../../../etc`
  - Expected: Should return error or empty list
  - Verify no access to parent directories

- [ ] **File Read Path Traversal**
  - Try to read: `GET /apanel44/api/files/passwd?path=../../../etc`
  - Expected: Should return 404 or error
  - Verify no access to system files

#### Invalid Characters
- [ ] **Special Characters in Path**
  - Manually test API with: `path=folder<test>`
  - Expected: Should be rejected or sanitized

- [ ] **Null Bytes**
  - Test with null byte in path parameter
  - Expected: Should be filtered out

### Edge Cases

- [ ] **Empty Directory**
  - Navigate to PluginB/data (empty folder)
  - Verify message "No files found in plugins directory"
  - Verify can still navigate back

- [ ] **Deep Nesting**
  - Create a deeply nested folder structure
  - Verify navigation works at all levels
  - Verify breadcrumbs show full path

- [ ] **Refresh in Subdirectory**
  - Navigate to PluginA/config
  - Click "Refresh" button
  - Verify stays in same directory
  - Verify file list updates

- [ ] **Direct URL Access**
  - Note the current URL when in a subdirectory
  - Currently URLs don't persist path (state-based)
  - This is acceptable behavior

## API Testing with curl

If you want to test the API directly:

### List Root Directory
```bash
curl -X GET 'http://localhost:3000/apanel44/api/files' \
  -H 'Cookie: your-session-cookie'
```

### List Subdirectory
```bash
curl -X GET 'http://localhost:3000/apanel44/api/files?path=PluginA' \
  -H 'Cookie: your-session-cookie'
```

### Read File in Subdirectory
```bash
curl -X GET 'http://localhost:3000/apanel44/api/files/config.yml?path=PluginA' \
  -H 'Cookie: your-session-cookie'
```

### Upload to Subdirectory
```bash
curl -X POST 'http://localhost:3000/apanel44/api/files' \
  -H 'Cookie: your-session-cookie' \
  -F 'file=@test.jar' \
  -F 'path=PluginA'
```

## Expected Results

### Success Indicators
- ✓ Navigation between directories is smooth
- ✓ Breadcrumbs accurately reflect current location
- ✓ All file operations work in subdirectories
- ✓ Context is preserved after operations
- ✓ Path traversal attempts are blocked
- ✓ Invalid paths are rejected

### Known Limitations
- URL state is not persisted (navigation is state-based)
- Cannot rename/move files between directories (only within current directory)
- Cannot create new directories from UI (would need additional feature)

## Troubleshooting

### Files Not Showing Up
- Check `/opt/minecraft/dev/plugins` directory exists
- Verify file permissions allow read access
- Check browser console for API errors

### Cannot Navigate Into Folder
- Ensure folder has proper permissions
- Check folder icon is displayed (📁)
- Verify folder is clickable (hover should show pointer cursor)

### Edit/Upload Not Working
- Verify you have Admin or Super Admin role
- Check browser console for errors
- Verify session is valid

## Conclusion

This feature enables complete recursive navigation and file management within the plugin directory structure. All operations maintain security through path validation and sanitization while providing a user-friendly breadcrumb-based navigation interface.
