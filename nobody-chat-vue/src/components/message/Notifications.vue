<script lang="ts" setup>
import { useMsgState } from '@/stores/message_state';

let msgState = useMsgState();

</script>

<template>
    <ul>
        <TransitionGroup name="list" tag="ul">
            <li v-for="notify in msgState.notifications" :key="notify.id">
                <div class="toast relative p-2">
                    <div class="alert alert-info">
                        <span>{{ notify.content }}</span>
                    </div>
                </div>
            </li>
        </TransitionGroup>
    </ul>
</template>

<style>
.list-move,
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

.list-leave-active {
    position: absolute;
}
</style>