const { app, shell, BrowserWindow, Menu, MenuItem } = require('electron');

const HELP_URL = 'http://github.com/esimov/triangle';

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
          label: 'Load Image...',
          accelerator: 'CmdOrCtrl+O',
          click(item, focusedWindow) {
            if (focusedWindow) {
              const {dialog} = require('electron');
              dialog.showOpenDialog(
                {properties: ['openFile', 'multiSelections']},
                //{filters: [{name: 'Images', extensions: ['jpg', 'png']}]},
                (filePaths) => {
                  if (filePaths) {
                    // Get the last file selected and send it trough IPC action to web renderer
                    AppMenu.action('file-open', filePaths[filePaths.length-1])
                  }
                }
              );
            }
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
          click() {
            // TODO trigger save dialog
          }
        },
        {
          label: 'Save as...',
          sublabel: 'changeable',
          accelerator: 'CmdOrCtrl+Shift+S',
          enabled: false,
          click(item, focusedWindow) {
            if (focusedWindow) {
              const {dialog} = require('electron');
              dialog.showSaveDialog({
                filters: [{
                  name:'Image',
                  extensions: ['jpg', 'png']
                }]
              })
            }
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
          click(item, focusedWindow) {
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
          click(item, focusedWindow) {
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
          label: 'Source Code',
          click() {
            shell.openExternal(HELP_URL)
          }
        },
      ]
    }]

    // On MacOS we need to include the menu subitems into the application menu item.
    if (process.platform === 'darwin') {
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
            accelerator: 'Cmd+,',
            click(item, focusedWindow) {
              if (focusedWindow) {
                AppMenu.action('open-settings');
              }
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click() {
              app.quit();
            }
          },
        ]
      });
    } else {
      var name = app.getName();
      template[1].submenu.push(
        {
          type: 'separator'
        }, {
          label: 'Settings...',
          accelerator: 'Ctrl+,',
          click(item, focusedWindow) {
            if (focusedWindow) {
              AppMenu.action('open-settings');
            }
          }
      });
      template[template.length-1].submenu.push(
        {
          type: 'separator'
        }, {
          label: 'About ' + name,
          click(item, focusedWindow) {
            if (focusedWindow) {
              AppMenu.action('open-about');
            }
          }
      })
    }
    return template;
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

  // Trasmit event trough IPC channel
  static action(action, ...params) {
    const win = BrowserWindow.getAllWindows()[0];
    if (process.platform === 'darwin') {
			win.restore();
		}
    win.webContents.send(action, ...params);
  }
}

module.exports = AppMenu;