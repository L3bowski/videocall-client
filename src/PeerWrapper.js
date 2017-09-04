export default class PeerWrapper {

	constructor(webSocketWrapper) {
		this.localUserId = null;
		this.remoteUserId = null;
		this.webSocketWrapper = webSocketWrapper;
		this.peerConnection = new RTCPeerConnection();

		this.peerConnection.onaddstream = (event) => {
            let videoWrapper = document.getElementById('video-wrapper');
            videoWrapper.innerHTML = '';
            let video = document.createElement('video');
            videoWrapper.appendChild(video);
            video.src = window.URL.createObjectURL(event.stream);
            video.play();
        };

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.webSocketWrapper.sendMessage({
                    operationType: 'ice',
                    candidate: event.candidate,
                    senderId: this.localUserId,
                    receiverId: this.remoteUserId
                });
            }
        };
	}

	async call(localUserId, remoteUserId) {

		this.localUserId = localUserId;
		this.remoteUserId = remoteUserId;

        /*An stream from the current browser webcam is created and added to the peerConnection*/
        let stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        this.peerConnection.addStream(stream);

        let offer = await this.peerConnection.createOffer();
        /*The following operation will create many ice candidates */
        await this.peerConnection.setLocalDescription(offer);

        this.webSocketWrapper.sendMessage({
            operationType: 'offer',
            offer,
            senderId: this.localUserId,
            receiverId: this.remoteUserId
        });
    }

    addIceCandidate(iceCandidate) {
        return this.peerConnection.addIceCandidate(iceCandidate);
    }

    async setRemoteDescription(remoteDescription) {
        return await this.peerConnection.setRemoteDescription(remoteDescription);
    }

    async prepareAnswer() {
        let answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }
}