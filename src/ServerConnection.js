import PeerWrapper from './PeerWrapper.js';

export default class ServerConnection {

    acceptCall(remoteUserId, localUserId) {
		this.localUserId = localUserId;
		this.remoteUserId = remoteUserId;

		this.sendMessage({
            operationType: 'callAccepted',
        	receiverId: remoteUserId,
        	senderId: localUserId
        });
    }

	constructor(webSocketUrl, callbacks) {
		this.localUserId = null;
		this.remoteUserId = null;
		this.callbacks = callbacks;

		this.webSocket = new WebSocket(webSocketUrl);
		this.webSocket.onopen = () => {
	        this.webSocket.onmessage = this.onWebsocketMessage.bind(this);
	    };

        this.peerWrapper = new PeerWrapper(this.iceCandidateHandler.bind(this));
	}

	iceCandidateHandler(iceCandidate) {
    	this.sendMessage({
            operationType: 'iceCandidate',
            iceCandidate,
            senderId: this.localUserId,
            receiverId: this.remoteUserId
        });
	}

	onWebsocketMessage(message) {
		let data = JSON.parse(message.data);
        switch (data.operationType) {
			case 'userRegistered':
	        	this.callbacks.userRegistered(data.user, data.otherUsers);
	        	break;

	        case 'otherUserRegistered':
	        	this.callbacks.otherUserRegistered(data.user);
	        	break;

	        case 'callRequested':
	        	this.callbacks.callRequested(data);
	        	break;

	        case 'callAccepted':
                this.sendOffer(data.receiverId, data.senderId);
	        	break;

	        case 'iceCandidate':
	        	this.peerWrapper.addIceCandidate(data.iceCandidate);
	        	break;

	        case 'offerReceived':
				this.sendAnswer(data);
				this.callbacks.callEstablished();
	            break;

	        case 'answerReceived':
    			this.peerWrapper.setRemoteDescription(data.answer);
				this.callbacks.callEstablished();
	        	break;
        }
	}

    register(username) {
        this.sendMessage({
            operationType: 'register',
        	username
        });
    }

    requestCall(localUserId, remoteUserId) {
		this.localUserId = localUserId;
		this.remoteUserId = remoteUserId;

		this.sendMessage({
            operationType: 'callRequested',
        	receiverId: remoteUserId,
        	senderId: localUserId
        });
    }

    async sendAnswer(data) {
        let answer = await this.peerWrapper.prepareAnswer(data.offer);
        this.sendMessage({
            operationType: 'answerReceived',
            answer,
            senderId: data.receiverId,
            receiverId: data.senderId
        });
    }

    sendMessage(data) {
    	this.webSocket.send(JSON.stringify(data));
    }

    async sendOffer(localUserId, remoteUserId) {
    	let offer = await this.peerWrapper.prepareOffer();
        this.sendMessage({
            operationType: 'offerReceived',
            offer,
            senderId: localUserId,
            receiverId: remoteUserId
        });
    }
}
