function showToast({
  message = 'Thông báo hệ thống.',
  delay = 4000,
  link = null,
  type = 'info', // 'success', 'error', 'warning', 'info'
} = {}) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const messageEl = document.createElement(link ? 'a' : 'div');
  messageEl.className = 'message';
  messageEl.textContent = message;
  if (link) {
    messageEl.href = link;
    messageEl.classList.add('hover:underline');
  }
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => {
    toast.classList.add('closing');
    setTimeout(() => toast.remove(), 500);
  };
  toast.appendChild(messageEl);
  toast.appendChild(closeBtn);
  // Click vào message cũng đóng toast nếu có link
  if (link) {
    toast.onclick = (e) => {
      if (e.target !== closeBtn) window.location.href = link;
    };
  }
  container.appendChild(toast);
  // Auto remove
  setTimeout(() => {
    toast.classList.add('closing');
    setTimeout(() => toast.remove(), 500);
  }, delay);
}
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please select an image or video file.');
      event.target.value = '';
      return;
    }
    
    // Auto-send when file is selected
    sendMessage();
  }
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch('/storage/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.data.url; // API returns { message, url }
  } catch (error) {
    console.error('Error uploading file:', error);
    showToast({ message: 'Lỗi khi tải lên tệp.', type: 'error' });
    return null;
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

function canSendMessage(conversationId) {
  return allowedConversationIds.includes(conversationId);
}

function updateMessageInputState() {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.querySelector('button[onclick="sendMessage()"]');
  const fileButton = document.querySelector('label[for="fileInput"]');
  const messageInputContainer = messageInput?.parentElement;
  
  if (!currentConversationId) {
    return;
  }
  
  const canSend = canSendMessage(currentConversationId);
  
  if (canSend) {
    // User can send messages - restore normal state
    if (messageInput) {
      messageInput.disabled = false;
      messageInput.placeholder = "Nhập tin nhắn...";
      messageInput.style.backgroundColor = "";
      messageInput.style.color = "";
    }
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.style.display = "";
    }
    if (fileButton) {
      fileButton.style.display = "";
    }
  } else {
    // User cannot send messages - disable input
    if (messageInput) {
      messageInput.disabled = true;
      messageInput.placeholder = "Bạn không thể nhắn tin";
      messageInput.value = "";
      messageInput.style.backgroundColor = "#374151";
      messageInput.style.color = "#9CA3AF";
    }
    if (sendButton) {
      sendButton.disabled = true;
      sendButton.style.display = "none";
    }
    if (fileButton) {
      fileButton.style.display = "none";
    }
    
    // Hide reply preview if showing
    if (currentReply) {
      cancelReply();
    }
  }
}

let currentReply = null;
let messageIdCounter = 0;
let conversations = [];
let messages = [];
let currentConversationId = null;
let currentUser = null;
let isLoadingConversations = false;
let isLoadingMessages = false;
let conversationPage = 1;
let messageCreatedAt = null;
let hasMoreConversations = true;
let hasMoreMessages = true;
let currentSearchQuery = '';

// Socket connection
let socket = null;
let tempMessages = new Map(); // Store temporary messages while sending
let allowedConversationIds = []; // Store conversation IDs that user can send messages to

function renderMessages() {
  console.log('Rendering messages:', messages.length);
  const container = document.getElementById('messagesContainer');
  if (!container) {
    console.error('Messages container not found');
    return;
  }
  
  container.innerHTML = '';

  messages.forEach((message) => {
    const messageDiv = createMessageElement(message);
    container.appendChild(messageDiv);
  });
}

function createMessageElement(message) {
  const messageDiv = document.createElement('div');
    // Handle system messages differently
  if (message.senderType === 'SYSTEM') {
    messageDiv.className = 'system-message-wrapper flex justify-center my-2';
    messageDiv.dataset.messageId = message._id;
    
    messageDiv.innerHTML = `
      <div class="system-message text-gray-400 text-sm text-center">
        ${message.content}
      </div>
    `;
    
    return messageDiv;
  }
  
  // Regular user messages
  const isCurrentUser = message.sender && message.sender._id === currentUser?._id;
  const tempClass = message.isTemp ? 'temp-message' : '';
  const uploadingClass = message.isUploading ? 'uploading' : '';
  messageDiv.className = `message-wrapper ${isCurrentUser ? 'sent' : 'received'} ${tempClass} ${uploadingClass}`;
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
  const replyAuthor = getDisplayNameForUser(message.replyTo.sender?._id, message.replyTo.sender?.name || 'Người dùng');
    const replyContent = message.replyTo.content || '';
    replyHtml = `
      <div class="reply-message" onclick="highlightReplyMessage(this)">
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
  }  // Message status indicator for temporary messages
  let statusHtml = '';
  if (message.isTemp) {
    const statusText = message.isUploading ? 'Đang tải lên...' : 'Đang gửi...';
    const iconClass = message.isUploading ? 'ri-upload-line' : 'ri-time-line';
    statusHtml = `
      <div class="message-status text-xs text-gray-400 mt-1">
        <i class="${iconClass} animate-pulse"></i> ${statusText}
      </div>
    `;
  } else if (message.isFailed) {
    statusHtml = `
      <div class="message-status text-xs text-red-400 mt-1 cursor-pointer" onclick="retryMessage('${message._id}')">
        <i class="ri-error-warning-line"></i> Gửi thất bại. Nhấn để thử lại
      </div>
    `;
  }
  // Check if user can send messages in this conversation
  const canSend = canSendMessage(currentConversationId);
  
  const action = canSend ? `
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
        </button>        <div class="context-menu hidden" id="menu${message._id}">
          <button onclick="handleReply('${message._id}', '${message.content.replace(/'/g, "\\'")}', '${getDisplayNameForUser(message.sender?._id, message.sender?.name || 'Người dùng')}')">
            <i class="ri-reply-line"></i>Reply
          </button>
          ${!message.isTemp ? `<button onclick="handleHideMessage('${message._id}')">
            <i class="ri-eye-off-line"></i>Xóa ở phía bạn
          </button>` : ''}
          ${isCurrentUser && !message.isTemp ? `<button onclick="handleDelete('${message._id}')">
            <i class="ri-delete-bin-line"></i>Xóa vĩnh viễn
          </button>` : ''}
        </div>
      </div>
    </div>` : '';
  const messageTime = formatTime(message.createdAt);
  const senderName = getDisplayNameForUser(message.sender?._id, message.sender?.name || 'Người dùng');

  messageDiv.innerHTML = `
    ${avatarHtml}
    <div class="message-content">
      ${!isCurrentUser ? `<div class="sender-name">${senderName}</div>` : ''}      <div class="flex items-end ${isCurrentUser ? 'justify-end' : ''}">
        ${isCurrentUser && !message.isTemp && canSend ? action : ''}
        <div class="message-bubble ${isCurrentUser ? 'sent' : 'received'} p-3 rounded-lg ${message.replyTo ? 'reply-animation' : ''} p-1 max-w-[500px] group relative ${message.isTemp ? 'opacity-70' : ''}">
          ${replyHtml}
          ${contentHtml}
          <div class="time-tooltip">${messageTime}</div>
          ${reactionsHtml}
          ${statusHtml}
        </div>
        ${!isCurrentUser && !message.isTemp && canSend ? action : ''}
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
  if (!socket || !currentConversationId) {
    showToast({ message: 'Không thể gửi phản ứng lúc này.', type: 'error' });
    return;
  }

  // Check if user has permission to react in this conversation
  if (!canSendMessage(currentConversationId)) {
    showToast({ message: 'Bạn không có quyền phản ứng trong cuộc trò chuyện này.', type: 'error' });
    return;
  }

  // Find the message to check if it's temporary
  const message = messages.find(m => m._id === messageId);
  if (!message) {
    showToast({ message: 'Không tìm thấy tin nhắn.', type: 'error' });
    return;
  }

  // Don't allow reactions on temporary messages
  if (message.isTemp || tempMessages.has(messageId)) {
    showToast({ message: 'Không thể phản ứng với tin nhắn đang gửi.', type: 'warning' });
    return;
  }

  socket.emit('reaction-message', {
    messageId: messageId,
    conversationId: currentConversationId,
    reaction: emoji
  });

  // Close reaction picker
  document
    .getElementById(`reactionPicker${messageId}`)
    .classList.remove('active');
}

function handleReply(messageId, content, author) {
  // Check if user can send messages in current conversation
  if (!canSendMessage(currentConversationId)) {
    showToast({ message: 'Bạn không có quyền trả lời tin nhắn trong cuộc trò chuyện này.', type: 'error' });
    return;
  }

  // Create message object for preview
  const message = {
    sender: { name: author },
    content: content
  };
  
  currentReply = {
    messageId: messageId,
    content: content,
    author: author,
  };

  // Use enhanced reply preview function
  showReplyPreview(message);
  
  document.getElementById('messageInput').focus();

  // Close menu
  document.getElementById(`menu${messageId}`).classList.add('hidden');
}

function cancelReply() {
  currentReply = null;
  // Use enhanced hide reply preview function
  hideReplyPreview();
}

function handleHideMessage(messageId) {
  if (!socket || !currentConversationId) {
    showToast({ message: 'Không thể ẩn tin nhắn lúc này.', type: 'error' });
    return;
  }

  if (confirm('Bạn có chắc chắn muốn ẩn tin nhắn này ở phía bạn?')) {
    socket.emit('hide-message', {
      messageId: messageId,
      conversationId: currentConversationId
    });
  }
}

function handleDelete(messageId) {
  if (!socket || !currentConversationId) {
    showToast({ message: 'Không thể xóa tin nhắn lúc này.', type: 'error' });
    return;
  }

  if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tin nhắn này? Hành động này không thể hoàn tác.')) {
    socket.emit('delete-message', {
      messageId: messageId,
      conversationId: currentConversationId
    });
  }
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const fileInput = document.getElementById('fileInput');
  const content = input.value.trim();
  const file = fileInput.files[0];

  if (!content && !file) {
    return;
  }

  if (!socket || !currentConversationId) {
    showToast({ message: 'Không thể gửi tin nhắn lúc này.', type: 'error' });
    return;
  }

  // Check if user has permission to send messages in this conversation
  if (!canSendMessage(currentConversationId)) {
    showToast({ message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này.', type: 'error' });
    return;
  }

  try {
    let messageContent = content;
    let messageType = 'TEXT';
    let tempFileUrl = null; // For preview
    
    // Generate temporary ID first
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle file preparation if there's a file
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        showToast({ message: 'Chỉ hỗ trợ tệp hình ảnh và video.', type: 'error' });
        return;
      }

      messageType = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';
      
      // Create temporary URL for immediate preview
      tempFileUrl = URL.createObjectURL(file);
      messageContent = tempFileUrl;
    }
    
    // Create temporary message for immediate display
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      type: messageType,
      sender: currentUser,
      createdAt: new Date().toISOString(),
      isTemp: true,
      isUploading: !!file, // Mark if this is uploading a file
      replyTo: currentReply ? {
        _id: currentReply.messageId,
        content: currentReply.content,
        sender: { name: currentReply.author }
      } : null
    };    // Add temporary message to display immediately
    tempMessages.set(tempId, tempMessage);    messages.push(tempMessage);
    
    // Add the new message element to the container with enhanced animation
    const container = document.getElementById('messagesContainer');
    const messageElement = createMessageElement(tempMessage);
    
    // Add special animation for reply messages
    if (currentReply) {
      messageElement.style.transform = 'translateX(-30px) scale(0.9)';
      messageElement.style.opacity = '0';
      
      container.appendChild(messageElement);
      
      // Trigger animation
      requestAnimationFrame(() => {
        messageElement.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        messageElement.style.transform = 'translateX(0) scale(1)';
        messageElement.style.opacity = '1';
      });
    } else {
      container.appendChild(messageElement);
    }
    
    // Update conversation list immediately for better UX
    const tempMessageForConversation = {
      ...tempMessage,
      conversationId: currentConversationId
    };
    updateConversationLastMessage(tempMessageForConversation);

    // Clear input FIRST but keep currentReply for socket emit
    input.value = '';

    // Scroll to bottom
    const chatContainer = document.querySelector('.chat-messages');
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
    
    // If there's a file, upload it in background
    if (file) {
      showToast({ message: 'Đang tải lên tệp...', type: 'info' });
      
      try {
        const fileUrl = await uploadFile(file);
        if (!fileUrl) {
          throw new Error('Upload failed');
        }

        // Update the temporary message with real URL
        const messageIndex = messages.findIndex(m => m._id === tempId);
        if (messageIndex !== -1) {
          // Clean up temporary URL
          if (tempFileUrl) {
            URL.revokeObjectURL(tempFileUrl);
          }
          
          messages[messageIndex].content = fileUrl;
          messages[messageIndex].isUploading = false;
          tempMessages.set(tempId, messages[messageIndex]);
          
          // Update the message element
          updateMessageContent(tempId, fileUrl);
        }

        messageContent = fileUrl;
        
        // Clear file input
        fileInput.value = '';
        
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        showToast({ message: 'Lỗi khi tải lên tệp.', type: 'error' });
        
        // Mark message as failed
        const messageIndex = messages.findIndex(m => m._id === tempId);
        if (messageIndex !== -1) {
          messages[messageIndex] = {
            ...messages[messageIndex],
            isFailed: true,
            isTemp: false,
            isUploading: false,
            status: 'failed'
          };
          updateMessageStatus(tempId);
        }
        tempMessages.delete(tempId);
        
        // Clean up temporary URL
        if (tempFileUrl) {
          URL.revokeObjectURL(tempFileUrl);
        }
        return;
      }
    }

    // Emit message to server
    const messageData = {
      conversationId: currentConversationId,
      content: messageContent,
      type: messageType,
      tempId: tempId
    };

    if (currentReply) {
      messageData.replyTo = currentReply.messageId;
    }

    console.log('Sending message data:', messageData);
    socket.emit('send-message', messageData);
    
    // NOW clear the reply after emitting
    if (currentReply) {
      cancelReply();
    }
    
    // Set timeout to mark message as failed if no response received
    cleanupFailedMessage(tempId);
  } catch (error) {
    console.error('Error sending message:', error);
    showToast({ message: 'Lỗi khi gửi tin nhắn.', type: 'error' });
    
    // Mark the temporary message as failed
    const messageIndex = messages.findIndex(m => m._id === tempId);
    if (messageIndex !== -1) {
      messages[messageIndex] = {
        ...messages[messageIndex],
        isFailed: true,
        isTemp: false,
        status: 'failed'
      };
      updateMessageStatus(tempId);
    }
    tempMessages.delete(tempId);
  }
}

// Socket event handlers
function handleMessageReceived(data) {
  try {
    console.log('Message received:', data);
    
    // Handle two possible data structures:
    // 1. data.message exists (old format)
    // 2. data itself is the message (new format from your socket)
    let message = data.message || data;
    
    // Validate incoming data
    if (!message || !message._id) {
      console.error('Invalid message data received:', data);
      return;
    }
    
    // Check if this is a response to a temporary message (từ user hiện tại)
    if (data.tempId && tempMessages.has(data.tempId)) {
      // Validate that we have the necessary data for updating temp message
      if (!message._id) {
        console.error('Missing message ID in temp message response:', data);
        return;
      }
      
      // Find and update the temporary message
      const tempIndex = messages.findIndex(m => m._id === data.tempId);
      if (tempIndex !== -1) {
        // Update the temporary message to remove "sending" status
        messages[tempIndex] = {
          ...messages[tempIndex],  // Keep existing message data
          ...message,              // Update with server response
          _id: message._id,        // Use real message ID from server
          isTemp: false,           // No longer temporary
          status: 'sent'           // Mark as successfully sent
        };
        tempMessages.delete(data.tempId);
        
        // Update the message element with real ID
        const messageElement = document.querySelector(`[data-message-id="${data.tempId}"]`);
        if (messageElement) {
          messageElement.setAttribute('data-message-id', message._id);
        }
        
        // Just update the specific message element instead of re-rendering all
        updateMessageStatus(message._id);
        
        // Still need to update conversation list for temp messages
        updateConversationLastMessage(message);
        return;
      }
    }
    
    // Xử lý tin nhắn mới từ người khác hoặc tin nhắn không có tempId
    const isFromCurrentUser = message.sender && message.sender._id === currentUser?._id;
    
    // Nếu là tin nhắn từ user hiện tại mà không có tempId, có thể là tin nhắn đã gửi từ device khác
    // Hoặc là tin nhắn từ người khác
    // Kiểm tra xem tin nhắn đã tồn tại trong danh sách chưa (tránh duplicate)
    const existingMessageIndex = messages.findIndex(m => m._id === message._id);
    
    if (existingMessageIndex === -1) {
      // Tin nhắn mới chưa tồn tại, thêm vào danh sách
      // Add new message if it's in current conversation
      if (message.conversation === currentConversationId || message.conversationId === currentConversationId) {
        // Insert message in correct chronological order
        const insertIndex = insertMessageInOrder(message);
        
        // Render message at correct position
        renderNewMessageAtPosition(message, insertIndex);
        
        // Scroll to bottom for new messages from others, or maintain position for own messages from other devices
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
          if (!isFromCurrentUser) {
            // Tin nhắn từ người khác - scroll to bottom
            setTimeout(() => {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);
          } else {
            // Tin nhắn từ chính mình nhưng từ device khác - có thể giữ vị trí hoặc scroll nhẹ
            setTimeout(() => {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);
          }
        }
        
        // Show notification for messages from others
        if (!isFromCurrentUser) {
          showNewMessageNotification(message);
        }
      }
    }
    
    // Always update conversation list last message regardless of current conversation
    // Make sure to add conversationId if it doesn't exist
    const messageForConversation = {
      ...message,
      conversationId: message.conversationId || message.conversation
    };
    updateConversationLastMessage(messageForConversation);
  } catch (error) {
    console.error('Error in handleMessageReceived:', error);
    console.error('Data that caused error:', data);
    showToast({
      message: 'Lỗi khi xử lý tin nhắn nhận được',
      type: 'error'
    });
  }
}

function handleReactionReceived(data) {
  try {
    console.log('Reaction received:', data);
    
    // Validate data
    if (!data || !data.messageId) {
      console.error('Invalid reaction data received:', data);
      return;
    }
    
    // Find and update message with new reactions
    const messageIndex = messages.findIndex(m => m._id === data.messageId);
    if (messageIndex !== -1) {
      // Update the message reactions with the complete reactions array from server
      messages[messageIndex].reactions = data.reactions || [];
      
      // Update only the specific message element instead of re-rendering all messages
      updateMessageReactions(data.messageId, data.reactions);
    }
  } catch (error) {
    console.error('Error in handleReactionReceived:', error);
    showToast({
      message: 'Lỗi khi xử lý phản ứng',
      type: 'error'
    });
  }
}

function handleMessageDeleted(data) {
  try {
    console.log('Message deleted:', data);
    
    // Validate data
    if (!data || !data.messageId) {
      console.error('Invalid message delete data received:', data);
      return;
    }
    
    // Remove message from current conversation (for both hide and delete)
    if (currentConversationId) {
      messages = messages.filter(m => m._id !== data.messageId);
      renderMessages();
    }
  } catch (error) {
    console.error('Error in handleMessageDeleted:', error);
    showToast({
      message: 'Lỗi khi xử lý xóa tin nhắn',
      type: 'error'
    });
  }
}

function handleMessageHidden(data) {
  try {
    console.log('Message hidden:', data);
    
    // Validate data
    if (!data || !data.messageId) {
      console.error('Invalid message hide data received:', data);
      return;
    }
    
    // Remove message from current conversation (same as delete for UI purposes)
    if (currentConversationId) {
      messages = messages.filter(m => m._id !== data.messageId);
      renderMessages();
    }
  } catch (error) {
    console.error('Error in handleMessageHidden:', error);
    showToast({
      message: 'Lỗi khi xử lý ẩn tin nhắn',
      type: 'error'
    });
  }
}

function updateConversationLastMessage(message) {
  try {
    console.log('Updating conversation last message:', message);
    
    // Validate message data
    if (!message || !message.conversationId) {
      console.error('Invalid message data for conversation update:', message);
      return;
    }
    
    // Find and update conversation in the list
    const conversationIndex = conversations.findIndex(c => c._id === message.conversationId);
    console.log('Found conversation index:', conversationIndex);
  
  if (conversationIndex !== -1) {
    // Format last message based on type and sender
    let lastMessageText = message.content;
    const isFromCurrentUser = message.sender && message.sender._id === currentUser?._id;
    const senderName = message.sender?.name || 'Ai đó';
      switch (message.type) {
      case 'IMAGE':
        lastMessageText = isFromCurrentUser ? '📷 Bạn đã gửi một hình ảnh' : `📷 ${senderName} đã gửi một hình ảnh`;
        break;
      case 'VIDEO':
        lastMessageText = isFromCurrentUser ? '🎥 Bạn đã gửi một video' : `🎥 ${senderName} đã gửi một video`;
        break;
      default:
        // Handle system messages
        if (message.senderType === 'SYSTEM') {
          lastMessageText = message.content;
        } else {
          // For text messages, show sender name if not from current user
          if (!isFromCurrentUser && conversations[conversationIndex]?.isGroup) {
            // In group chats, show sender name for others' messages
            lastMessageText = `${senderName}: ${message.content}`;
          } else if (!isFromCurrentUser && !conversations[conversationIndex]?.isGroup) {
            // In 1-on-1 chats, just show the message content
            lastMessageText = message.content;
          } else {
            // For current user's messages
            lastMessageText = `Bạn: ${message.content}`;
          }
        }
    }
    
    console.log('Updating conversation with last message:', lastMessageText);
    
    // Update conversation data
    conversations[conversationIndex].lastMessage = lastMessageText;
    conversations[conversationIndex].lastMessageAt = message.createdAt;
    
    // Add unread indicator for messages from others
    if (!isFromCurrentUser && message.conversationId !== currentConversationId) {
      // Mark conversation as having unread messages
      conversations[conversationIndex].hasUnread = true;
    }
    
    // Only move to top if it's not already at index 0
    if (conversationIndex !== 0) {
      // Move conversation to top
      const conversation = conversations.splice(conversationIndex, 1)[0];
      conversations.unshift(conversation);
      
      console.log('Conversation moved to top, updating list');
      
      // Use more efficient update instead of full re-render
      updateConversationInList(conversation, 0);
    } else {
      // If already at top, just update the existing element
      console.log('Conversation already at top, updating in place');
      const existingElement = document.querySelector(`[data-conversation-id="${message.conversationId}"]`);
      if (existingElement) {
        // Update last message text
        const lastMessageEl = existingElement.querySelector('.text-sm.text-gray-400.truncate');
        if (lastMessageEl) {
          lastMessageEl.textContent = lastMessageText;
        }
        
        // Update time
        const timeEl = existingElement.querySelector('.text-xs.text-gray-400');
        if (timeEl) {
          timeEl.textContent = formatTime(message.createdAt);
        }
        
        // Add/remove unread indicator
        if (!isFromCurrentUser && message.conversationId !== currentConversationId) {
          // Add unread indicator
          let unreadDot = existingElement.querySelector('.unread-dot');
          if (!unreadDot) {
            const avatarContainer = existingElement.querySelector('.relative');
            if (avatarContainer) {
              unreadDot = document.createElement('div');
              unreadDot.className = 'unread-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900';
              avatarContainer.appendChild(unreadDot);
            }
          }
        }
      }
    }  } else {
    console.warn('Conversation not found in list:', message.conversationId);
    // If conversation not found, try to reload conversations
    loadConversations();
  }
  } catch (error) {
    console.error('Error updating conversation last message:', error);
  }
}

function updateConversationInList(conversation, newIndex) {
  const chatListContainer = document.querySelector('.chat-list .p-2');
  if (!chatListContainer) return;
  
  // Check if this conversation is currently active
  const isCurrentActive = conversation._id === currentConversationId;
  
  // Remove existing conversation element if it exists
  const existingElement = document.querySelector(`[data-conversation-id="${conversation._id}"]`);
  if (existingElement) {
    existingElement.remove();
  }
  
  // Create new conversation element
  const conversationElement = createConversationElement(conversation);
  
  // Restore active state if this was the active conversation
  if (isCurrentActive) {
    conversationElement.classList.add('bg-primary', 'bg-opacity-20');
  }
  
  // Insert at the specified position (0 for top)
  if (newIndex === 0) {
    chatListContainer.insertBefore(conversationElement, chatListContainer.firstChild);
  } else {
    const children = chatListContainer.children;
    if (newIndex < children.length) {
      chatListContainer.insertBefore(conversationElement, children[newIndex]);
    } else {
      chatListContainer.appendChild(conversationElement);
    }
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

// API Functions
async function loadConversations(search = '', filterOptions = {}) {
  // Reset only when search query changes or it's the first load
  if (search !== currentSearchQuery) {
    conversations = [];
    conversationPage = 1;
    hasMoreConversations = true;
    currentSearchQuery = search;
  }
  
  if (isLoadingConversations || !hasMoreConversations) return;
  
  isLoadingConversations = true;
  showConversationLoading();
  
  console.log('Loading conversations...', { page: conversationPage, search, filterOptions });
  
  try {
    const params = new URLSearchParams({
      page: conversationPage,
      limit: 20,
      ...(search && { search }),
      ...(filterOptions.userId && { userId: filterOptions.userId }),
      ...(filterOptions.conversationId && { conversationId: filterOptions.conversationId })
    });
    
    const url = `/chat/conversation?${params}`;
    console.log('Fetching conversations from:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Conversations result:', result);
      if (result && result.success && result.data && result.data.length > 0) {
      const data = result.data;
      
      if (conversationPage === 1) {
        conversations = data;
      } else {
        conversations.push(...data);
      }
      
      if (data.length < 20) {
        hasMoreConversations = false;
      }
      
      conversationPage++;
      renderConversations();
    } else {
      hasMoreConversations = false;
      // Clear conversations if no results and reset to empty state
      if (conversationPage === 1) {
        conversations = [];
        renderConversations(); // This will clear the list
      }
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
    showToast({
      message: 'Lỗi khi tải danh sách cuộc trò chuyện',
      type: 'error'
    });
  } finally {
    hideConversationLoading();
    isLoadingConversations = false;
  }
}

async function loadMessages(conversationId, loadMore = false) {
  console.log('loadMessages called:', { conversationId, loadMore, isLoadingMessages, hasMoreMessages });
  
  if (isLoadingMessages) return;
  
  if (!loadMore) {
    messages = [];
    messageCreatedAt = null;
    hasMoreMessages = true;
  } else if (!hasMoreMessages) {
    return;
  }
  
  isLoadingMessages = true;
  showMessageLoading();
  
  console.log('Loading messages for conversation:', conversationId);
  
  try {
    const params = new URLSearchParams({
      conversationId,
      limit: 20,
      page: 1,
      ...(messageCreatedAt && { createdAt: messageCreatedAt })
    });
    
    const url = `/chat/messages?${params}`;
    console.log('Fetching messages from:', url);
    
    const response = await fetch(url);
    const result = await response.json();
    
    console.log('Messages API response:', result);
    
    if (result && result.success && result.data && result.data.docs && result.data.docs.length > 0) {
      const data = result.data;
      const newMessages = data.docs.reverse(); // API trả về theo thứ tự desc, cần reverse
      
      if (loadMore) {
        // Lưu vị trí cuộn hiện tại
        const chatContainer = document.querySelector('.chat-messages');
        const scrollHeight = chatContainer.scrollHeight;
        
        messages.unshift(...newMessages);
        messageCreatedAt = newMessages[0].createdAt;
        
        // Render và giữ vị trí cuộn
        renderMessages();
        
        requestAnimationFrame(() => {
          const newScrollHeight = chatContainer.scrollHeight;
          chatContainer.scrollTop = newScrollHeight - scrollHeight;
        });
      } else {
        messages = newMessages;
        if (newMessages.length > 0) {
          messageCreatedAt = newMessages[0].createdAt;
        }
        renderMessages();
        
        // Scroll to bottom cho lần đầu load
        setTimeout(() => {
          const chatContainer = document.querySelector('.chat-messages');
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
      }
      
      if (data.docs.length < 20) {
        hasMoreMessages = false;
      }
    } else {
      hasMoreMessages = false;
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    showToast({
      message: 'Lỗi khi tải tin nhắn',
      type: 'error'
    });
  } finally {
    hideMessageLoading();
    isLoadingMessages = false;
  }
}

function showConversationLoading() {
  const loader = document.getElementById('conversationLoading');
  if (loader) {
    loader.classList.remove('hidden');
  }
}

function hideConversationLoading() {
  const loader = document.getElementById('conversationLoading');
  if (loader) {
    loader.classList.add('hidden');
  }
}

function showMessageLoading() {
  const loader = document.getElementById('messageLoading');
  if (loader) {
    loader.classList.remove('hidden');
  }
}

function hideMessageLoading() {
  const loader = document.getElementById('messageLoading');
  if (loader) {
    loader.classList.add('hidden');
  }
}

function renderConversations() {
  console.log('Rendering conversations:', conversations.length);
  
  const chatListContainer = document.querySelector('.chat-list .p-2');
  if (!chatListContainer) {
    console.error('Chat list container not found');
    return;
  }
  
  // Clear existing conversations for fresh render
  chatListContainer.innerHTML = '';
  
  if (conversations.length === 0) {
    // Show empty state message
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'text-center py-8 text-gray-400';
    emptyMessage.innerHTML = `
      <i class="ri-search-line text-3xl mb-3"></i>
      <p class="text-sm">${currentSearchQuery ? `Không tìm thấy cuộc trò chuyện nào với "${currentSearchQuery}"` : 'Chưa có cuộc trò chuyện nào'}</p>
    `;
    chatListContainer.appendChild(emptyMessage);
    return;
  }
  
  conversations.forEach((conversation, index) => {
    console.log('Processing conversation:', conversation._id, conversation);
    
    const conversationElement = createConversationElement(conversation);
    
    // Add active state if this is the current conversation
    if (conversation._id === currentConversationId) {
      conversationElement.classList.add('bg-primary', 'bg-opacity-20');
    }
    
    chatListContainer.appendChild(conversationElement);
  });
}

function createConversationElement(conversation) {
  const div = document.createElement('div');
  div.className = 'conversation-item flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer mt-1';
  div.setAttribute('data-conversation-id', conversation._id);
  div.setAttribute('role', 'button');
  div.setAttribute('tabindex', '0');
  
  // Determine display info
  let displayName = conversation.name || 'Cuộc trò chuyện';
  let avatar = '/images/kairo.jpg'; // Default avatar
  // Check if this is a group conversation or 1-on-1
  if (conversation.isGroup) {
    // For group chat, use conversation avatar if exists
    avatar = conversation.avatar || '/images/kairo.jpg';
    displayName = conversation.name || 'Nhóm chat';  } else {
    // For 1-on-1 chat, find the other user (not current user)
    if (conversation.populatedUsers && conversation.populatedUsers.length >= 2 && conversation.participants) {
      const otherUser = conversation.populatedUsers.find(user => 
        user.email !== currentUser?.email && user.username !== currentUser?.username
      );
        if (otherUser) {        // Find the other participant to get nickname
        const otherParticipant = conversation.participants.find(p => p.user !== currentUser?._id);
        // Use nickname if available, otherwise use name
        displayName = otherParticipant?.nickname || otherUser.name;
        avatar = otherUser.avatar || '/images/kairo.jpg';
      }
    }
  }
  
  const lastMessage = conversation.lastMessage || 'Chưa có tin nhắn';
  const lastMessageTime = conversation.lastMessageAt 
    ? formatTime(conversation.lastMessageAt) 
    : '';
    div.innerHTML = `
    <div class="relative">
      <div class="w-12 h-12 rounded-full bg-gray-700 overflow-hidden">
        <img
          alt="${displayName}"
          class="w-full h-full object-cover"
          height="48"
          loading="lazy"
          src="${avatar}"
          width="48"/>
      </div>
      ${conversation.hasUnread ? '<div class="unread-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></div>' : ''}
    </div>
    <div class="ml-3 flex-1 min-w-0">
      <div class="flex items-center">
        <span class="font-medium truncate flex-1 select-text">
          ${displayName}
        </span>
        <span class="text-xs text-gray-400">
          ${lastMessageTime}
        </span>
      </div>
      <div class="text-sm text-gray-400 truncate">
        ${lastMessage}
      </div>
    </div>
  `;
  
  div.addEventListener('click', () => selectConversation(conversation));
  
  return div;
}

// Update selectConversation to also update URL
function selectConversation(conversation) {
  // Remove active class from all conversations
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.remove('bg-primary', 'bg-opacity-20');
  });
  
  // Add active class to selected conversation
  const conversationElement = document.querySelector(`[data-conversation-id="${conversation._id}"]`);
  if (conversationElement) {
    conversationElement.classList.add('bg-primary', 'bg-opacity-20');
    
    // Remove unread indicator when selecting conversation
    const unreadDot = conversationElement.querySelector('.unread-dot');
    if (unreadDot) {
      unreadDot.remove();
    }
  }
  
  // Mark conversation as read in data
  const conversationIndex = conversations.findIndex(c => c._id === conversation._id);
  if (conversationIndex !== -1) {
    conversations[conversationIndex].hasUnread = false;
  }
  
  // Reset message state for new conversation
  messages = [];
  messageCreatedAt = null;
  hasMoreMessages = true;
  
  // Clear messages container
  const container = document.getElementById('messagesContainer');
  if (container) {
    container.innerHTML = '';
  }
    // Update current conversation
  currentConversationId = conversation._id;
  
  // Make currentConversationId globally accessible
  window.currentConversationId = currentConversationId;
  
  // Update message input state based on permissions
  updateMessageInputState();
  
  // Hide no messages placeholder
  const noMessages = document.getElementById('noMessages');
  if (noMessages) noMessages.style.display = 'none';
  
  // Update chat header
  updateChatHeader(conversation);
  
  // Update URL with current conversation
  if (conversation && conversation._id) {
    updateURLParameter('conversationId', conversation._id);
  }
  
  // Join conversation room via socket
  if (socket && socket.connected) {
    //socket.emit('join-room', { conversationId: conversation._id });
  }
  
  // Load messages
  loadMessages(conversation._id);
}

function updateChatHeader(conversation) {
  const headerName = document.getElementById('headerName');
  const headerStatus = document.getElementById('headerStatus');
  const headerAvatar = document.getElementById('headerAvatar');
  
  if (!headerName || !headerStatus || !headerAvatar) return;
  
  let displayName = conversation.name || 'Cuộc trò chuyện';
  let avatar = '/images/kairo.jpg'; // Default avatar
  let status = 'Đang hoạt động';
  let userId = null; // For profile link
  let isGroup = conversation.isGroup || false;
  
  console.log('updateChatHeader called with:', {
    conversationId: conversation._id,
    isGroup: conversation.isGroup,
    populatedUsers: conversation.populatedUsers,
    currentUser: currentUser
  });
  
  // Check if this is a group conversation or 1-on-1
  if (conversation.isGroup) {
    // For group chat, use conversation avatar and name
    avatar = conversation.avatar || '/images/kairo.jpg';
    displayName = conversation.name || 'Nhóm chat';
    status = `${conversation.participants?.length || 0} thành viên`;
    // For group chat, userId remains null (no individual profile)
    console.log('Group chat detected, userId remains null');  } else {
    // For 1-on-1 chat, find the other user (not current user)
    if (conversation.populatedUsers && conversation.populatedUsers.length >= 2 && conversation.participants) {
      console.log('Looking for other user in populated users:', conversation.populatedUsers);
      console.log('Participants:', conversation.participants);
      
      const otherUser = conversation.populatedUsers.find(user => {
        // Use multiple comparison methods to be more robust
        const isNotCurrentUser = (
          user.email !== currentUser?.email && 
          user.username !== currentUser?.username
        );
        console.log('Checking user:', user, 'isNotCurrentUser:', isNotCurrentUser);
        return isNotCurrentUser;
      });
      
      console.log('Found other user:', otherUser);
        if (otherUser) {
        // Get userId from participants array since populatedUsers doesn't have _id
        const otherParticipant = conversation.participants.find(p => {
          // Find the participant that's not the current user
          return p.user !== currentUser?._id;
        });
          if (otherParticipant) {          userId = otherParticipant.user; // Set userId from participants
          // Use nickname if available, otherwise use name
          displayName = otherParticipant.nickname || otherUser.name;
          console.log('Set userId from participants:', userId, 'displayName:', displayName);        } else {
          displayName = otherUser.name;
          console.warn('Could not find other participant');
        }
        
        avatar = otherUser.avatar || '/images/kairo.jpg';
        status = otherUser.isOnline ? 'Đang hoạt động' : 'Không hoạt động';
      } else {
        console.warn('Could not find other user in populated users');
      }
    } else {
      console.warn('populatedUsers or participants not available or insufficient length:', {
        populatedUsers: conversation.populatedUsers,
        participants: conversation.participants
      });
    }
  }
  
  headerName.textContent = displayName;
  headerStatus.textContent = status;
  headerAvatar.src = avatar;
  headerAvatar.alt = displayName;
  
  // Update dropdown user info when chat header is updated
  console.log('Calling updateDropdownUserInfo with:', { displayName, avatar, userId, isGroup });
  if (typeof updateDropdownUserInfo === 'function') {
    updateDropdownUserInfo(displayName, avatar, userId, isGroup, conversation);
  } else {
    console.warn('updateDropdownUserInfo function not found');
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Vừa xong';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
}

// Initialize scroll handlers
function initializeScrollHandlers() {
  // Conversation list infinite scroll
  const chatList = document.querySelector('.chat-list');
  if (chatList) {
    chatList.addEventListener('scroll', () => {
      if (chatList.scrollTop + chatList.clientHeight >= chatList.scrollHeight - 5) {
        loadConversations();
      }
    });
  }

  // Message list infinite scroll
  const chatMessages = document.querySelector('.chat-messages');
  if (chatMessages) {
    chatMessages.addEventListener('scroll', () => {
      if (chatMessages.scrollTop === 0 && currentConversationId) {
        loadMessages(currentConversationId, true);
      }
    });
  }
}

// Search functionality
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = e.target.value.trim();
        console.log('Search triggered with term:', searchTerm);
        resetConversationPagination();
        loadConversations(searchTerm);
      }, 300);
    });
    
    console.log('Search functionality initialized');
  } else {
    console.error('Search input element not found');
  }
}

function resetConversationPagination() {
  conversationPage = 1;
  hasMoreConversations = true;
  conversations = [];
}

// Socket functions
function initializeSocket() {
  // Connect to socket server
  socket = io(window.location.origin, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
  });

  // Enhance error handling
  enhanceSocketErrorHandling();
  // Socket event handlers
  socket.on('connected', (data) => {
    console.log('Connected to chat server:', data);
    socket.emit('join-room', { });
  });  socket.on('joined-room', (data) => {
    console.log('Joined chat rooms:', data);
    // Store allowed conversation IDs from join-room response
    if (data && data.conversationIds && Array.isArray(data.conversationIds)) {
      allowedConversationIds = data.conversationIds;
      console.log('Allowed conversation IDs:', allowedConversationIds);
      
      // Update message input state if a conversation is currently selected
      if (currentConversationId) {
        updateMessageInputState();
        // Re-render messages to update action buttons
        renderMessages();
      }
    }
  });
  socket.on('error', (data) => {
    console.error('Socket error:', data);
    showToast({ message: data.message || 'Lỗi kết nối socket', type: 'error' });
    
    // Mark all pending temporary messages as failed
    tempMessages.forEach((tempMessage, tempId) => {
      const messageIndex = messages.findIndex(m => m._id === tempId);
      if (messageIndex !== -1) {
        messages[messageIndex] = {
          ...messages[messageIndex],
          isFailed: true,
          isTemp: false,
          status: 'failed'
        };
        updateMessageStatus(tempId);
      }
    });
    
    // Clear all temporary messages
    tempMessages.clear();
  });
  socket.on('messageReceived', (data) => {
    console.log('Socket received messageReceived event:', data);
    handleMessageReceived(data);
  });

  socket.on('reactionReceived', (data) => {
    console.log('Socket received reactionReceived event:', data);
    handleReactionReceived(data);
  });

  socket.on('messageDeleted', (data) => {
    console.log('Socket received messageDeleted event:', data);
    handleMessageDeleted(data);
  });
  socket.on('messageHidden', (data) => {
    console.log('Socket received messageHidden event:', data);
    handleMessageHidden(data);
  });

  socket.on('nicknameChanged', (data) => {
    console.log('Socket received nicknameChanged event:', data);
    handleNicknameChanged(data);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    showToast({ message: 'Mất kết nối với server', type: 'warning' });
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    showToast({ message: 'Lỗi kết nối socket', type: 'error' });
  });
}

// Message retry functionality
function retryMessage(tempId) {
  const messageIndex = messages.findIndex(m => m._id === tempId);
  if (messageIndex === -1) return;

  const message = messages[messageIndex];
  
  // Reset message status to sending
  messages[messageIndex] = {
    ...message,
    isTemp: true,
    isFailed: false,
    status: 'sending'
  };

  // Update the message display
  updateMessageStatus(tempId);

  showToast({ message: 'Đang thử gửi lại tin nhắn...', type: 'info' });

  const messageData = {
    conversationId: currentConversationId,
    content: message.content,
    type: message.type,
    tempId: tempId
  };

  if (message.replyTo) {
    messageData.replyTo = message.replyTo._id;
  }

  // Re-add to tempMessages map for tracking
  tempMessages.set(tempId, messages[messageIndex]);

  socket.emit('send-message', messageData);
}

// Clean up failed messages after timeout
function cleanupFailedMessage(tempId) {
  setTimeout(() => {
    if (tempMessages.has(tempId)) {
      const messageIndex = messages.findIndex(m => m._id === tempId);
      if (messageIndex !== -1) {
        // Mark as failed instead of removing
        messages[messageIndex] = {
          ...messages[messageIndex],
          isFailed: true,
          isTemp: false,
          status: 'failed'
        };
        // Update the specific message display
        updateMessageStatus(tempId);
      }
      tempMessages.delete(tempId);
    }
  }, 30000); // 30 seconds timeout
}

// Enhanced error handling for socket events
function enhanceSocketErrorHandling() {
  if (!socket) return;

  const originalEmit = socket.emit;
  socket.emit = function(event, data, callback) {
    if (event === 'send-message' && data.tempId) {
      // Set timeout for message sending
      cleanupFailedMessage(data.tempId);
    }
    return originalEmit.call(this, event, data, callback);  };
}

// Get current user information
async function getCurrentUser() {
  try {
    const response = await fetch('/profile/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.data) {
        currentUser = data.data;
        console.log('Current user loaded:', currentUser);
      }
    }
  } catch (error) {
    console.error('Error loading current user:', error);
    // Set a default user or handle error
    currentUser = {
      _id: 'temp-user-id',
      name: 'Người dùng',
      avatar: '/images/kairo.jpg'
    };
  }
}

// Request notification permission on app init
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }
}

// Helper function to show new message notification
function showNewMessageNotification(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const senderName = message.sender?.name || 'Ai đó';
    let notificationText = message.content;
    
    // Format notification text based on message type
    switch (message.type) {
      case 'IMAGE':
        notificationText = 'đã gửi một hình ảnh';
        break;
      case 'VIDEO':
        notificationText = 'đã gửi một video';
        break;
      default:
        notificationText = message.content;
    }
    
    const notification = new Notification(`${senderName}`, {
      body: notificationText,
      icon: message.sender?.avatar || '/images/kairo.jpg',
      tag: `message-${message._id}`,
      requireInteraction: false
    });
    
    // Auto close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    // Click notification to focus window (optional)
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Helper function to insert message in correct chronological order
function insertMessageInOrder(newMessage) {
  const newMessageTime = new Date(newMessage.createdAt).getTime();
  
  for (let i = messages.length - 1; i >= 0; i--) {
    const messageTime = new Date(messages[i].createdAt).getTime();
    if (messageTime <= newMessageTime) {
      messages.splice(i + 1, 0, newMessage);
      return i + 1;
    }
  }
  
  // If no suitable position found, insert at beginning
  messages.unshift(newMessage);
  return 0;
}

// Helper function to render new message at correct position
function renderNewMessageAtPosition(message, position) {
  const container = document.getElementById('messagesContainer');
  if (!container) return;
  
  const messageElement = createMessageElement(message);
  const children = container.children;
  
  if (position >= children.length) {
    container.appendChild(messageElement);
  } else {
    container.insertBefore(messageElement, children[position]);
  }
}

// URL Query Parameter Handling
function getURLParameters() {
  const urlParams = new URLSearchParams(window.location.search);
 
  return {
    userId: urlParams.get('userId'),
    conversationId: urlParams.get('conversationId')
  };
}

function updateURLParameter(paramName, paramValue) {
  const url = new URL(window.location);
  if (paramValue) {
    url.searchParams.set(paramName, paramValue);
  } else {
    url.searchParams.delete(paramName);
  }
  // Update URL without page reload
  window.history.replaceState({}, '', url);
}

function clearURLParameters() {
  const url = new URL(window.location);
  url.searchParams.delete('userId');
  url.searchParams.delete('conversationId');
  window.history.replaceState({}, '', url);
}

async function handleURLConversationSelection() {
  const { userId, conversationId } = getURLParameters();
  
  if (conversationId) {
    // Load conversations filtered by specific conversation ID
    await loadConversations('', { conversationId });
  } else if (userId) {
    // Load conversations filtered by specific user ID
    await loadConversations('', { userId });
  }
  
  // After conversations are loaded, auto-select the first one if available
  if (conversations.length > 0) {
    selectConversation(conversations[0]);
  }
}

// Initialize app
async function initializeApp() {
  console.log('Initializing chat app...');
  
  try {
    await getCurrentUser();
    requestNotificationPermission(); // Request notification permission
    await initializeSocket();
    initializeScrollHandlers();
    initializeSearch();
    
    // Check if we have URL parameters before loading conversations
    const { userId, conversationId } = getURLParameters();
    
    if (userId || conversationId) {
      // If we have URL parameters, handle them (which will load filtered conversations)
      await handleURLConversationSelection();
    } else {
      // Normal case: load all conversations
      await loadConversations();
    }
    
    console.log('Chat app initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast({
      message: 'Lỗi khởi tạo ứng dụng chat',
      type: 'error'
    });
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Update specific message status without re-rendering all messages
function updateMessageStatus(messageId) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  // Find the message data
  const message = messages.find(m => m._id === messageId);
  if (!message) return;

  // Remove temp-message class and opacity
  messageElement.classList.remove('temp-message');
  const messageBubble = messageElement.querySelector('.message-bubble');
  if (messageBubble) {
    messageBubble.classList.remove('opacity-70');
  }
  
  // Remove or update status indicator
  const statusElement = messageElement.querySelector('.message-status');
  if (statusElement) {
    if (message.isTemp) {
      // Still sending or uploading
      const statusText = message.isUploading ? 'Đang tải lên...' : 'Đang gửi...';
      const iconClass = message.isUploading ? 'ri-upload-line' : 'ri-time-line';
      statusElement.innerHTML = `
        <i class="${iconClass} animate-pulse"></i> ${statusText}
      `;
    } else if (message.isFailed) {
      // Failed
      statusElement.innerHTML = `
        <i class="ri-error-warning-line"></i> Gửi thất bại. Nhấn để thử lại
      `;
      statusElement.className = 'message-status text-xs text-red-400 mt-1 cursor-pointer';
      statusElement.onclick = () => retryMessage(messageId);
    } else {
      // Successfully sent - remove status indicator
      statusElement.remove();
    }
  }
  
  // Add message controls if message is not temporary (for both sent and received messages)
  if (!message.isTemp && canSendMessage(currentConversationId)) {
    const messageContent = messageElement.querySelector('.message-content');
    const messageBubbleContainer = messageContent.querySelector('.flex.items-end');
    const isCurrentUser = message.sender?._id === currentUser?._id;
    
    // Check if controls already exist
    if (!messageBubbleContainer.querySelector('.message-controls')) {
      const controlsHtml = `
        <div class="message-controls">
          <div class="relative">
            <button onclick="toggleReactionPicker(event, '${messageId}')" class="reaction-btn">
              <i class="ri-emotion-line"></i>
            </button>
            <div class="reaction-picker" id="reactionPicker${messageId}">
              <button onclick="addReaction('${messageId}', '❤️')">❤️</button>
              <button onclick="addReaction('${messageId}', '😊')">😊</button>
              <button onclick="addReaction('${messageId}', '😂')">😂</button>
              <button onclick="addReaction('${messageId}', '👍')">👍</button>
              <button onclick="addReaction('${messageId}', '😮')">😮</button>
              <button onclick="addReaction('${messageId}', '😢')">😢</button>
            </div>
          </div>
          <div class="relative">
            <button onclick="toggleMenu(event, '${messageId}')" class="more-btn">
              <i class="ri-more-line"></i>
            </button>
            <div class="context-menu hidden" id="menu${messageId}">
              <button onclick="handleReply('${messageId}', '${message.content.replace(/'/g, "\\'")}', '${message.sender?.name || 'Người dùng'}')">
                <i class="ri-reply-line"></i>Reply
              </button>
              <button onclick="handleHideMessage('${messageId}')">
                <i class="ri-eye-off-line"></i>Xóa ở phía bạn
              </button>
              ${isCurrentUser ? `<button onclick="handleDelete('${messageId}')">
                <i class="ri-delete-bin-line"></i>Xóa vĩnh viễn
              </button>` : ''}
            </div>
          </div>
        </div>
      `;
      
      if (isCurrentUser) {
        messageBubbleContainer.insertAdjacentHTML('afterbegin', controlsHtml);
      } else {
        messageBubbleContainer.insertAdjacentHTML('beforeend', controlsHtml);
      }
    }
  }
}

// Update message content after file upload completes
function updateMessageContent(messageId, newContent) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  const contentElement = messageElement.querySelector('.message-bubble');
  if (contentElement) {
    // Find and update the message in the array
    const messageIndex = messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      messages[messageIndex].content = newContent;
      
      // Re-create the content HTML based on message type
      const message = messages[messageIndex];
      let contentHtml = '';
      
      switch (message.type) {
        case 'IMAGE':
          contentHtml = `<img src="${newContent}" alt="Image" class="max-w-full h-auto rounded cursor-pointer" onclick="openImageModal('${newContent}')"/>`;
          break;
        case 'VIDEO':
          contentHtml = `<video controls class="max-w-full h-auto rounded"><source src="${newContent}" type="video/mp4"/>Trình duyệt không hỗ trợ video.</video>`;
          break;
        default:
          contentHtml = `<p class="break-words">${newContent}</p>`;
      }
      
      // Update only the content part, preserve other elements like time tooltip
      const existingContent = contentElement.querySelector('p, img, video');
      if (existingContent) {
        existingContent.outerHTML = contentHtml;
      }
    }
  }
}

// Update message reactions without re-rendering all messages
function updateMessageReactions(messageId, reactions) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  const reactionContainer = messageElement.querySelector('.message-bubble .flex.flex-wrap');
  
  if (reactions && reactions.length > 0) {
    // Group reactions by emoji
    const reactionGroups = {};
    reactions.forEach(reaction => {
      if (reactionGroups[reaction.reaction]) {
        reactionGroups[reaction.reaction]++;
      } else {
        reactionGroups[reaction.reaction] = 1;
      }
    });

    const reactionElements = Object.entries(reactionGroups)
      .map(([emoji, count]) =>
        `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-600 text-white mr-1 mt-1 cursor-pointer hover:bg-gray-500 transition-colors">${emoji} ${count}</span>`
      )
      .join('');

    if (reactionContainer) {
      reactionContainer.innerHTML = reactionElements;
    } else {
      // Create reaction container if it doesn't exist
      const messageBubble = messageElement.querySelector('.message-bubble');
      const newReactionContainer = document.createElement('div');
      newReactionContainer.className = 'flex flex-wrap mt-1';
      newReactionContainer.innerHTML = reactionElements;
      messageBubble.appendChild(newReactionContainer);
    }
  } else {
    // Remove reaction container if no reactions
    if (reactionContainer) {
      reactionContainer.remove();
    }
  }
}

// Enhanced reply preview with better animations
function showReplyPreview(message) {
  const replyPreview = document.getElementById('replyPreview');
  const replyAuthor = document.getElementById('replyAuthor');
  const replyContent = document.getElementById('replyContent');
  
  if (replyPreview && replyAuthor && replyContent) {
    // Update content first
    replyAuthor.textContent = `Trả lời ${message.sender?.name || 'Người dùng'}`;
    replyContent.textContent = message.content || '';
    
    // Remove hidden class first to make element visible
    replyPreview.classList.remove('hidden');
    
    // Force a reflow to ensure the element is rendered
    replyPreview.offsetHeight;
    
    // Apply CSS animation class
    replyPreview.classList.add('reply-preview-show');
    
    // Focus message input after animation
    setTimeout(() => {
      const messageInput = document.getElementById('messageInput');
      if (messageInput) {
        messageInput.focus();
      }
    }, 300);
  }
}

// Enhanced hide reply preview
function hideReplyPreview() {
  const replyPreview = document.getElementById('replyPreview');
  
  if (replyPreview && !replyPreview.classList.contains('hidden')) {
    // Add hide animation class
    replyPreview.classList.add('reply-preview-hide');
    
    // Hide element after animation completes
    setTimeout(() => {
      replyPreview.classList.add('hidden');
      replyPreview.classList.remove('reply-preview-show', 'reply-preview-hide');
    }, 200);
  }
}

// Nickname change functions
function changeUserNickname(targetUserId, nickname) {
  if (!currentConversationId) {
    console.warn('No conversation selected for nickname change');
    showToast({ message: 'Vui lòng chọn cuộc trò chuyện', type: 'warning' });
    return;
  }
  
  if (!targetUserId) {
    console.warn('No target user ID provided for nickname change');
    showToast({ message: 'Không thể xác định người dùng mục tiêu', type: 'error' });
    return;
  }
  
  console.log('Changing nickname:', { targetUserId, nickname, conversationId: currentConversationId });
  
  // Emit socket event to change nickname
  if (socket && socket.connected) {
    socket.emit('change-nickname', {
      conversationId: currentConversationId,
      userId: targetUserId,
      nickname: nickname
    });
    
    console.log('Nickname change request sent via socket');
  } else {
    console.error('Socket not connected');
    showToast({ message: 'Không thể kết nối đến server', type: 'error' });
  }
}

function handleNicknameChanged(data) {
  console.log('Nickname changed event received:', data);
  
  try {
    const { conversationId, nickname, userId, message } = data;
    
    if (!conversationId || !userId) {
      console.warn('Invalid nickname change data:', data);
      return;
    }
    
    // Update the conversation in memory
    const conversationIndex = conversations.findIndex(c => c._id === conversationId);
    if (conversationIndex !== -1) {
      const conversation = conversations[conversationIndex];
      
      // Update participant nickname in conversation data
      if (conversation.participants) {
        const participantIndex = conversation.participants.findIndex(p => p.user === userId);
        if (participantIndex !== -1) {
          conversation.participants[participantIndex].nickname = nickname;
          console.log('Updated nickname in conversation data:', conversation.participants[participantIndex]);
        }
      }
      
      // Update conversations array
      conversations[conversationIndex] = conversation;
    }
    
    // If this is the current conversation, update the header display
    if (conversationId === currentConversationId) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        updateChatHeader(conversation);
        console.log('Updated chat header for current conversation');
      }
      
      // Add system message to current conversation if there's a message
      if (message && conversationId === currentConversationId) {
        const systemMessage = {
          _id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: message,
          type: 'TEXT',
          senderType: 'SYSTEM',
          createdAt: new Date().toISOString(),
          conversationId: conversationId
        };
        
        // Add system message to messages array
        messages.push(systemMessage);
        
        // Render the new system message
        const container = document.getElementById('messagesContainer');
        if (container) {
          const messageElement = createMessageElement(systemMessage);
          container.appendChild(messageElement);
          
          // Scroll to bottom to show the new system message
          const chatContainer = document.querySelector('.chat-messages');
          if (chatContainer) {
            setTimeout(() => {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);
          }
        }
        
        // Update conversation last message
        updateConversationLastMessage(systemMessage);
      }
    }
    
    // Update conversation list display names
    updateConversationDisplayNames();
    
    // Show success message
    showToast({ 
      message: 'Đã thay đổi biệt danh thành công', 
      type: 'success' 
    });
    
    console.log('Nickname change handled successfully');
  } catch (error) {
    console.error('Error handling nickname change:', error);
    showToast({ 
      message: 'Lỗi khi xử lý thay đổi biệt danh', 
      type: 'error' 
    });
  }
}

function updateConversationDisplayNames() {
  console.log('Updating conversation display names...');
  
  // Update all conversation elements in the list
  conversations.forEach(conversation => {
    const conversationElement = document.querySelector(`[data-conversation-id="${conversation._id}"]`);
    if (conversationElement && !conversation.isGroup) {
      // For 1-on-1 conversations, update display name with nickname
      const otherUser = conversation.populatedUsers?.find(user => 
        user.email !== currentUser?.email && user.username !== currentUser?.username
      );
        if (otherUser) {        const otherParticipant = conversation.participants?.find(p => p.user !== currentUser?._id);
        const displayName = otherParticipant?.nickname || otherUser.name;
        
        // Update the name in the conversation element
        const nameElement = conversationElement.querySelector('.font-medium.truncate');
        if (nameElement) {
          nameElement.textContent = displayName;
        }
      }
    }
  });
  
  console.log('Conversation display names updated');
}

// Helper function to get display name with nickname priority
function getDisplayNameForUser(userId, fallbackName = 'Người dùng') {
  if (!currentConversationId || !userId) return fallbackName;
  
  // Find current conversation
  const conversation = conversations.find(c => c._id === currentConversationId);
  if (!conversation || !conversation.participants) return fallbackName;
  
  // Check for nickname in participants
  const participant = conversation.participants.find(p => p.user === userId);
  if (participant && participant.nickname) {
    return participant.nickname;
  }
    // If no nickname, try to get name from populatedUsers
  if (conversation.populatedUsers) {
    // Find the user in populatedUsers that corresponds to this userId
    // We need to match by finding the participant first, then find corresponding populated user
    if (participant && conversation.populatedUsers.length > 0) {
      // For current user
      if (userId === currentUser?._id) {
        const currentUserInPopulated = conversation.populatedUsers.find(user => 
          user.email === currentUser?.email || user.username === currentUser?.username
        );
        if (currentUserInPopulated) {
          return currentUserInPopulated.name;
        }
      } else {
        // For other users, find the one that's not current user
        const otherUser = conversation.populatedUsers.find(user => 
          user.email !== currentUser?.email && user.username !== currentUser?.username
        );
        if (otherUser) {
          return otherUser.name;
        }
      }
    }
  }
  
  return fallbackName;
}
