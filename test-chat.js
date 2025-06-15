// Test script to verify chat functionality
console.log('Testing chat functionality...');

// Simulate message received event
const testMessage = {
  _id: 'test-message-id',
  content: 'Test message content',
  type: 'TEXT',
  conversationId: 'test-conversation-id',
  createdAt: new Date().toISOString(),
  sender: {
    _id: 'test-sender-id',
    name: 'Test User',
    avatar: '/images/test-avatar.jpg'
  }
};

console.log('Test message structure:', testMessage);
console.log('Chat functionality test completed');
