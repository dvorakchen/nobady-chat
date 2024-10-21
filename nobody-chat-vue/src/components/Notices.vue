<script setup lang="ts">
import { useChatState } from '@/stores/chat_state';
import { onMounted, ref } from 'vue';

let chatState = useChatState();


function removeLastPeriodically() {
    setTimeout(() => {
        if (chatState.notices.length > 0) {
            chatState.notices.shift();

            removeLastPeriodically();
        }
    }, 3000);
}

onMounted(removeLastPeriodically);

</script>

<template>

    <div class="fixed z-10 top-2 right-0">
        <div class="flex flex-col">
            <div class="toast relative shadow py-2" v-for="msg in chatState.notices">
                <div class="alert alert-info">
                    <span>{{ msg }}</span>
                </div>
            </div>
        </div>
    </div>

</template>