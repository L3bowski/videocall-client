<template>
    <div id="app">

        <div v-if="user.id == null">
            <p>Choose your username</p>
            <input v-model="user.name"/>
            <button v-if="user.name != null" v-on:click="register" id="register-button">Register</button>
        </div>

        <div v-if="user.id != null && !callInProgress">
            <p>Choose some one to call to:</p>
            <p v-if="otherUsers.length == 0">Seems that there is no one registered yet...</p>
            <div v-if="otherUsers.length > 0">
                <select v-model="selectedUser">
                    <option disabled value="">Please select one</option>
                    <option v-for="user in otherUsers" v-bind:value="user" >{{ user.name }}</option>
                </select>
                <button v-if="selectedUser != null" v-on:click="requestCall">Call</button>
            </div>
        </div>

        <div v-if="promptAcceptCall">
            <p>{{ selectedUser.name }} is calling you. Do you want to accept the call?</p>
            <button v-on:click="acceptCall">Yes</button>
            <button v-on:click="rejectCall">No</button>
        </div>

        <div id="video-wrapper" class="video-wrapper">
            <div class="thumbnail"></div>
        </div>

    </div>
</template>

<script>
    import ServerConnection from './ServerConnection.js';

    export default {
        data: () => ({
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
        },
        async mounted() {
            this.serverConnection = new ServerConnection('ws://localhost:20000', {
                userRegistered: (user, otherUsers) => {
                    this.user = user;
                    this.otherUsers = otherUsers;
                },
                otherUserRegistered: (newUser) => {
                    this.otherUsers = this.otherUsers.concat([newUser]);
                },
                callRequested: (data) => {
                    this.selectedUser = this.otherUsers.find(user => user.id = data.senderId);
                    this.promptAcceptCall = true;
                },
                callAccepted: async () => {
                    await this.serverConnection.call(this.user.id, this.selectedUser.id);
                },
                callEstablished: () => {
                    this.callInProgress = true;
                }
            });
        }
    }
</script>

<style scoped>
    .thumbnail {
        width: 640px;
        height: 480px;
        background-color: lightgrey;
    }
</style>
