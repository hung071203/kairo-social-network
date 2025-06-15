function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  const isCurrentUser = message.sender && message.sender._id === currentUser?._id;
  messageDiv.className = `message-wrapper ${isCurrentUser ? 'sent' : 'received'}`;
  messageDiv.dataset.messageId = message._id;

  let avatarHtml = '';
  if (!isCurrentUser) {
    const senderAvatar = message.sender?.avatar || '/images/kairo.jpg';
    avatarHtml = `
      <div class="avatar">
        <img class="w-full h-full object-cover" src="${senderAvatar}" alt="Avatar"/>
      </div>
    `;
  }

  let replyHtml = '';
  if (message.replyTo) {
    const replyAuthor = message.replyTo.sender?.name || 'Người dùng';
    const replyContent = message.replyTo.content || '';
    replyHtml = `
      <div class="reply-message">
        <div class="reply-author">${replyAuthor}</div>
        <div class="reply-content">${replyContent}</div>
      </div>
    `;
  }

  let contentHtml = '';
  switch (message.type) {
    case 'IMAGE':
      contentHtml = `
        <img
          class="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition"
          src="${message.content}"
          alt="Image"
          onclick="openImageModal('${message.content}')"
        />`;
      break;
    case 'VIDEO':
      contentHtml = `
        <video controls class="rounded-lg w-full h-auto" preload="metadata">
          <source src="${message.content}" type="video/mp4"/>
        </video>
      `;
      break;
    default:
      contentHtml = `<p>${message.content}</p>`;
  }

  let reactionsHtml = '';
  if (message.reactions && message.reactions.length > 0) {
    const reactionGroups = {};
    message.reactions.forEach((reactionObj) => {
      const emoji = reactionObj.reaction;
      reactionGroups[emoji] = (reactionGroups[emoji] || 0) + 1;
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
        <button onclick="toggleReactionPicker(event, '${message._id}')" class="reaction-btn">
          <i class="ri-emotion-line"></i>
        </button>
        <div class="reaction-picker" id="reactionPicker${message._id}">
          <button onclick="addReaction('${message._id}', '❤️')">❤️</button>
          <button onclick="addReaction('${message._id}', '😊')">😊</button>
          <button onclick="addReaction('${message._id}', '😂')">😂</button>
          <button onclick="addReaction('${message._id}', '👍')">👍</button>
          <button onclick="addReaction('${message._id}', '😮')">😮</button>
          <button onclick="addReaction('${message._id}', '😢')">😢</button>
        </div>
      </div>
      <div class="relative">
        <button onclick="toggleMenu(event, '${message._id}')" class="more-btn">
          <i class="ri-more-line"></i>
        </button>
        <div class="context-menu hidden" id="menu${message._id}">
          <button onclick="handleReply('${message._id}', '${message.content.replace(/'/g, "\\'")}', '${message.sender?.name || 'Người dùng'}')">
            <i class="ri-reply-line"></i>Reply
          </button>
          ${isCurrentUser ? `<button onclick="handleDelete('${message._id}')">
            <i class="ri-delete-bin-line"></i>Xóa tin nhắn
          </button>` : ''}
        </div>
      </div>
    </div>`;

  const messageTime = formatTime(message.createdAt);
  const senderName = message.sender?.name || 'Người dùng';

  messageDiv.innerHTML = `
    ${avatarHtml}
    <div class="message-content">
      ${!isCurrentUser ? `<div class="sender-name">${senderName}</div>` : ''}
      <div class="flex items-end ${isCurrentUser ? 'justify-end' : ''}">
        ${isCurrentUser ? action : ''}
        <div class="message-bubble ${isCurrentUser ? 'sent' : 'received'} p-3 rounded-lg ${message.replyTo ? 'reply-animation' : ''} p-1 max-w-[500px] group relative">
          ${replyHtml}
          ${contentHtml}
          <div class="time-tooltip">${messageTime}</div>
          ${reactionsHtml}
        </div>
        ${!isCurrentUser ? action : ''}
      </div>
    </div>
  `;

  return messageDiv;
}
