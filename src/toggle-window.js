/**
 * Show or hide the browser window.
 */
export default (appWindow) => {
    if (appWindow.isVisible()) {
        appWindow.hide()
    } else {
        appWindow.show()
    }
}