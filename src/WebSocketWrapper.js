export default class WebSocketWrapper {

	constructor(webSocketUrl, onmessageCallback) {
		this.webSocket = new WebSocket(webSocketUrl);
		this.webSocket.onopen = () => {
	        this.webSocket.onmessage = onmessageCallback;
	    };
	    this.sendMessage = (() => {
			var webSocket = this.webSocket;
			return function(data) {
	        	webSocket.send(JSON.stringify(data));
	    	};
	    })();
	}
}