# Sensitive File Protection Implementation

## Overview
This implementation adds protection for plugin configuration files that contain sensitive information such as MySQL credentials. The protection applies even to Super Admin users, ensuring that sensitive data cannot be accessed or modified through the admin panel.

## Features Implemented

### 1. Sensitive Content Detection
A new function `hasSensitiveContent()` has been added to `/src/lib/fileUtils.ts` that detects whether a file contains MySQL/MariaDB credentials using:

#### Pattern-Based Detection (Primary)
- **Pattern 1**: Key-value pairs with password (e.g., `password: secret` or `password=secret`)
- **Pattern 2**: JDBC connection strings with credentials (e.g., `jdbc:mysql://...?password=...`)
- **Pattern 3**: Database configuration blocks with user/password fields (limited to 500 chars for performance)

#### Keyword-Based Detection (Fallback)
- MySQL-related keywords: `mysql`, `mariadb`, `jdbc:mysql`
- Credential keywords: `password`, `passwd`, `pwd`
- Files are flagged as sensitive if they contain both MySQL references AND credential keywords

### 2. Backend API Protection

#### File Reading (GET `/apanel44/api/files/[filename]`)
- Before returning file content, checks if the file contains sensitive information
- Returns 403 Forbidden with message: "This file contains sensitive information (MySQL credentials) and can only be modified via direct SSH access."
- Logs blocked attempts with reason: `sensitive_content`

#### File Editing (PUT `/apanel44/api/files/[filename]`)
- Checks both existing and new content for sensitive information
- Blocks editing of files with MySQL credentials
- Returns 403 Forbidden with appropriate message
- Logs blocked attempts

#### File Renaming (PUT `/apanel44/api/files/[filename]` with `newFilename`)
- Blocks renaming of ALL configuration files (not just sensitive ones)
- Returns 403 Forbidden with message: "Configuration files cannot be renamed. Please use direct SSH access."
- Logs blocked attempts with reason: `config_file_protection`

#### File Deletion (DELETE `/apanel44/api/files/[filename]`)
- Blocks deletion of ALL configuration files (not just sensitive ones)
- Returns 403 Forbidden with message: "Configuration files cannot be deleted. Please use direct SSH access."
- Logs blocked attempts with reason: `config_file_protection`

### 3. Frontend UI Updates

#### Visual Indicators
- Configuration files now display a `🔒 CONFIG` badge next to the filename
- Badge is yellow with white text for visibility
- Tooltip explains the protection

#### Button States
- **Edit Button**: Remains enabled (server will block if file is sensitive)
  - Tooltip updated to indicate automatic blocking for sensitive files
- **Rename Button**: Disabled for all config files
  - Grayed out appearance with `cursor: not-allowed`
  - Tooltip: "Config files cannot be renamed"
- **Delete Button**: Disabled for all config files
  - Grayed out appearance with `cursor: not-allowed`
  - Tooltip: "Config files cannot be deleted"

## Protected File Types
The following file extensions are considered configuration files and receive protection:
- `.yml`
- `.yaml`
- `.json`
- `.properties`
- `.txt`
- `.conf`
- `.cfg`

## Security Benefits

1. **Prevents Credential Leakage**: Super admins cannot view or copy MySQL passwords through the web interface
2. **Prevents Accidental Modification**: Configuration files with credentials cannot be edited, preventing accidental corruption
3. **Prevents Accidental Deletion**: Configuration files cannot be deleted through the panel
4. **Audit Trail**: All blocked attempts are logged with user ID and reason
5. **Defense in Depth**: Protection at both backend (API) and frontend (UI) levels
6. **Performance Optimized**: Constants are defined once, regex patterns are limited in scope

## Testing

### Test Files Created
1. `mysql-config.yml` - Contains MySQL credentials (SENSITIVE)
2. `database-plugin-config.yml` - Contains comprehensive MySQL config (SENSITIVE)
3. `normal-config.yml` - Regular config without credentials (NOT SENSITIVE)
4. `test-plugin.jar` - JAR file (NOT PROTECTED)

### Test Results
All 12 integration tests passed with 100% success rate:
- ✅ 5 sensitive content detection tests
- ✅ 3 file type protection tests
- ✅ 4 actual plugin file tests

### Expected Behavior

| File Type | Contains Credentials | Edit | Rename | Delete |
|-----------|---------------------|------|--------|--------|
| Config with MySQL credentials | Yes | ❌ Blocked (403) | ❌ Blocked (403) | ❌ Blocked (403) |
| Config without credentials | No | ✅ Allowed | ❌ Blocked (403) | ❌ Blocked (403) |
| JAR file | N/A | N/A | ✅ Allowed | ✅ Allowed |

### Manual Testing Steps

1. **Test Viewing Sensitive File**:
   - Navigate to Plugins page at `https://v1rtopia.com/apanel44/plugins/`
   - Try to edit `mysql-config.yml`
   - Should see error message about sensitive content

2. **Test Editing Non-Sensitive Config**:
   - Try to edit `normal-config.yml`
   - Should be able to view and edit successfully

3. **Test Renaming Config Files**:
   - Notice Rename button is disabled for all config files
   - Notice tooltip explaining why

4. **Test Deleting Config Files**:
   - Notice Delete button is disabled for all config files
   - Notice tooltip explaining why

5. **Test Non-Config Files**:
   - JAR files should have fully functional Rename and Delete buttons

## Code Changes Summary

### Modified Files
1. **`/src/lib/fileUtils.ts`** (+51 lines)
   - Added `hasSensitiveContent()` function with optimized detection
   - Added `isConfigFile()` helper function
   - Moved constants outside function for performance

2. **`/src/pages/api/files/[filename].ts`** (+98 lines)
   - Updated GET endpoint with sensitive content check
   - Updated PUT endpoint (rename) with config file protection
   - Updated PUT endpoint (edit) with sensitive content check
   - Updated DELETE endpoint with config file protection
   - Added activity logging for blocked operations
   - Fixed logging action type to use 'read_file'

3. **`/src/pages/plugins.tsx`** (+34 lines)
   - Added visual `🔒 CONFIG` badge for config files
   - Disabled Rename button for config files
   - Disabled Delete button for config files
   - Updated tooltips to explain restrictions
   - Removed code duplication

4. **`SENSITIVE_FILE_PROTECTION.md`** (New, +145 lines)
   - Comprehensive documentation of the feature

5. **`test-sensitive-protection.js`** (New, +200 lines)
   - Integration test suite for the feature

## Performance Optimizations
1. Constants (keyword arrays, regex patterns) are defined once outside functions
2. Regex pattern 3 is limited to 500 chars lookahead to prevent performance issues on large files
3. Pattern matching is performed before fallback keyword detection for efficiency

## Future Enhancements
- Pattern-based detection for other sensitive data (API keys, tokens, etc.)
- Configurable sensitivity patterns via environment variables
- Whitelist mechanism for specific files if needed
- More granular permissions (e.g., view-only for some admins)
- Email notifications when sensitive files are accessed

## Compliance Notes
This implementation helps meet security requirements for:
- **PCI DSS**: Protecting database credentials (Requirement 8: Identify and authenticate access)
- **GDPR**: Preventing unauthorized data access (Article 32: Security of processing)
- **General Security Best Practices**: Principle of least privilege and defense in depth
