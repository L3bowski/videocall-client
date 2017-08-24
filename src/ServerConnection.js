import WebSocketWrapper from './WebSocketWrapper.js';
import PeerWrapper from './PeerWrapper.js';

export default class ServerConnection {

	constructor(webSocketUrl, callbacks) {
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

		        case 'ice':
		        	this.peerWrapper.peerConnection.addIceCandidate(data.candidate);
		        	break;

		        case 'offer':
		            // IIFE lamda to synchronously exectue asynchronous functions
            		(async () => {
            			await this.peerWrapper.peerConnection.setRemoteDescription(data.offer);
			            let answer = await this.peerWrapper.peerConnection.createAnswer();
			            await this.peerWrapper.peerConnection.setLocalDescription(answer);
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
            		})();
		            break;

		        case 'answer':
		        	// IIFE lamda to synchronously exectue an asynchronous functions
            		(async () => {
            			await this.peerWrapper.peerConnection.setRemoteDescription(data.answer);
            		})();
		        	break;
            }
        });

        this.peerWrapper = new PeerWrapper(this.webSocketWrapper);
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

    acceptCall(initiatorId, userId) {
		this.webSocketWrapper.sendMessage({
            operationType: 'acceptCall',
        	receiverId: initiatorId,
        	senderId: userId
        });
    }

    async call(senderId, receiverId) {
    	this.callStarted = true;
    	this.peerWrapper.call(senderId, receiverId)
    }
}