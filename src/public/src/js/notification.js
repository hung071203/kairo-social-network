// Notification system for admin panel
let notifications = [];
let currentPage = 1;
let hasMore = true;
let isLoading = false;
let socket = null;

// DOM elements
const notificationsList = document.querySelector('#notifications-scroll .list-group');
const countUnread = document.querySelector('.count-unread');
const notificationBadge = document.querySelector('.badge-notifications');

// Initialize notification system
document.addEventListener('DOMContentLoaded', function() {
    initializeSocket();
    loadNotifications();
    updateUnreadCount();
    
    // Setup infinite scroll
    const scrollContainer = document.querySelector('#notifications-scroll');
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', function() {
            if (this.scrollTop + this.clientHeight >= this.scrollHeight - 5) {
                loadNotifications();
            }
        });
    }
});

// Initialize Socket.IO connection
function initializeSocket() {
    if (typeof io !== 'undefined') {
        socket = io({
            transports: ['websocket'],
            withCredentials: true, // Gửi cookie cùng với kết nối
            autoConnect: true
        });
        
        setupSocketEvents();
    }
}

// Setup socket event listeners
function setupSocketEvents() {
    if (!socket) return;
    
    // Handle connection events
    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });
    
    socket.on('connected', (data) => {
        console.log('Authentication successful:', data);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        showErrorToast(error.message || 'Lỗi kết nối thông báo');
    });
    
    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });
    
    // Listen for notification events
    socket.on('notificationReceived', (data) => {
        console.log('New notification received:', data);
        handleNewNotification(data);
    });
    
    // Reconnection handling
    socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        // Refresh notifications after reconnection
        setTimeout(() => {
            loadNotifications();
            updateUnreadCount();
        }, 1000);
    });
    
    socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection failed:', error);
    });
}

// Handle new notification from socket
function handleNewNotification(data) {
    // Add new notification to the beginning
    notifications.unshift(data);
    
    // Update UI if notification list exists and is not showing empty state
    if (notificationsList && !notificationsList.querySelector('.text-center')) {
        const newElement = createNotificationElement(data);
        notificationsList.insertBefore(newElement, notificationsList.firstChild);
    } else if (notificationsList) {
        // Clear empty state and add notification
        notificationsList.innerHTML = '';
        const newElement = createNotificationElement(data);
        notificationsList.appendChild(newElement);
    }
    
    updateUnreadCount();
    
    // Show toast for new notification
    showToast({
        message: data.message,
        header: data.title || 'Thông báo mới',
        type: 'info',
        delay: 5000,
        url: data.redirectUrl
    });
}

// Load notifications
async function loadNotifications() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    
    try {
        const response = await fetch(`/notification?page=${currentPage}&limit=10`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load notifications');
        }
        
        const data = await response.json();
        const newNotifications = data.data?.docs || [];
        
        if (newNotifications.length < 10) {
            hasMore = false;
        }
        
        notifications = [...notifications, ...newNotifications];
        currentPage++;
        
        renderNotifications(newNotifications);
        
    } catch (error) {
        console.error('Error loading notifications:', error);
        showErrorToast('Không thể tải thông báo');
    } finally {
        isLoading = false;
    }
}

// Render notifications to DOM
function renderNotifications(newNotifications) {
    if (!notificationsList) return;
    
    newNotifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification);
        notificationsList.appendChild(notificationElement);
    });
    
    // Show empty state if no notifications
    if (notifications.length === 0) {
        showEmptyState();
    }
}

// Create notification element
function createNotificationElement(notification) {
    const li = document.createElement('li');
    li.className = `list-group-item list-group-item-action dropdown-notifications-item ${!notification.isRead ? 'mark-as-unread' : ''}`;
    li.setAttribute('data-id', notification._id);
      li.innerHTML = `
        <div class="d-flex notification-content" style="cursor: pointer;">
            <div class="flex-shrink-0 me-3">
                <div class="avatar">
                    <i class="${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)}"></i>
                </div>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${notification.title}</h6>
                        <p class="mb-1">${notification.message}</p>
                        <small class="text-muted">${getTimeAgo(notification.createdAt)}</small>
                    </div>
                    <div class="flex-shrink-0 dropdown-notifications-actions">
                        ${!notification.isRead ? '<span class="badge bg-primary rounded-pill badge-sm">Mới</span>' : ''}
                        <div class="dropdown-notifications-actions-btns">
                            <button class="btn btn-sm btn-icon btn-text-secondary rounded-pill dropdown-notifications-delete" 
                                    title="Xóa thông báo"
                                    style="z-index: 10; position: relative;">
                                <i class="bx bx-x"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add click handler for notification content
    const notificationContent = li.querySelector('.notification-content');
    notificationContent.addEventListener('click', (e) => {
        // Prevent event if clicking on delete button
        if (e.target.closest('.dropdown-notifications-delete')) {
            e.stopPropagation();
            return;
        }
        handleNotificationClick(notification);
    });
    
    // Add click handler for delete button
    const deleteButton = li.querySelector('.dropdown-notifications-delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            deleteNotification(notification._id, e);
        });
    }
    
    return li;
}

// Handle notification click
async function handleNotificationClick(notification) {
    try {
        // Always mark as read when clicked (if not already read)
        if (!notification.isRead) {
            await markAsReadSilent(notification._id);
        }
        
        // Redirect if URL exists
        if (notification.redirectUrl) {
            if (notification.redirectUrl.startsWith('http://') || notification.redirectUrl.startsWith('https://')) {
                window.open(notification.redirectUrl, '_blank');
            } else {
                window.location.href = notification.redirectUrl;
            }
        }
    } catch (error) {
        console.error('Error handling notification click:', error);
    }
}

// Mark notification as read silently (without showing toast)
async function markAsReadSilent(notificationId) {
    try {
        const response = await fetch(`/notification/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark as read');
        }
        
        // Update UI
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.classList.remove('mark-as-unread');
            const badge = notificationElement.querySelector('.badge');
            if (badge) badge.remove();
        }
        
        // Update notification in array
        const notification = notifications.find(n => n._id === notificationId);
        if (notification) {
            notification.isRead = true;
        }
        
        updateUnreadCount();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
        // Don't show error toast for silent operation
    }
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        const response = await fetch(`/notification/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark as read');
        }
        
        // Update UI
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.classList.remove('mark-as-unread');
            const badge = notificationElement.querySelector('.badge');
            if (badge) badge.remove();
        }
        
        // Update notification in array
        const notification = notifications.find(n => n._id === notificationId);
        if (notification) {
            notification.isRead = true;
        }
        
        updateUnreadCount();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
        showErrorToast('Không thể đánh dấu thông báo đã đọc');
    }
}

// Mark all notifications as read
async function markAllRead() {
    try {
        const response = await fetch('/notification/mark-all-read', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to mark all as read');
        }
        
        // Update UI
        document.querySelectorAll('.mark-as-unread').forEach(element => {
            element.classList.remove('mark-as-unread');
            const badge = element.querySelector('.badge');
            if (badge) badge.remove();
        });
        
        // Update notifications array
        notifications.forEach(notification => {
            notification.isRead = true;
        });
        
        updateUnreadCount();
        showSuccessToast('Đã đánh dấu tất cả thông báo là đã đọc');
        
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        showErrorToast('Không thể đánh dấu tất cả thông báo đã đọc');
    }
}

// Delete notification
async function deleteNotification(notificationId, event) {
    // Stop event propagation to prevent notification click
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
        return;
    }
    
    try {
        const response = await fetch(`/notification/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete notification');
        }
        
        // Remove from UI
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.remove();
        }
        
        // Remove from array
        const index = notifications.findIndex(n => n._id === notificationId);
        if (index !== -1) {
            notifications.splice(index, 1);
        }
        
        updateUnreadCount();
        
        // Show empty state if no notifications left
        if (notifications.length === 0) {
            showEmptyState();
        }
        
        showSuccessToast('Đã xóa thông báo');
        
    } catch (error) {
        console.error('Error deleting notification:', error);
        showErrorToast('Không thể xóa thông báo');
    }
}

// Update unread count
async function updateUnreadCount() {
    try {
        const response = await fetch('/notification/unread', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get unread count');
        }
        
        const data = await response.json();
        const unreadCount = data.data?.unread || 0;
        
        // Update badge
        if (countUnread) {
            countUnread.textContent = unreadCount;
        }
        
        // Show/hide notification badge
        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.style.display = 'block';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Error updating unread count:', error);
    }
}

// Show empty state
function showEmptyState() {
    if (!notificationsList) return;
    
    notificationsList.innerHTML = `
        <li class="list-group-item text-center py-4">
            <i class="bx bx-bell-off text-muted" style="font-size: 2rem;"></i>
            <p class="text-muted mt-2 mb-0">Không có thông báo nào</p>
        </li>
    `;
}

// Utility functions
function getNotificationIcon(type) {
    const icons = {
        'system': 'bx bx-cog',
        'message': 'bx bx-message',
        'follow': 'bx bx-user-plus',
        'like': 'bx bx-heart',
        'comment': 'bx bx-comment',
        'post': 'bx bx-file',
        'warning': 'bx bx-error-circle',
        'info': 'bx bx-info-circle',
        'success': 'bx bx-check-circle'
    };
    
    return icons[type] || 'bx bx-bell';
}

function getNotificationColor(type) {
    const colors = {
        'system': 'text-primary',
        'message': 'text-info',
        'follow': 'text-success',
        'like': 'text-danger',
        'comment': 'text-warning',
        'post': 'text-dark',
        'warning': 'text-warning',
        'info': 'text-info',
        'success': 'text-success'
    };
    
    return colors[type] || 'text-secondary';
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
}

// Toast helper functions
function showSuccessToast(message) {
    if (typeof showToast === 'function') {
        showToast({
            message: message,
            header: 'Thành công',
            type: 'success',
            delay: 3000
        });
    }
}

function showErrorToast(message) {
    if (typeof showToast === 'function') {
        showToast({
            message: message,
            header: 'Lỗi',
            type: 'error',
            delay: 5000
        });
    }
}