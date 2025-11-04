## Description

This PR implements a new Grant Recipes list page using MUI DataGrid that allows users to view, edit, and manage grant recipes. The page includes inline editing capabilities, file upload functionality for Word documents and JSON files, and a clean, modern UI with proper spacing.

**Key Features:**
- Display grant recipes in a DataGrid with columns: Description, Token Count, Model Type, and Date
- Inline editing for Description, Token Count, Model Type, and Date fields directly in the list
- File upload support for Word documents (.docx, .doc) and JSON files
- Delete functionality with confirmation dialog
- Double-click navigation to detail pages
- Test recipe row included for development/testing
- Responsive layout with max-width constraint and centered content

**Reviewers should pay attention to:**
- File upload parsing logic for Word documents (currently basic text extraction)
- Inline editing implementation using `onCellEditStop` and `editMode="cell"`
- Test recipe handling (local state updates vs Firestore updates)
- Date parsing and formatting (MM/DD/YYYY format)

## What type of PR is this? (check all applicable)

- [ ] Refactor
- [x] Feature
- [ ] Bug Fix
- [ ] Optimization
- [ ] Documentation Update

## Related Tickets & Documents

_Link user story from projects.digitalaidseattle.org_

- Related Issue #
- Closes #

## QA Instructions, Screenshots, Recordings

### Testing Instructions

1. **View the List Page:**
   - Navigate to `/grant-recipes`
   - Verify the page displays with a clean layout
   - Check that the test recipe row appears at the top with:
     - Description: "this is a Description description"
     - Token Count: 512
     - Model Type: "this is model type"
     - Date: 11/04/2025

2. **Inline Editing:**
   - Click on any editable cell (Description, Token Count, Model Type, or Date)
   - Edit the value
   - Press Enter or click outside to save
   - Verify changes are saved to Firestore (for real recipes) or local state (for test recipe)
   - Check that the list refreshes after saving

3. **File Upload:**
   - Click the "Upload Recipe" button
   - Upload a Word document (.docx or .doc)
   - Verify the recipe is created and appears in the list
   - Upload a JSON file with recipe data
   - Verify the structured data is parsed correctly

4. **Delete Functionality:**
   - Click the Delete icon button on any row
   - Confirm the deletion in the dialog
   - Verify the recipe is removed from the list
   - Try canceling the deletion to ensure it doesn't delete

5. **Navigation:**
   - Double-click any row
   - Verify navigation to `/grant-recipes/:id` detail page
   - Check that the detail page loads correctly

6. **Responsive Design:**
   - Verify the page has a max-width and is centered
   - Check spacing and layout on different screen sizes

### Screenshots

_Add screenshots of the list page, editing interface, and upload functionality_

### Expected Behavior

- All fields should be editable inline
- Changes should save automatically when editing is complete
- File uploads should process both Word and JSON files
- Delete should require confirmation before proceeding
- Double-click should navigate to detail page
- Test recipe should always appear in the list

### Known Issues/Limitations

- Word document parsing currently extracts raw text only (no structured field parsing)
- Test recipe updates are local only (not saved to Firestore)
- Date field editing requires MM/DD/YYYY format

