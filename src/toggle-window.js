/**
 * Show or hide the browser window.
 */
module.exports = (appWindow) => {
    if (appWindow.isVisible()) {
        appWindow.hide()
    } else {
        appWindow.show()
    }
}