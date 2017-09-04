# videocall-client

> Websocket client that allows two clients to establish a RTCPeerConnection from a browser

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```
Remember to have an instance of the [websocket server](https://github.com/L3bowski/videocall-server) running!

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Nightwatch Integration Tests

``` bash
#download the selenium driver
node nightwatch.conf.BASIC.js

#run all the tests located in ./nightwatch/tests
npm run e2e
```
