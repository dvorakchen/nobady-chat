<script setup lang="ts">
const { id, name, unread } = defineProps(['id', 'name', 'unread'])

import { computed, inject } from 'vue'

import { provideKey } from '@/stores/chat_state';
import type { OnlineUserModel } from '@/http';

let chatState: any = inject(provideKey)!;

const isOwn = computed(() => {
    return chatState?.user?.value?.id === id;
})
function handleClickUser() {
    if (isOwn.value) {
        return;
    }
    chatState.talkTo({ id, name } as OnlineUserModel);
}

</script>

<template>
    <li name="online-user" :data-userid="id">
        <div class="collapse  bg-base-200" :class="{ 'collapse-arrow': !isOwn }">
            <input type="radio" :style="{ cursor: isOwn ? 'default' : '' }" name="online-user" :data-userid="id"
                :data-username="name" @click="handleClickUser" />
            <div class="collapse-title text-lg font-medium">
                {{ name }}
                <div class="badge badge-accent" v-if="isOwn">You</div>
                <div class="badge badge-accent" v-if="!isOwn && unread > 0" :data-unread="id">{{ unread }}</div>
            </div>
            <div class="collapse-content" v-if="!isOwn">
                <div class="badge badge-accent">Activity</div>
            </div>
        </div>
    </li>
</template>
