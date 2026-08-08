import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Users, UserPlus, Send, Plus, X, 
  Phone, Video, Calendar, FolderOpen, 
  Pin, Bell, Sparkles, 
  Paperclip, Mic, VideoOff, MicOff, PhoneOff, Hand,
  Eye, Download, Info, ArrowLeft, Search, Upload, FileText, Volume2, Smartphone, Radio
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/hooks/useEmployees'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Badge } from '@/components/common/Badge'
import { ModernPagination } from '@/components/common/ModernPagination'
import { useChat } from '@/hooks/useChat'
import { socketManager } from '@/utils/websocket'
import { useSearchParams } from 'react-router-dom'
import { UnifiedLoader } from '@/components/common/UnifiedLoader'
import {
  createConversation,
  scheduleMeeting,
  fetchMeetings,
  initiateCall,
  answerCall,
  rejectCall,
  endCall,
  addGroupMember
} from '@/utils/communicationApi'

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  text: string
  timestamp: string
  reactions?: string[]
  attachments?: { name: string; size: string; type: string }[]
}

export interface ChatGroup {
  id: string
  name: string
  description: string
  members: string[]
  createdAt: string
  isPinned?: boolean
}

interface MeetingItem {
  id: string
  title: string
  time: string
  date: string
  attendees: string[]
  joinUrl: string
}

export interface FileItem {
  id: string
  name: string
  size: string
  uploader: string
  uploadedAt: string
  type: 'image' | 'pdf' | 'doc'
}

export const TeamManagementPage: React.FC = () => {
  const { user, fetchUsers } = useAuth()
  const role = user?.role ?? 'employee'
  const isEmployee = role === 'employee'

  const { employees, loading: employeesLoading } = useEmployees()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentEmployee = useMemo(() => {
    return employees.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase())
  }, [employees, user?.email])

  const currentEmployeeId = currentEmployee?.id || 'temp'

  // Sub-Navigation Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'meetings' | 'files'>('dashboard')
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  useEffect(() => {
    const convoId = searchParams.get('conversation_id')
    if (convoId) {
      setActiveTab('chat')
      setActiveChatId(convoId)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])
  const [inputText, setInputText] = useState('')
  const [replyingTo, setReplyingTo] = useState<any>(null)

  const {
    conversations,
    messages: chatMessages,
    loading: messagesLoading,
    typingUsers: activeTypingUsers,
    onlineUsers,
    loadConversations,
    sendMessage: sendChatMessage,
    reactToMessage: reactChatEmoji
  } = useChat(activeChatId)

  // Map Backend Conversations to Frontend ChatGroups
  const groups = useMemo(() => {
    if (!Array.isArray(conversations)) return []
    return conversations.map(c => {
      const isDirect = c.type === 'direct'
      const otherMember = c.members?.find((m: any) => m.user?.id !== user?.id)
      const name = isDirect ? (otherMember?.user?.name || 'Private Chat') : (c.title || 'Group Chat')
      const description = isDirect ? (otherMember?.user?.email || 'Direct Message') : (c.description || 'Group Discussion')
      return {
        id: c.id,
        type: c.type,
        name,
        description,
        members: c.members?.map((m: any) => m.user?.id) || [],
        createdAt: c.created_at,
        isPinned: c.is_archived,
        unreadCount: c.unread_count || 0,
        lastMessageText: c.last_message ? c.last_message.text : '',
        lastMessageTime: c.last_message ? new Date(c.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      }
    })
  }, [conversations, user?.id])

  // Map Backend Messages for active chat
  const activeChatMessages = useMemo(() => {
    if (!Array.isArray(chatMessages)) return []
    return chatMessages.map((m: any) => ({
      id: m.id,
      senderId: m.sender?.id || 'temp',
      senderName: m.sender?.name || 'User',
      senderRole: m.sender?.role || 'employee',
      text: m.text || (m.file_path ? `Sent an attachment: ${m.file_path.split('/').pop()}` : ''),
      timestamp: m.created_at,
      reactions: (m.reactions?.map((r: any) => r.emoji) || []) as string[],
      filePath: m.file_path,
      fileType: m.file_type
    }))
  }, [chatMessages])

  // Mock messages lookup mapping compatibility
  const messages = useMemo(() => {
    if (!activeChatId) return {}
    return {
      [activeChatId]: activeChatMessages
    }
  }, [activeChatId, activeChatMessages])

  // Call State (Simulator)
  const [activeCall, setActiveCall] = useState<{
    id?: string
    type: 'voice' | 'video'
    status: 'ringing' | 'connected'
    partnerName: string
    duration: number
    isMuted: boolean
    isCameraOff: boolean
    isScreenSharing: boolean
    isHandRaised: boolean
    isIncoming?: boolean
    conversationId?: string
  } | null>(null)

  // Prevent body scrolling on laptop/desktop viewports
  useEffect(() => {
    const mainEl = document.querySelector('main')
    if (mainEl) {
      mainEl.classList.add('lg:overflow-hidden')
    }
    return () => {
      if (mainEl) {
        mainEl.classList.remove('lg:overflow-hidden')
      }
    }
  }, [])

  // Meeting Schedule State & Pagination
  const [meetings, setMeetings] = useState<MeetingItem[]>([])
  
  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const res = await fetchMeetings()
        if (Array.isArray(res)) {
          setMeetings(res.map((m: any) => ({
            id: m.id,
            title: m.title,
            time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(m.start_time).toISOString().slice(0, 10),
            attendees: m.attendances?.map((a: any) => a.user?.name) || [],
            joinUrl: m.join_url || '#'
          })))
        } else {
          setMeetings([])
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadMeetings()
  }, [activeTab])

  // Sound effects synthesiser using native Web Audio API
  const playSound = (type: 'outgoing' | 'incoming' | 'calling') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      if (type === 'outgoing') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.12)
      } else if (type === 'incoming') {
        // Double ring sound
        osc.type = 'sine'
        osc.frequency.setValueAtTime(480, audioCtx.currentTime)
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.4)
        gain.gain.setValueAtTime(0.01, audioCtx.currentTime + 0.45)
        
        osc.frequency.setValueAtTime(480, audioCtx.currentTime + 0.5)
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.5)
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.9)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.95)
        
        osc.start()
        osc.stop(audioCtx.currentTime + 1.0)
      } else if (type === 'calling') {
        // Slow outgoing calling sound
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, audioCtx.currentTime)
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 1.2)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.4)
        
        osc.start()
        osc.stop(audioCtx.currentTime + 1.45)
      }
    } catch (e) {
      console.warn(e)
    }
  }

  // Ringtone loop
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'ringing') return

    const playLoop = () => {
      if (activeCall.isIncoming) {
        playSound('incoming')
      } else {
        playSound('calling')
      }
    }

    playLoop()

    const intervalTime = activeCall.isIncoming ? 2000 : 3000
    const ringInterval = setInterval(playLoop, intervalTime)

    return () => {
      clearInterval(ringInterval)
    }
  }, [activeCall?.status, activeCall?.isIncoming])


  const files = useMemo(() => {
    return chatMessages
      .filter((m: any) => m.file_path)
      .map((m: any) => {
        const pathParts = m.file_path.split('/')
        const name = pathParts[pathParts.length - 1] || 'attachment'
        let ext = 'doc'
        if (name.endsWith('.pdf')) ext = 'pdf'
        else if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) ext = 'image'
        return {
          id: m.id,
          name,
          size: '1.2 MB',
          uploader: m.sender?.name || 'User',
          uploadedAt: new Date(m.created_at).toLocaleDateString(),
          type: ext as 'pdf' | 'doc' | 'image'
        }
      })
  }, [chatMessages])

  // Pagination states
  const [meetingPage, setMeetingPage] = useState(1)
  const [filePage, setFilePage] = useState(1)

  // Functional search & typing states
  const [searchQuery, setSearchQuery] = useState('')
  const typingUser = useMemo(() => {
    const typingNames = Object.keys(activeTypingUsers).filter(name => activeTypingUsers[name])
    return typingNames.length > 0 ? typingNames[0] : null
  }, [activeTypingUsers])

  // Modals & Panels Control
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [groupForm, setGroupForm] = useState({ name: '', description: '', members: [] as string[] })
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>('')
  const [meetingForm, setMeetingForm] = useState({ title: '', time: '11:00 AM', date: new Date().toISOString().slice(0, 10), attendees: [] as string[] })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const sessionId = useMemo(() => Math.random().toString(36).substring(2, 9), [])
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)

  // Queues & references to fix race conditions and stale closures
  const pendingSignalsRef = useRef<any[]>([])
  const pendingCandidatesRef = useRef<any[]>([])
  const activeCallRef = useRef<any>(null)
  const typingTimeoutRef = useRef<any>(null)
  const isTypingRef = useRef(false)

  const getFileDownloadUrl = (filePath: string) => {
    if (!filePath) return ''
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`
    return `${baseUrl}${cleanPath}`
  }

  const [audioOutput, setAudioOutput] = useState<'speaker' | 'earpiece'>('speaker')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)

  const toggleAudioOutput = async () => {
    const nextOutput = audioOutput === 'speaker' ? 'earpiece' : 'speaker'
    setAudioOutput(nextOutput)
    const audioEl = remoteAudioRef.current || remoteVideoRef.current
    if (audioEl && typeof (audioEl as any).setSinkId === 'function') {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
        let targetDevice = audioOutputs[0]
        if (nextOutput === 'earpiece') {
          const earpiece = audioOutputs.find(d => d.label.toLowerCase().includes('earpiece') || d.label.toLowerCase().includes('receiver') || d.label.toLowerCase().includes('phone'))
          if (earpiece) targetDevice = earpiece
        } else {
          const speaker = audioOutputs.find(d => d.label.toLowerCase().includes('speaker') || d.label.toLowerCase().includes('speakerphone') || d.label.toLowerCase().includes('audio out'))
          if (speaker) targetDevice = speaker
        }
        if (targetDevice) {
          await (audioEl as any).setSinkId(targetDevice.deviceId)
          console.log(`Audio output routed to: ${targetDevice.label}`)
        }
      } catch (err) {
        console.warn("Failed to set audio sink:", err)
      }
    }
  }

  const startScreenRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      recordedChunksRef.current = []
      const options = { mimeType: 'video/webm; codecs=vp9' }
      const recorder = new MediaRecorder(displayStream, options)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const file = new File([blob], `recording-${new Date().getTime()}.webm`, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        if (activeChatId) {
          await sendChatMessage(
            `Sent an attachment: ${file.name}`,
            `/media/uploads/${file.name}`,
            'video'
          )
        }
        displayStream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }
      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Failed to start screen recording:", err)
    }
  }

  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  useEffect(() => {
    activeCallRef.current = activeCall
  }, [activeCall])

  const processPendingSignals = async (pc: RTCPeerConnection) => {
    while (pendingSignalsRef.current.length > 0) {
      const data = pendingSignalsRef.current.shift()
      const { sdp, candidate } = data.signal_data || {}
      if (sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        if (sdp.type === 'offer') {
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socketManager.send({
            type: 'rtc_signal',
            conversation_id: activeCallRef.current?.conversationId || activeChatId,
            signal_data: { sdp: pc.localDescription, sessionId }
          })
          // Apply queued candidates
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift()
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand))
            } catch (e) {
              console.error("Error adding queued candidate:", e)
            }
          }
        }
      } else if (candidate) {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (e) {
            console.error("Error adding queued candidate:", e)
          }
        } else {
          pendingCandidatesRef.current.push(candidate)
        }
      }
    }
  }

  // WebRTC Connection Setup Effect
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall.type === 'video'
      }).then(stream => {
        localStreamRef.current = stream
        if (localVideoRef.current && activeCall.type === 'video') {
          localVideoRef.current.srcObject = stream
          localVideoRef.current.play().catch(err => console.error("Video play error:", err))
        }

        // Initialize RTCPeerConnection
        const iceServersJson = import.meta.env.VITE_ICE_SERVERS
        let iceServers = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
        if (iceServersJson) {
          try {
            iceServers = JSON.parse(iceServersJson)
          } catch (e) {
            console.error("Failed to parse VITE_ICE_SERVERS:", e)
          }
        }

        const pc = new RTCPeerConnection({ iceServers })
        peerConnectionRef.current = pc

        // Stream local tracks
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream)
        })

        // Handle remote stream tracks
        pc.ontrack = (event) => {
          const remoteStream = event.streams[0]
          remoteStreamRef.current = remoteStream
          if (activeCall.type === 'video' && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
            remoteVideoRef.current.play().catch(err => console.error("Remote video play error:", err))
          } else if (activeCall.type === 'voice' && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream
            remoteAudioRef.current.play().catch(err => console.error("Remote audio play error:", err))
          }
        }

        // Broadcast ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketManager.send({
              type: 'rtc_signal',
              conversation_id: activeCall.conversationId || activeChatId,
              signal_data: { candidate: event.candidate, sessionId }
            })
          }
        }

        pc.oniceconnectionstatechange = () => {
          console.log("ICE Connection State:", pc.iceConnectionState)
          if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            console.warn("ICE connection failed/disconnected.")
            setActiveCall(null)
          }
        }

        pc.onconnectionstatechange = () => {
          console.log("Connection State:", pc.connectionState)
          if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            console.warn("Connection failed/closed.")
            setActiveCall(null)
          }
        }

        // Process any queued signals
        processPendingSignals(pc)

        // If the initiator, create the offer SDP payload
        if (activeCall.isIncoming === false) {
          pc.createOffer().then(offer => {
            return pc.setLocalDescription(offer)
          }).then(() => {
            socketManager.send({
              type: 'rtc_signal',
              conversation_id: activeCall.conversationId || activeChatId,
              signal_data: { sdp: pc.localDescription, sessionId }
            })
          }).catch(err => console.error("Create offer error:", err))
        }
      }).catch(err => {
        console.error("Failed to access media devices:", err)
      })
    } else if (!activeCall) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => track.stop())
        remoteStreamRef.current = null
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }
      pendingSignalsRef.current = []
      pendingCandidatesRef.current = []
    }
  }, [activeCall?.id, activeCall?.status, activeCall?.type])

  // Listen to remote WebRTC signaling
  useEffect(() => {
    const unsubRtc = socketManager.on('rtc_signal', async (data: any) => {
      if (data.signal_data?.sessionId === sessionId) return
      const pc = peerConnectionRef.current
      if (pc) {
        const { sdp, candidate } = data.signal_data || {}
        if (sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
          if (sdp.type === 'offer') {
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socketManager.send({
              type: 'rtc_signal',
              conversation_id: activeCallRef.current?.conversationId || activeChatId,
              signal_data: { sdp: pc.localDescription, sessionId }
            })
            // Apply queued candidates
            while (pendingCandidatesRef.current.length > 0) {
              const cand = pendingCandidatesRef.current.shift()
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand))
              } catch (e) {
                console.error("Error adding queued candidate:", e)
              }
            }
          } else if (sdp.type === 'answer') {
            setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null)
          }
        } else if (candidate) {
          if (pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (e) {
              console.error("Error adding ice candidate:", e)
            }
          } else {
            pendingCandidatesRef.current.push(candidate)
          }
        }
      } else {
        pendingSignalsRef.current.push(data)
      }
    })
    return () => {
      unsubRtc()
    }
  }, [activeChatId, sessionId])

  // Call timer simulation
  useEffect(() => {
    let interval: any
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeCall?.status])



  const activeChatDetails = useMemo(() => {
    if (!activeChatId) return null
    return groups.find(g => g.id === activeChatId)
  }, [activeChatId, groups])

  // Filter contacts for DMs based on search query
  const dmPartners = useMemo(() => {
    const baseList = employees.filter(e => e.id !== currentEmployeeId)
      
    if (!searchQuery.trim()) return baseList
    return baseList.filter(emp => 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [employees, currentEmployeeId, searchQuery])

  // Filter channels based on search query
  const filteredGroups = useMemo(() => {
    const channels = groups.filter(g => g.type !== 'direct')
    if (!searchQuery.trim()) return channels
    return channels.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [groups, searchQuery])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return
    
    try {
      await sendChatMessage(
        `Sent an attachment: ${uploadedFile.name}`,
        `/media/uploads/${uploadedFile.name}`,
        uploadedFile.name.endsWith('.pdf') ? 'pdf' : 'doc'
      )
      playSound('outgoing')
    } catch (err) {
      console.error(err)
    }
  }

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeChatId])

  useEffect(() => {
    const unsubCall = socketManager.on('call', (data: any) => {
      if (data.call_data && String(data.call_data.host_id) !== String(user?.id)) {
        setActiveCall({
          id: String(data.call_data.id),
          type: data.call_data.type,
          status: 'ringing',
          partnerName: data.call_data.host_name,
          duration: 0,
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false,
          isHandRaised: false,
          isIncoming: true,
          conversationId: String(data.call_data.conversation_id)
        })
      }
    })

    const unsubAnswered = socketManager.on('call_answered', (data: any) => {
      if (activeCallRef.current && String(data.call_data.id) === String(activeCallRef.current.id)) {
        setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null)
        playSound('outgoing')
      }
    })

    const unsubRejected = socketManager.on('call_rejected', (data: any) => {
      if (activeCallRef.current && String(data.call_data.id) === String(activeCallRef.current.id)) {
        setActiveCall(null)
      }
    })

    const unsubEnded = socketManager.on('call_ended', (data: any) => {
      if (activeCallRef.current && String(data.call_data.id) === String(activeCallRef.current.id)) {
        setActiveCall(null)
      }
    })

    return () => {
      unsubCall()
      unsubAnswered()
      unsubRejected()
      unsubEnded()
    }
  }, [user?.id])


  const handleSendMessage = (textOverride?: string) => {
    const textToSend = textOverride || inputText
    if (!textToSend.trim() || !activeChatId) return
    sendChatMessage(textToSend, undefined, undefined, replyingTo?.id)
    setInputText('')
    setReplyingTo(null)
    playSound('outgoing')
  }

  const handleAddReaction = (msgId: string, emoji: string) => {
    reactChatEmoji(msgId, emoji)
  }

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) return
    try {
      const allUsers = await fetchUsers()
      const selectedEmails = groupForm.members.map(empId => {
        const emp = employees.find(e => e.id === empId)
        return emp?.email?.toLowerCase()
      }).filter(Boolean)

      const userIds = allUsers.filter((u: any) => 
        selectedEmails.includes(u.email?.toLowerCase())
      ).map((u: any) => u.id)

      await createConversation({
        type: 'group',
        title: groupForm.name,
        description: groupForm.description,
        member_ids: userIds
      })
      loadConversations()
      setShowCreateModal(false)
      setGroupForm({ name: '', description: '', members: [] })
    } catch (e) {
      console.error(e)
    }
  }

  const handleScheduleMeeting = async () => {
    if (!meetingForm.title.trim()) return
    try {
      const allUsers = await fetchUsers()
      const selectedEmails = meetingForm.attendees.map(empId => {
        const emp = employees.find(e => e.id === empId)
        return emp?.email?.toLowerCase()
      }).filter(Boolean)

      const userIds = allUsers.filter((u: any) => 
        selectedEmails.includes(u.email?.toLowerCase())
      ).map((u: any) => u.id)

      // Parse dates safely
      let timeStr = meetingForm.time
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        // Convert '10:00 AM' to 24h format
        const [time, modifier] = timeStr.split(' ')
        let [hours, minutes] = time.split(':')
        if (hours === '12') hours = '00'
        if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12)
        timeStr = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
      }
      const startTime = new Date(`${meetingForm.date}T${timeStr}`).toISOString()
      
      await scheduleMeeting({
        title: meetingForm.title,
        start_time: startTime,
        invitee_ids: userIds
      })
      
      const res = await fetchMeetings()
      if (Array.isArray(res)) {
        setMeetings(res.map((m: any) => ({
          id: m.id,
          title: m.title,
          time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(m.start_time).toISOString().slice(0, 10),
          attendees: m.attendances?.map((a: any) => a.user?.name) || [],
          joinUrl: m.join_url || '#'
        })))
      } else {
        setMeetings([])
      }
      setShowScheduleModal(false)
      setMeetingForm({ title: '', time: '11:00 AM', date: new Date().toISOString().slice(0, 10), attendees: [] })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDmPartnerClick = async (partnerEmployee: any) => {
    const partnerEmail = partnerEmployee.email
    const existingConv = Array.isArray(conversations) ? conversations.find(c => {
      if (c.type !== 'direct') return false
      const other = c.members?.find((m: any) => m.user?.email?.toLowerCase() === partnerEmail?.toLowerCase())
      return !!other
    }) : null

    if (existingConv) {
      setActiveTab('chat')
      setActiveChatId(existingConv.id)
    } else {
      try {
        const allUsers = await fetchUsers()
        const targetUser = allUsers.find((u: any) => u.email?.toLowerCase() === partnerEmail?.toLowerCase())
        if (targetUser) {
          const newConv = await createConversation({
            type: 'direct',
            member_ids: [targetUser.id]
          })
          loadConversations()
          setActiveTab('chat')
          setActiveChatId(newConv.id)
        }
      } catch (e) {
        console.error('Failed to start direct conversation', e)
      }
    }
  }

  const handleTriggerCall = async (type: 'voice' | 'video', partnerName: string) => {
    setActiveCall({
      type,
      status: 'ringing',
      partnerName,
      duration: 0,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isHandRaised: false,
      isIncoming: false,
      conversationId: activeChatId || undefined
    })

    playSound('calling')

    try {
      if (activeChatId) {
        const callObj = await initiateCall({
          conversation: activeChatId,
          type
        })
        if (callObj && callObj.id) {
          setActiveCall(prev => prev ? { ...prev, id: String(callObj.id) } : null)
        }
      }
    } catch (err) {
      console.error('Failed to register call on backend:', err)
    }
    }

  const meetingsPerPage = 4
  const paginatedMeetings = meetings.slice((meetingPage - 1) * meetingsPerPage, meetingPage * meetingsPerPage)
  const totalMeetingPages = Math.ceil(meetings.length / meetingsPerPage)

  const filesPerPage = 6
  const paginatedFiles = files.slice((filePage - 1) * filesPerPage, filePage * filesPerPage)
  const totalFilePages = Math.ceil(files.length / filesPerPage)

  useEffect(() => {
    const isMobileChatOpen = activeTab === 'chat' && activeChatId && window.innerWidth < 1024
    if (isMobileChatOpen) {
      document.body.classList.add('mobile-chat-active')
    } else {
      document.body.classList.remove('mobile-chat-active')
    }
    return () => {
      document.body.classList.remove('mobile-chat-active')
    }
  }, [activeTab, activeChatId])

  const totalUnreadMessages = useMemo(() => {
    return Array.isArray(conversations) ? conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) : 0
  }, [conversations])

  const totalOnlineColleagues = useMemo(() => {
    return Object.values(onlineUsers).filter(Boolean).length
  }, [onlineUsers])

  const totalTodayMeetings = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    return meetings.filter(m => m.date === todayStr).length
  }, [meetings])

  const totalSharedAssets = useMemo(() => {
    return files.length
  }, [files])

  if (employeesLoading) {
    return <UnifiedLoader message="Loading workspace team portal..." />
  }

  return (
    <div className={`flex flex-col lg:flex-row h-[100dvh] lg:h-[calc(100vh-140px)] gap-md relative overflow-hidden bg-background text-text-primary ${
      activeTab === 'chat' && activeChatId ? 'fixed inset-0 z-50 m-0 pb-0 rounded-none' : 'pb-16 lg:pb-0'
    }`}>
      {/* Persistent Left Sidebar */}
      <div className={`w-full lg:w-80 h-[calc(100dvh-6rem)] mb-4 lg:h-auto lg:mb-0 flex flex-col rounded-2xl lg:rounded-3xl border border-border bg-card p-md shadow-sm no-print ${
        activeTab === 'chat' && !activeChatId ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Workspace Title & Search */}
        <div className="flex items-center justify-between gap-sm mb-md px-sm">
          <div className="flex items-center gap-xs">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm">
              TC
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-text-primary">Workspace Hub</p>
              <p className="text-[10px] text-text-secondary mt-0.5">Enterprise Suite</p>
            </div>
          </div>
          <Badge variant="primary">v2.1</Badge>
        </div>

        {/* Global Tab Navigation */}
        <div className="hidden lg:grid grid-cols-4 gap-xs p-xs rounded-xl bg-background border border-border/50 mb-md">
          {[
            { id: 'dashboard', label: 'Home', icon: Sparkles },
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'meetings', label: 'Meetings', icon: Calendar },
            { id: 'files', label: 'Files', icon: FolderOpen }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                title={tab.label}
                className={`flex flex-col items-center gap-xs py-sm rounded-lg transition-all ${
                  isActive 
                    ? 'bg-card text-primary shadow-sm border border-border/50' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-200/55 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            )
          })}
        </div>        {/* Workspace Search Input */}
        <div className="mb-md relative">
          <input
            type="text"
            placeholder="Search channels or DMs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-border bg-background px-md py-sm pl-8 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
          />
          <Search className="h-3.5 w-3.5 text-text-secondary absolute left-3 top-2.5" />
        </div>

        {/* Channels/Active list for Sidebar */}
        <div className="flex-1 overflow-y-auto space-y-md pr-xs scrollbar-thin">
          {/* pinned channels */}
          <div className="space-y-sm">
            <div className="flex items-center justify-between px-xs">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Channels</p>
              {!isEmployee && (
                <button onClick={() => setShowCreateModal(true)} className="text-primary hover:text-primary-600 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-xs">
              {filteredGroups.map(g => (
                <div
                  key={g.id}
                  onClick={() => {
                    setActiveTab('chat')
                    setActiveChatId(g.id)
                  }}
                  className={`flex items-center justify-between p-sm rounded-xl cursor-pointer transition-all duration-200 group border ${
                    activeChatId === g.id && activeTab === 'chat'
                      ? 'bg-primary/20 border-primary/30'
                      : 'hover:bg-background border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-sm min-w-0 flex-1">
                    <div className="rounded-lg bg-primary-100 dark:bg-primary-900/40 p-xs text-primary shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-xs">
                        <p className="text-sm font-semibold text-text-primary truncate">{g.name}</p>
                        {g.lastMessageTime && <span className="text-[9px] text-text-secondary">{g.lastMessageTime}</span>}
                      </div>
                      <p className="text-[10px] text-text-secondary truncate">
                        {g.lastMessageText || g.description || 'General Discussion'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-xs shrink-0 pl-sm">
                    {g.unreadCount > 0 && (
                      <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                        {g.unreadCount}
                      </span>
                    )}
                    {g.isPinned && <Pin className="h-3 w-3 text-text-secondary" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DMs Section */}
          <div className="space-y-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Direct Messages</p>
            <div className="space-y-xs">
              {dmPartners.map(emp => {
                const empConv = conversations.find(c => {
                  if (c.type !== 'direct') return false
                  return c.members?.some((m: any) => m.user?.email?.toLowerCase() === emp.email?.toLowerCase())
                })
                const unreadCount = empConv ? (empConv.unread_count || 0) : 0
                const lastMsgText = empConv && empConv.last_message ? empConv.last_message.text : ''
                const lastMsgTime = empConv && empConv.last_message 
                  ? new Date(empConv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : ''
                const isOnline = onlineUsers[emp.email?.toLowerCase()] || false
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleDmPartnerClick(emp)}
                    className={`flex items-center justify-between p-sm rounded-xl cursor-pointer transition-all duration-200 border ${
                      activeChatId === empConv?.id && activeTab === 'chat'
                        ? 'bg-primary/20 border-primary/30'
                        : 'hover:bg-background border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-sm min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-text-primary text-xs font-bold relative shrink-0">
                        {(emp.firstName?.[0] || '').toUpperCase()}{(emp.lastName?.[0] || '').toUpperCase()}
                        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-xs">
                          <p className="text-sm font-semibold text-text-primary truncate">{emp.firstName} {emp.lastName}</p>
                          {lastMsgTime && <span className="text-[9px] text-text-secondary">{lastMsgTime}</span>}
                        </div>
                        <p className="text-[10px] text-text-secondary truncate">
                          {lastMsgText || `${emp.position} • ${emp.department}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-xs shrink-0 pl-sm">
                      {unreadCount > 0 && (
                        <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className={`flex-1 flex flex-col overflow-hidden relative ${
        activeTab === 'chat' && activeChatId === null ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Dynamic Navigation rendering */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-sm sm:p-lg space-y-sm sm:space-y-lg"
            >
              {/* Welcome Card */}
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 p-md sm:p-xl text-white shadow-lg">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                <div className="max-w-xl space-y-sm">
                  <div className="inline-flex items-center gap-sm rounded-full bg-white/10 px-md py-xs text-xs font-semibold text-cyan-300">
                    <Sparkles className="h-4 w-4" />
                    Premium Collaboration Module
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black">Welcome back, {user?.name || 'Developer'}!</h2>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Connect with colleagues in real-time, sync with project requirements, schedule sprint calls, and manage docs inside our team terminal.
                  </p>
                </div>
              </div>

              {/* Status and quick grid stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
                {[
                  { label: 'Unread Messages', value: `${totalUnreadMessages} alerts`, icon: Bell, tone: 'text-primary bg-primary-50 dark:bg-primary-900/10' },
                  { label: 'Online Colleagues', value: `${totalOnlineColleagues} online`, icon: Users, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
                  { label: 'Scheduled Meetings', value: `${totalTodayMeetings} today`, icon: Calendar, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
                  { label: 'Shared Media Assets', value: `${totalSharedAssets} assets`, icon: FolderOpen, tone: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20' }
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <div key={i} className="card p-md flex items-center justify-between border border-border bg-card shadow-sm hover:scale-[1.01] transition-transform">
                      <div>
                        <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{stat.label}</p>
                        <p className="text-lg font-bold text-text-primary mt-sm">{stat.value}</p>
                      </div>
                      <div className={`p-sm rounded-xl ${stat.tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Meetings Sync */}
              <div className="card p-sm sm:p-lg space-y-sm sm:space-y-md border border-border bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
                  <div>
                    <h3 className="text-md font-bold text-text-primary">Today's Meeting Syncs</h3>
                    <p className="text-xs text-text-secondary">Low latency voice/video standups</p>
                  </div>
                  {!isEmployee && (
                    <Button variant="secondary" onClick={() => setShowScheduleModal(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-xs" />
                      Schedule
                    </Button>
                  )}
                </div>

                <div className="space-y-sm">
                  {meetings.slice(0, 2).map(meet => (
                    <div key={meet.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md p-md border border-border rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
                      <div className="flex gap-sm items-center min-w-0">
                        <div className="p-xs bg-primary-100 dark:bg-primary-900/40 text-primary rounded-xl shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{meet.title}</p>
                          <p className="text-xs text-text-secondary">{meet.time}</p>
                        </div>
                      </div>
                      <Button variant="primary" onClick={() => handleTriggerCall('video', 'Tech Sprint Group')} className="w-full sm:w-auto gap-sm justify-center">
                        <Video className="h-4 w-4" />
                        Join Call
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              {activeChatId ? (
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Column Chat Stream */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-lg py-md">
                      <div className="flex items-center gap-sm min-w-0">
                        <Button 
                          variant="ghost" 
                          onClick={() => setActiveChatId(null)} 
                          className="lg:hidden p-xs mr-xs shrink-0"
                        >
                          <ArrowLeft className="h-5 w-5 text-text-primary" />
                        </Button>
                        <div className="min-w-0">
                          <h4 className="text-md font-bold text-text-primary truncate">{activeChatDetails?.name}</h4>
                          <p className="text-xs text-text-secondary truncate mt-xs">{activeChatDetails?.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-sm">
                        <Button variant="ghost" onClick={() => handleTriggerCall('voice', activeChatDetails?.name || 'Call')} className="p-xs">
                          <Phone className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" onClick={() => handleTriggerCall('video', activeChatDetails?.name || 'Call')} className="p-xs">
                          <Video className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" onClick={() => setShowRightPanel(!showRightPanel)} className="p-xs">
                          <Info className="h-4 w-4 text-text-secondary" />
                        </Button>
                      </div>
                    </div>

                    {/* Message list */}
                    <div className={`flex-1 overflow-x-hidden ${
                      (messages[activeChatId] || []).length === 0 && !messagesLoading ? 'overflow-y-hidden' : 'overflow-y-auto'
                    } p-lg space-y-md scrollbar-thin`}>
                      {messagesLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className={`flex items-start gap-sm max-w-lg ${i % 2 === 0 ? '' : 'ml-auto flex-row-reverse'}`}>
                            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                            <div className="space-y-xs min-w-[120px]">
                              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                              <div className="h-12 w-[240px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
                            </div>
                          </div>
                        ))
                      ) : (messages[activeChatId] || []).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-lg">
                          <MessageSquare className="h-12 w-12 text-text-secondary mb-sm animate-bounce" />
                          <p className="text-sm font-semibold text-text-primary">No messages yet</p>
                          <p className="text-xs text-text-secondary mt-xs">Send a message to start the conversation!</p>
                        </div>
                      ) : (
                        (messages[activeChatId] || []).map((msg) => {
                          const isMyMessage = String(msg.senderId) === String(user?.id)
                          return (
                            <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className="group relative max-w-[85%] md:max-w-[75%]">
                                {/* Reactions drawer */}
                                <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-lg rounded-full border border-border px-xs py-0.5 flex gap-1 z-10">
                                  {['👍', '🔥', '🎉', '❤️'].map(emoji => (
                                    <button 
                                      key={emoji} 
                                      onClick={() => handleAddReaction(msg.id, emoji)}
                                      className="hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <button onClick={() => setReplyingTo(msg)} className="hover:scale-125 transition-transform ml-1 text-text-secondary hover:text-primary">
                                    <MessageSquare className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className={`p-md rounded-2xl border ${
                                  isMyMessage 
                                    ? 'bg-primary text-white border-primary-600 rounded-tr-none' 
                                    : 'bg-card text-text-primary border-border rounded-tl-none'
                                }`}>
                                  {!isMyMessage && (
                                    <div className="text-[10px] font-bold text-primary mb-xs">
                                      {msg.senderName} ({msg.senderRole.replace('_', ' ')})
                                    </div>
                                  )}
                                  {msg.filePath ? (
                                    <div className="mt-sm p-sm rounded-xl bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between gap-md min-w-[200px] max-w-full">
                                      <div className="flex items-center gap-sm min-w-0">
                                        <div className={`p-xs rounded-lg shrink-0 ${isMyMessage ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'}`}>
                                          <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className={`text-xs font-bold truncate ${isMyMessage ? 'text-white' : 'text-text-primary'}`}>
                                            {msg.text.replace('Sent an attachment: ', '')}
                                          </p>
                                          <p className={`text-[10px] ${isMyMessage ? 'text-white/60' : 'text-text-secondary'}`}>
                                            Attachment
                                          </p>
                                        </div>
                                      </div>
                                      <a
                                        href={getFileDownloadUrl(msg.filePath)}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-xs rounded-lg hover:bg-black/10 dark:hover:bg-white/10 shrink-0 transition-colors ${
                                          isMyMessage ? 'text-white' : 'text-primary'
                                        }`}
                                      >
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </div>
                                  ) : (
                                    <p className="text-sm break-words leading-relaxed">{msg.text}</p>
                                  )}
                                  
                                  {msg.reactions && msg.reactions.length > 0 && (
                                    <div className="flex flex-wrap gap-xs mt-sm">
                                      {Array.from(new Set(msg.reactions)).map((emoji: string) => (
                                        <span key={emoji} className="inline-flex items-center gap-xs rounded-full bg-slate-100 dark:bg-slate-800 px-sm py-0.5 text-[10px] text-text-secondary border border-border">
                                          {emoji} {msg.reactions?.filter((r: string) => r === emoji).length}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <p className={`text-[9px] mt-xs text-right ${isMyMessage ? 'text-white/70' : 'text-text-secondary'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                      {typingUser && (
                        <div className="flex items-center gap-xs text-xs text-text-secondary italic bg-background/40 backdrop-blur-sm rounded-xl px-md py-sm border border-border/40 w-fit max-w-[70%] animate-pulse">
                          <div className="flex gap-0.5 mr-xs shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce" />
                            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-text-secondary animate-bounce [animation-delay:0.4s]" />
                          </div>
                          <span>{typingUser} is typing...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat composer */}
                    <div className="flex-shrink-0 border-t border-border bg-card flex flex-col no-print">
                      {replyingTo && (
                        <div className="px-md py-sm bg-background border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1 h-full bg-primary rounded-full"></div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-primary truncate">Replying to {replyingTo.senderName}</p>
                              <p className="text-xs text-text-secondary truncate">{replyingTo.text}</p>
                            </div>
                          </div>
                          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
                            <X className="h-4 w-4 text-text-secondary" />
                          </button>
                        </div>
                      )}
                      <div className="p-md flex gap-sm items-center">
                        <input
                          type="file"
                          ref={chatFileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button 
                          variant="ghost" 
                          onClick={() => chatFileInputRef.current?.click()} 
                          className="p-xs text-text-secondary shrink-0"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <input
                        type="text"
                        placeholder="Type your message here..."
                        value={inputText}
                        onChange={e => {
                          setInputText(e.target.value)
                          if (activeChatId) {
                            if (!isTypingRef.current) {
                              isTypingRef.current = true
                              socketManager.sendTyping(activeChatId, true)
                            }
                            if (typingTimeoutRef.current) {
                              clearTimeout(typingTimeoutRef.current)
                            }
                            typingTimeoutRef.current = setTimeout(() => {
                              isTypingRef.current = false
                              socketManager.sendTyping(activeChatId, false)
                            }, 2000)
                          }
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }}
                        className="flex-1 min-w-0 rounded-xl border border-border bg-background px-md py-sm text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                      <Button variant="primary" className="p-sm rounded-xl shrink-0" onClick={() => handleSendMessage()}>
                        <Send className="h-4 w-4" />
                      </Button>
                      </div>
                    </div>
                  </div>

                  {/* Context Right drawer */}
                  {showRightPanel && (
                    <div className="w-72 border-l border-border bg-card/40 backdrop-blur-md p-md flex flex-col gap-lg overflow-y-auto no-print hidden xl:flex">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-sm">Channel Information</h4>
                        <p className="text-sm font-semibold text-text-primary">{activeChatDetails?.name}</p>
                        <p className="text-xs text-text-secondary mt-xs">{activeChatDetails?.description}</p>
                      </div>

                      <div className="border-t border-border pt-md">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-sm">Media Shared</h4>
                        {files.length === 0 ? (
                          <p className="text-xs text-text-secondary italic">No media shared yet</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-xs max-h-40 overflow-y-auto">
                            {files.map((file: any) => {
                              const fileObj = chatMessages.find((m: any) => m.id === file.id)
                              const path = fileObj?.file_path || file.name
                              const downloadUrl = getFileDownloadUrl(path)
                              const isImage = file.type === 'image' || path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')
                              return (
                                <a 
                                  key={file.id}
                                  href={downloadUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={file.name}
                                  className="aspect-square bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex flex-col items-center justify-center p-xs text-center border border-border transition-colors cursor-pointer group overflow-hidden relative"
                                >
                                  {isImage ? (
                                    <img 
                                      src={downloadUrl} 
                                      alt={file.name} 
                                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                  ) : (
                                    <>
                                      <FileText className="h-5 w-5 text-primary mb-xs" />
                                      <span className="text-[8px] text-text-secondary font-semibold truncate max-w-full px-xs">{file.name}</span>
                                    </>
                                  )}
                                </a>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {activeChatDetails && activeChatDetails.type !== 'direct' && (
                        <div className="border-t border-border pt-md space-y-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Channel Members</h4>
                          <div className="space-y-xs max-h-40 overflow-y-auto">
                            {activeChatDetails.members?.map((member: any) => {
                              const email = member.user?.email
                              const emp = employees.find(e => e.email?.toLowerCase() === email?.toLowerCase())
                              if (!emp) return null
                              return (
                                <div key={member.id} className="flex items-center justify-between text-xs p-1">
                                  <span className="font-semibold text-text-primary">{emp.firstName} {emp.lastName}</span>
                                  <span className="text-[10px] text-text-secondary">{emp.department || 'Employee'}</span>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Add Member form for Admin/HR */}
                          {!isEmployee && (
                            <div className="flex gap-xs items-center pt-xs">
                              <select
                                value={selectedMemberToAdd}
                                onChange={e => setSelectedMemberToAdd(e.target.value)}
                                className="flex-1 text-xs rounded-lg border border-border bg-background px-sm py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                              >
                                <option value="">Add member...</option>
                                {employees
                                  .filter(emp => !activeChatDetails.members?.some((m: any) => m.user?.email?.toLowerCase() === emp.email?.toLowerCase()))
                                  .map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.firstName} {emp.lastName}
                                    </option>
                                  ))}
                              </select>
                              <Button
                                variant="primary"
                                className="py-1 px-sm rounded-lg text-xs"
                                onClick={async () => {
                                  if (!selectedMemberToAdd || !activeChatId) return
                                  try {
                                    const allUsers = await fetchUsers()
                                    const emp = employees.find(e => e.id === selectedMemberToAdd)
                                    const targetUser = allUsers.find((u: any) => u.email?.toLowerCase() === emp?.email?.toLowerCase())
                                    if (targetUser) {
                                      await addGroupMember(activeChatId, targetUser.id)
                                      loadConversations()
                                      setSelectedMemberToAdd('')
                                    }
                                  } catch (err) {
                                    console.error('Failed to add member:', err)
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="border-t border-border pt-md">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-sm">Pinned Messages</h4>
                        <div className="p-sm bg-background border border-border rounded-xl text-xs text-text-secondary">
                          "Standup shifted to 10:15 AM today."
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-xl">
                  <MessageSquare className="h-16 w-16 text-text-secondary mb-md animate-pulse" />
                  <h4 className="text-lg font-bold text-text-primary">Select a workspace chat</h4>
                  <p className="text-sm text-text-secondary mt-xs max-w-sm">Pick a channel or a team member from the sidebar to begin collaborating.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'meetings' && (
            <motion.div 
              key="meetings" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-sm sm:p-lg space-y-sm sm:space-y-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Interactive Meeting Schedule</h2>
                  <p className="text-sm text-text-secondary">Plan sprint discussions and standups</p>
                </div>
                {!isEmployee && (
                  <Button variant="primary" onClick={() => setShowScheduleModal(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-xs" />
                    Schedule Meeting
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {paginatedMeetings.map(meet => (
                  <div key={meet.id} className="card p-md border border-border bg-card rounded-2xl flex flex-col justify-between">
                    <div className="space-y-sm">
                      <div className="flex items-center gap-xs">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="text-xs font-semibold text-text-secondary">{meet.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary">{meet.title}</h4>
                      <p className="text-xs text-text-secondary">{meet.time}</p>
                    </div>
                    <div className="mt-lg pt-md border-t border-border flex justify-between items-center">
                      <span className="text-xs text-text-secondary">{meet.attendees.length} participants</span>
                      <Button variant="secondary" onClick={() => handleTriggerCall('video', meet.title)} className="gap-sm">
                        <Video className="h-4 w-4" />
                        Join Meet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalMeetingPages > 1 && (
                <div className="pt-md border-t border-border flex justify-center">
                  <ModernPagination
                    currentPage={meetingPage}
                    totalPages={totalMeetingPages}
                    onPageChange={setMeetingPage}
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div 
              key="files" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-sm sm:p-lg space-y-sm sm:space-y-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Shared Team Files</h2>
                  <p className="text-sm text-text-secondary">Manage collaborative documents and mockups</p>
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="primary" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full sm:w-auto gap-sm justify-center"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md">
                {paginatedFiles.map(file => (
                  <div key={file.id} className="card p-md border border-border bg-card rounded-2xl flex flex-col justify-between">
                    <div className="flex gap-sm items-start">
                      <div className="p-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-primary">
                        <FolderOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary truncate max-w-[150px]">{file.name}</p>
                        <p className="text-[10px] text-text-secondary">{file.size} • by {file.uploader}</p>
                      </div>
                    </div>
                    <div className="mt-md pt-md border-t border-border flex justify-end gap-sm">
                      <a
                        href={getFileDownloadUrl(chatMessages.find((m: any) => m.id === file.id)?.file_path || file.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary"
                        title="View File"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={getFileDownloadUrl(chatMessages.find((m: any) => m.id === file.id)?.file_path || file.name)}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary"
                        title="Download File"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {totalFilePages > 1 && (
                <div className="pt-md border-t border-border flex justify-center">
                  <ModernPagination
                    currentPage={filePage}
                    totalPages={totalFilePages}
                    onPageChange={setFilePage}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Active Call / Video Simulator HUD */}
      <AnimatePresence>
        {activeCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl overflow-hidden rounded-3xl md:rounded-[2.5rem] border border-slate-800 bg-slate-900 shadow-2xl flex flex-col text-white h-[85vh] md:h-[80vh] m-xs"
            >
              {/* Call Header */}
              <div className="flex items-center justify-between p-md sm:p-lg border-b border-slate-800 gap-xs">
                <div className="flex items-center gap-xs sm:gap-sm min-w-0">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-md font-bold truncate">{activeCall.partnerName}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                      {activeCall.status === 'ringing' ? 'Connecting Securely...' : `Live Session • ${Math.floor(activeCall.duration / 60)}:${String(activeCall.duration % 60).padStart(2, '0')}`}
                    </p>
                  </div>
                </div>
                <div className="px-sm sm:px-md py-0.5 sm:py-xs rounded-full bg-slate-800 text-[10px] sm:text-xs font-semibold shrink-0">
                  Secure Call Channel
                </div>
              </div>

              {/* Call Body */}
              <div className="flex-1 bg-slate-950 flex items-center justify-center relative p-xs sm:p-md overflow-hidden">
                {activeCall.type === 'video' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-xs sm:gap-md w-full h-full overflow-y-auto md:overflow-hidden p-xs">
                    {/* Remote Stream Video */}
                    <div className="relative rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center min-h-[160px] md:min-h-0">
                      {activeCall.status === 'connected' ? (
                        <video 
                          ref={(el) => {
                            remoteVideoRef.current = el;
                            if (el && remoteStreamRef.current) {
                              el.srcObject = remoteStreamRef.current;
                              el.play().catch(() => {});
                            }
                          }}
                          autoPlay
                          playsInline 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center space-y-md">
                          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-3xl sm:text-4xl font-bold mx-auto animate-pulse">
                            {activeCall.partnerName?.[0]}
                          </div>
                          <p className="text-sm font-semibold">{activeCall.partnerName}</p>
                          <p className="text-xs text-slate-400">Ringing...</p>
                        </div>
                      )}
                      <div className="absolute bottom-md left-md bg-slate-950/80 px-md py-xs rounded-lg text-xs z-10">
                        Remote Peer Feed
                      </div>
                    </div>
                    {/* Local Stream Video */}
                    <div className="relative rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center min-h-[160px] md:min-h-0">
                      {activeCall.isCameraOff ? (
                        <div className="text-center space-y-md">
                          <VideoOff className="h-8 w-8 sm:h-10 sm:w-10 text-slate-500 mx-auto" />
                          <p className="text-xs text-slate-500">Your Camera is Off</p>
                        </div>
                      ) : (
                        <video 
                          ref={(el) => {
                            localVideoRef.current = el;
                            if (el && localStreamRef.current) {
                              el.srcObject = localStreamRef.current;
                              el.play().catch(() => {});
                            }
                          }}
                          muted 
                          playsInline 
                          autoPlay
                          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                        />
                      )}
                      <div className="absolute bottom-sm left-sm bg-slate-950/80 px-sm py-0.5 rounded text-[10px] sm:text-xs z-10">
                        Host Preview (Me)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-md sm:space-y-lg">
                    <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-primary flex items-center justify-center text-white text-4xl sm:text-5xl font-black mx-auto shadow-2xl relative">
                      {activeCall.partnerName?.[0]}
                      {/* Pulse soundwaves */}
                      <span className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black">{activeCall.partnerName}</h3>
                     <p className="text-[10px] sm:text-xs text-slate-500">
                       {activeCall.status === 'ringing' 
                         ? (activeCall.isIncoming ? 'Incoming Call...' : 'Calling...') 
                         : 'Voice Link Connection Established'}
                     </p>
                    <audio 
                      ref={(el) => {
                        remoteAudioRef.current = el;
                        if (el && remoteStreamRef.current) {
                          el.srcObject = remoteStreamRef.current;
                          el.play().catch(() => {});
                        }
                      }} 
                      autoPlay 
                      className="absolute opacity-0 pointer-events-none w-px h-px" 
                    />
                  </div>
                )}

                {/* Hand Raised overlay */}
                {activeCall.isHandRaised && (
                  <div className="absolute top-sm right-sm bg-amber-500/90 text-slate-950 px-sm py-xs rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-xs">
                    <Hand className="h-3 w-3 sm:h-4 sm:w-4 animate-bounce" />
                    Hand Raised
                  </div>
                )}
              </div>

              {/* Call Controls HUD */}
              <div className="flex items-center justify-center gap-sm sm:gap-md p-md sm:p-lg border-t border-slate-800 bg-slate-900 shrink-0">
                {activeCall.status === 'ringing' ? (
                  activeCall.isIncoming ? (
                    <>
                      <Button 
                        variant="primary" 
                        onClick={async () => {
                          try {
                            if (activeCall.id) {
                              await answerCall(activeCall.id)
                            }
                          } catch (err) {
                            console.error(err)
                          }
                          setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null)
                          playSound('outgoing')
                        }}
                        className="px-lg py-sm rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg animate-bounce"
                      >
                        Answer
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={async () => {
                          try {
                            if (activeCall.id) {
                              await rejectCall(activeCall.id)
                            }
                          } catch (err) {
                            console.error(err)
                          }
                          setActiveCall(null)
                        }}
                        className="px-lg py-sm rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg"
                      >
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="ghost" 
                      onClick={async () => {
                        try {
                          if (activeCall.id) {
                            await endCall(activeCall.id)
                          }
                        } catch (err) {
                          console.error(err)
                        }
                        setActiveCall(null)
                      }}
                      className="px-lg py-sm rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg"
                    >
                      Cancel Call
                    </Button>
                  )
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        const nextMuted = !activeCall.isMuted
                        setActiveCall(prev => prev ? { ...prev, isMuted: nextMuted } : null)
                        if (localStreamRef.current) {
                          localStreamRef.current.getAudioTracks().forEach(track => {
                            track.enabled = !nextMuted
                          })
                        }
                      }}
                      className={`p-sm sm:p-md rounded-full shadow-md ${activeCall.isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                      {activeCall.isMuted ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </Button>
                    {activeCall.type === 'video' && (
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          const nextCameraOff = !activeCall.isCameraOff
                          setActiveCall(prev => prev ? { ...prev, isCameraOff: nextCameraOff } : null)
                          if (localStreamRef.current) {
                            localStreamRef.current.getVideoTracks().forEach(track => {
                              track.enabled = !nextCameraOff
                            })
                          }
                        }}
                        className={`p-sm sm:p-md rounded-full shadow-md ${activeCall.isCameraOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                      >
                        {activeCall.isCameraOff ? <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Video className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      onClick={toggleAudioOutput}
                      title={`Switch to ${audioOutput === 'speaker' ? 'Earpiece (Mobile)' : 'Speaker'}`}
                      className={`p-sm sm:p-md rounded-full shadow-md bg-slate-800 text-slate-300 hover:bg-slate-700`}
                    >
                      {audioOutput === 'speaker' ? <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={isRecording ? stopScreenRecording : startScreenRecording}
                      title={isRecording ? "Stop Screen Recording" : "Record Screen"}
                      className={`p-sm sm:p-md rounded-full shadow-md transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      <Radio className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveCall(prev => prev ? { ...prev, isHandRaised: !prev.isHandRaised } : null)}
                      className={`p-sm sm:p-md rounded-full shadow-md ${activeCall.isHandRaised ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                    >
                      <Hand className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={async () => {
                        try {
                          if (activeCall.id) {
                            await endCall(activeCall.id)
                          }
                        } catch (err) {
                          console.error(err)
                        }
                        setActiveCall(null)
                      }}
                      className="p-sm sm:p-md rounded-full shadow-md bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && !isEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-card p-lg shadow-2xl flex flex-col text-left space-y-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-md mb-xs">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-xs">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Create New Group
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-text-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-sm">
                <Input
                  label="Channel Name"
                  placeholder="e.g. Sales Sprint Sync"
                  value={groupForm.name}
                  onChange={e => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  label="Description"
                  placeholder="Brief sync topic description"
                  value={groupForm.description}
                  onChange={e => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="space-y-xs max-h-32 overflow-y-auto border border-border rounded-xl p-sm bg-background">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Select Members</p>
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-sm text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg">
                      <input
                        type="checkbox"
                        checked={groupForm.members.includes(emp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setGroupForm(prev => ({ ...prev, members: [...prev.members, emp.id] }))
                          } else {
                            setGroupForm(prev => ({ ...prev, members: prev.members.filter(id => id !== emp.id) }))
                          }
                        }}
                        className="rounded text-primary border-border focus:ring-primary"
                      />
                      <span className="text-text-primary truncate">{emp.firstName} {emp.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-sm justify-end pt-sm border-t border-border mt-md">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto justify-center">Cancel</Button>
                <Button variant="primary" onClick={handleCreateGroup} className="w-full sm:w-auto justify-center">Create Channel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SCHEDULE MEETING MODAL */}
      <AnimatePresence>
        {showScheduleModal && !isEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-card p-lg shadow-2xl flex flex-col text-left space-y-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-md mb-xs">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-xs">
                  <Calendar className="h-5 w-5 text-primary" />
                  Schedule Video Standup
                </h3>
                <button onClick={() => setShowScheduleModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-text-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-sm">
                <Input
                  label="Standup Title"
                  placeholder="e.g. Design Sync & Review"
                  value={meetingForm.title}
                  onChange={e => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  label="Meeting Date"
                  type="date"
                  value={meetingForm.date}
                  onChange={e => setMeetingForm(prev => ({ ...prev, date: e.target.value }))}
                />
                <Input
                  label="Meeting Time"
                  placeholder="e.g. 10:00 AM"
                  value={meetingForm.time}
                  onChange={e => setMeetingForm(prev => ({ ...prev, time: e.target.value }))}
                />
                <div className="space-y-xs max-h-32 overflow-y-auto border border-border rounded-xl p-sm bg-background">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Invite Members</p>
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-sm text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg">
                      <input
                        type="checkbox"
                        checked={meetingForm.attendees.includes(emp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setMeetingForm(prev => ({ ...prev, attendees: [...prev.attendees, emp.id] }))
                          } else {
                            setMeetingForm(prev => ({ ...prev, attendees: prev.attendees.filter(id => id !== emp.id) }))
                          }
                        }}
                        className="rounded text-primary border-border focus:ring-primary"
                      />
                      <span className="text-text-primary truncate">{emp.firstName} {emp.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-sm justify-end pt-sm border-t border-border mt-md">
                <Button variant="secondary" onClick={() => setShowScheduleModal(false)} className="w-full sm:w-auto justify-center">Cancel</Button>
                <Button variant="primary" onClick={handleScheduleMeeting} className="w-full sm:w-auto justify-center">Schedule Meeting</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      <div id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-md z-40 shadow-lg no-print">
        {[
          { id: 'dashboard', label: 'Home', icon: Sparkles },
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'meetings', label: 'Meetings', icon: Calendar },
          { id: 'files', label: 'Files', icon: FolderOpen }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any)
                if (tab.id !== 'chat') {
                  setActiveChatId(null)
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive 
                  ? 'text-primary' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold mt-0.5">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
