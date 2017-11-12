import {Menu, MenuItem} from 'electron';

export default class AppMenu {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.menu;
    }

    get menuTemplate() {
        return [{
            label: 'View',
            submenu: [
              {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click: function(item, focusedWindow) {
                  if (focusedWindow)
                    focusedWindow.reload();
                }
              },
              {
                label: 'Toggle Full Screen',
                accelerator: (function() {
                  if (process.platform == 'darwin')
                    return 'Ctrl+Command+F';
                  else
                    return 'F11';
                })(),
                click: function(item, focusedWindow) {
                  if (focusedWindow)
                    focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                }
              }
            ]
        }]
    }

    setMenu(props) {
        this.menu = Menu.buildFromTemplate(this.menuTemplate);
        return this;
    }

    appendMenuItem(menuItem) {
      const item = new MenuItem(menuItem)
      this.menu.append(item);
      return this;
    }

    initMenu() {
      if (this.menu) {
        Menu.setApplicationMenu(this.menu);
      }
    }
}