const { app, shell, Menu, MenuItem } = require('electron');

class AppMenu {
  constructor() {
    this.menu;
  }

  // Return the menu template;
  get menuTemplate() {
    let template = [{
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: function() {
            const {dialog} = require('electron');
            dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']});
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Save',
          sublabel: 'changeable',
          accelerator: 'CmdOrCtrl+S',
          enabled: false,
          click: function() {
            // TODO trigger save dialog
          }
        },
        {
          label: 'Save as...',
          sublabel: 'changeable',
          accelerator: 'CmdOrCtrl+Shift+S',
          enabled: false,
          click: function() {
            const {dialog} = require('electron');
            dialog.showSaveDialog({
              filters: [{
                name:'Image',
                extensions: ['jpg', 'png']
              }]
            })
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: (function () {
            if (process.platform == 'darwin')
              return 'Ctrl+Command+F';
            else
              return 'F11';
          })(),
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: function() { shell.openExternal('http://github.com/esimov/triangle') }
        },
      ]
    }]

    // On MacOS we need to include the menu subitems into the application menu item.
    if (process.platform == 'darwin') {
      var name = app.getName();
      template.unshift({
        label: name,
        submenu: [
          {
            label: 'About ' + name,
            role: 'about'
          },
          {
            type: 'separator'
          },
          {
            label: 'Hide ' + name,
            accelerator: 'Command+H',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            role: 'hideothers'
          },
          {
            label: 'Show All',
            role: 'unhide'
          },
          {
            type: 'separator'
          },
          {
            label: 'Settings...',
            accelerator: (function () {
              if (process.platform == 'darwin')
                return 'Cmd+,';
              else
                return 'Ctrl+P';
            })(),
            click: function() {
              // TODO call settings panel...
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function () {
              app.quit();
            }
          },
        ]
      });
      return template;
    }
  }

  // Build the application menu based on the menu template.
  setMenu() {
    this.menu = Menu.buildFromTemplate(this.menuTemplate);
    return this;
  }

  // Retrive menu object.
  getMenu() {
    return this.menu;
  }

  // Append menu item
  appendMenuItem(menuItem) {
    const item = new MenuItem(menuItem)
    this.menu.append(item);
    return this;
  }

  // Initialize the menu
  initMenu() {
    if (this.menu) {
      Menu.setApplicationMenu(this.menu);
    }
  }
}

module.exports = AppMenu;