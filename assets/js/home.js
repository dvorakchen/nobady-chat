const chatBox = document.getElementById("chat-box");
const messageForm = document.getElementById("send-message");
const newMessage = document.getElementById("new-message");
const bubbleList = document.getElementById("bubble-list");
const bgPlaceholder = document.getElementById("bg-phaceholder");
const onlineUserList = document.getElementById("online-user-list");
const talkTo = document.getElementById("talkTo");

const historyRecord = new Map();

class User {
  #id = "";
  #name = "";
  #talkTo = "";

  get name() {
    return this.#name;
  }

  set name(newName) {
    this.#name = newName;
  }

  get id() {
    return this.#id;
  }

  get talkTo() {
    return this.#talkTo;
  }

  set talkTo(newTalkTo) {
    this.#talkTo = newTalkTo;
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
  if (
    target.nodeName !== "INPUT" ||
    target.name !== "online-user" ||
    target.dataset.userid === user.talkTo
  ) {
    return;
  }

  const talkToName = target.dataset.username;
  user.talkTo = target.dataset.userid;

  talkTo.textContent = talkToName;
  talkTo.dataset.userid = user.talkTo;

  bubbleList.replaceChildren();
  bgPlaceholder.style.display = "none";
  chatBox.style.display = "flex";

  const records = historyRecord.get(user.talkTo);
  if (records !== undefined && records.length !== 0) {
    records.forEach((record) => {
      let bubble;
      if (record[0] === null) {
        bubble = buildMyBubble(record[1]);
      } else {
        bubble = buildTheirBubble(record[0]);
      }

      appendBubble(bubble);
    });
  }

  const userEle = document.querySelector(`li [data-unread='${user.talkTo}']`);
  userEle.classList.add("hidden");
  userEle.textContent = "";
});

messageForm.onsubmit = (ev) => {
  ev.preventDefault();
  const newMsg = newMessage.value.trim();
  if (!newMsg) {
    return false;
  }

  socket.send(
    JSON.stringify({
      msg_type: {
        talkTo: {
          to: user.talkTo,
          msg: newMsg,
        },
      },
    })
  );

  let msg = buildMyBubble(newMsg);
  appendBubble(msg);

  let record = historyRecord.get(user.talkTo);
  if (record === undefined) {
    record = [];
    historyRecord.set(user.talkTo, record);
  }
  record.push([null, newMsg]);

  newMessage.value = "";
};

function appendBubble(bubble) {
  bubbleList.appendChild(bubble);
  bubble.scrollIntoView({
    behavior: "smooth",
  });
}

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

const socket = new WebSocket(
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`
);

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
  } else if (data.msg_type.msg) {
    appendReceivedNewMsg(data.msg_type.msg.from, data.msg_type.msg.msg);
  } else if (data.msg_type.userOffline) {
    removeUser(data.msg_type.userOffline.id);
  }

  console.log("Message from server ", data);
});

function removeUser(userId) {
  if (userId === user.id) {
    return;
  }

  let userLi = document.querySelector(
    `li[name="online-user"][data-userid="${userId}"]`
  );
  if (userLi !== null) {
    userLi.remove();
  }
}

function appendReceivedNewMsg(from, msg) {
  let records = historyRecord.get(from);
  if (records === undefined) {
    records = [];
    historyRecord.set(from, records);
  }

  records.push([msg, null]);

  if (user.talkTo === from) {
    let ele = buildTheirBubble(msg);
    bubbleList.appendChild(ele);
    ele.scrollIntoView({
      behavior: "smooth",
    });
  } else {
    const userEle = document.querySelector(`li [data-unread='${from}']`);
    userEle.classList.remove("hidden");
    let unread = userEle.textContent;
    unread = parseInt(unread);
    if (isNaN(unread)) {
      unread = 1;
    } else {
      unread++;
    }

    userEle.textContent = unread;
  }
}

function appendNewUserOnline(newUser) {
  const userEle = document.querySelector(`li [data-userid='${newUser.id}']`);
  if (userEle !== null) {
    return;
  }

  let own = newUser.id === user.id;

  const template = `
  <div class="collapse collapse-arrow bg-base-200">
    <input
      type="radio"
      name="online-user"
      data-userId="${newUser.id}"
      data-username="${newUser.name}"
    />
    <div class="collapse-title text-lg font-medium">${newUser.name}
      <div class="badge badge-accent hidden" data-unread=${newUser.id}></div>
    </div>
    <div class="collapse-content">
      <div class="badge badge-accent">Activity</div>
    </div>
  </div>
  `;

  const ownTemplate = `
  <div class="collapse bg-base-200">
    <input
      type="radio"
      data-userid="${newUser.id}"
      data-username="${newUser.name}"
    />
    <div class="collapse-title text-lg font-medium">${newUser.name}
      <div class="badge badge-accent">You</div>
    </div>
  </div>
  `;

  const li = document.createElement("li");
  li.setAttribute("name", "online-user");
  li.setAttribute("data-userid", newUser.id);

  li.innerHTML = own ? ownTemplate : template;

  if (own) {
    onlineUserList.prepend(li);
  } else {
    onlineUserList.appendChild(li);
  }
}

chatBox.style.display = "none";
