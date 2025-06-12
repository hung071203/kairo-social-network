const iconNotification = document.getElementsByClassName(
  'badge rounded-pill badge-notifications border',
)[0];

const notificationsScroll = document.getElementById('notifications-scroll');
const badges = document.getElementsByClassName(
  'badge bg-label-primary me-2 count-unread',
);
const badgesArray = Array.from(badges);

// Hàm lấy class icon
function getIconClass(type) {
  switch (type) {
    case 'SUCCESS':
      return 'bx bx-check-circle';
    case 'INFOR':
      return 'bx bx-info-circle';
    case 'WARNING':
      return 'bx bx-error-circle'; // Biểu tượng cảnh báo
    case 'ERROR':
      return 'bx bx-error';
    default:
      return '';
  }
}

// Hàm lấy class nền
function getBgClass(type) {
  switch (type) {
    case 'SUCCESS':
      return 'bg-label-success';
    case 'INFO':
      return 'bg-label-info';
    case 'WARNING':
      return 'bg-label-warning';
    case 'ERROR':
      return 'bg-label-danger';
    default:
      return '';
  }
}

// Hàm tạo icon thông báo
function createNotificationIcon(type) {
  const iconClass = getIconClass(type);
  const bgClass = getBgClass(type);
  return `
    <span class="avatar-initial rounded-circle ${bgClass}">
      <i class="icon-base ${iconClass}"></i>
    </span>
  `;
}

// Hàm gọi API
async function getNotifications() {
  try {
    const res = await fetch(`/notifications/json?page=1`);
    const data = await res.json();

    // Kiểm tra nếu không có thông báo
    if (data.data.docs.length === 0) {
      showNoNotificationsMessage();
    } else if (data.data.docs.length > 0) {
      appendNotifications(notificationsScroll, data.data.docs);
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  } finally {
    isLoading = false;
  }
}

function timeAgo(isoDateString) {
  const date = new Date(isoDateString);
  const now = new Date();
  const diff = now - date; // milliseconds

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return `${seconds} giây trước`;
  } else if (minutes < 60) {
    return `${minutes} phút trước`;
  } else if (hours < 24) {
    return `${hours} giờ trước`;
  } else if (days < 30) {
    return `${days} ngày trước`;
  } else if (months < 12) {
    return `${months} tháng trước`;
  } else {
    return `${years} năm trước`;
  }
}

function appendNotifications(htmlSelector, notifications) {
  const list = htmlSelector.querySelector('ul');
  notifications.forEach((notification) => {
    const li = document.createElement('li');
    li.className = `list-group-item list-group-item-action dropdown-notifications-item ${
      notification.is_readed ? 'marked-as-read' : ''
    }`;

    // Tạo nội dung cho thông báo
    li.innerHTML = `
        <div class="d-flex">
          <div class="flex-shrink-0 me-3">
            <div class="avatar">
              ${createNotificationIcon(notification.type)}
            </div>
          </div>
          <div class="flex-grow-1">
            <h6 class="small mb-0">${notification.title}</h6>
            <small class="mb-1 d-block text-body">${notification.message}</small>
            <small class="text-body-secondary">${timeAgo(notification.createdAt)}</small>
          </div>
          <div class="flex-shrink-0 dropdown-notifications-actions">
            <a href="javascript:void(0)" class="dropdown-notifications-read">
              <span class="badge badge-dot"></span>
            </a>
            <a href="javascript:void(0)" class="dropdown-notifications-archive">
              <span class="icon-base bx bx-x"></span>
            </a>
          </div>
        </div>
      `;

    // Thêm sự kiện click để chuyển hướng và cập nhật trạng thái đã đọc
    li.addEventListener('click', async () => {
      // Chuyển hướng nếu có link
      if (notification.link) {
        window.open(notification.link, '_blank');
      }

      // Cập nhật trạng thái đã đọc
      if (!notification.is_readed) {
        try {
          const response = await fetch(
            `/notifications/${notification._id}/mark-as-read`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            },
          );
          const data = await response.json();
          if (data.success) {
            notification.is_readed = true; // Cập nhật trạng thái trong dữ liệu
            li.classList.add('marked-as-read'); // Thêm class để hiển thị trạng thái đã đọc
            checkCountNotification(1);
          } else {
            showToast({
              message: data.message,
              header: 'Lỗi!',
              type: 'error',
              delay: 5000,
            });
          }
        } catch (error) {
          showToast({
            message: error.message,
            header: 'Lỗi!',
            type: 'error',
            delay: 5000,
          });
        }
      }
    });

    // Thêm sự kiện click vào nút xóa để chỉ xóa thông báo mà không thay đổi trạng thái đã đọc
    const deleteButton = li.querySelector('.dropdown-notifications-archive');
    deleteButton.addEventListener('click', async (event) => {
      // Ngăn không cho sự kiện click trên thẻ li kích hoạt
      event.stopPropagation();

      try {
        const response = await fetch(`/notifications/${notification._id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success) {
          li.remove(); // Xóa thông báo khỏi UI
          checkCountNotification(1);
        } else {
          showToast({
            message: data.message,
            header: 'Lỗi!',
            type: 'error',
            delay: 5000,
          });
        }
      } catch (error) {
        showToast({
          message: error.message,
          header: 'Lỗi!',
          type: 'error',
          delay: 5000,
        });
      }
    });

    // Thêm thẻ li vào danh sách
    if (notifications.length == 1) {
      list.insertBefore(li, list.firstChild);
    } else {
      list.appendChild(li);
    }
  });
}

// Hàm hiển thị thông báo "Không có thông báo nào"
function showNoNotificationsMessage() {
  const list = notificationsScroll.querySelector('ul');
  list.innerHTML = `
    <li class="list-group-item text-center">
      <span class="text-body-secondary">Không có thông báo nào</span>
    </li>
  `;
}

async function markAllRead() {
  try {
    const response = await fetch(`/notifications/mark-all-as-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (data.success) {
      const notifications = notificationsScroll.querySelectorAll(
        '.dropdown-notifications-item',
      );
      notifications.forEach((notification) => {
        notification.classList.add('marked-as-read');
      });
      if (window.location.pathname === '/notifications-manager') {
        const pageNoti = listNoti.querySelectorAll(
          '.dropdown-notifications-item',
        );
        pageNoti.forEach((notification) => {
          notification.classList.add('marked-as-read');
        });
      }
      const count = parseInt(badgesArray[0].textContent);
      checkCountNotification(count);
      showToast({
        message: data.message,
        header: 'Thông báo',
        type: 'success',
        delay: 3000,
      });
    } else {
      showToast({
        message: data.message,
        header: 'Lỗi!',
        type: 'error',
        delay: 5000,
      });
    }
  } catch (error) {
    showToast({
      message: error.message,
      header: 'Lỗi!',
      type: 'error',
      delay: 5000,
    });
  }
}

async function getCountUnread() {
  try {
    const response = await fetch('/notifications/count-unread');
    const data = await response.json();
    const count = data.data.count; // Chuyển đổi HTMLCollection thành mảng

    if (count > 0) {
      iconNotification.classList.add('bg-danger', 'badge-dot');
      badgesArray.forEach((badge) => {
        badge.textContent = count;
        badge.classList.remove('d-none');
      });
    } else {
      iconNotification.classList.remove('bg-danger', 'badge-dot');
      badgesArray.forEach((badge) => {
        badge.classList.add('d-none');
      });
    }
  } catch (error) {
    showToast({
      message: error.message,
      header: 'Lỗi!',
      type: 'error',
      delay: 5000,
    });
  }
}

function checkCountNotification(numeric) {
  const count = parseInt(badgesArray[0].textContent);
  if (count - numeric === 0) {
    iconNotification.classList.remove('bg-danger', 'badge-dot');
    badgesArray.forEach((badge) => {
      badge.classList.add('d-none');
    });
  } else {
    iconNotification.classList.add('bg-danger', 'badge-dot');
    badgesArray.forEach((badge) => {
      badge.textContent = count - numeric;
      badge.classList.remove('d-none');
    });
  }
}

getCountUnread();
// Tải trang đầu tiên khi khởi động
getNotifications();

// Kết nối với socketNoti server
const socketNoti = io(window.location.origin + '/notifications', {
  reconnection: true, // Tự động kết nối lại nếu bị ngắt
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  transports: ['websocket'],
});

socketNoti.on('connected', () => {
  console.log('Connected to notifications socketNoti');
});

socketNoti.on('error', (data) => {
  showToast({
    message: 'Lỗi: ' + data.message,
    header: 'Lỗi!',
    type: 'error',
    delay: 5000,
  });
});

socketNoti.on('usersOnline', (data) => {
  const avatarUserElements = document.querySelectorAll(
    '[class*="avatar-user-"]',
  );
  const onlineUsersList = document.getElementById('online-users-list');
  const onlineCount = document.getElementById('online-count');
  onlineCount.textContent = data.length;
  onlineUsersList.innerHTML = '';
  // Kiểm tra và xử lý các phần tử tìm thấy
  avatarUserElements.forEach((element) => {
    element.classList.forEach((className) => {
      if (className.startsWith('avatar-user-')) {
        const userId = className.substring('avatar-user-'.length);
        if (data.includes(userId)) {
          element.classList.add('avatar-online');
        } else {
          element.classList.remove('avatar-online');
        }
      }
    });
  });
  data.forEach((user) => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <a class="dropdown-item text-primary" href="/users?search=${user._id}">
        ${user.name} (${user.email})
      </a>
    `;
    onlineUsersList.appendChild(listItem);
  });
});

function getUsersOnline() {
  socketNoti.emit('getUsersOnline');
}

socketNoti.on('notificationReceived', (data) => {
  appendNotifications(notificationsScroll, [data]);
  if (window.location.pathname === '/notifications') {
    appendNotifications(listNoti, [data]);
  }
  showToast({
    message: data.message,
    header: data.title,
    type: data.type,
    delay: 2000,
  });
  checkCountNotification(-1);
});

const requestLog = document.getElementById('requestLog');

socketNoti.on('logRequest', (data) => {
  if (requestLog) {
    requestLog.innerHTML += `<span style="color: gray;"> [${data.time}]</span> - <span style="color: ${ data.type == 'info' ? 'black' : data.type == 'warn' ? 'rgb(255, 187, 0)' : 'red'};">${data.text}</span><br>`;
    scrollToBottom();
  }
});

function scrollToBottom() {
  var logContainer = document.getElementById('logContainer');
  logContainer.scrollTop = logContainer.scrollHeight;
}
