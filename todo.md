# To-Do List

- [ ] Add a way to cancel loading an archive or check a repository.
- [ ] Show navigation topbar when loading an archive
- [ ] Refresh "open repository" panel when config window is saved to account for user config changes.
- [ ] Extraction improvements
    - [ ] When extracting a subdirectory of an archive, don't include the whole subtree to that folder in the output folder.
    - [ ] Extraction popup window with status, progress bar, and cancel button.
    - [ ] Add quotes around file paths in extraction command to allow for special characters in file names.
- [ ] Borg 2.0 support
- [ ] Add option for text string on file timestamps ("x hours/months/years ago") to be relative to archive creation time instead of relative to now (e.g. "x hours/days/years old")
- [ ] Video previews
- [ ] Add textbox for searching file browser listing (include checkbox for searching child directories)

## Completed
### v0.0.8
- [X] Add navigation/location text box to manually enter a directory to navigate to.

### v0.0.7
- [X] Calculate directory size
- [X] Directory extraction

### v0.0.6
- [X] **File Explorer**: Table-based layout
- [X] **File Explorer**: Sort by any header column (Name, Size, Modified Date)

### v0.0.4
- [X] **Bug Fix**: When borg shows 'moved repository' message, show message to user somehow
- [X] **UI**: UI for setting `BORG_RELOCATED_REPO_ACCESS_IS_OK=yes`
