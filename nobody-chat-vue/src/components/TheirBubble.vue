<script setup lang="ts">
defineProps(['message'])
</script>

<template>
    <div class="chat chat-start">
        <div class="chat-bubble">
            {{ message }}
        </div>
    </div>
</template>