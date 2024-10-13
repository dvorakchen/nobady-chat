<script setup lang="ts">
import { useChatState } from '@/stores/chat_state';
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue';
import MyBubble from '@/components/MyBubble.vue';
import TheirBubble from '@/components/TheirBubble.vue';

const sentMsgEmit = defineEmits<{
    (e: 'sentMsg', msg: string): void
}>()

let bubbleList = useTemplateRef('bubble-list');

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
</script>

<template>
    <div class="flex-grow rounded-md max-md:h-0">
        <div class="w-full h-full flex items-center justify-center" v-if="chatState.talkTo === null">
            <p class="text-3xl font-black -mt-10">NOBODY CHAT</p>
        </div>
        <div class="flex flex-col h-full space-y-2" v-if="chatState.talkTo !== null">
            <div class="p-4">
                <span class="text-lg font-bold" id="chat-to">Chat to:
                    <span :data-userid="chatState.talkTo?.id">{{ chatState.talkTo?.name }}
                        <span class="text-accent" v-if="chatState.talkTo === null">(Offline)</span>
                    </span>
                </span>
            </div>
            <div class="flex-grow overflow-y-scroll">
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
</template>