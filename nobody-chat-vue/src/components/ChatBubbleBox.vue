<script setup lang="ts">
import { useChatState } from '@/stores/chat_state';
import { computed, nextTick, onMounted, ref } from 'vue';
import MyBubble from '@/components/MyBubble.vue';
import TheirBubble from '@/components/TheirBubble.vue';
import IconVideo from '@/icons/video.vue'
import VideoBox from './VideoView/VideoBox.vue';
import { usePeerState } from '@/stores/peer_state';
import { useVideoState } from '@/stores/video_state';
import { setOverScroll } from '@/utils';
import type { User } from '@/models';

const sentMsgEmit = defineEmits<{
    (e: 'sentMsg', msg: string): void
}>()

const videoState = useVideoState();
let chatState = useChatState();

let records = computed(() => {
    return chatState.talkTo?.records ?? [];
})

const sendMsg = ref('');

onMounted(() => {
    chatState.bubbleListToEnd()
})

function handleSendMsg() {
    if (sendMsg.value.trim() === '' || chatState.talkTo === null) {
        return;
    }
    chatState.talkTo.records.push(['', sendMsg.value])
    nextTick(() => {
        chatState.bubbleListToEnd();
    })
    sentMsgEmit('sentMsg', sendMsg.value);
    sendMsg.value = '';
}

function handleApplyVideo() {
    videoState.to = chatState.talkTo!.user
    videoState.state = 'offering'
    videoState.sendOffer()
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
                    <span :data-userid="chatState.talkTo?.user.id">{{ chatState.talkTo?.user.name }}
                        <span class="text-accent" v-if="chatState.talkTo === null">(Offline)</span>
                    </span>
                </span>
                <span class=" tooltip" :data-tip="`发起视频通话${videoState.isShowScreen ? '（忙碌中）' : ''}`">
                    <button class="btn btn-ghost" :disabled="videoState.isShowScreen" @click="handleApplyVideo">
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

    <teleport to="#app" v-if="videoState.isShowScreen">
        <div class="fixed z-50 top-2 right-2 user-selection-none cursor-all-scroll w-80 aspect-[9/16]
         max-w-[50%]" @pointerdown.stop.prevent.passive="handlePointerStart" :style="videoPositionStyle">
            <VideoBox />
        </div>
    </teleport>

</template>