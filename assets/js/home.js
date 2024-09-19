const chatBox = document.getElementById("chat-box");
const messageForm = document.getElementById("send-message");
const newMessage = document.getElementById("new-message");
const bubbleList = document.getElementById("bubble-list");
const bgPlaceholder = document.getElementById("bg-phaceholder");
const peopleList = document.getElementById("activity-people-list");

peopleList.addEventListener("click", (ev) => {
  const target = ev.target;
  if (target.nodeName !== "INPUT" || target.name !== "online-people") {
    return;
  }

  bgPlaceholder.style.display = "none";
  chatBox.style.display = "flex";
});

messageForm.onsubmit = (ev) => {
  ev.preventDefault();
  const newMsg = newMessage.value.trim();
  if (!newMsg) {
    return false;
  }

  let msg = buildMyBubble(newMsg);
  bubbleList.appendChild(msg);
  msg.scrollIntoView({
    behavior: "smooth",
  });
};

function buildMyBubble(message) {
  let li = document.createElement("li");
  li.innerHTML = `
<div class="chat chat-end">
  <div class="chat-bubble chat-bubble-primary">
    ${message}
  </div>
</div>
    `;

  return li;
}

function buildTheirBubble(message) {
  let li = document.createElement("li");
  li.innerHTML = `
<div class="chat chat-start">
  <div class="chat-bubble">
    ${message}
  </div>
</div>
    `;

  return li;
}

const socket = new WebSocket(`ws://${window.location.host}/ws`);

socket.addEventListener("open", function (event) {
  socket.send("Hello Server!");
});

// Listen for messages
socket.addEventListener("message", function (event) {
  console.log("Message from server ", event.data);
});

chatBox.style.display = "none";
