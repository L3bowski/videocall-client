import WebSocketWrapper from './WebSocketWrapper.js';
import PeerWrapper from './PeerWrapper.js';

export default class ServerConnection {

    acceptCall(remoteUserId, localUserId) {
		this.localUserId = localUserId;
		this.remoteUserId = remoteUserId;

		this.webSocketWrapper.sendMessage({
            operationType: 'callAccepted',
        	receiverId: remoteUserId,
        	senderId: localUserId
        });
    }

	constructor(webSocketUrl, callbacks) {
		this.localUserId = null;
		this.remoteUserId = null;
		this.callbacks = callbacks;
		this.webSocketWrapper = new WebSocketWrapper(webSocketUrl, this.onWebsocketMessage.bind(this));
        this.peerWrapper = new PeerWrapper(this.iceCandidateHanlder.bind(this));
	}

	iceCandidateHanlder(iceCandidate) {
    	this.webSocketWrapper.sendMessage({
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
				this.respondCall(data);
				this.callbacks.callEstablished();
	            break;

	        case 'answerReceived':
    			this.peerWrapper.setRemoteDescription(data.answer);
				this.callbacks.callEstablished();
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
		this.localUserId = localUserId;
		this.remoteUserId = remoteUserId;

		this.webSocketWrapper.sendMessage({
            operationType: 'callRequested',
        	receiverId: remoteUserId,
        	senderId: localUserId
        });
    }

    async respondCall(data) {
        let answer = await this.peerWrapper.prepareAnswer(data.offer);
        this.webSocketWrapper.sendMessage({
            operationType: 'answerReceived',
            answer,
            senderId: data.receiverId,
            receiverId: data.senderId
        });
    }

    async sendOffer(localUserId, remoteUserId) {
    	let offer = await this.peerWrapper.prepareOffer();
        this.webSocketWrapper.sendMessage({
            operationType: 'offerReceived',
            offer,
            senderId: localUserId,
            receiverId: remoteUserId
        });
    }
}
