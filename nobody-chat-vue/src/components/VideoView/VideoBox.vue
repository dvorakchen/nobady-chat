<script lang="ts" setup>

import { onMounted, useTemplateRef } from 'vue';
import { useChatState } from '@/stores/chat_state';
import { usePeerState } from '@/stores/peer_state';
import { WebSocketData } from '@/http';

let videoRef = useTemplateRef('video-ele')
let remoteVideoRef = useTemplateRef('remote-video-ele')

const peerState = usePeerState();
const chatState = useChatState();

const talkTo = chatState.talkTo;
if (talkTo) {
    onMounted(() => {
        peerState.videoRef = videoRef.value
        peerState.removeVideoRef = remoteVideoRef.value
        requestVideoCommunicate()
    });
} else if (peerState.oppositeId !== '') {
    onMounted(() => {
        peerState.videoRef = videoRef.value
        peerState.removeVideoRef = remoteVideoRef.value
    });
}



function requestVideoCommunicate() {
    const signalData = WebSocketData.newRequestVideo(chatState.user.id, talkTo!.id)
    peerState.requestTimeStamp = +signalData.msg_type.signal.value
    peerState.oppositeId = talkTo!.id;
    peerState.state = 'requesting'

    chatState.socket.send(JSON.stringify(signalData))
}

</script>

<template>
    <div class="mockup-phone border-primary user-selection-none w-full h-full">
        <div class="camera max-w-[60%]"></div>
        <div class="display w-full h-full">
            <div class="artboard artboard-demo w-full h-full">
                <div class="relative w-full h-full flex flex-col justify-center items-center">
                    <h1 class="absolute text-xl flex justify-center gap-2 bg-base-100 p-2 shadow rounded opacity-70"
                        v-if="peerState.isConnection">连接中
                        <span class="loading loading-bars"></span>
                    </h1>
                    <video width="100%" ref="video-ele" playsinline muted v-show="peerState.showVideo" />
                    <video class="absolute top-5 right-4" ref="remote-video-ele" playsinline width="50%" autoplay />
                </div>
            </div>
        </div>
    </div>
</template>