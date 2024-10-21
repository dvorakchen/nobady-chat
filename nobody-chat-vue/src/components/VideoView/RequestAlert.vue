<script lang="ts" setup>
import { useChatState } from '@/stores/chat_state';
import { usePeerState } from '@/stores/peer_state';

let peerState = usePeerState();
let chatState = useChatState();

function handleAccept() {
    peerState.acceptRequest();
}

function handleDeny() {
    peerState.denyRequest()
}

</script>

<template>
    <div class="fixed top-2 z-50">
        <div role="alert" class="alert">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                class="stroke-info h-6 w-6 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{{ peerState.oppositeName }} 向你发起视频通话</span>
            <div>
                <button class="btn btn-sm" @click="handleDeny">拒绝</button>
                <button class="btn btn-sm btn-primary" @click="handleAccept">接受</button>
            </div>
        </div>
    </div>
</template>