// // Tạo kết nối tới server
// const socket = io(window.location.origin, {
//   reconnection: true, // Tự động kết nối lại nếu bị ngắt
// });

// socket.on('connect', () => {});

// socket.on('leaveThread', (data) => {
//   console.log('Leave thread:', data);
// });

// socket.on('error', (data) => {
//   showToast({
//     message: 'Lỗi: ' + data.message,
//     header: 'Lỗi!',
//     type: 'error',
//     delay: 5000,
//   });
// });

// // Sự kiện khi ngắt kết nối
// socket.on('disconnect', (reason) => {
//   console.log('Socket.IO bị ngắt kết nối:', reason);
// });

// // Sự kiện khi có lỗi
// socket.on('connect_error', (error) => {
//   showToast({
//     message: 'Lỗi kết nối: ' + error.message,
//     header: 'Lỗi!',
//     type: 'error',
//     delay: 5000,
//   });
// });

// // Lấy các phần tử
// const textarea = document.querySelector('.custom-message-input');
// const sendButton = document.querySelector('.custom-send-btn');
// const messageList = document.getElementsByClassName(
//   'list-unstyled chat-history',
// )[0];

// const scroll = document.getElementsByClassName(
//   'chat-history-body custom-scroll',
// )[0];

// const hiddenChat = document.getElementsByClassName(
//   'message-restricted alert alert-warning text-center mb-2 d-none',
// )[0];

// const showChat = document.getElementsByClassName(
//   'custom-message-wrapper d-flex align-items-center d-none',
// )[0];

// const sidebar = document.getElementById('app-chat-sidebar-left');

// let isSending = false; // Trạng thái gửi tin nhắn

// // Lắng nghe thay đổi trên danh sách tin nhắn
// const observer = new MutationObserver((mutationsList) => {
//   for (const mutation of mutationsList) {
//     if (mutation.type === 'childList') {
//       toggleNoMessages();
//     }
//   }
// });

// // Thiết lập observer để theo dõi các thay đổi trong con của messageList
// observer.observe(messageList, { childList: true });

// function toggleNoMessages() {
//   const emptyMessage = document.getElementsByClassName(
//     'no-messages text-center text-muted',
//   )[0];
//   if (messageList.children.length > 0) {
//     emptyMessage.style.display = 'none';
//   } else {
//     emptyMessage.style.display = '';
//   }
// }

// socket.on('messageSent', (data) => {
//   const icon = document.getElementById(data.sectionId);
//   if (icon) {
//     icon.classList.add('text-success');
//   }

//   const isScroll =
//     scroll.scrollTop == scroll.scrollHeight - scroll.clientHeight;
//   changeText({
//     threadId: data.threadId,
//     message: data.message,
//     ts: data.ts,
//     isScroll,
//   });
// });

// socket.on('messageReceived', (data) => {
//   if (data.threadId == currentThreadId) {
//     const time = formatTime(data.ts);
//     const messageHtml = `
//     <li class="chat-message custom-message">
//         <div class="d-flex overflow-hidden">
        
//             <div class="user-avatar flex-shrink-0 me-4">
//             <div class="avatar avatar-sm avatar-user-${data.sender._id} avatar-online">
//                 <span class="avatar-initial rounded-circle bg-label-${getColor(data.sender.name)}">
//                     ${data.sender.name[0]}
//                 </span>
//             </div>
//             </div>
//         <div class="chat-message-wrapper flex-grow-1">
//             <div class="chat-message-sender text-muted mb-1">
//                             ${data.sender.name}
//                         </div>
//             <div class="chat-message-text">
//             <p class="mb-0">${formatMessage(data.message)}</p>
//             </div>
//             <div class=" text-muted mt-1">
            
//             <small>${time}</small>
//             </div>
//         </div>
        
//         </div>
//     </li>`;

//     data.isScroll =
//       scroll.scrollTop == scroll.scrollHeight - scroll.clientHeight;
//     messageList.insertAdjacentHTML('beforeend', messageHtml);
//   }
//   changeText(data);
// });

// // Hàm gửi tin nhắn
// function sendMessage() {
//   if (isSending) return; // Nếu đang gửi tin nhắn, không thực hiện gửi thêm
//   const content = textarea.value.trim(); // Lấy nội dung tin nhắn và loại bỏ khoảng trắng thừa
//   if (!content) return; // Không làm gì nếu nội dung rỗng

//   isSending = true; // Đặt trạng thái gửi tin nhắn
//   sendButton.disabled = true; // Vô hiệu hóa nút gửi
//   const time = formatTime(Date.now());
//   const randomString = Math.random().toString(36).substring(7);
//   const messageHtml = `
//   <li class="chat-message chat-message-right custom-message-right">
//                 <div class="d-flex overflow-hidden">
                
//                 <div class="chat-message-wrapper flex-grow-1">
//                     <div class="chat-message-text">
//                     <p class="mb-0">${formatMessage(content)}</p>
//                     </div>
//                     <div class="text-end text-muted mt-1">
//                     <i class="icon-base bx bx-check-double bx-16px me-1" id="${randomString}"></i>
//                     <small>${time}</small>
//                     </div>
//                 </div>
                
//                     <div class="user-avatar flex-shrink-0 ms-4">
//                     <div class="avatar avatar-sm avatar-user-${currentUserId} avatar-online">
//                         <span class="avatar-initial rounded-circle bg-label-${getColor(currentName)}">
//                         ${currentName[0]}
//                         </span>
//                     </div>
//                     </div>
//                 </div>
//             </li>`;
//   messageList.insertAdjacentHTML('beforeend', messageHtml);
//   socket.emit('sendMessage', {
//     threadId: currentThreadId,
//     message: content,
//     sectionId: randomString,
//   }); // Gửi tin nhắn tới server

//   textarea.value = ''; // Xóa nội dung trong textarea sau khi gửi
//   textarea.style.height = 'auto'; // Reset chiều cao của textarea
//   isSending = false; // Hoàn tất gửi tin nhắn
//   sendButton.disabled = false; // Kích hoạt lại nút gửi
//   scroll.scrollTop = scroll.scrollHeight;
// }

// function changeText(data) {
//   const lastMessage = document.getElementById('lastMessage-' + data.threadId);
//   const timeLastMessage = document.getElementById(
//     'time-lastMessage-' + data.threadId,
//   );
//   const thread = document.getElementById('thread-' + data.threadId);
//   lastMessage.textContent = data.message;
//   timeLastMessage.textContent = formatTime(data.ts);
//   const parent = thread.parentNode;
//   parent.insertBefore(thread, parent.children[0]);
//   if (data.isScroll) {
//     scroll.scrollTop = scroll.scrollHeight;
//   }
// }

// // Lắng nghe sự kiện nhấn phím trên textarea
// textarea.addEventListener('keydown', (event) => {
//   if (event.key === 'Enter' && !event.shiftKey) {
//     // Nếu nhấn Enter mà không giữ Shift
//     event.preventDefault(); // Ngăn tạo dòng mới
//     sendMessage(); // Gọi hàm gửi tin nhắn
//   }
// });

// // Lắng nghe sự kiện click nút gửi
// sendButton.addEventListener('click', sendMessage);

// const checkScrollTop = () => {
//   if (scroll.scrollTop === 0 && scroll.scrollHeight > scroll.clientHeight) {
//     getMessageThreadById(currentThreadId);
//   }
// };
// scroll.addEventListener('scroll', checkScrollTop);

// function getDataCreate() {
//   const selectElement = document.getElementById('choices-multiple-user');
//   const members = Array.from(selectElement.selectedOptions).map(
//     (option) => option.value,
//   );
//   const nameThread = document.getElementById('thread-name').value;
//   const canChat = document.getElementById('canSendMessage').checked;
//   socket.emit('createThread', {
//     members,
//     name: nameThread,
//     canSendMessage: canChat,
//   });
// }

// function getDataEdit() {
//   const selectElement = document.getElementById('choices-multiple-user');
//   const members = Array.from(selectElement.selectedOptions).map(
//     (option) => option.value,
//   );
//   const selectElementAdmin = document.getElementById('choices-multiple-admin');
//   const admins = Array.from(selectElementAdmin.selectedOptions).map(
//     (option) => option.value,
//   );
//   const nameThread = document.getElementById('thread-name').value;
//   const canChat = document.getElementById('canSendMessage').checked;
//   socket.emit('editThread', {
//     threadId: currentThreadId,
//     members,
//     admins,
//     name: nameThread,
//     canSendMessage: canChat,
//   });
// }

// socket.on('editThread', (data) => {
//   window.location.reload();
// });

// socket.on('threadCreated', (data) => {
//   createThread(data);
//   sidebar.classList.remove('show'); // Đóng sidebar
//   showToast({
//     message: 'Tạo nhóm chat thành công!',
//     header: 'Thành công!',
//     type: 'success',
//     delay: 3000,
//   });
// });

// socket.on('joinThread', (data) => {
//   createThread(data);
// });

// function deleteThread() {
//   socket.emit('deleteThread', {
//     threadId: currentThreadId,
//     members: threadsCanSendMessage.find(
//       (item) => item.threadId === currentThreadId,
//     ).members,
//   });
// }

// socket.on('threadDeleted', () => {
//   window.location.reload();
// });

// function createThread(data) {
//   const innerHTML = `
//     <li class="chat-contact-list-item mb-1" data-id="${data._id}" id="thread-${data._id}" data-name="${data.name}">
//       <a class="d-flex align-items-center">
//         <div class="flex-shrink-0 avatar avatar-online">
//           <span class="avatar-initial rounded-circle bg-label-${getColor(data.name)}" id="avatar-${data._id}">
//           ${data.name[0]}
//           </span>
//         </div>
//         <div class="chat-contact-info flex-grow-1 ms-4">
//           <div class="d-flex justify-content-between align-items-center">
//             <h6 class="chat-contact-name text-truncate m-0 fw-normal" id="name-${data._id}">${data.name}</h6>
//             <small class="text-muted" id="time-lastMessage-${data._id}">
//               ${formatTime(Date.now())}
//             </small>
//           </div>
//           <small class="chat-contact-status text-truncate" id="lastMessage-${data._id}">
//             Không có tin nhắn nào!
//           </small>
//         </div>
//       </a>
//     </li>`;
//   const contactList = document.getElementById('chat-list');
//   contactList.insertAdjacentHTML('afterbegin', innerHTML);

//   threadsCanSendMessage.push({
//     threadId: data._id,
//     admins: data.admins,
//     members: data.members,
//     name: data.name,
//     canSendMessage: data.canSendMessage,
//   });
// }

// let menuIcon = document.querySelector(
//   ".chat-history-header [data-target='#app-chat-contacts']",
// );
// let closeIcon = document.getElementById('close-sidebar-chat'); // Biểu tượng đóng
// let sidebar1 = document.querySelector('#app-chat-contacts'); // Sidebar

// // Mở sidebar khi click vào biểu tượng menu
// menuIcon.addEventListener('click', () => {
//   sidebar1.classList.add('show'); // Mở sidebar
// });

// // Đóng sidebar khi click vào biểu tượng đóng
// closeIcon.addEventListener('click', () => {
//   sidebar1.classList.remove('show'); // Đóng sidebar
// });

// // Lấy phần tử sidebar
// let choicesInstance = null;
// let choicesAdmin = null;
// const titleSidebar = document.getElementById('title-sidebar');
// const threadName = document.getElementById('thread-name');
// const listAdmin = document.getElementById('admin-list');
// const buttonAction = document.getElementById('button-action');
// async function openCreateThread() {
//   if (currentRole != '0') return;
//   openThread('create');
// }

// async function openEditThread() {
//   openThread('edit');
// }

// async function openThread(type) {
//   try {
//     const response = await fetch('/list-user'); // Gọi API
//     const data = await response.json();
//     const users = data.users;

//     const choicesElement = document.getElementById('choices-multiple-user');

//     const reloadChoices = (choicesElement, choicesInstance, allChoices) => {
//       // Nếu Choices đã được khởi tạo, hủy khởi tạo trước
//       if (choicesInstance) {
//         choicesInstance.removeActiveItems();
//         choicesInstance.destroy();
//       }

//       // Khởi tạo lại Choices với dữ liệu mới
//       choicesInstance = new Choices(choicesElement, {
//         removeItemButton: true,
//         placeholderValue: 'Chọn người dùng',
//         searchPlaceholderValue: 'Tìm kiếm...',
//         shouldSort: false,
//       });

//       // Cập nhật Choices với tất cả các lựa chọn
//       choicesInstance.setChoices(allChoices, 'value', 'label', false);
//       return choicesInstance; // Trả về đối tượng Choices mới
//     };

//     // Thêm các trường mặc định
//     const predefinedOptions = [
//       { value: 'dev', label: 'Dev', selected: false },
//       { value: 'admin', label: 'Admin', selected: false },
//       { value: 'user', label: 'User', selected: false },
//     ];

//     // Kết hợp dữ liệu từ API
//     const userChoices = users.map((user) => ({
//       value: user._id,
//       label: `${user.name} (${user.email})`,
//       role: user.role,
//       selected: false,
//     }));

//     const allChoices = [...predefinedOptions, ...userChoices];

//     const choicesElementAdmin = document.getElementById(
//       'choices-multiple-admin',
//     );
//     const showButton = document.getElementById('showButton');
//     switch (type) {
//       case 'create':
//         listAdmin.style.display = 'none';
//         titleSidebar.textContent = 'Tạo nhóm chat';
//         threadName.value = '';
//         buttonAction.innerHTML =
//           '<i class="bx bx-plus bx-sm me-2"></i>Thêm mới';
//         buttonAction.onclick = getDataCreate;
//         showButton.classList.remove('d-none');
//         const checkCanSendMessage = document.getElementById('canSendMessage');
//         checkCanSendMessage.disabled = false;
//         threadName.disabled = false;
//         choicesElement.disabled = false;
//         choicesInstance = reloadChoices(
//           choicesElement,
//           choicesInstance,
//           allChoices,
//         );
//         break;
//       case 'edit':
//         const thread = threadsCanSendMessage.find(
//           (item) => item.threadId === currentThreadId,
//         );
//         const checkCSendMessage = document.getElementById('canSendMessage');
//         checkCSendMessage.checked = thread.canSendMessage;
//         if (!thread.admins.includes(currentUserId)) {
//           showButton.classList.add('d-none');
//           checkCSendMessage.disabled = true;
//           threadName.disabled = true;
//           choicesElement.disabled = true;
//           choicesElementAdmin.disabled = true;
//         } else {
//           checkCSendMessage.disabled = false;
//           showButton.classList.remove('d-none');
//           threadName.disabled = false;
//           choicesElement.disabled = false;
//           choicesElementAdmin.disabled = false;
//         }
//         listAdmin.style.display = '';
//         titleSidebar.textContent = 'Thông tin nhóm chat';
//         buttonAction.innerHTML =
//           '<i class="bx bx-edit bx-sm me-2"></i>Cập nhật';
//         buttonAction.onclick = getDataEdit;

//         let adminChoices = users.map((user) => ({
//           value: user._id,
//           label: `${user.name} (${user.email})`,
//           role: user.role,
//           selected: false,
//         }));

//         threadName.value = thread.name;
//         adminChoices = adminChoices.filter((user) =>
//           thread.members.includes(user.value),
//         );
//         choicesAdmin = reloadChoices(
//           choicesElementAdmin,
//           choicesAdmin,
//           adminChoices,
//         );
//         choicesInstance = reloadChoices(
//           choicesElement,
//           choicesInstance,
//           allChoices,
//         );
//         choicesAdmin.setChoiceByValue(thread.admins);
//         choicesInstance.setChoiceByValue(thread.members);
//         const roles = {
//           dev: 0,
//           admin: 1,
//           user: 2,
//         };
        
//         Object.entries(roles).forEach(([key, role]) => {
//           const usersInRole = users.filter((user) => user.role === role).map((user) => user._id);
//           const allUserIdsSelected = usersInRole.every((id) => thread.members.includes(id));
//           if(allUserIdsSelected){
//             choicesInstance.setChoiceByValue(key);
//           }
//         });
//         break;
//     }

//     sidebar.classList.add('show'); // Mở sidebar

//     // Lắng nghe sự kiện thay đổi
//     choicesElement.addEventListener('change', (event) =>
//       handleChoiceChange(event, users),
//     );
//   } catch (error) {
//     showToast({
//       message: error.message,
//       header: 'Lỗi!',
//       type: 'error',
//       delay: 5000,
//     });
//   }
// }

// function handleChoiceChange(event, users) {
//   const selectedValues = choicesInstance.getValue(true); // Lấy giá trị đã chọn

//   if (!selectedValues || selectedValues.length === 0) return;

//   const roles = {
//     dev: 0,
//     admin: 1,
//     user: 2,
//   };

//   const lastSelectedValue = selectedValues[selectedValues.length - 1];

//   Object.entries(roles).forEach(([key, role]) => {
//     const userIds = users
//       .filter((user) => user.role === role)
//       .map((user) => user._id);

//     // Kiểm tra nếu tất cả userIds đã nằm trong các giá trị đã chọn
//     const allUserIdsSelected = userIds.every((id) =>
//       selectedValues.includes(id),
//     );
//     const someUserIdsSelected = userIds.some((id) =>
//       selectedValues.includes(id),
//     );

//     if (selectedValues.includes(key)) {
//       if (
//         (!allUserIdsSelected && !someUserIdsSelected) ||
//         lastSelectedValue === key
//       ) {
//         choicesInstance.setChoiceByValue(userIds);
//       } else if (!allUserIdsSelected && someUserIdsSelected) {
//         choicesInstance.removeActiveItemsByValue(key);
//       }
//     } else {
//       if (allUserIdsSelected) {
//         userIds.forEach((id) => choicesInstance.removeActiveItemsByValue(id));
//       }
//     }
//   });
// }

// // Lấy thẻ đóng sidebar (thẻ có class close-sidebar)
// const closeSidebarElement = document.querySelector('.close-sidebar');

// // Đóng sidebar khi nhấn vào thẻ đóng
// if (closeSidebarElement != null) {
//   closeSidebarElement.addEventListener('click', () => {
//     sidebar.classList.remove('show'); // Đóng sidebar
//   });
// }

// document.addEventListener('DOMContentLoaded', () => {
//   activateCurrentThread();
//   const textarea = document.querySelector('.custom-message-input');

//   textarea.addEventListener('input', () => {
//     textarea.style.height = 'auto'; // Reset height
//     const maxHeight = 5 * 1.5 * 16; // Giới hạn chiều cao: 5 dòng
//     textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;

//     // Xử lý thanh cuộn
//     if (textarea.scrollHeight > maxHeight) {
//       textarea.style.overflowY = 'scroll';
//     } else {
//       textarea.style.overflowY = 'hidden';
//     }
//   });

//   const contactList = document.querySelector('.chat-contact-list');

//   contactList.addEventListener('click', (event) => {
//     const item = event.target.closest('.chat-contact-list-item');

//     if (!item || item.classList.contains('active')) return;

//     const contactId = item.getAttribute('data-id');
//     const threadName = item.getAttribute('data-name');

//     const threadNameElement = document.getElementById('nameThread');
//     const threadAvatarElement = document.getElementById('avatarThread');

//     threadNameElement.textContent = threadName;
//     threadAvatarElement.textContent = threadName.charAt(0).toUpperCase();
//     threadAvatarElement.className = ''; // Xóa toàn bộ lớp
//     threadAvatarElement.classList.add(
//       'avatar-initial',
//       'rounded-circle',
//       'bg-label-' + getColor(threadName),
//     );

//     if (!contactId) return;
//     getMessageThreadById(contactId);

//     // Loại bỏ class 'active' khỏi tất cả các mục
//     document
//       .querySelectorAll('.chat-contact-list-item')
//       .forEach((contact) => contact.classList.remove('active'));

//     // Gán class 'active' cho mục được click
//     item.classList.add('active');
//   });
// });

// function formatMessage(message) {
//   // Xử lý xuống dòng: Thay \n thành <br>
//   message = message.replace(/\n/g, '<br>');

//   // Xử lý in đậm (**text**): Thay **text** thành <strong>text</strong>
//   message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

//   // Xử lý in nghiêng (*text*): Thay *text* thành <em>text</em>
//   message = message.replace(/\*(.*?)\*/g, '<em>$1</em>');

//   // Xử lý gạch ngang (~~text~~): Thay ~~text~~ thành <del>text</del>
//   message = message.replace(/~~(.*?)~~/g, '<del>$1</del>');

//   // Xử lý mã code dạng inline (`text`): Thay `text` thành <code>text</code>
//   message = message.replace(/`(.*?)`/g, '<code>$1</code>');

//   // Xử lý mã code dạng block:
//   message = message.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

//   // Xử lý danh sách có đánh số
//   message = message.replace(/(\n|^)(\d+\.) (.*?)(?=\n|$)/g, '<li>$3</li>');

//   // Thêm thẻ <ol> bao bọc toàn bộ danh sách có đánh số
//   message = message.replace(/(<li>[\s\S]*?<\/li>)/g, '<ol>$1</ol>');

//   // Xử lý liên kết [text](url): Thay [text](url) thành <a href="url" target="_blank">text</a>
//   message = message.replace(
//     /\[(.*?)\]\((https?:\/\/[^\s]+)\)/g,
//     '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
//   );

//   // Trả về HTML đã format
//   return message;
// }

// let page = 1; // Trang hiện tại
// let maxPage = 99;

// async function getMessageThreadById(id) {
//   const emptyMessage = document.getElementsByClassName(
//     'no-messages text-center text-muted',
//   )[0];
//   const messageList = document.getElementsByClassName(
//     'list-unstyled chat-history',
//   )[0];

//   const cfThread = threadsCanSendMessage.find(
//     (thread) => thread.threadId === id,
//   );
//   if (!cfThread.admins.includes(currentUserId)) {
//     const canChat = cfThread.canSendMessage;
//     if (!canChat) {
//       hiddenChat.classList.remove('d-none');
//       showChat.classList.add('d-none');
//     } else {
//       hiddenChat.classList.add('d-none');
//       showChat.classList.remove('d-none');
//     }
//   } else {
//     hiddenChat.classList.add('d-none');
//     showChat.classList.remove('d-none');
//   }

//   if (currentThreadId === id) {
//     if (page > maxPage) {
//       return;
//     }
//   } else {
//     page = 1;
//     currentThreadId = id;
//     maxPage = 99;
//     messageList.innerHTML = '';
//   }
//   const loadingElement = document.getElementsByClassName(
//     page == 1 ? 'loading-indicator text-center' : 'loading-indicator-chat',
//   )[0];

//   emptyMessage.style.display = 'none';
//   loadingElement.style.display = '';
//   try {
//     const response = await fetch(`/get-message-thread/${id}?page=${page}`);
//     const data = await response.json();
//     maxPage = data.totalPages;
//     if (data.docs.length === 0) {
//       emptyMessage.style.display = '';
//     } else {
//       let messageHtml = '';
//       data.docs
//         .sort((a, b) => a.create_at - b.create_at) // Sắp xếp tin nhắn theo create_at
//         .forEach((message) => {
//           if(!message.senderId){
//             message.senderId = {
//               _id: 'deleted',
//               name: 'Người dùng đã xóa',
//             };
//           }
//           const isCurrentUser = message.senderId._id === currentUserId; // Kiểm tra tin nhắn của bản thân

//           const chatMessageClass = isCurrentUser
//             ? 'chat-message chat-message-right custom-message-right'
//             : 'chat-message custom-message';

//           const time = formatTime(message.create_at);

//           messageHtml += `
//             <li class="${chatMessageClass}">
//                 <div class="d-flex overflow-hidden">
//                 ${
//                   !isCurrentUser
//                     ? `
//                     <div class="user-avatar flex-shrink-0 me-4">
//                         <div class="avatar avatar-sm avatar-user-${message.senderId._id}">
//                         <span class="avatar-initial rounded-circle bg-label-${getColor(
//                           message.senderId.name,
//                         )}">
//                             ${message.senderId.name[0]}
//                         </span>
//                         </div>
//                     </div>`
//                     : ''
//                 }
//                 <div class="chat-message-wrapper flex-grow-1">
//                     ${
//                       !isCurrentUser
//                         ? `<div class="chat-message-sender text-muted mb-1">
//                             ${message.senderId.name}
//                         </div>`
//                         : ''
//                     }
//                     <div class="chat-message-text">
//                     <p class="mb-0">${formatMessage(message.content)}</p>
//                     </div>
//                     <div class="${isCurrentUser ? 'text-end' : ''} text-muted mt-1">
//                     ${
//                       isCurrentUser
//                         ? '<i class="icon-base bx bx-check-double bx-16px text-success me-1"></i>'
//                         : ''
//                     }
//                     <small>${time}</small>
//                     </div>
//                 </div>
//                 ${
//                   isCurrentUser
//                     ? `
//                     <div class="user-avatar flex-shrink-0 ms-4">
//                         <div class="avatar avatar-sm avatar-user-${message.senderId._id}">
//                         <span class="avatar-initial rounded-circle bg-label-${getColor(
//                           message.senderId.name,
//                         )}">
//                             ${message.senderId.name[0]}
//                         </span>
//                         </div>
//                     </div>`
//                     : ''
//                 }
//                 </div>
//             </li>
//             `;
//         });

//       // Lưu vị trí cuộn ban đầu trước khi chèn dữ liệu
//       const previousHeight = scroll.scrollHeight;
//       // Thêm tin nhắn vào danh sách
//       messageList.insertAdjacentHTML('afterbegin', messageHtml);
//       if (page == 1) {
//         scroll.scrollTop = scroll.scrollHeight;
//       } else {
//         const newHeight = scroll.scrollHeight;
//         scroll.scrollTop = scroll.scrollTop + (newHeight - previousHeight);
//       }
//     }
//     localStorage.setItem('currentThreadId', id);
//     loadingElement.style.display = 'none';
//   } catch (error) {
//     emptyMessage.style.display = '';
//     loadingElement.style.display = 'none';
//     console.error(error);
    
//     showToast({
//       message: error.message,
//       header: 'Lỗi!',
//       type: 'error',
//       delay: 5000,
//     });
//   }
//   page++;
// }

// function activateCurrentThread() {
//   if (!currentThreadId) return;

//   const contactItems = document.querySelectorAll('.chat-contact-list-item');
//   contactItems.forEach((contact) => {
//     const contactId = contact.getAttribute('data-id');
//     if (contactId === currentThreadId) {
//       contact.classList.add('active'); // Active mục phù hợp
//       contact.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Tự động cuộn tới mục
//     } else {
//       contact.classList.remove('active'); // Xóa active khỏi mục khác
//     }
//   });

//   // Gán thông tin thread hiện tại vào giao diện
//   const selectedContact = document.querySelector(
//     `.chat-contact-list-item[data-id="${currentThreadId}"]`
//   );
//   if (selectedContact) {
//     const threadName = selectedContact.getAttribute('data-name');
//     const threadNameElement = document.getElementById('nameThread');
//     const threadAvatarElement = document.getElementById('avatarThread');

//     threadNameElement.textContent = threadName;
//     threadAvatarElement.textContent = threadName.charAt(0).toUpperCase();
//     threadAvatarElement.className = ''; // Xóa toàn bộ lớp
//     threadAvatarElement.classList.add(
//       'avatar-initial',
//       'rounded-circle',
//       'bg-label-' + getColor(threadName)
//     );

//     // Gọi hàm tải tin nhắn của thread
//     getMessageThreadById(currentThreadId);
//   }
// }
