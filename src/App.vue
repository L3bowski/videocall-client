<template>
    <div id="app">

        <div v-if="serverConnection == null">
            <p>Introduce the server address to connect to</p>
            <input v-model="webSocketUrl" id="server-address"/>
            <button v-if="webSocketUrl != null" v-on:click="setUpConnection" id="server-connect">Connect</button>
        </div>

        <div v-if="serverConnection != null && user.id == null">
            <p>Choose your username</p>
            <input v-model="user.name" id="username"/>
            <button v-if="user.name != null" v-on:click="register" id="register">Register</button>
        </div>

        <div v-if="user.id != null && !callInProgress">
            <p>Choose some one to call to:</p>
            <p v-if="otherUsers.length == 0">Seems that there is no one registered yet...</p>
            <div v-if="otherUsers.length > 0">
                <select v-model="selectedUser" id="user-select">
                    <option disabled value="">Please select one</option>
                    <option v-for="user in otherUsers" v-bind:value="user" :data-client-name="user.name">{{ user.name }}</option>
                </select>
                <button v-if="selectedUser != null" v-on:click="requestCall" id="call-user">Call</button>
            </div>
        </div>

        <div v-if="promptAcceptCall">
            <p>{{ selectedUser.name }} is calling you. Do you want to accept the call?</p>
            <button v-on:click="acceptCall" id="accept-call">Yes</button>
            <button v-on:click="rejectCall" id="reject-call">No</button>
        </div>

        <div id="video-wrapper" class="video-wrapper"></div>

    </div>
</template>

<script>
    import ServerConnection from './ServerConnection.js';

    export default {
        data: () => ({
            webSocketUrl: null,
            serverConnection: null,
            user: {
                id: null,
                name: null
            },
            otherUsers: [],
            selectedUser: null,
            promptAcceptCall: false,
            callInProgress: false
        }),
        methods: {
            setUpConnection() {
                this.serverConnection = new ServerConnection(this.webSocketUrl, {
                    userRegistered: (user, otherUsers) => {
                        this.user = user;
                        this.otherUsers = otherUsers;
                    },
                    otherUserRegistered: (newUser) => {
                        this.otherUsers = this.otherUsers.concat([newUser]);
                    },
                    callRequested: (data) => {
                        this.selectedUser = this.otherUsers.find(user => user.id == data.senderId);
                        this.promptAcceptCall = true;
                    },
                    callAccepted: async () => {
                        await this.serverConnection.call(this.user.id, this.selectedUser.id);
                    },
                    callEstablished: () => {
                        this.callInProgress = true;
                    }
                });
            },
            register() {
                this.serverConnection.register(this.user.name);
            },
            requestCall() {
                this.serverConnection.requestCall(this.user.id, this.selectedUser.id);
            },
            acceptCall() {
                this.promptAcceptCall = false;
                this.serverConnection.acceptCall(this.selectedUser.id, this.user.id);
            },
            rejectCall() {
                this.promptAcceptCall = false;
                this.selectedUser = null;
            }
        }
    }
</script>
