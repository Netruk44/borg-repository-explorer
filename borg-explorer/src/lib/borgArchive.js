
class FileTreeItem {
  // This class represents a file or directory in a BorgArchiveFileTree.
  //constructor(parent, path, type, explicit = true) {
  constructor(data, explicit = true) {
    /* data is an object that looks like:
    {
      "type":"d", // d for directory, - for file
      "mode":"drwxr-xr-x",
      "user":"danielperry",
      "group":"staff",
      "uid":501,
      "gid":20,
      "path":"Users/danielperry/Desktop/borg-explorer-repo/backup",
      "healthy":true,
      "source":"",
      "linktarget":"",
      "flags":0,
      "mtime":"2022-11-04T00:49:44.110426",
      "size":0
    }*/
    this.data = data;

    this.path = data.path;
    this.name = data.path.split('/').pop();
    this.type = data.type;
    this.mode = data.mode;
    this.user = data.user;
    this.group = data.group;
    this.uid = data.uid;
    this.gid = data.gid;
    this.healthy = data.healthy;
    this.source = data.source;
    this.linktarget = data.linktarget;
    this.flags = data.flags;
    this.mtime = data.mtime;
    this.size = data.size;

    // An item is 'explicit' if it's included in the archive.
    // Directories that don't exist in the archive but need to exist
    // in order to navigate a file tree have 'explicit' set to false.
    this.explicit = explicit;

    // An item is always explicit if a parent is explicit.
    /* Requires parent
    var cur = this.parent;
    while (cur != null) {
      if (cur.explicit) {
        this.explicit = true;
        break;
      }
      cur = cur.parent;
    }
    */

    if (this.type == 'd') {
      this.children = { };
    }
  }

  // Implement [] get
  get(key) {
    // First check if the key is a path and not a name
    // e.x. path['foo/bar/baz'] should return the item at path['foo']['bar']['baz']
    if (key.includes('/')) {
      var nextPart = key.split('/')[0];
      if (nextPart in this.children) {
        return this.children[nextPart].get(key.substring(nextPart.length + 1));
      } else {
        return null;
      }
    } else {
      // If the key is empty, return this item
      if (key == '') {
        return this;
      }
      return this.children[key];
    }
  }

  // Implement [] set
  set(key, value) {
    // First check if the key is a path and not a name
    if (key.includes('/')) {
      var nextPart = key.split('/')[0];
      if (nextPart in this.children) {
        this.children[nextPart].set(key.substring(nextPart.length + 1), value);
      } else {
        this.children[nextPart] = new FileTreeItem({ path: this.path + '/' + nextPart , type: 'd' }, false);
        this.children[nextPart].set(key.substring(nextPart.length + 1), value);
      }
    } else {
      // Check if item already exists
      if (key in this.children) {
        // If the item is explicit, error out
        if (this.children[key].explicit) {
          throw new Error('Item already exists: ' + key);
        }
        // Otherwise, replace the item
        // Item may have children already, Update value with children
        if (this.children[key].type == 'd') {
          for (var childKey in this.children[key].children) {
            value.children[childKey] = this.children[key].children[childKey];
          }
        }
      }
      this.children[key] = value;
    }
  }

  // Implement [] delete
  delete(key) {
    if (key.includes('/')) {
      var nextPart = key.split('/')[0];
      if (nextPart in this.children) {
        this.children[nextPart].delete(key.substring(nextPart.length + 1));
      }
    } else {
      delete this.children[key];
    }
  }

  // Implement [] in
  in(key) {
    if (key.includes('/')) {
      var nextPart = key.split('/')[0];
      if (nextPart in this.children) {
        return this.children[nextPart].in(key.substring(nextPart.length + 1));
      } else {
        return false;
      }
    } else {
      return this.type == 'd' && key in this.children;
    }
  }

  getChildren() {
    var children = [];
    for (var key in this.children) {
      children.push(this.children[key]);
    }

    // Sort children, first by type, then by name
    children.sort(function(a, b) {
      if (a.type == b.type) {
        return a.name.localeCompare(b.name);
      } else if (a.type == 'd') {
        return -1;
      } else {
        return 1;
      }
    });
    
    return children;
  }
}

class BorgArchiveFileTree {
  // This class is responsible for building a tree of files and directories
  // from the output of `borg list --json-lines`.

  constructor(archiveFileList) {
    this.fileTree = new FileTreeItem({ path: '', type: 'd' }, false);
    this.fileCount = 0;
    for (var i = 0; i < archiveFileList.length; i++) {
      //this.fileTree.set(archiveFileList[i].path, new FileTreeItem(archiveFileList[i]));
      this.addStreamData(archiveFileList[i]);
    }
  }

  getItem(path) {
    // If the path begins with a /, trim it
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    return this.fileTree.get(path);
  }

  addStreamData(nextItem) {
    // Add the next item to the file tree
    this.fileTree.set(nextItem.path, new FileTreeItem(nextItem));
    this.fileCount++;
  }

  getFileCount() {
    return this.fileCount;
  }
}

module.exports = BorgArchiveFileTree;