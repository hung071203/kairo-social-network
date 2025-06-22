let notifications = [];
let currentPageNoti = 1;
let hasMore = true;
let renderedIds = new Set(); // Track rendered notification IDs

// DOM elements
const btn = document.getElementById('notificationBtn');
const dropdown = document.getElementById('notificationDropdown');
const container = document.getElementById('notificationsList');
const tabs = document.querySelectorAll('.tab-btn');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const notificationBadge = document.getElementById('notificationBadge');
const allCount = document.getElementById('allCount');
const unreadCount = document.getElementById('unreadCount');

let currentTab = 'all';
let isLoadingNoti = false;

// Utility functions
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

function getNotificationIcon(type) {
  const icons = {
    FOLLOW: 'fas fa-user-plus',
    LIKE: 'fas fa-heart',
    COMMENT: 'fas fa-comment',
    SYSTEM: 'fas fa-cog',
    POST: 'fas fa-file-alt',
    REPORT: 'fas fa-exclamation-triangle',
    USER: 'fas fa-user',
  };
  return icons[type] || 'fas fa-bell';
}

function getNotificationColor(type) {
  const colors = {
    FOLLOW: 'text-green-400',
    LIKE: 'text-red-400',
    COMMENT: 'text-blue-400',
    SYSTEM: 'text-yellow-400',
    POST: 'text-purple-400',
    REPORT: 'text-orange-400',
    USER: 'text-gray-400',
  };
  return colors[type] || 'text-gray-400';
}

async function updateCounts() {
  try {
    const res = await fetch('/notification/unread');
    const data = await res.json();
    const total = data?.data?.total || 0;
    const unreadTotal = data?.data?.unread || 0;

    allCount.textContent = total;
    unreadCount.textContent = unreadTotal;
    notificationBadge.textContent = unreadTotal;

    if (unreadTotal === 0) {
      notificationBadge.style.display = 'none';
    } else {
      notificationBadge.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error updating counts:', error);
  }
}

// Toggle dropdown
btn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = dropdown.classList.contains('hidden');

  if (isHidden) {
    if (window.innerWidth <= 640) {
      dropdown.classList.add('dropdown-container');
      dropdown.style.position = 'fixed';
      dropdown.style.right = '8px';
      dropdown.style.left = '8px';
      dropdown.style.top = '60px';
      dropdown.style.width = 'auto';
    } else {
      dropdown.classList.remove('dropdown-container');
      dropdown.style.position = '';
      dropdown.style.right = '';
      dropdown.style.left = '';
      dropdown.style.top = '';
      dropdown.style.width = '';
    }

    dropdown.classList.remove('hidden');
    resetPagination();
    loadNotifications();
  } else {
    dropdown.classList.add('hidden');
  }
});

// Click outside to close
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

// Infinite scroll
dropdown.addEventListener('scroll', () => {
  if (isLoadingNoti || !hasMore) return;

  const { scrollTop, scrollHeight, clientHeight } = dropdown;
  if (scrollTop + clientHeight >= scrollHeight - 5) {
    loadNotifications();
  }
});

// Reset pagination when switching tabs
function resetPagination() {
  currentPageNoti = 1;
  notifications = [];
  hasMore = true;
  renderedIds.clear();
  container.innerHTML = '';
}

// Load notifications
async function loadNotifications() {
  if (isLoadingNoti) return;

  isLoadingNoti = true;
  if (currentPageNoti === 1) {
    showLoadingState();
  }

  try {
    const url =
      currentTab === 'all'
        ? `/notification?page=${currentPageNoti}&limit=10`
        : `/notification?page=${currentPageNoti}&limit=10&isRead=false`;
    const response = await fetch(url);
    const newNotifications = (await response.json()).data.docs || [];

    if (newNotifications.length < 10) {
      hasMore = false;
    }

    notifications = [...notifications, ...newNotifications];
    currentPageNoti++;

    if (currentPageNoti === 2) {
      hideLoadingState();
      renderNotifications(newNotifications);
    } else {
      appendNotifications(newNotifications);
    }
    updateCounts();
  } catch (error) {
    console.error('Error loading notifications:', error);
    hideLoadingState();
    showEmptyState();
  } finally {
    isLoadingNoti = false;
  }
}

function showLoadingState() {
  loadingState.classList.remove('hidden');
  container.classList.add('hidden');
  emptyState.classList.add('hidden');
}

function hideLoadingState() {
  loadingState.classList.add('hidden');
}

function showEmptyState() {
  emptyState.classList.remove('hidden');
  container.classList.add('hidden');
}

// Append new notifications
function appendNotifications(newNotifications) {
  const filteredNotifications =
    currentTab === 'all'
      ? newNotifications
      : newNotifications.filter((n) => !n.isRead);

  if (notifications.length === 0 && filteredNotifications.length === 0) {
    showEmptyState();
    return;
  }

  container.classList.remove('hidden');
  emptyState.classList.add('hidden');
  filteredNotifications.forEach((notification, index) => {
    if (renderedIds.has(notification._id)) return; // Skip if already rendered

    const item = document.createElement('div');
    item.className = `notification-item flex gap-3 items-start p-3 rounded-lg cursor-pointer transition-all ${
      !notification.isRead ? 'unread' : ''
    } mb-2`;
    item.dataset.id = notification._id;

    item.innerHTML = `
                            <div class="flex-shrink-0 pt-1">
                                <i class="${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)} text-lg"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-sm font-semibold text-white break-words">${notification.title}</h4>
                                        <p class="text-sm text-gray-300 mt-1 text-clamp-2">${notification.message}</p>
                                        <span class="text-xs text-gray-400 mt-1 block">${getTimeAgo(notification.createdAt)}</span>
                                    </div>
                                    <div class="flex items-center gap-1 flex-shrink-0">
                                        ${!notification.isRead ? '<div class="w-2 h-2 rounded-full bg-blue-500"></div>' : ''}
                                        <button class="delete-btn text-gray-400 opacity-0 hover:text-red-500 p-1 rounded transition-all" data-id="${notification._id}">
                                            <i class="fas fa-times text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      handleNotificationClick(notification);
    });

    item.addEventListener('mouseenter', () => {
      const deleteBtn = item.querySelector('.delete-btn');
      deleteBtn.classList.remove('opacity-0');
      deleteBtn.classList.add('opacity-100');
    });

    item.addEventListener('mouseleave', () => {
      const deleteBtn = item.querySelector('.delete-btn');
      deleteBtn.classList.add('opacity-0');
      deleteBtn.classList.remove('opacity-100');
    });

    container.appendChild(item);
    renderedIds.add(notification._id);
  });

  container.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      deleteNotification(id);
    });
  });
}

// Render notifications (for initial load or reset)
function renderNotifications(newNotifications) {
  container.innerHTML = '';
  renderedIds.clear();

  const filteredNotifications =
    currentTab === 'all'
      ? newNotifications
      : newNotifications.filter((n) => !n.isRead);

  if (filteredNotifications.length === 0) {
    showEmptyState();
    return;
  }

  appendNotifications(filteredNotifications);
}

// Handle notification click
function handleNotificationClick(notification) {
  if (!notification.isRead) {
    markAsRead(notification._id);
  }

  if (notification.redirectUrl) {
    window.location.href = notification.redirectUrl;
    dropdown.classList.add('hidden');
  }
}

// Mark notification as read
async function markAsRead(notificationId) {
  try {
    await fetch(`/notification/${notificationId}/read`, { method: 'PATCH' });

    const notification = notifications.find((n) => n._id === notificationId);
    if (notification) {
      notification.isRead = true;
      if (currentTab === 'unread') {
        // Remove from DOM if in unread tab
        const item = container.querySelector(`[data-id="${notificationId}"]`);
        if (item) item.remove();
        renderedIds.delete(notificationId);
        if (container.children.length === 0) showEmptyState();
      } else {
        // Update DOM to remove unread indicator
        const item = container.querySelector(`[data-id="${notificationId}"]`);
        if (item) {
          item.classList.remove('unread');
          const unreadDot = item.querySelector('.w-2.h-2');
          if (unreadDot) unreadDot.remove();
        }
      }
      updateCounts();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Delete notification
async function deleteNotification(notificationId) {
  try {
    await fetch(`/notification/${notificationId}`, { method: 'DELETE' });

    const index = notifications.findIndex((n) => n._id === notificationId);
    if (index !== -1) {
      notifications.splice(index, 1);
      const item = container.querySelector(`[data-id="${notificationId}"]`);
      if (item) item.remove();
      renderedIds.delete(notificationId);
      if (container.children.length === 0) showEmptyState();
      updateCounts();
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

// Tab handling
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const newTab = tab.dataset.tab;
    if (currentTab === newTab) return;

    currentTab = newTab;

    tabs.forEach((t) => {
      t.classList.remove('text-white', 'border-blue-500');
      t.classList.add('text-gray-400', 'border-transparent');
    });

    tab.classList.remove('text-gray-400', 'border-transparent');
    tab.classList.add('text-white', 'border-blue-500');

    resetPagination();
    loadNotifications();
  });
});

// Mark all as read
document.getElementById('markAllRead').addEventListener('click', async (e) => {
  e.preventDefault();

  try {
    await fetch('/notification/mark-all-read', { method: 'PATCH' });

    notifications.forEach((n) => (n.isRead = true));
    if (currentTab === 'unread') {
      container.innerHTML = '';
      renderedIds.clear();
      showEmptyState();
    } else {
      container.querySelectorAll('.notification-item').forEach((item) => {
        item.classList.remove('unread');
        const unreadDot = item.querySelector('.w-2.h-2');
        if (unreadDot) unreadDot.remove();
      });
    }
    updateCounts();
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
});

// Initialize
updateCounts();

// Kết nối với socketNoti server
const socketNoti = io(window.location.origin, {
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
    type: 'error',
    delay: 5000,
  });
});

socketNoti.on('notificationReceived', (data) => {
  console.log('Notification received:', data);
  showToast({
    message: `${data.title}: ${data.message}`,
    link: data.redirectUrl || null,
    type: 'info',
    delay: 5000,
  });

  // Add new notification to the start of the array
  notifications.unshift(data);

  // Update counts
  updateCounts();

  // Only prepend if dropdown is open and notification matches current tab
  if (!dropdown.classList.contains('hidden')) {
    if (currentTab === 'all' || (currentTab === 'unread' && !data.isRead)) {
      prependNotification(data);
    }
  }
});

// Prepend single notification to the top
function prependNotification(notification) {
  if (renderedIds.has(notification._id)) return; // Skip if already rendered

  const filteredNotifications =
    currentTab === 'all'
      ? [notification]
      : !notification.isRead
        ? [notification]
        : [];

  if (filteredNotifications.length === 0) return;

  container.classList.remove('hidden');
  emptyState.classList.add('hidden');

  const item = document.createElement('div');
  item.className = `notification-item flex gap-3 items-start p-3 rounded-lg cursor-pointer transition-all ${
    !notification.isRead ? 'unread' : ''
  } mb-2`;
  item.dataset.id = notification._id;

  item.innerHTML = `
            <div class="flex-shrink-0 pt-1">
                <i class="${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)} text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-white break-words">${notification.title}</h4>
                        <p class="text-sm text-gray-300 mt-1 text-clamp-2">${notification.message}</p>
                        <span class="text-xs text-gray-400 mt-1 block">${getTimeAgo(notification.createdAt)}</span>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        ${!notification.isRead ? '<div class="w-2 h-2 rounded-full bg-blue-500"></div>' : ''}
                        <button class="delete-btn text-gray-400 opacity-0 hover:text-red-500 p-1 rounded transition-all" data-id="${notification._id}">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

  item.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) return;
    handleNotificationClick(notification);
  });

  item.addEventListener('mouseenter', () => {
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.classList.remove('opacity-0');
    deleteBtn.classList.add('opacity-100');
  });

  item.addEventListener('mouseleave', () => {
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.classList.add('opacity-0');
    deleteBtn.classList.remove('opacity-100');
  });

  container.prepend(item); // Add to the top
  renderedIds.add(notification._id);

  // Add delete event listener
  item.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const id = e.target.closest('.delete-btn').dataset.id;
    deleteNotification(id);
  });

  // If container was previously empty, hide empty state
  if (container.children.length > 0) {
    emptyState.classList.add('hidden');
  }
}
