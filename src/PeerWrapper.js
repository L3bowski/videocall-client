export default class PeerWrapper {

    addIceCandidate(iceCandidate) {
        return this.peerConnection.addIceCandidate(iceCandidate);
    }

	constructor(iceCandidateHandler) {
		this.peerConnection = new RTCPeerConnection();
		this.peerConnection.onaddstream = event => this.consumeVideoStream('remote-video', event.stream);
        this.peerConnection.onicecandidate = event => {
            if (event.candidate) {
                iceCandidateHandler(event.candidate);
            }
        };
	}

    consumeVideoStream(elementId, stream) {
        let videoWrapper = document.getElementById(elementId);
        videoWrapper.innerHTML = '';
        let video = document.createElement('video');
        videoWrapper.appendChild(video);
        video.src = window.URL.createObjectURL(stream);
        video.play();
        return video;
    }

    async getVideoStream() {
        let stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        return stream;
    }

	async prepareOffer() {
        var videoStream = await this.getVideoStream();
        this.consumeVideoStream('local-video', videoStream);
        this.peerConnection.addStream(videoStream);

        let offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer); // This operation will send many ice candidates

        return offer;
    }

    async prepareAnswer() {
        let answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    async setRemoteDescription(remoteDescription) {
        return await this.peerConnection.setRemoteDescription(remoteDescription);
    }
}
