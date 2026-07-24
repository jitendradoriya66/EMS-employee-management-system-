import { useState, useEffect, useCallback } from 'react'
import {
  fetchConversations,
  fetchMessages,
  sendMessage as sendApiMessage,
  deleteMessage as deleteApiMessage,
  reactToMessage as reactApiMessage,
  markMessageRead as readApiMessage
} from '@/utils/communicationApi'
import { socketManager } from '@/utils/websocket'

export function useChat(activeConversationId: string | null) {
  const [conversations, setConversations] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const [onlineStatus, setOnlineStatus] = useState<'connected' | 'disconnected'>('disconnected')

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations()
      setConversations(data)
    } catch (e) {
      console.error('Failed to load conversations', e)
    }
  }, [])

  // Load messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true)
      const data = await fetchMessages({ conversation: conversationId })
      setMessages(data)
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
        created_at: new Date().toISOString()
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
  }, [activeConversationId, loadConversations])

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

  // Action: mark read
  const markRead = useCallback(async (messageId: string) => {
    try {
      await readApiMessage(messageId)
      // Notify WS
      if (activeConversationId) {
        socketManager.sendReadReceipt(activeConversationId, messageId)
      }
    } catch (e) {
      console.error('Failed to mark message as read', e)
    }
  }, [activeConversationId])

  // Setup WebSockets & subscriptions
  useEffect(() => {
    socketManager.connect()

    const unsubStatus = socketManager.on('status', (data) => {
      setOnlineStatus(data.status === 'connected' ? 'connected' : 'disconnected')
    })

    const unsubMsg = socketManager.on('message', (data) => {
      if (data.message && data.message.conversation === activeConversationId) {
        setMessages((prev) => {
          // Prevent duplicates if already added optimistically
          if (prev.some((m) => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })
      }
      loadConversations() // Update latest message logs on list
    })

    const unsubTyping = socketManager.on('typing', (data) => {
      if (data.conversation_id === activeConversationId) {
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

    return () => {
      unsubStatus()
      unsubMsg()
      unsubTyping()
      unsubReceipt()
    }
  }, [activeConversationId, loadConversations])

  // Retrieve messages when active convo changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId)
      setTypingUsers({})
    }
  }, [activeConversationId, loadMessages])

  // Initial load
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    messages,
    loading,
    typingUsers,
    onlineStatus,
    loadConversations,
    sendMessage,
    deleteMessage,
    reactToMessage,
    markRead
  }
}
