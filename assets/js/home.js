const chatBox = document.getElementById("chat-box");
const messageForm = document.getElementById("send-message");
const newMessage = document.getElementById("new-message");
const bubbleList = document.getElementById("bubble-list");
const bgPlaceholder = document.getElementById("bg-phaceholder");
const onlineUserList = document.getElementById("online-user-list");

class User {
  #id = "";
  #name = "";

  get name() {
    return this.#name;
  }

  set name(newName) {
    this.#name = newName;
  }

  get id() {
    return this.#id;
  }

  setInfo(user) {
    const id = user.id;
    const name = user.name;

    this.#id = id;
    this.#name = name;

    appendNewUserOnline(user);
  }
}

let user = new User();

onlineUserList.addEventListener("click", (ev) => {
  const target = ev.target;
  if (target.nodeName !== "INPUT" || target.name !== "online-user") {
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
  // socket.send("Hello Server!");
});

// Listen for messages
socket.addEventListener("message", function (event) {
  let data = JSON.parse(event.data);

  if (data.msg_type.setUser) {
    user.setInfo(data.msg_type.setUser);
  } else if (data.msg_type.userOnline) {
    appendNewUserOnline(data.msg_type.userOnline);
  }

  console.log("Message from server ", data);
});

function appendNewUserOnline(newUser) {
  const userEle = document.querySelector(`li [data-userid='${newUser.id}']`);
  if (userEle !== null) {
    return;
  }

  const template = `
  <div class="collapse collapse-arrow bg-base-200">
    <input
      type="radio"
      name="online-user"
      data-userId="${newUser.id}"
    />
    <div class="collapse-title text-lg font-medium">${newUser.name}
    ${newUser.id === user.id ? `<div class="badge badge-accent">You</div>` : ``}
    </div>
    <div class="collapse-content">
      <div class="badge badge-accent">Activity</div>
    </div>
  </div>
  `;

  const li = document.createElement("li");

  li.innerHTML = template;

  onlineUserList.appendChild(li);
}

chatBox.style.display = "none";
