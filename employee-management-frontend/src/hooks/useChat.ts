import { useState, useEffect, useCallback } from 'react'
import {
  fetchConversations,
  fetchMessages,
  sendMessage as sendApiMessage,
  deleteMessage as deleteApiMessage,
  reactToMessage as reactApiMessage,
  markConversationRead
} from '@/utils/communicationApi'
import { socketManager } from '@/utils/websocket'
import { useAuth } from '@/contexts/AuthContext'

export function useChat(activeConversationId: string | null) {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const [onlineStatus, setOnlineStatus] = useState<'connected' | 'disconnected'>('disconnected')
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({})

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations()
      setConversations(data)

      // Initialize online status map
      const initialOnline: Record<string, boolean> = {}
      data.forEach((c: any) => {
        c.members?.forEach((m: any) => {
          if (m.user?.email) {
            initialOnline[m.user.email.toLowerCase()] = m.is_online || false
          }
        })
      })
      setOnlineUsers((prev) => ({ ...prev, ...initialOnline }))
    } catch (e) {
      console.error('Failed to load conversations', e)
    }
  }, [])

  // Load messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true)
      const data = await fetchMessages({ conversation: conversationId })
      const sortedData = [...data].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
      setMessages(sortedData)
    } catch (e) {
      console.error('Failed to load messages', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Action: send message
  const sendMessage = useCallback(async (text?: string, filePath?: string, fileType?: string, replyTo?: string) => {
    if (!activeConversationId) return
    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`
      const optimisticMsg = {
        id: tempId,
        conversation: activeConversationId,
        text,
        file_path: filePath,
        file_type: fileType,
        reply_to: replyTo,
        is_pending: true,
        created_at: new Date().toISOString(),
        sender: { id: user?.id, name: user?.name || 'User' }
      }
      setMessages((prev) => [...prev, optimisticMsg])

      const realMsg = await sendApiMessage({
        conversation: activeConversationId,
        text,
        file_path: filePath,
        file_type: fileType,
        reply_to: replyTo
      })

      // Replace optimistic message with actual DB response
      setMessages((prev) => prev.map((m) => (m.id === tempId ? realMsg : m)))
      loadConversations() // reload to update latest message metadata
    } catch (e) {
      console.error('Failed to send message', e)
    }
  }, [activeConversationId, loadConversations, user])

  // Action: delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteApiMessage(messageId)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_deleted: true, text: 'This message was deleted', file_path: null, file_type: null }
            : m
        )
      )
    } catch (e) {
      console.error('Failed to delete message', e)
    }
  }, [])

  // Action: react to message
  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      await reactApiMessage(messageId, emoji)
      // Toggle reaction locally
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            const reactions = m.reactions || []
            const existingIdx = reactions.findIndex((r: any) => r.emoji === emoji)
            if (existingIdx > -1) {
              return { ...m, reactions: reactions.filter((_: any, idx: number) => idx !== existingIdx) }
            } else {
              return { ...m, reactions: [...reactions, { emoji }] }
            }
          }
          return m
        })
      )
    } catch (e) {
      console.error('Failed to react to message', e)
    }
  }, [])

  // Action: mark conversation read
  const markRead = useCallback(async (conversationId: string) => {
    try {
      await markConversationRead(conversationId)
      // Local state update: reset unread count of that conversation
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      )
    } catch (e) {
      console.error('Failed to mark conversation as read', e)
    }
  }, [])

  // Auto-mark conversation as read when active conversation ID changes
  useEffect(() => {
    if (activeConversationId) {
      markRead(activeConversationId)
    }
  }, [activeConversationId, markRead])

  // Auto-mark conversation as read when a new message arrives in active conversation
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      // Only mark read if the last message is from someone else and not pending
      if (lastMsg && lastMsg.sender?.id !== user?.id && !lastMsg.is_pending) {
        markRead(activeConversationId)
      }
    }
  }, [messages.length, activeConversationId, markRead, user?.id])

  // Setup WebSockets & subscriptions
  useEffect(() => {
    if (!isAuthenticated || !user) return

    socketManager.connect()

    const unsubStatus = socketManager.on('status', (data) => {
      setOnlineStatus(data.status === 'connected' ? 'connected' : 'disconnected')
    })

    const unsubMsg = socketManager.on('message', (data) => {
      const msgConvoId = typeof data.message?.conversation === 'object'
        ? String(data.message.conversation?.id)
        : String(data.message?.conversation)
      const currentConvoId = String(activeConversationId)
      
      console.log('[WebSocket] Message received:', {
        message: data.message,
        msgConvoId,
        currentConvoId,
        match: msgConvoId === currentConvoId
      })

      if (data.message && msgConvoId === currentConvoId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev
          
          // Replace matching pending optimistic message inline to prevent duplicates
          const pendingIdx = prev.findIndex((m) => 
            m.is_pending && 
            m.text === data.message.text && 
            String(m.sender?.id) === String(data.message.sender?.id)
          )
          if (pendingIdx > -1) {
            return prev.map((m, idx) => idx === pendingIdx ? data.message : m)
          }
          
          return [...prev, data.message]
        })
      }
      loadConversations() // Update latest message logs on list
    })

    const unsubConvo = socketManager.on('conversation_created', (data) => {
      console.log('[WebSocket] Conversation created event:', data)
      loadConversations()
    })

    const unsubTyping = socketManager.on('typing', (data) => {
      if (data.conversation_id === activeConversationId && String(data.user_id) !== String(user?.id)) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.user_name]: data.is_typing
        }))
      }
    })

    const unsubReceipt = socketManager.on('read_receipt', (data) => {
      if (data.conversation_id === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === data.message_id) {
              const receipts = m.receipts || []
              if (!receipts.some((r: any) => r.user?.id === data.user_id)) {
                return {
                  ...m,
                  receipts: [...receipts, { user: { id: data.user_id }, status: 'read' }]
                }
              }
            }
            return m
          })
        )
      }
    })

    const unsubReadAll = socketManager.on('read_all', (data) => {
      if (data.conversation_id === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender?.id !== data.user_id) {
              const receipts = m.receipts || []
              if (!receipts.some((r: any) => r.user?.id === data.user_id)) {
                return {
                  ...m,
                  receipts: [...receipts, { user: { id: data.user_id }, status: 'read' }]
                }
              }
            }
            return m
          })
        )
      }
    })

    const unsubPresence = socketManager.on('presence', (data) => {
      if (data.email) {
        setOnlineUsers((prev) => ({
          ...prev,
          [data.email.toLowerCase()]: data.is_online
        }))
      }
    })

    return () => {
      unsubStatus()
      unsubMsg()
      unsubConvo()
      unsubTyping()
      unsubReceipt()
      unsubReadAll()
      unsubPresence()
    }
  }, [activeConversationId, loadConversations, isAuthenticated, user])

  // Retrieve messages when active convo changes
  useEffect(() => {
    if (activeConversationId && isAuthenticated && user) {
      loadMessages(activeConversationId)
      setTypingUsers({})
    }
  }, [activeConversationId, loadMessages, isAuthenticated, user])

  // Initial load
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations()
    }
  }, [isAuthenticated, user, loadConversations])

  return {
    conversations,
    messages,
    loading,
    typingUsers,
    onlineStatus,
    onlineUsers,
    loadConversations,
    sendMessage,
    deleteMessage,
    reactToMessage,
    markRead
  }
}

