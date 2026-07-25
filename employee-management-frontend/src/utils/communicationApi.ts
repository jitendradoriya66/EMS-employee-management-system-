import apiClient from './apiClient'

// Conversations
export const fetchConversations = async (params?: any) => {
  const response = await apiClient.get('/api/v1/communication/conversations/', { params })
  return response.data.results || response.data
}

export const createConversation = async (payload: { type: 'direct' | 'group'; title?: string; description?: string; member_ids?: string[] }) => {
  const response = await apiClient.post('/api/v1/communication/conversations/', payload)
  return response.data
}

export const addGroupMember = async (conversationId: string, userId: string, role?: string) => {
  const response = await apiClient.post(`/api/v1/communication/conversations/${conversationId}/add_member/`, { user_id: userId, role })
  return response.data
}

export const removeGroupMember = async (conversationId: string, userId: string) => {
  const response = await apiClient.post(`/api/v1/communication/conversations/${conversationId}/remove_member/`, { user_id: userId })
  return response.data
}

export const leaveGroup = async (conversationId: string) => {
  const response = await apiClient.post(`/api/v1/communication/conversations/${conversationId}/leave/`)
  return response.data
}

export const muteGroupMember = async (conversationId: string, userId: string, durationMinutes?: number) => {
  const response = await apiClient.post(`/api/v1/communication/conversations/${conversationId}/mute_member/`, { user_id: userId, duration_minutes: durationMinutes })
  return response.data
}

export const archiveConversation = async (conversationId: string) => {
  const response = await apiClient.post(`/api/v1/communication/conversations/${conversationId}/archive/`)
  return response.data
}

// Messages
export const fetchMessages = async (params?: any) => {
  const response = await apiClient.get('/api/v1/communication/messages/', { params })
  return response.data.results || response.data
}

export const sendMessage = async (payload: { conversation: string; text?: string; file_path?: string; file_type?: string; reply_to?: string }) => {
  const response = await apiClient.post('/api/v1/communication/messages/', payload)
  return response.data
}

export const deleteMessage = async (messageId: string) => {
  const response = await apiClient.delete(`/api/v1/communication/messages/${messageId}/`)
  return response.data
}

export const reactToMessage = async (messageId: string, emoji: string) => {
  const response = await apiClient.post(`/api/v1/communication/messages/${messageId}/react/`, { emoji })
  return response.data
}

export const markMessageRead = async (messageId: string) => {
  const response = await apiClient.post(`/api/v1/communication/messages/${messageId}/mark_read/`)
  return response.data
}

// Calls
export const initiateCall = async (payload: { conversation: string; type: 'voice' | 'video' }) => {
  const response = await apiClient.post('/api/v1/communication/calls/', payload)
  return response.data
}

export const answerCall = async (callId: string) => {
  const response = await apiClient.post(`/api/v1/communication/calls/${callId}/answer/`)
  return response.data
}

export const rejectCall = async (callId: string) => {
  const response = await apiClient.post(`/api/v1/communication/calls/${callId}/reject/`)
  return response.data
}

export const endCall = async (callId: string) => {
  const response = await apiClient.post(`/api/v1/communication/calls/${callId}/end/`)
  return response.data
}

// Meetings
export const fetchMeetings = async (params?: any) => {
  const response = await apiClient.get('/api/v1/communication/meetings/', { params })
  return response.data.results || response.data
}

export const scheduleMeeting = async (payload: { title: string; description?: string; start_time: string; duration?: number; join_url?: string; invitee_ids?: string[] }) => {
  const response = await apiClient.post('/api/v1/communication/meetings/', payload)
  return response.data
}

export const joinMeeting = async (meetingId: string) => {
  const response = await apiClient.post(`/api/v1/communication/meetings/${meetingId}/join/`)
  return response.data
}

export const cancelMeeting = async (meetingId: string) => {
  const response = await apiClient.post(`/api/v1/communication/meetings/${meetingId}/cancel/`)
  return response.data
}

export const markConversationRead = async (conversationId: string) => {
  const response = await apiClient.post(`/api/v1/communication/conversations/${conversationId}/mark_read/`)
  return response.data
}

