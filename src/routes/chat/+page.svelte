<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  
  // Chat state
  let conversations = $state([
    { id: '1', name: 'Emily Johnson', unread: 2, lastMessage: 'When is the science project due?', time: '10:45 AM', avatar: 'EJ', online: true },
    { id: '2', name: 'Michael Smith', unread: 0, lastMessage: 'I submitted my math homework', time: '9:30 AM', avatar: 'MS', online: false },
    { id: '3', name: 'Sarah Williams', unread: 1, lastMessage: 'Can we review the test questions?', time: 'Yesterday', avatar: 'SW', online: true },
    { id: '4', name: 'Math 101 Class', unread: 5, lastMessage: 'David: I have a question about problem #3', time: 'Yesterday', avatar: 'M1', isGroup: true, members: 24 },
    { id: '5', name: 'Science Team', unread: 0, lastMessage: 'You: Let\'s meet after school tomorrow', time: 'Monday', avatar: 'ST', isGroup: true, members: 8 },
    { id: '6', name: 'James Wilson', unread: 0, lastMessage: 'Thanks for the feedback!', time: 'Monday', avatar: 'JW', online: false },
    { id: '7', name: 'Parent Conference', unread: 0, lastMessage: 'You: Looking forward to meeting everyone', time: 'Last week', avatar: 'PC', isGroup: true, members: 15 }
  ]);
  
  let activeConversation = $state(conversations[0]);
  
  let messages = $state([
    { id: '1', sender: 'other', text: 'Good morning! I had a question about the science project.', time: '10:30 AM' },
    { id: '2', sender: 'me', text: 'Good morning, Emily! What would you like to know?', time: '10:32 AM' },
    { id: '3', sender: 'other', text: 'When is the final due date? I\'m a bit confused because the syllabus says next Friday but you mentioned next Monday in class.', time: '10:35 AM' },
    { id: '4', sender: 'me', text: 'The correct due date is next Monday. I\'ll update the syllabus to reflect that. Thanks for bringing this to my attention!', time: '10:38 AM' },
    { id: '5', sender: 'other', text: 'Great, thank you! One more question - do we need to include a bibliography for the research portion?', time: '10:40 AM' },
    { id: '6', sender: 'me', text: 'Yes, please include a bibliography with at least 3 sources. They should be properly formatted in MLA style.', time: '10:42 AM' },
    { id: '7', sender: 'other', text: 'When is the science project due?', time: '10:45 AM' }
  ]);
  
  let newMessage = $state('');
  let searchQuery = $state('');
  let showEmojiPicker = $state(false);
  let showAttachMenu = $state(false);
  
  // Filtered conversations
  let filteredConversations = $derived(
    searchQuery 
      ? conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : conversations
  );
  
  function sendMessage() {
    if (!newMessage.trim()) return;
    
    const message = {
      id: (messages.length + 1).toString(),
      sender: 'me',
      text: newMessage.trim(),
      time: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    };
    
    messages = [...messages, message];
    newMessage = '';
    
    // Update last message in conversation list
    conversations = conversations.map(c => 
      c.id === activeConversation.id 
        ? { ...c, lastMessage: `You: ${message.text}`, time: 'Just now', unread: 0 }
        : c
    );
    
    // Simulate reply after 2 seconds
    if (activeConversation.id === '1') {
      setTimeout(() => {
        const reply = {
          id: (messages.length + 1).toString(),
          sender: 'other',
          text: 'Thank you for the clarification! I\'ll make sure to include the bibliography.',
          time: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
        };
        
        messages = [...messages, reply];
        
        // Update conversation
        conversations = conversations.map(c => 
          c.id === activeConversation.id 
            ? { ...c, lastMessage: reply.text, time: 'Just now' }
            : c
        );
      }, 2000);
    }
  }
  
  function selectConversation(conversation) {
    activeConversation = conversation;
    
    // Mark as read
    conversations = conversations.map(c => 
      c.id === conversation.id 
        ? { ...c, unread: 0 }
        : c
    );
    
    // Reset UI states
    showEmojiPicker = false;
    showAttachMenu = false;
  }
  
  function addEmoji(emoji) {
    newMessage += emoji;
    showEmojiPicker = false;
  }
  
  // Common emojis
  const emojis = ['😊', '👍', '👏', '🎉', '👨‍🏫', '📚', '✏️', '📝', '🧪', '🔍', '⭐', '❤️'];
</script>

<div class="min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-highlight mb-2">Chat</h1>
      <p class="text-text-base">Communicate with students and classes</p>
    </div>
    
    <!-- Chat Interface -->
    <div class="card-dark p-0 overflow-hidden">
      <div class="flex h-[calc(100vh-12rem)]">
        <!-- Sidebar -->
        <div class="w-80 border-r border-border flex flex-col">
          <!-- Search -->
          <div class="p-4 border-b border-border">
            <div class="relative">
              <input 
                type="text" 
                bind:value={searchQuery}
                placeholder="Search conversations..."
                class="input w-full pl-10 py-2"
              />
              <svg class="w-5 h-5 text-muted absolute left-3 top-1/2 transform -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          
          <!-- Conversation List -->
          <div class="flex-1 overflow-y-auto">
            {#each filteredConversations as conversation}
              <button 
                class={`w-full text-left p-4 border-b border-border/50 hover:bg-surface/50 transition-colors flex items-center gap-3 ${activeConversation.id === conversation.id ? 'bg-purple-bg' : ''}`}
                onclick={() => selectConversation(conversation)}
              >
                <div class="relative">
                  <div class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium">
                    {conversation.avatar}
                  </div>
                  {#if conversation.online}
                    <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                  {/if}
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-center mb-1">
                    <div class="font-medium text-highlight truncate">
                      {conversation.name}
                      {#if conversation.isGroup}
                        <span class="text-xs text-text-base ml-1">({conversation.members})</span>
                      {/if}
                    </div>
                    <div class="text-xs text-text-base">{conversation.time}</div>
                  </div>
                  <div class="flex justify-between items-center">
                    <div class="text-sm text-text-base truncate">{conversation.lastMessage}</div>
                    {#if conversation.unread > 0}
                      <div class="bg-purple text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unread}
                      </div>
                    {/if}
                  </div>
                </div>
              </button>
            {/each}
            
            {#if filteredConversations.length === 0}
              <div class="p-4 text-center text-text-base">
                No conversations found
              </div>
            {/if}
          </div>
          
          <!-- New Chat Button -->
          <div class="p-4 border-t border-border">
            <button class="btn btn-primary w-full">
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
              New Chat
            </button>
          </div>
        </div>
        
        <!-- Chat Area -->
        <div class="flex-1 flex flex-col">
          <!-- Chat Header -->
          <div class="p-4 border-b border-border flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium">
                  {activeConversation.avatar}
                </div>
                {#if activeConversation.online}
                  <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                {/if}
              </div>
              
              <div>
                <div class="font-medium text-highlight">
                  {activeConversation.name}
                  {#if activeConversation.isGroup}
                    <span class="text-xs text-text-base ml-1">({activeConversation.members} members)</span>
                  {/if}
                </div>
                {#if activeConversation.online && !activeConversation.isGroup}
                  <div class="text-xs text-green-500">Online</div>
                {/if}
              </div>
            </div>
            
            <div class="flex gap-2">
              <button class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors" title="Call">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </button>
              <button class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors" title="Video">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </button>
              <button class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors" title="Info">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            {#each messages as message}
              <div class={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div class={`max-w-[70%] ${message.sender === 'me' ? 'bg-purple text-white' : 'bg-surface text-text-hover'} rounded-lg px-4 py-2 shadow-sm`}>
                  <div class="text-sm mb-1">{message.text}</div>
                  <div class="text-xs opacity-70 text-right">{message.time}</div>
                </div>
              </div>
            {/each}
          </div>
          
          <!-- Message Input -->
          <div class="p-4 border-t border-border">
            <div class="relative">
              <input 
                type="text" 
                bind:value={newMessage}
                placeholder="Type a message..."
                class="input w-full pr-24"
                on:keydown={(e) => e.key === 'Enter' && sendMessage()}
              />
              
              <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <div class="relative">
                  <button 
                    class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
                    onclick={() => showEmojiPicker = !showEmojiPicker}
                    title="Emoji"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                  </button>
                  
                  {#if showEmojiPicker}
                    <div class="absolute bottom-10 right-0 bg-card border border-border rounded-lg p-2 shadow-dropdown">
                      <div class="grid grid-cols-6 gap-1">
                        {#each emojis as emoji}
                          <button 
                            class="w-8 h-8 text-lg hover:bg-surface rounded"
                            onclick={() => addEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
                
                <div class="relative">
                  <button 
                    class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
                    onclick={() => showAttachMenu = !showAttachMenu}
                    title="Attach"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                  </button>
                  
                  {#if showAttachMenu}
                    <div class="absolute bottom-10 right-0 bg-card border border-border rounded-lg shadow-dropdown">
                      <div class="py-1">
                        <button class="flex items-center gap-2 px-4 py-2 hover:bg-surface w-full text-left">
                          <svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span class="text-text-hover">Image</span>
                        </button>
                        <button class="flex items-center gap-2 px-4 py-2 hover:bg-surface w-full text-left">
                          <svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <span class="text-text-hover">Document</span>
                        </button>
                        <button class="flex items-center gap-2 px-4 py-2 hover:bg-surface w-full text-left">
                          <svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                          </svg>
                          <span class="text-text-hover">Video</span>
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
                
                <button 
                  class="p-2 text-text-base hover:text-purple rounded-full hover:bg-surface transition-colors"
                  onclick={sendMessage}
                  disabled={!newMessage.trim()}
                  title="Send"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>