import WebSocketWrapper from './WebSocketWrapper.js';
import PeerWrapper from './PeerWrapper.js';

export default class ServerConnection {

	constructor(webSocketUrl, callbacks) {
		this.localUserId = null;
		this.remoteUserId = null;
		this.callStarted = false;
		this.callbacks = callbacks;
		this.webSocketWrapper = new WebSocketWrapper(webSocketUrl, message => {
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

				case 'hangUpCall':
		        	this.callbacks.callFinished(data);
		        	break;

		        case 'ice':
		        	this.peerWrapper.addIceCandidate(data.candidate);
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
        });

        this.peerWrapper = new PeerWrapper(candidate => {
        	this.webSocketWrapper.sendMessage({
	            operationType: 'ice',
	            candidate,
	            senderId: this.localUserId,
	            receiverId: this.remoteUserId
	        });
        });
	}

    register(username) {
        this.webSocketWrapper.sendMessage({
            operationType: 'register',
        	username
        });
    }

    requestCall(senderId, receiverId) {
		this.webSocketWrapper.sendMessage({
            operationType: 'requestCall',
        	receiverId,
        	senderId
        });
    }

	hangUpCall(senderId, receiverId) {
		this.webSocketWrapper.sendMessage({
            operationType: 'hangUpCall',
        	receiverId,
        	senderId
        });
    }

    acceptCall(initiatorId, userId) {
		this.webSocketWrapper.sendMessage({
            operationType: 'acceptCall',
        	receiverId: initiatorId,
        	senderId: userId
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