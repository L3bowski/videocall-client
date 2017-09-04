var config = require('../../nightwatch.conf.js');

//var appUrl = 'http://vsenterprisestorage.blob.core.windows.net/videocall/index.html';
var appUrl = 'http://localhost:8080';
var webSocketUrl = 'ws://52.174.2.85:20000';
var clientA = 'Client A';
var clientB = 'Client B';
var pauseTime = 1000;

function initializeWindow(clientName) {
    return this
    .waitForElementVisible('body')
    .assert.title('videocall-client')
    .pause(pauseTime)
    .setValue('#server-address', webSocketUrl)
    .pause(pauseTime)
    .click('#server-connect')
    .waitForElementVisible('#username')
    .pause(pauseTime)
    .setValue('#username', clientName)
    .pause(pauseTime)
    .click('#register');
}

function openWindow(url) {
    return this.execute(function (url) {
        window.open(url, null, "height=700,width=700");
    }, [url]);
}

function windowSwitcher(windowIndex) {
    return this.windowHandles(function (result) {
        var selectedWindow = result.value[windowIndex];
        this.switchWindow(selectedWindow);
    });
}

module.exports = {
    'Videocall Flow': function(browser) {

        browser.initializeWindow = initializeWindow.bind(browser);
        browser.windowSwitcher = windowSwitcher.bind(browser);
        browser.openWindow = openWindow.bind(browser);

        browser
        .openWindow(appUrl) // Open a new window (to be sure the two peers are in the same conditions)
        .closeWindow() // Close the original window
        // Set the first window
        .windowSwitcher(0)
        .resizeWindow(700, 700)
        .setWindowPosition(0, 0)
        .initializeWindow(clientA)
        // Set the second window
        .openWindow(appUrl)
        .windowSwitcher(1)
        .resizeWindow(700, 700)
        .setWindowPosition(700, 0)
        .initializeWindow(clientB)
        // Select the clientB in the first window
        .windowSwitcher(0)
        .waitForElementVisible('option[data-client-name="' + clientB + '"]')
        .click('#user-select option[data-client-name="' + clientB + '"]')
        .pause(pauseTime)
        .click('#call-user')
        // Accept clientA call in the second window
        .windowSwitcher(1)
        .waitForElementVisible('#accept-call')
        .pause(pauseTime)
        .click('#accept-call');
    }
};
