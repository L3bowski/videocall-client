<template>
    <v-app :dark="true">
        
        <main>
            <v-toolbar>
              <v-toolbar-title>Videocall<span class="amber--text accent-3">JS</span></v-toolbar-title>
            </v-toolbar>
            <v-container fluid>
                
                 <div v-if="serverConnection == null">
                     <v-layout row>
                        <v-flex xs4>
                            <v-text-field
                              name="webSocketUrl-input"
                              v-model="webSocketUrl"
                              label="Introduce the server address to connect to"
                              id="server-address"
                            ></v-text-field>
                         </v-flex>
                         <v-flex xs4>
                            <v-btn v-if="webSocketUrl != null" v-on:click="setUpConnection" id="server-connect" primary dark>
                                <v-icon light left>fa-plug</v-icon>
                                Connect
                            </v-btn>
                        </v-flex>
                    </v-layout>
                </div>

                <div v-if="serverConnection != null && user.id == null">
                    <v-layout row>
                        <v-flex xs4>
                            <v-text-field
                              name="username-input"
                              v-model="user.name"
                              label="Choose your username"
                              id="username"
                            ></v-text-field>
                         </v-flex>
                         <v-flex xs4>
                            <v-btn v-if="user.name != null" v-on:click="register" id="register" warning dark>
                                <v-icon light left>fa-user-plus</v-icon>
                                Register
                            </v-btn>
                        </v-flex>
                    </v-layout>
                    
                </div>

                <div v-if="user.id != null && !callInProgress">

                    <v-subheader>Choose some one to call to:</v-subheader>
                    <p v-if="otherUsers.length == 0">Seems that there is no one registered yet...</p>
                    <div v-if="otherUsers.length > 0">
                    <v-layout row>
                        <v-flex xs4>
                            <v-select
                              v-bind:items="otherUsers"
                              v-model="selectedUser"
                              label="Please select one"
                              single-line
                              auto
                              item-text="name"
                              prepend-icon="fa-user"
                              hide-details
                            ></v-select>
                         </v-flex>
                         <v-flex xs4>
                            <v-btn v-if="selectedUser != null" v-on:click="requestCall" id="call-user" success dark>
                                <v-icon light left>fa-phone</v-icon>
                                Call
                            </v-btn>
                        </v-flex>
                    </v-layout>
                        
                        <!--<select v-model="selectedUser" id="user-select">
                            <option disabled value="">Please select one</option>
                            <option v-for="user in otherUsers" v-bind:value="user" :data-client-name="user.name">{{ user.name }}</option>
                        </select>
                        <button v-if="selectedUser != null" v-on:click="requestCall" id="call-user">Call</button>-->
                    </div>
                </div>
                <div v-if="promptAcceptCall">
                    <v-layout row justify-center style="position: relative;">
                        <v-dialog v-model="promptAcceptCall" lazy absolute>
                          <v-card>
                            <v-card-title>
                              <div class="headline">Entrance call</div>
                            </v-card-title>
                            <v-card-text><strong>{{ selectedUser.name }}</strong> is calling you. Do you want to accept the call?</v-card-text><br></v-card-text>
                            <v-card-actions>
                              <v-spacer></v-spacer>
                              <v-btn v-on:click="acceptCall" id="accept-call" success dark>Yes</v-btn>
                              <v-btn v-on:click="rejectCall" id="reject-call" error dark>No</v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-dialog>
                    </v-layout>
                </div>
                <div id="remote-video"></div>
                <div id="local-video" class="miniature"></div>

            </v-container>
        </main>
    </v-app>
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
            callInProgress: false,
            dialog: false
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
                    },
                    callFinished: () => {
                        this.callInProgress = false;
                    }
                });
            },
            register() {
                this.serverConnection.register(this.user.name);
            },
            requestCall() {
                this.serverConnection.requestCall(this.user.id, this.selectedUser.id);
            },
            hangUpCall() {
                this.callInProgress = false;
                this.serverConnection.hangUpCall(this.user.id, this.selectedUser.id);
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

<style>
    .miniature > video {
        width: 160px;
        height: 120px;
    }
</style>