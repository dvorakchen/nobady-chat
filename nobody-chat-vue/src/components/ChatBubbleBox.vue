<script setup lang="ts">
import { useChatState } from '@/stores/chat_state';
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue';
import MyBubble from '@/components/MyBubble.vue';
import TheirBubble from '@/components/TheirBubble.vue';
import IconVideo from '@/icons/video.vue'
import VideoBox from './VideoView/VideoBox.vue';
import { usePeerState } from '@/stores/peer_state';
import RequestAlert from './VideoView/RequestAlert.vue';
import { setOverScroll } from '@/utils';

const sentMsgEmit = defineEmits<{
    (e: 'sentMsg', msg: string): void
}>()

let bubbleList = useTemplateRef('bubble-list');

let peerState = usePeerState();
let chatState = useChatState();

let records = computed(() => {
    let talkToId = chatState.talkTo?.id;
    if (!talkToId) {
        return [];
    }
    return chatState.historyRecords.get(talkToId);
})

const sendMsg = ref('');

onMounted(() => {
    if (bubbleList.value?.children?.length ?? 0 > 0) {
        bubbleList.value!.children[bubbleList.value!.children.length! - 1].scrollIntoView({
            behavior: 'smooth'
        })
    }
})

function handleSendMsg() {
    if (sendMsg.value.trim() === '' || chatState.talkTo === null) {
        return;
    }
    chatState.sendNewMsg(chatState.talkTo.id, sendMsg.value)
    nextTick(() => {
        if (bubbleList.value?.children?.length ?? 0 > 0) {
            bubbleList.value!.children[bubbleList.value!.children.length! - 1].scrollIntoView({
                behavior: 'smooth'
            })
        }
    })
    sentMsgEmit('sentMsg', sendMsg.value);
    sendMsg.value = '';
}

function handleApplyVideo() {
    peerState.state = 'requesting';
    peerState.oppositeId = chatState.talkTo!.id;
}

const videoPosition = ref({
    x: 0,
    y: 0
})

const startVideoPosition = {
    x: 0,
    y: 0
}

const preVideoPosition = {
    x: 0,
    y: 0
}


const videoPositionStyle = computed(() => {
    return {
        transform: `translateX(${videoPosition.value.x}px) translateY(${videoPosition.value.y}px)`
    }
})

function handlePointerStart(ev: PointerEvent) {
    let ele = ev.currentTarget as HTMLElement;
    setOverScroll(false);
    console.log('false')

    startVideoPosition.x = ev.clientX;
    startVideoPosition.y = ev.clientY;

    ele.addEventListener('pointermove', handleVideoMove);
    ele.addEventListener('pointerup', handleVideoRemoveMoveEvent)
    ele.addEventListener('pointerleave', handleVideoRemoveMoveEvent)
}

function handleVideoMove(ev: PointerEvent) {
    ev.preventDefault();
    const tmpX = ev.clientX - startVideoPosition.x + preVideoPosition.x;
    const tmpY = ev.clientY - startVideoPosition.y + preVideoPosition.y;

    videoPosition.value.x = tmpX
    videoPosition.value.y = tmpY
}

function handleVideoRemoveMoveEvent(ev: PointerEvent) {
    let ele = ev.currentTarget as HTMLElement;
    setOverScroll(true)
    console.log('true')

    preVideoPosition.x = videoPosition.value.x;
    preVideoPosition.y = videoPosition.value.y;

    ele.removeEventListener('pointermove', handleVideoMove);
    ele.removeEventListener('pointerup', handleVideoRemoveMoveEvent)
    ele.removeEventListener('pointerleave', handleVideoRemoveMoveEvent)
}


</script>

<template>
    <div class="flex-grow rounded-md max-md:h-0">
        <div class="w-full h-full flex items-center justify-center" v-if="chatState.talkTo === null">
            <p class="text-3xl font-black -mt-10">NOBODY CHAT</p>
        </div>
        <div class="flex flex-col h-full space-y-2" v-if="chatState.talkTo !== null">
            <div class="p-4 flex">
                <span class="text-lg font-bold flex-grow">Chat to:
                    <span :data-userid="chatState.talkTo?.id">{{ chatState.talkTo?.name }}
                        <span class="text-accent" v-if="chatState.talkTo === null">(Offline)</span>
                    </span>
                </span>
                <span class=" tooltip" :data-tip="`发起视频通话${peerState.isUsing ? '（忙碌中）' : ''}`">
                    <button class="btn btn-ghost" :disabled="peerState.isUsing" @click="handleApplyVideo">
                        <span class="w-8">
                            <icon-video />
                        </span>
                    </button>
                </span>
            </div>
            <div class=" flex-grow overflow-y-scroll">
                <ul class="px-4" id="bubbleList" ref="bubble-list">
                    <template v-for="[their, own] of records">
                        <component :is="their === '' ? MyBubble : TheirBubble" :message="their === '' ? own : their" />
                    </template>

                </ul>
            </div>
            <form class="flex gap-2" id="send-message" @submit.prevent="handleSendMsg">
                <input type="text" class="input input-bordered input-lg w-full" id="new-message"
                    placeholder="type here, enter to send" required autocomplete="off" v-model="sendMsg" />
                <button class="btn btn-primary h-full xl:btn-wide" type="submit">Send</button>
            </form>
        </div>
    </div>

    <teleport to="#app" v-if="peerState.isUsing">
        <div class="fixed z-50 top-2 right-2 user-selection-none cursor-all-scroll w-80 aspect-[9/16]
         max-w-[50%]" @pointerdown.stop.prevent.passive="handlePointerStart" :style="videoPositionStyle">
            <VideoBox />
        </div>
    </teleport>

    <Teleport to="#app" v-if="peerState.isThinking">
        <RequestAlert />
    </Teleport>
</template>