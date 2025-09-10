# Background Script Event Orchestration Test Plan

## Enhanced Features Testing Checklist

### 1. Omnibox Integration
- [ ] Type "tana" in address bar to activate omnibox
- [ ] Verify search suggestions appear for "save:" and "quick:" prefixes
- [ ] Test saving with custom title using "save:Custom Title"
- [ ] Test quick save using "quick:" prefix

### 2. Keyboard Commands
- [ ] Test Ctrl+Shift+S (Cmd+Shift+S on Mac) for quick save
- [ ] Test Ctrl+Shift+D (Cmd+Shift+D on Mac) for save with notes
- [ ] Verify commands work on different websites
- [ ] Check notification feedback appears

### 3. Context Menu Integration
- [ ] Right-click on page to see "Save page to Tana" option
- [ ] Right-click on page to see "Save page to Tana with notes" option
- [ ] Select text and right-click to see "Save selection to Tana" option
- [ ] Test all context menu actions work correctly

### 4. Content Script Injection
- [ ] Verify content scripts are dynamically injected when needed
- [ ] Test overlay injection for notes dialog functionality
- [ ] Confirm no conflicts with existing content scripts

### 5. Message Passing Architecture
- [ ] Test backward compatibility with existing popup functionality
- [ ] Verify new message types are handled correctly
- [ ] Test error handling for invalid message types
- [ ] Confirm async response handling works

### 6. Notification System
- [ ] Verify success notifications appear after successful saves
- [ ] Test error notifications for failed operations
- [ ] Check notifications auto-dismiss after 3 seconds
- [ ] Confirm notification icons display correctly

### 7. Error Handling
- [ ] Test behavior when Tana API is unreachable
- [ ] Verify graceful handling of missing configuration
- [ ] Test content extraction failures
- [ ] Check tab access permission errors

### 8. Performance
- [ ] Monitor console for excessive logging
- [ ] Check memory usage with multiple tabs
- [ ] Verify fast response times for quick save
- [ ] Test concurrent operation handling

## Manual Testing Instructions

1. Load the extension in Chrome developer mode
2. Navigate to test websites (news articles, blog posts, etc.)
3. Test each feature systematically
4. Check browser console for errors
5. Verify Tana API integration works end-to-end

## Expected Behaviors

- All existing functionality continues to work
- New keyboard shortcuts provide quick access
- Context menus appear in appropriate contexts
- Omnibox provides intuitive save options
- User feedback is clear and timely
- Error states are handled gracefully