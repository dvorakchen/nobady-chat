<script lang="ts" setup>

import { useVideoState } from '@/stores/video_state';

const videoState = useVideoState();

function handleHangUp() {
    videoState.hangUp()
}

</script>

<template>
    <div class="mockup-phone border-primary user-selection-none w-full h-full">
        <div class="camera max-w-[60%]"></div>
        <div class="display w-full h-full">
            <div class="artboard artboard-demo w-full h-full">
                <div class="relative w-full h-full flex flex-col justify-center items-center">
                    <h1 class="absolute text-xl flex justify-center gap-2 bg-base-100 p-2 shadow rounded opacity-70"
                        v-if="videoState.isShowConnecting">连接中
                        <span class="loading loading-bars"></span>
                    </h1>
                    <video width="100%" id="localVideo" ref="video-ele" playsinline muted autoplay />
                    <video class="absolute top-5 right-4" id="remoteVideo" ref="remote-video-ele" playsinline
                        width="50%" autoplay />
                    <div class="absolute bottom-10 flex items-center">
                        <button class="btn btn-error btn-circle" @click="handleHangUp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                class="bi bi-telephone-x-fill" viewBox="0 0 16 16">
                                <path fill-rule="evenodd"
                                    d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877zm9.261 1.135a.5.5 0 0 1 .708 0L13 2.793l1.146-1.147a.5.5 0 0 1 .708.708L13.707 3.5l1.147 1.146a.5.5 0 0 1-.708.708L13 4.207l-1.146 1.147a.5.5 0 0 1-.708-.708L12.293 3.5l-1.147-1.146a.5.5 0 0 1 0-.708" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>