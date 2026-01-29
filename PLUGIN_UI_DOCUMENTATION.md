# Plugin Management UI - Visual Documentation

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER BAR                               │
│  ⛏️ SMP Admin Panel              Admin User    [Logout]         │
│     Server Management System        Admin                        │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                      NAVIGATION BAR                              │
│  📊 Dashboard  👥 Users  🔌 Plugins  📋 Logs  ⏰ Tasks          │
│                        (highlighted)                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🔌 Plugin Management                                           │
│  Manage server plugins - upload .jar files, edit configs...     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Upload Plugin                                                   │
│  ┌─────────────────────┐                                        │
│  │ 📤 Choose .jar File │                                        │
│  └─────────────────────┘                                        │
│  Maximum file size: 35MB | Only .jar files are supported       │
│                                                                  │
│  [When uploading, shows progress bar:]                          │
│  ┌────────────────────────────────────────────────┐            │
│  │████████████████░░░░░░░░░░░░░░░░░░░░░░  65%    │            │
│  └────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Plugin Files (3)                              [🔄 Refresh]     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ File                    │ Size   │ Modified    │ Actions │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ ☕ EssentialsX-2.20.jar │ 2.5 MB │ Jan 29 10AM │ [✏️][🗑️]│  │
│  │ 📝 config.yml           │ 1.2 KB │ Jan 28 03PM │[✏️][✏️][🗑️]│
│  │ ☕ WorldEdit-7.2.15.jar │ 4.8 MB │ Jan 27 09AM │ [✏️][🗑️]│  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Modal Dialogs

### Edit File Modal (Large)
```
┌───────────────────────────────────────────────────────┐
│  Edit config.yml                                [×]   │
├───────────────────────────────────────────────────────┤
│  File Content                                         │
│  ┌─────────────────────────────────────────────────┐ │
│  │ # Configuration file                           │ │
│  │ server:                                        │ │
│  │   port: 25565                                  │ │
│  │   max-players: 20                              │ │
│  │   motd: "Welcome to the server!"               │ │
│  │                                                │ │
│  │ [... monospace font, scrollable ...]          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│                        [Cancel] [💾 Save Changes]    │
└───────────────────────────────────────────────────────┘
```

### Rename File Modal (Small)
```
┌──────────────────────────────────────────────┐
│  Rename EssentialsX-2.20.jar           [×]  │
├──────────────────────────────────────────────┤
│  New File Name                               │
│  ┌────────────────────────────────────────┐ │
│  │ EssentialsX-2.20.1.jar                │ │
│  └────────────────────────────────────────┘ │
│                                              │
│                    [Cancel] [✏️ Rename]     │
└──────────────────────────────────────────────┘
```

### Delete Confirmation Modal (Small)
```
┌──────────────────────────────────────────────┐
│  Delete File                            [×]  │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐ │
│  │ ⚠️ Warning                            │ │
│  │                                        │ │
│  │ Are you sure you want to delete        │ │
│  │ WorldEdit-7.2.15.jar?                  │ │
│  │                                        │ │
│  │ This action cannot be undone.          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│                    [Cancel] [🗑️ Delete]     │
└──────────────────────────────────────────────┘
```

## Toast Notifications

### Success Toast (Bottom Right)
```
┌────────────────────────────────────┐
│ ✓  File uploaded successfully  [×] │
└────────────────────────────────────┘
(Green background, auto-dismiss after 5s)
```

### Error Toast (Bottom Right)
```
┌────────────────────────────────────┐
│ ✕  Only .jar files are allowed [×] │
└────────────────────────────────────┘
(Red background, auto-dismiss after 5s)
```

### Warning Toast (Bottom Right)
```
┌────────────────────────────────────────────────┐
│ ⚠  File size exceeds 35MB limit (45.3MB)  [×] │
└────────────────────────────────────────────────┘
(Yellow background, auto-dismiss after 5s)
```

## Color Scheme

- **Background**: Dark stone (stone-900, stone-800)
- **Primary Accent**: Green (green-400, green-600)
- **Borders**: Dark stone (stone-700)
- **Text**: White on dark, stone-400 for secondary text
- **Buttons**:
  - Primary: Green (green-600/700)
  - Secondary: Blue (blue-600/700)
  - Warning: Yellow (yellow-600/700)
  - Danger: Red (red-600/700)
  - Neutral: Stone (stone-600/700)

## Interactions

### File Upload Flow
1. User clicks "📤 Choose .jar File" button
2. File picker opens (filtered to .jar files)
3. User selects a file
4. Validation runs:
   - Check file extension (.jar)
   - Check MIME type
   - Check file size (≤ 35MB)
5. If valid:
   - Progress bar appears
   - Upload begins with XHR
   - Progress updates in real-time
   - On success: Green toast + file list refreshes
6. If invalid:
   - Red toast with specific error message
   - File input cleared

### Edit File Flow
1. User clicks "✏️ Edit" button for a config file
2. Backend fetches file content
3. Large modal opens with content in textarea
4. User makes changes
5. User clicks "💾 Save Changes"
6. Button shows "Saving..." (disabled)
7. Content sent to backend
8. On success:
   - Modal closes
   - Green toast notification
   - File list refreshes (updated modified date)
9. On cancel:
   - Modal closes
   - Changes discarded
   - Content state cleared

### Rename File Flow
1. User clicks "✏️ Rename" button
2. Small modal opens with current filename pre-filled
3. User types new filename
4. User clicks "✏️ Rename"
5. Button shows "Renaming..." (disabled)
6. Filename sent to backend
7. On success:
   - Modal closes
   - Green toast notification
   - File list refreshes (new name appears)
8. On error (duplicate name):
   - Red toast with error message
   - Modal stays open for correction

### Delete File Flow
1. User clicks "🗑️ Delete" button
2. Confirmation modal opens with warning
3. User clicks "🗑️ Delete" to confirm
4. Button shows "Deleting..." (disabled)
5. Delete request sent to backend
6. On success:
   - Modal closes
   - Green toast notification
   - File list refreshes (file removed)
7. On cancel:
   - Modal closes
   - No changes made

## Responsive Behavior

### Desktop (> 1024px)
- Full table layout with all columns visible
- Modals centered with max-width constraints
- Side-by-side action buttons

### Tablet (768px - 1024px)
- Table remains but may require horizontal scroll
- Modal widths adjusted
- Buttons maintain size

### Mobile (< 768px)
- Consider stacked card layout instead of table
- Full-width modals
- Stacked action buttons

## Accessibility Features

1. **Keyboard Navigation**:
   - All interactive elements focusable
   - Tab order follows visual order
   - Modals trap focus

2. **Screen Reader Support**:
   - Descriptive aria-labels on all buttons
   - Proper label associations for form inputs
   - Role attributes where appropriate

3. **Visual Indicators**:
   - Clear focus states
   - Loading spinners for async operations
   - Disabled state styling

4. **Error Handling**:
   - Clear, descriptive error messages
   - Multiple feedback channels (toast + inline)
   - No silent failures

## Performance Considerations

- **Initial Load**: Single API call to fetch file list
- **Upload Progress**: Real-time via XHR progress events
- **Lazy Modals**: Content only fetched when modal opens
- **Optimistic Updates**: File list refreshes after operations
- **Debouncing**: Not needed (no search/filter yet)

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (not supported)

## Implementation Status

✅ All features implemented and tested
✅ Code review feedback addressed
✅ Security scan passed (CodeQL)
✅ Build successful
✅ No linting errors
✅ Ready for production deployment
