import WebSocketWrapper from './WebSocketWrapper.js';
import PeerWrapper from './PeerWrapper.js';

export default class ServerConnection {

    acceptCall(remoteUserId, localUserId) {
		this.webSocketWrapper.sendMessage({
            operationType: 'acceptCall',
        	receiverId: remoteUserId,
        	senderId: localUserId
        });
    }

    async call(localUserId, remoteUserId) {
		this.localUserId = localUserId;
		this.remoteUserId = remoteUserId;
    	this.callStarted = true;

    	let offer = await this.peerWrapper.prepareOffer();

        this.webSocketWrapper.sendMessage({
            operationType: 'offer',
            offer,
            senderId: localUserId,
            receiverId: remoteUserId
        });
    }

	constructor(webSocketUrl, callbacks) {
		this.localUserId = null;
		this.remoteUserId = null;
		this.callStarted = false;
		this.callbacks = callbacks;
		this.webSocketWrapper = new WebSocketWrapper(webSocketUrl, this.onWebsocketMessage.bind(this));
        this.peerWrapper = new PeerWrapper(this.iceCandidateHanlder.bind(this));
	}

	iceCandidateHanlder(iceCandidate) {
    	this.webSocketWrapper.sendMessage({
            operationType: 'ice',
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

	        case 'requestCall':
	        	this.callbacks.callRequested(data);
	        	break;

	        case 'acceptCall':
	        	this.callbacks.callAccepted(data);
	        	break;

	        case 'ice':
	        	this.peerWrapper.addIceCandidate(data.iceCandidate);
	        	break;

	        case 'offer':
	            // IIFE lamda to synchronously exectue asynchronous functions
        		(async () => {
        			await this.respondCall(data);
        		})();
	            break;

	        case 'answer':
	        	// IIFE lamda to synchronously exectue an asynchronous functions
        		(async () => {
        			await this.peerWrapper.setRemoteDescription(data.answer);
        		})();
	        	break;
        }
	}

    register(username) {
        this.webSocketWrapper.sendMessage({
            operationType: 'register',
        	username
        });
    }

    requestCall(localUserId, remoteUserId) {
		this.webSocketWrapper.sendMessage({
            operationType: 'requestCall',
        	receiverId: remoteUserId,
        	senderId: localUserId
        });
    }

    async respondCall(data) {
    	await this.peerWrapper.setRemoteDescription(data.offer);
        let answer = await this.peerWrapper.prepareAnswer();
		this.callbacks.callEstablished();
        this.webSocketWrapper.sendMessage({
            operationType: 'answer',
            senderId: data.receiverId,
            receiverId: data.senderId,
            answer
        });
		if (!this.callStarted) {
        	await this.call(data.receiverId, data.senderId);
        }
    }
}
