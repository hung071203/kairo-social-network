function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please select an image or video file.');
      event.target.value = '';
      return;
    }
    console.log(
      'Selected file:',
      file.name,
      'Type:',
      file.type,
      'Size:',
      file.size,
    );
    // Add your logic to handle the file (e.g., preview, upload, etc.)
  }
}

function openImageModal(imageUrl) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  modalImg.src = imageUrl;
  modal.classList.remove('hidden');
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.add('hidden');
}

function autoResize(textarea) {
  textarea.style.height = 'auto'; // Reset chiều cao về auto trước
  textarea.style.height = textarea.scrollHeight + 'px'; // Dãn theo nội dung
}

let currentReply = null;
let messageIdCounter = 0;

// Sample messages
const sampleMessages = [
  {
    id: ++messageIdCounter,
    type: 'received',
    content: 'Công chúa của anhhh3 ❤️❤️❤️❤️',
    time: '19:30',
    author: 'Công chúa của anhhh3',
    reactions: [],
  },
  {
    id: ++messageIdCounter,
    type: 'received',
    content: 'image',
    time: '19:32',
    author: 'Công chúa của anhhh3',
    isImage: true,
    imageUrl:
      'https://storage.googleapis.com/a1aa/image/f1fa1f8d-541c-4235-1226-2d7b8a6fdbab.jpg',
    reactions: [],
  },
  {
    id: ++messageIdCounter,
    type: 'sent',
    content: 'video',
    time: '19:35',
    author: 'Bạn',
    isVideo: true,
    reactions: [],
  },
  {
    id: ++messageIdCounter,
    type: 'received',
    content: 'Iu chồng nhé 💋',
    time: '19:40',
    author: 'Công chúa của anhhh3',
    reactions: [],
  },
  {
    id: ++messageIdCounter,
    type: 'received',
    content: 'Em đã xét tiền đến hôm 18/6',
    time: '19:42',
    author: 'Công chúa của anhhh3',
    reactions: [],
  },
  {
    id: ++messageIdCounter,
    type: 'received',
    content: 'Là tun phạm (wel)',
    time: '19:44',
    author: 'Công chúa của anhhh3',
    reactions: [],
  },
  {
    id: ++messageIdCounter,
    type: 'received',
    content: 'Nha hru em mua trả sau hết mấy 600k oy hihi',
    time: '22:06',
    author: 'Công chúa của anhhh3',
    reactions: [],
  },
  {
    id: ++messageIdCounter,
    type: 'sent',
    content: 'a đây 25t r mà đi học báo 2k cx k ai tin',
    time: '22:10',
    author: 'Bạn',
    reactions: [],
  },
  {
    id: ++messageIdCounter,
    type: 'sent',
    content: 'Vậy à, em cẩn thận nhé!',
    time: '22:12',
    author: 'Bạn',
    replyTo: {
      author: 'Công chúa của anhhh3',
      content: 'Nha hru em mua trả sau hết mấy 600k oy hihi',
    },
    reactions: ['❤️', '👍'],
  },
];

function renderMessages() {
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '';

  sampleMessages.forEach((message) => {
    const messageDiv = createMessageElement(message);
    container.appendChild(messageDiv);
  });
}

function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-wrapper ${message.type}`;
  messageDiv.dataset.messageId = message.id;

  let avatarHtml = '';
  if (message.type === 'received') {
    avatarHtml = `
                    <div class="avatar">
                        <img class="w-full h-full object-cover" src="https://storage.googleapis.com/a1aa/image/c16666aa-6bed-4ade-a776-fe6adb06f829.jpg" alt="Avatar"/>
                    </div>
                `;
  }

  let replyHtml = '';
  if (message.replyTo) {
    replyHtml = `
                    <div class="reply-message">
                        <div class="reply-author">${message.replyTo.author}</div>
                        <div class="reply-content">${message.replyTo.content}</div>
                    </div>
                `;
  }

  let contentHtml = '';
  if (message.isImage) {
    contentHtml = `
    <img
      class="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition"
      src="${message.imageUrl}"
      alt="Image"
      onclick="openImageModal('${message.imageUrl}')"
    />`;
  } else if (message.isVideo) {
    contentHtml = `
                    <video controls class="rounded-lg w-full h-auto" preload="metadata">
                        
                        <source src="https://redirector.googlevideo.com/videoplayback?expire=1749713830&ei=RS9KaL_7POfOp-oP0KX7qAQ&ip=176.1.134.163&id=o-AFu126Q9r1wdA0TYia2oHsW5GxJInYxLNiRVo8HIONgj&itag=18&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&met=1749692230%2C&mh=18&mm=31%2C29&mn=sn-uxax4vopj5qx-q0n6%2Csn-4g5edn6r&ms=au%2Crdu&mv=m&mvi=2&pl=17&rms=au%2Cau&initcwndbps=1965000&bui=AY1jyLOjN6MB1sb5x3Ynx44N5-UWstvWldkpEMivYokd7Ncjfq_EgB_jqeqbs_r85cQ9FnlaFuhfVFSf&spc=l3OVKTZVeu9sBr4oxx40cp6ZcsfpmyzmrlYMZzblxH-inJ-E2-1WfM4&vprv=1&svpuc=1&mime=video%2Fmp4&ns=_I02lB7b3-ufNp-wpXfFuWkQ&rqh=1&cnr=14&ratebypass=yes&dur=996.646&lmt=1739911603886714&mt=1749691739&fvip=4&fexp=51331020%2C51466643&c=MWEB&sefc=1&txp=5538534&n=1-35PzbS77i8qQ&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Crqh%2Ccnr%2Cratebypass%2Cdur%2Clmt&sig=AJfQdSswRAIgRovv1qLm_UQ2cJrEuZP2OBz5mNonwxWFAeIa1-4yvacCIAtL0vxUOfyKbY69fw7y6fe0Thruq_Eucm-ZgVyHuLWp&lsparams=met%2Cmh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Crms%2Cinitcwndbps&lsig=APaTxxMwRAIgK8DpnDxZ_pOkgjqspuank4MPizEqagrwYz7eqsKfnxsCIBSV6ZGRm4KSNospC93YVc1xZkQOHSgHvmbsenz_yMN9&pot=MnTYkNl6j5Owa9isxLC1xoArtf4ZuvD91TRSg1TSHePGD9fl8aPng-csKvwQYdFAIYp4WquIUg6g22mMEsf9hB-J9FNj9w0XltVTVp7PG3aWU0_mFcVLo4xcArSgbnduj8C6p41ekxb0TS7Boxsz0682kIFvXw==" type="video/mp4"/>
                    </video>
                `;
  } else {
    contentHtml = `<p>${message.content}</p>`;
  }

  let reactionsHtml = '';
  if (message.reactions && message.reactions.length > 0) {
    const reactionGroups = {};
    message.reactions.forEach((reaction) => {
      reactionGroups[reaction] = (reactionGroups[reaction] || 0) + 1;
    });

    const reactionElements = Object.entries(reactionGroups)
      .map(
        ([emoji, count]) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-600 text-white mr-1 mt-1 cursor-pointer hover:bg-gray-500 transition-colors">${emoji} ${count}</span>`,
      )
      .join('');

    reactionsHtml = `<div class="flex flex-wrap mt-1">${reactionElements}</div>`;
  }

  const action = `
                        <div class="message-controls">
                            <div class="relative">
                                <button onclick="toggleReactionPicker(event, ${message.id})" class="reaction-btn">
                                    <i class="ri-emotion-line"></i>
                                </button>
                                <div class="reaction-picker" id="reactionPicker${message.id}">
                                    <button onclick="addReaction(${message.id}, '❤️')">❤️</button>
                                    <button onclick="addReaction(${message.id}, '😊')">😊</button>
                                    <button onclick="addReaction(${message.id}, '😂')">😂</button>
                                    <button onclick="addReaction(${message.id}, '👍')">👍</button>
                                    <button onclick="addReaction(${message.id}, '😮')">😮</button>
                                    <button onclick="addReaction(${message.id}, '😢')">😢</button>
                                </div>
                            </div>
                            <div class="relative">
                                <button onclick="toggleMenu(event, ${message.id})" class="more-btn">
                                    <i class="ri-more-line"></i>
                                </button>
                                <div class="context-menu hidden" id="menu${message.id}">
                                    <button onclick="handleReply(${message.id}, '${message.content.replace(/'/g, "\\'")}', '${message.author}')">
                                        <i class="ri-reply-line"></i>Reply
                                    </button>
                                    <button onclick="handleDelete(${message.id})">
                                        <i class="ri-delete-bin-line"></i>Xóa tin nhắn
                                    </button>
                                </div>
                            </div>
                        </div>`;

  messageDiv.innerHTML = `
                ${avatarHtml}
                <div class="message-content">
                    ${message.type === 'received' ? `<div class="sender-name">${message.author}</div>` : ''}
                    <div class="flex items-end ${message.type === 'sent' ? 'justify-end' : ''}">
                        ${message.type === 'sent' ? action : ''}
                        <div class="message-bubble ${message.type} p-3 rounded-lg ${message.replyTo ? 'reply-animation' : ''} p-1 max-w-[500px] group relative">
                            ${replyHtml}
                            ${contentHtml}
                            <div class="time-tooltip">${message.time}</div>
                            ${reactionsHtml}
                        </div>
                        ${message.type === 'received' ? action : ''}
                    </div>
                </div>
            `;

  return messageDiv;
}

function toggleReactionPicker(event, messageId) {
  event.stopPropagation();

  // Close all other reaction pickers
  document.querySelectorAll('.reaction-picker').forEach((picker) => {
    if (picker.id !== `reactionPicker${messageId}`) {
      picker.classList.remove('active');
    }
  });

  // Close all menus
  document.querySelectorAll('.context-menu').forEach((menu) => {
    menu.classList.add('hidden');
  });

  const picker = document.getElementById(`reactionPicker${messageId}`);
  picker.classList.toggle('active');
}

function toggleMenu(event, messageId) {
  event.stopPropagation();

  // Close all other menus
  document.querySelectorAll('.context-menu').forEach((menu) => {
    if (menu.id !== `menu${messageId}`) {
      menu.classList.add('hidden');
    }
  });

  // Close all reaction pickers
  document.querySelectorAll('.reaction-picker').forEach((picker) => {
    picker.classList.remove('active');
  });

  const menu = document.getElementById(`menu${messageId}`);
  menu.classList.toggle('hidden');
}

function addReaction(messageId, emoji) {
  const message = sampleMessages.find((m) => m.id === messageId);
  if (message) {
    if (!message.reactions) {
      message.reactions = [];
    }
    message.reactions.push(emoji);
    renderMessages();
  }

  // Close reaction picker
  document
    .getElementById(`reactionPicker${messageId}`)
    .classList.remove('active');
}

function handleReply(messageId, content, author) {
  currentReply = {
    messageId: messageId,
    content: content,
    author: author,
  };

  document.getElementById('replyContent').textContent = content;
  document.getElementById('replyPreview').classList.remove('hidden');
  document.getElementById('messageInput').focus();

  // Close menu
  document.getElementById(`menu${messageId}`).classList.add('hidden');
}

function cancelReply() {
  currentReply = null;
  document.getElementById('replyPreview').classList.add('hidden');
}

function handleDelete(messageId) {
  const messageIndex = sampleMessages.findIndex((m) => m.id === messageId);
  if (messageIndex !== -1) {
    sampleMessages.splice(messageIndex, 1);
    renderMessages();
  }
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();

  if (content) {
    const newMessage = {
      id: ++messageIdCounter,
      type: 'sent',
      content: content,
      time: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      author: 'Bạn',
      reactions: [],
    };

    if (currentReply) {
      newMessage.replyTo = {
        author: currentReply.author,
        content: currentReply.content,
      };
      cancelReply();
    }

    sampleMessages.push(newMessage);
    renderMessages();
    input.value = '';

    // Scroll to bottom
    const chatContainer = document.querySelector('.chat-messages');
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // ngăn xuống dòng
    sendMessage();
  }
}

// Close menus and reaction pickers when clicking outside
document.addEventListener('click', function (event) {
  if (
    !event.target.closest('.reaction-btn') &&
    !event.target.closest('.reaction-picker')
  ) {
    document.querySelectorAll('.reaction-picker').forEach((picker) => {
      picker.classList.remove('active');
    });
  }

  if (
    !event.target.closest('.more-btn') &&
    !event.target.closest('.context-menu')
  ) {
    document.querySelectorAll('.context-menu').forEach((menu) => {
      menu.classList.add('hidden');
    });
  }
});

// Initialize
renderMessages();
