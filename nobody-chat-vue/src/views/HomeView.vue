<script setup lang="ts">
import { onMounted } from 'vue'
import { getOnlineUsers, type WsRecvData } from '@/http'
import OnlineUser from '@/components/OnlineUser.vue'
import ChatBubbleBox from '@/components/ChatBubbleBox.vue'
import { useChatState } from '@/stores/chat_state'


let socket: WebSocket;

const chatState = useChatState();

onMounted(async () => {
  socket = chatState.socket;
  socket.onmessage = (event) => {
    let data: WsRecvData = JSON.parse(event.data);
    if (data.msg_type.setUser) {
      chatState.setUserInfo(data.msg_type.setUser);
    } else if (data.msg_type.userOnline) {
      chatState.newUserOnline(data.msg_type.userOnline);
    } else if (data.msg_type.msg) {
      chatState.receiveMsg(data.msg_type.msg.from, data.msg_type.msg.msg);
    } else if (data.msg_type.userOffline) {
      chatState.removeUser(data.msg_type.userOffline.id);
    }

  }

  chatState.onlineUsers = await getOnlineUsers();
})

function handleSentMsg(msg: string) {
  if (chatState.talkTo !== null) {
    chatState.socket.send(JSON.stringify({
      msg_type: {
        talkTo: {
          to: chatState.talkTo?.id,
          msg: msg,
        },
      },
    }));
  }

}

</script>

<template>
  <main id="chat-main" class="h-screen w-screen bg-base-200 md:h-[90vh] md:w-[90vw] md:rounded-md">
    <div class="flex flex-col md:flex-row h-full p-4 gap-4">
      <div class="md:bg-base-100 min-w-72 md:h-full rounded-md">
        <div class="drawer md:drawer-open flex flex-col max-h-full py-2 pl-2">
          <input id="online-list" type="checkbox" class="drawer-toggle" />
          <div class="drawer-content flex items-start">
            <div class="flex gap-4 w-full md:py-2 px-2">
              <label for="online-list" class="flex gap-2 max-md:btn text-lg font-bold cursor-pointer md:cursor-auto">
                Online(s)
                <span class="block w-7">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                      d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                  </svg></span>
              </label>
              <div class="flex flex-grow justify-end pr-2">
                <a class="flex w-7" href="https://github.com/dvorakchen/nobody-chat" target="_blank">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16">
                    <path
                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div
            class="drawer-side z-10 max-h-full overflow-x-hidden overflow-y-scroll scrollbar-w-none md:scrollbar-w-auto md:pt-4 md:pr-4">
            <label for="online-list" aria-label="close sidebar" class="drawer-overlay"></label>
            <div class="bg-base-100 p-4 md:p-0 min-w-72 max-md:h-screen">
              <ul class="space-y-2" id="online-user-list">

                <OnlineUser v-for="{ id, name, unread } of chatState.onlineUsers" :id="id" :name="name" :unread="unread"
                  :key="id" />

              </ul>
              <p class="py-4 text-sm text-base-content text-center">NO MORE</p>
            </div>
          </div>
        </div>
      </div>

      <ChatBubbleBox @sentMsg="handleSentMsg" />

    </div>
  </main>
</template>
