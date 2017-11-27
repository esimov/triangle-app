import { Menu, Tray, app } from 'electron';
import toggleWindow from './toggle-window';
import checkForUpdates from './updater';

export default class AppTray {
    /**
   * @param  {String} options.src Absolute path for tray icon
   * @param  {Boolean} options.isDev Development mode or not
   * @param  {BrowserWindow} options.mainWindow
   * @return {AppTray}
   */
    constructor(options) {
        this.options = options
        this.tray = null
    }

    /**
     * Show application icon in menu bar
     */
    show() {
        const tray = new Tray(this.options.src)
        tray.setToolTip("Triangle")
        tray.setContextMenu(this.buildContextMenu())
        this.tray = tray
    }

    /**
     * Hide icon in menu bar
     */
    hide() {
        if (this.tray) {
            this.tray.destroy()
            this.tray = null
        }
    }

    /**
     * Construct application tray menu
     */
    buildContextMenu() {
        const { mainWindow, isDev } = this.options
        const separator = { type: 'separator' }

        const template = [
            {
                label: 'Toggle Triangle',
                click: () => toggleWindow(mainWindow)
            },
            separator,
            {
                label: 'Settings...',
                click: () => this.showSettingsModal(mainWindow, 'settings'),
            },
            separator,
            {
                label: 'Check for updates',
                click: () => checkForUpdates(),
            }
        ]

        if (isDev) {
            template.push(separator)
            template.push({
                label: 'Development',
                submenu: [{
                    label: 'DevTools',
                    click: () => mainWindow.webContents.openDevTools({ mode: 'detach' })
                }, {
                    label: 'Reload',
                    click: () => {
                        mainWindow.reload()
                    }
                }]
            })
        }

        template.push(separator)
        template.push({
            label: 'Quit Triangle',
            click: () => app.quit()
        })
        return Menu.buildFromTemplate(template)
    }

    /**
     * Show settings modal
     *
     * @param {BrowserWindow} mainWindow
     * @param {string} message
     */
    showSettingsModal(mainWindow, message) {
        mainWindow.show();
        mainWindow.webContents.send('open-settings');
    }
}

module.exports = AppTray;