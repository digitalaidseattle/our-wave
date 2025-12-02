## Description

This PR implements a new Grant Recipes list page using MUI DataGrid that allows users to view, edit, upload, and manage grant recipes. The page includes inline editing capabilities, file upload functionality for Word documents and JSON files, and a clean, modern UI with proper spacing.

**Key Features:**
- Display grant recipes in a DataGrid with columns: Description, Token Count, Model Type, and Date
- Inline editing for Description, Token Count, Model Type, and Date fields directly in the list
- File upload support for Word documents (.docx, .doc) and JSON files
- Delete functionality with confirmation dialog
- Double-click navigation to detail pages
- Test recipe row included for development/testing (always displayed at the top)
- Responsive layout with max-width constraint (1400px) and centered content
- Clean spacing and modern MUI components

**Reviewers should pay attention to:**
- File upload parsing logic for Word documents (currently basic text extraction, stores full text in `prompt` and `tokenString`)
- Inline editing implementation using `onCellEditStop` and `editMode="cell"` from MUI DataGrid
- Test recipe handling (local state updates only, not saved to Firestore)
- Date parsing and formatting (MM/DD/YYYY format for display and editing)
- Firestore service integration (`grantRecipeService.findAll()`, `insert()`, `update()`, `delete()`)

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
   - Navigate to `/grant-recipes` from the sidebar menu
   - Verify the page displays with a clean layout (centered, max-width 1400px)
   - Check that the test recipe row appears at the top with:
     - Description: "this is a Description description"
     - Token Count: 512
     - Model Type: "this is model type"
     - Date: 11/04/2025
   - Verify all recipes from Firestore are displayed below the test recipe

2. **Inline Editing:**
   - Click on any editable cell (Description, Token Count, Model Type, or Date)
   - Edit the value
   - Press Enter or click outside to save
   - **For real recipes**: Verify changes are saved to Firestore and the list refreshes
   - **For test recipe**: Verify changes update in local state (not saved to Firestore)
   - Try editing all four fields on different rows
   - Test date editing with MM/DD/YYYY format (e.g., "11/04/2025")

3. **File Upload:**
   - Click the "Upload Recipe" button (top right)
   - Upload a Word document (.docx or .doc)
     - Verify the recipe is created with extracted text
     - Check that description is set to first 200 characters of text
     - Verify token count is calculated from text length
   - Upload a JSON file with recipe data
     - Verify structured data is parsed correctly
     - Check that all fields are populated from JSON
   - Verify uploaded recipes appear in the list
   - Verify the upload button is disabled when not logged in

4. **Delete Functionality:**
   - Click the Delete icon button on any row
   - Confirm the deletion in the dialog
   - Verify the recipe is removed from the list
   - Try canceling the deletion to ensure it doesn't delete
   - Verify delete button is disabled when not logged in
   - **Note**: Test recipe cannot be deleted (it's local state only)

5. **Navigation:**
   - Double-click any row
   - Verify navigation to `/grant-recipes/:id` detail page
   - Check that the detail page loads correctly
   - Navigate back and verify the list is still intact

6. **Responsive Design:**
   - Verify the page has a max-width of 1400px and is centered
   - Check spacing and layout on different screen sizes
   - Verify DataGrid is responsive and scrollable on smaller screens

7. **Authentication:**
   - Test with logged-in user: all features should work
   - Test without login: upload and delete buttons should be disabled
   - Verify inline editing shows alert if not logged in

### Expected Behavior

- All editable fields (Description, Token Count, Model Type, Date) should save automatically when editing is complete
- File uploads should process both Word and JSON files correctly
- Delete should require confirmation before proceeding
- Double-click should navigate to detail page
- Test recipe should always appear at the top of the list
- Page should be properly centered with max-width constraint
- All actions should be disabled when user is not logged in

### Known Issues/Limitations

- Word document parsing currently extracts raw text only (no structured field parsing from formatted documents)
- Test recipe updates are local only (not saved to Firestore) - this is intentional for development
- Date field editing requires MM/DD/YYYY format
- Model Type field is a free text field (no dropdown/validation)

### Files Changed

- `src/pages/grants/GrantRecipesListPage.tsx` - Main list page implementation
- `src/pages/routes.tsx` - Added routes for grant recipes
- `src/TemplateConfig.tsx` - Added navigation menu item
- `src/services/grantRecipeService.ts` - Added `findAll()` and `delete()` methods
