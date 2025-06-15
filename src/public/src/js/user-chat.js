// Lưu ý sử dụng cho tất cả các yêu cầu:
// - Không được tạo file readme huoặc ghi chú nào khác ngoài những gì đã có.
// - Không được sửa file css vì có thể lỗi giao diện.
// - Cách kết nối socket trong file connection gateway
// - Mọi hành động của tính năng chat đều phải thông qua socket, không được gọi trực tiếp API, trừ những mục tôi đã viết api trong chat controller.

//Yêu cầu 1:
// Chuyển từ giao diện mẫu sang sử dụng api để gọi trong chat controller:
// @Get('conversation') để leeys danh sách cuộc trò chuyện
//  @Get('messages') để lấy danh sách tin nhắn của cuộc trò chuyện.
// Lưu ý:
// đọc kĩ dto để hiểu cách truyền tham số.
// Tôi muốn dữ liệu load theo kiểu cuộn vô hạn với mỗi lần load là 20 bản ghi
// có cả hiệu ứng loading khi đang load dữ liệu.
// Khi load xong thì cần giữ đúng vị trí cuộn trước đó(bao gồm cả load danh sách tin nhắn và lịch sử tin nhắn

// Yêu cầu 2:
// Chỉ hỗ trợ gửi một trong ba loại: tin nhắn văn bản, hình ảnh hoặc video.
// Nếu nội dung là hình ảnh hoặc video, cần gọi hàm uploadFile trước để lấy URL,
// sau đó mới emit tin nhắn với URL đó lên server.
//
// Khi gửi tin nhắn, cần hiển thị tạm thời tin nhắn với trạng thái "đang gửi".
// Nếu nhận được sự kiện 'messageReceived' từ server với cùng tempId,
// cần xoá tin nhắn tạm thời đó để thay thế bằng bản chính thức.
//
// Lưu ý quan trọng:
// - Mỗi lần gửi chỉ được một trong ba loại: text, ảnh hoặc video.
// - Không được gửi kèm text với ảnh hoặc video trong cùng một tin nhắn.

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
          ${isCurrentUser && !message.isTemp ? `<button onclick="handleDelete('${message._id}')">
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
        ${isCurrentUser && !message.isTemp ? action : ''}
        <div class="message-bubble ${isCurrentUser ? 'sent' : 'received'} p-3 rounded-lg ${message.replyTo ? 'reply-animation' : ''} p-1 max-w-[500px] group relative ${message.isTemp ? 'opacity-70' : ''}">
          ${replyHtml}
          ${contentHtml}
          <div class="time-tooltip">${messageTime}</div>
          ${reactionsHtml}
          ${statusHtml}
        </div>
        ${!isCurrentUser && !message.isTemp ? action : ''}
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
  if (!socket || !currentConversationId) {
    showToast({ message: 'Không thể xóa tin nhắn lúc này.', type: 'error' });
    return;
  }

  if (confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
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
    tempMessages.set(tempId, tempMessage);
    messages.push(tempMessage);
    
    // Add the new message element to the container
    const container = document.getElementById('messagesContainer');
    const messageElement = createMessageElement(tempMessage);
    container.appendChild(messageElement);    // Update conversation list immediately for better UX
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
  console.log('Message received:', data);
  
  // Check if this is a response to a temporary message
  if (data.tempId && tempMessages.has(data.tempId)) {
    // Find and update the temporary message
    const tempIndex = messages.findIndex(m => m._id === data.tempId);
    if (tempIndex !== -1) {
      // Update the temporary message to remove "sending" status
      messages[tempIndex] = {
        ...messages[tempIndex],  // Keep existing message data
        ...data.message,         // Update with server response
        _id: data.tempId,        // Keep the temp ID for UI consistency
        isTemp: false,           // No longer temporary
        status: 'sent'           // Mark as successfully sent
      };
      tempMessages.delete(data.tempId);
      
      // Just update the specific message element instead of re-rendering all
      updateMessageStatus(data.tempId);
      
      // Still need to update conversation list for temp messages
      updateConversationLastMessage(data.message);
      return;
    }
  }
  
  // Add new message if it's in current conversation
  if (data.message.conversationId === currentConversationId) {
    messages.push(data.message);
    
    // Add the new message element to the container instead of re-rendering all
    const container = document.getElementById('messagesContainer');
    const messageElement = createMessageElement(data.message);
    container.appendChild(messageElement);
    
    // Scroll to bottom
    const chatContainer = document.querySelector('.chat-messages');
    setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
  }
  
  // Update conversation list last message
  updateConversationLastMessage(data.message);
}

function handleReactionReceived(data) {
  console.log('Reaction received:', data);
  
  // Find and update message with new reactions
  const messageIndex = messages.findIndex(m => m._id === data.messageId);
  if (messageIndex !== -1) {
    // Update the message reactions with the complete reactions array from server
    messages[messageIndex].reactions = data.reactions || [];
    
    // Update only the specific message element instead of re-rendering all messages
    updateMessageReactions(data.messageId, data.reactions);
  }
}

function handleMessageDeleted(data) {
  console.log('Message deleted:', data);
  
  // Remove message from current conversation
  if (data.conversationId === currentConversationId) {
    messages = messages.filter(m => m._id !== data.messageId);
    renderMessages();
  }
}

function handleMessageHidden(data) {
  console.log('Message hidden:', data);
  
  // Similar to delete but maybe with different UI indication
  handleMessageDeleted(data);
}

function updateConversationLastMessage(message) {
  console.log('Updating conversation last message:', message);
  
  // Find and update conversation in the list
  const conversationIndex = conversations.findIndex(c => c._id === message.conversationId);
  console.log('Found conversation index:', conversationIndex);
  
  if (conversationIndex !== -1) {
    // Format last message based on type
    let lastMessageText = message.content;
    switch (message.type) {
      case 'IMAGE':
        lastMessageText = '📷 Đã gửi một hình ảnh';
        break;
      case 'VIDEO':
        lastMessageText = '🎥 Đã gửi một video';
        break;
      default:
        lastMessageText = message.content;
    }
    
    console.log('Updating conversation with last message:', lastMessageText);
    
    // Update conversation data
    conversations[conversationIndex].lastMessage = lastMessageText;
    conversations[conversationIndex].lastMessageAt = message.createdAt;
    
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
      }
    }
  } else {
    console.warn('Conversation not found in list:', message.conversationId);
    // If conversation not found, try to reload conversations
    loadConversations();
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
async function loadConversations(search = '') {
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
  
  console.log('Loading conversations...', { page: conversationPage, search });
  
  try {
    const params = new URLSearchParams({
      page: conversationPage,
      limit: 20,
      ...(search && { search })
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
    displayName = conversation.name || 'Nhóm chat';
  } else {
    // For 1-on-1 chat, find the other user (not current user)
    if (conversation.populatedUsers && conversation.populatedUsers.length >= 2) {
      const otherUser = conversation.populatedUsers.find(user => 
        user.email !== currentUser?.email && user.username !== currentUser?.username
      );
      
      if (otherUser) {
        displayName = otherUser.name;
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

function selectConversation(conversation) {
  // Remove active class from all conversations
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.remove('bg-primary', 'bg-opacity-20');
  });
  
  // Add active class to selected conversation
  const conversationElement = document.querySelector(`[data-conversation-id="${conversation._id}"]`);
  if (conversationElement) {
    conversationElement.classList.add('bg-primary', 'bg-opacity-20');
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
  
  // Enable message input and send button
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.querySelector('button[onclick="sendMessage()"]');
  if (messageInput) messageInput.disabled = false;
  if (sendButton) sendButton.disabled = false;
  
  // Hide no messages placeholder
  const noMessages = document.getElementById('noMessages');
  if (noMessages) noMessages.style.display = 'none';
  
  // Update chat header
  updateChatHeader(conversation);
  
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
  
  // Check if this is a group conversation or 1-on-1
  if (conversation.isGroup) {
    // For group chat, use conversation avatar and name
    avatar = conversation.avatar || '/images/kairo.jpg';
    displayName = conversation.name || 'Nhóm chat';
    status = `${conversation.participants?.length || 0} thành viên`;
  } else {
    // For 1-on-1 chat, find the other user (not current user)
    if (conversation.populatedUsers && conversation.populatedUsers.length >= 2) {
      const otherUser = conversation.populatedUsers.find(user => 
        user.email !== currentUser?.email && user.username !== currentUser?.username
      );
      if (otherUser) {
        displayName = otherUser.name;
        avatar = otherUser.avatar || '/images/kairo.jpg';
        status = otherUser.isOnline ? 'Đang hoạt động' : 'Không hoạt động';
      }
    }
  }
  
  headerName.textContent = displayName;
  headerStatus.textContent = status;
  headerAvatar.src = avatar;
  headerAvatar.alt = displayName;
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
        resetConversationPagination();
        loadConversations(searchTerm);
      }, 300);
    });
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
  });

  socket.on('joined-room', (data) => {
    console.log('Joined chat rooms:', data);
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
    handleMessageReceived(data);
  });

  socket.on('reactionReceived', (data) => {
    handleReactionReceived(data);
  });

  socket.on('messageDeleted', (data) => {
    handleMessageDeleted(data);
  });

  socket.on('messageHidden', (data) => {
    handleMessageHidden(data);
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

// Initialize app
async function initializeApp() {
  console.log('Initializing chat app...');
  
  try {
    await getCurrentUser();
    await initializeSocket();
    initializeScrollHandlers();
    initializeSearch();
    await loadConversations();
    
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
    }  }

  // Add message controls if message is not temporary (for both sent and received messages)
  if (!message.isTemp) {
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
              ${isCurrentUser ? `<button onclick="handleDelete('${messageId}')">
                <i class="ri-delete-bin-line"></i>Xóa tin nhắn
              </button>` : ''}
            </div>
          </div>
        </div>
      `;
      
      const messageBubble = messageBubbleContainer.querySelector('.message-bubble');
      if (isCurrentUser) {
        messageBubble.insertAdjacentHTML('beforebegin', controlsHtml);
      } else {
        messageBubble.insertAdjacentHTML('afterend', controlsHtml);
      }
    }
  }
}

// Update message content after file upload completes
function updateMessageContent(messageId, newContent) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  const message = messages.find(m => m._id === messageId);
  if (!message) return;

  // Update the content in the message bubble
  const messageBubble = messageElement.querySelector('.message-bubble');
  if (!messageBubble) return;

  let contentHtml = '';
  switch (message.type) {
    case 'IMAGE':
      contentHtml = `
        <img
          class="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition"
          src="${newContent}"
          alt="Image"
          onclick="openImageModal('${newContent}')"
        />`;
      break;
    case 'VIDEO':
      contentHtml = `
        <video controls class="rounded-lg w-full h-auto" preload="metadata">
          <source src="${newContent}" type="video/mp4"/>
        </video>
      `;
      break;
    default:
      contentHtml = `<p>${newContent}</p>`;
  }

  // Find existing content and replace it
  const existingContent = messageBubble.querySelector('img, video, p');
  if (existingContent) {
    existingContent.outerHTML = contentHtml;
  }
}

// Update message reactions without re-rendering all messages
function updateMessageReactions(messageId, reactions) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageElement) return;

  // Find the message bubble
  const messageBubble = messageElement.querySelector('.message-bubble');
  if (!messageBubble) return;

  // Remove existing reactions element
  const existingReactions = messageBubble.querySelector('.flex.flex-wrap.mt-1');
  if (existingReactions) {
    existingReactions.remove();
  }

  // Add new reactions if any exist
  if (reactions && reactions.length > 0) {
    const reactionGroups = {};
    reactions.forEach((reactionObj) => {
      const emoji = reactionObj.reaction;
      reactionGroups[emoji] = (reactionGroups[emoji] || 0) + 1;
    });

    const reactionElements = Object.entries(reactionGroups)
      .map(
        ([emoji, count]) =>
          `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-600 text-white mr-1 mt-1 cursor-pointer hover:bg-gray-500 transition-colors">${emoji} ${count}</span>`,
      )
      .join('');

    const reactionsHtml = `<div class="flex flex-wrap mt-1">${reactionElements}</div>`;
    
    // Insert the new reactions before the time tooltip
    const timeTooltip = messageBubble.querySelector('.time-tooltip');
    if (timeTooltip) {
      timeTooltip.insertAdjacentHTML('beforebegin', reactionsHtml);
    } else {
      // If no time tooltip, append to the end of message bubble
      messageBubble.insertAdjacentHTML('beforeend', reactionsHtml);
    }
  }
}
