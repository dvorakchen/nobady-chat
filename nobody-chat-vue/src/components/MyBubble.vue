<script setup lang="ts">
defineProps(['message']);
</script>
<template>
    <div class="chat chat-end">
        <div class="chat-bubble chat-bubble-primary">
            {{ message }}
        </div>
    </div>
</template>