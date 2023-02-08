# To-Do List

- [ ] Add a way to cancel loading an archive or check a repository.
- [ ] Show navigation topbar when loading an archive
- [ ] Refresh "open repository" panel when config window is saved to account for user config changes.
- [ ] Add navigation/location text box to manually enter a directory to navigate to.
- [ ] Fix extraction clunkiness (when extracting a subdirectory, don't also extract its parent path, and other issues with extracting)
- [ ] Borg 2.0 support

## Completed
### v0.0.7
- [X] Calculate directory size
- [X] Directory extraction

### v0.0.6
- [X] **File Explorer**: Table-based layout
- [X] **File Explorer**: Sort by any header column (Name, Size, Modified Date)

### v0.0.4
- [X] **Bug Fix**: When borg shows 'moved repository' message, show message to user somehow
- [X] **UI**: UI for setting `BORG_RELOCATED_REPO_ACCESS_IS_OK=yes`