import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Users, UserPlus, Send, Plus, X, 
  Phone, Video, Calendar, FolderOpen, 
  Pin, Bell, Sparkles, Smile, 
  Paperclip, Mic, VideoOff, MicOff, PhoneOff, Hand,
  Eye, Download, Info, ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/hooks/useEmployees'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Badge } from '@/components/common/Badge'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  text: string
  timestamp: string
  reactions?: string[]
  attachments?: { name: string; size: string; type: string }[]
}

interface ChatGroup {
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

interface FileItem {
  id: string
  name: string
  size: string
  uploader: string
  uploadedAt: string
  type: 'image' | 'pdf' | 'doc'
}

export const TeamManagementPage: React.FC = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'employee'
  const isEmployee = role === 'employee'

  const { employees } = useEmployees()

  // Current logged in employee info
  const currentEmployee = useMemo(() => {
    return employees.find(e => e.email.toLowerCase() === user?.email?.toLowerCase())
  }, [employees, user?.email])

  const currentEmployeeId = currentEmployee?.id || 'temp'

  // Sub-Navigation Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'meetings' | 'files'>('dashboard')
  
  // Real-Time Chat State
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeChatType, setActiveChatType] = useState<'group' | 'dm'>('group')
  const [inputText, setInputText] = useState('')
  
  // Call State (Simulator)
  const [activeCall, setActiveCall] = useState<{
    type: 'voice' | 'video'
    status: 'ringing' | 'connected'
    partnerName: string
    duration: number
    isMuted: boolean
    isCameraOff: boolean
    isScreenSharing: boolean
    isHandRaised: boolean
  } | null>(null)

  // Meeting Schedule State
  const [meetings, setMeetings] = useState<MeetingItem[]>([
    {
      id: 'meet-1',
      title: 'Daily Tech Standup',
      time: '10:00 AM - 10:30 AM',
      date: new Date().toISOString().slice(0, 10),
      attendees: ['Bob', 'Alice'],
      joinUrl: '#'
    },
    {
      id: 'meet-2',
      title: 'Sprint Planning & Retro',
      time: '02:00 PM - 03:00 PM',
      date: new Date().toISOString().slice(0, 10),
      attendees: ['Bob', 'Alice', 'Charlie'],
      joinUrl: '#'
    }
  ])

  const [files] = useState<FileItem[]>([
    { id: 'f-1', name: 'UI_Design_Spec_v2.pdf', size: '4.2 MB', uploader: 'Alice Smith', uploadedAt: 'Today', type: 'pdf' },
    { id: 'f-2', name: 'Workforce_Model.xlsx', size: '1.8 MB', uploader: 'Bob Johnson', uploadedAt: 'Yesterday', type: 'doc' },
    { id: 'f-3', name: 'Banner_Mockup_Premium.png', size: '12.4 MB', uploader: 'Charlie Brown', uploadedAt: '3 days ago', type: 'image' }
  ])

  // Modals & Panels Control
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [groupForm, setGroupForm] = useState({ name: '', description: '', members: [] as string[] })
  const [meetingForm, setMeetingForm] = useState({ title: '', time: '11:00 AM', date: new Date().toISOString().slice(0, 10), attendees: [] as string[] })

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  
  // Call timer simulation
  useEffect(() => {
    let interval: any
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeCall])

  // Initialize and persist mock chats
  useEffect(() => {
    const savedGroups = localStorage.getItem('ems_chat_groups_v2')
    const savedMessages = localStorage.getItem('ems_chat_messages_v2')

    if (savedGroups) {
      setGroups(JSON.parse(savedGroups))
    } else {
      const initialGroups: ChatGroup[] = [
        {
          id: 'grp-all',
          name: 'Company Announcements Feed',
          description: 'General communication feed for all departments.',
          members: employees.map(e => e.id),
          createdAt: new Date().toISOString(),
          isPinned: true
        },
        {
          id: 'grp-tech',
          name: 'Tech & Engineering Sync',
          description: 'Collaboration channel for engineers and developers.',
          members: employees.filter(e => e.department === 'Engineering').map(e => e.id),
          createdAt: new Date().toISOString()
        }
      ]
      setGroups(initialGroups)
      localStorage.setItem('ems_chat_groups_v2', JSON.stringify(initialGroups))
    }

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    } else {
      const initialMessages: Record<string, ChatMessage[]> = {
        'grp-all': [
          {
            id: 'm1',
            senderId: 'system',
            senderName: 'HR Specialist',
            senderRole: 'admin_hr',
            text: 'Welcome to the Workforce Hub general feed! Feel free to ask questions here.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      }
      setMessages(initialMessages)
      localStorage.setItem('ems_chat_messages_v2', JSON.stringify(initialMessages))
    }
  }, [employees])

  const activeChatDetails = useMemo(() => {
    if (!activeChatId) return null
    if (activeChatType === 'group') {
      return groups.find(g => g.id === activeChatId)
    } else {
      const partner = employees.find(e => e.id === activeChatId)
      return partner ? { name: `${partner.firstName} ${partner.lastName}`, description: `${partner.position} • ${partner.department}` } : null
    }
  }, [activeChatId, activeChatType, groups, employees])

  // Filter contacts for DMs
  const dmPartners = useMemo(() => {
    if (isEmployee) {
      return employees.filter(e => e.id !== currentEmployeeId && e.department === currentEmployee?.department)
    }
    return employees.filter(e => e.id !== currentEmployeeId)
  }, [employees, currentEmployeeId, currentEmployee, isEmployee])

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeChatId])

  const handleSendMessage = (textOverride?: string) => {
    const textToSend = textOverride || inputText
    if (!textToSend.trim() || !activeChatId) return

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      senderId: currentEmployeeId,
      senderName: user?.name || 'User',
      senderRole: role,
      text: textToSend,
      timestamp: new Date().toISOString(),
      reactions: []
    }

    const updated = {
      ...messages,
      [activeChatId]: [...(messages[activeChatId] || []), newMsg]
    }
    setMessages(updated)
    localStorage.setItem('ems_chat_messages_v2', JSON.stringify(updated))
    setInputText('')
  }

  const handleAddReaction = (msgId: string, emoji: string) => {
    if (!activeChatId) return
    const updatedMsgs = (messages[activeChatId] || []).map(msg => {
      if (msg.id === msgId) {
        const reactions = msg.reactions || []
        return {
          ...msg,
          reactions: reactions.includes(emoji) ? reactions.filter(r => r !== emoji) : [...reactions, emoji]
        }
      }
      return msg
    })
    const updated = { ...messages, [activeChatId]: updatedMsgs }
    setMessages(updated)
    localStorage.setItem('ems_chat_messages_v2', JSON.stringify(updated))
  }

  const handleCreateGroup = () => {
    if (!groupForm.name.trim()) return
    const newGroup: ChatGroup = {
      id: `grp-${Math.random().toString(36).substring(7)}`,
      name: groupForm.name,
      description: groupForm.description,
      members: [...groupForm.members, currentEmployeeId],
      createdAt: new Date().toISOString()
    }
    const updated = [...groups, newGroup]
    setGroups(updated)
    localStorage.setItem('ems_chat_groups_v2', JSON.stringify(updated))
    setShowCreateModal(false)
    setGroupForm({ name: '', description: '', members: [] })
  }

  const handleScheduleMeeting = () => {
    if (!meetingForm.title.trim()) return
    const newMeet: MeetingItem = {
      id: `meet-${Math.random().toString(36).substring(7)}`,
      title: meetingForm.title,
      time: meetingForm.time,
      date: meetingForm.date,
      attendees: meetingForm.attendees,
      joinUrl: '#'
    }
    setMeetings(prev => [...prev, newMeet])
    setShowScheduleModal(false)
  }

  const handleTriggerCall = (type: 'voice' | 'video', partnerName: string) => {
    setActiveCall({
      type,
      status: 'ringing',
      partnerName,
      duration: 0,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isHandRaised: false
    })
    
    // Simulate connection after 2 seconds
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null)
    }, 2000)
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)] gap-md relative overflow-hidden bg-background text-text-primary">
      {/* Persistent Left Sidebar */}
      <div className={`w-full lg:w-80 flex-col rounded-3xl border border-border bg-card p-md shadow-sm no-print ${
        activeTab === 'chat' && activeChatId !== null ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Workspace Title & Search */}
        <div className="flex items-center justify-between gap-sm mb-md px-sm">
          <div className="flex items-center gap-xs">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm">
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
        <div className="grid grid-cols-4 gap-xs p-xs rounded-xl bg-slate-100 dark:bg-slate-800/40 mb-md">
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
        </div>

        {/* Channels/Active list for Sidebar */}
        <div className="flex-1 overflow-y-auto space-y-md pr-xs scrollbar-thin">
          {/* pinned channels */}
          <div className="space-y-sm">
            <div className="flex items-center justify-between px-xs">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Channels</p>
              <button onClick={() => setShowCreateModal(true)} className="text-primary hover:text-primary-600 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-xs">
              {groups.map(g => (
                <div
                  key={g.id}
                  onClick={() => {
                    setActiveTab('chat')
                    setActiveChatId(g.id)
                    setActiveChatType('group')
                  }}
                  className={`flex items-center justify-between p-sm rounded-xl cursor-pointer transition-all duration-200 group border ${
                    activeChatId === g.id && activeTab === 'chat'
                      ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-sm min-w-0">
                    <div className="rounded-lg bg-primary-100 dark:bg-primary-900/40 p-xs text-primary shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{g.name}</p>
                      <p className="text-[10px] text-text-secondary truncate">{g.description || 'General Discussion'}</p>
                    </div>
                  </div>
                  {g.isPinned && <Pin className="h-3 w-3 text-text-secondary" />}
                </div>
              ))}
            </div>
          </div>

          {/* DMs Section */}
          <div className="space-y-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Direct Messages</p>
            <div className="space-y-xs">
              {dmPartners.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    setActiveTab('chat')
                    setActiveChatId(emp.id)
                    setActiveChatType('dm')
                  }}
                  className={`flex items-center gap-sm p-sm rounded-xl cursor-pointer transition-all duration-200 border ${
                    activeChatId === emp.id && activeTab === 'chat'
                      ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border-transparent'
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-text-primary text-xs font-bold relative shrink-0">
                    {emp.firstName[0]}{emp.lastName[0]}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{emp.firstName} {emp.lastName}</p>
                    <p className="text-[10px] text-text-secondary truncate">{emp.position} • {emp.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className={`flex-1 flex-col rounded-3xl bg-slate-50/40 dark:bg-slate-900/10 overflow-hidden relative border border-border/50 ${
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
              className="flex-1 overflow-y-auto p-lg space-y-lg"
            >
              {/* Welcome Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 p-xl text-white shadow-lg">
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
                  { label: 'Unread Messages', value: '14 alerts', icon: Bell, tone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
                  { label: 'Online Colleagues', value: `${employees.length} online`, icon: Users, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
                  { label: 'Scheduled Meetings', value: `${meetings.length} today`, icon: Calendar, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
                  { label: 'Shared Media Assets', value: `${files.length} assets`, icon: FolderOpen, tone: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20' }
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

              {/* Meetings & Birthdays Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                
                {/* Schedule Card */}
                <div className="lg:col-span-2 card p-lg space-y-md border border-border bg-card">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-md font-bold text-text-primary">Today's Meeting Syncs</h3>
                      <p className="text-xs text-text-secondary">Low latency voice/video standups</p>
                    </div>
                    <Button variant="secondary" onClick={() => setShowScheduleModal(true)}>
                      <Plus className="h-4 w-4 mr-xs" />
                      Schedule
                    </Button>
                  </div>

                  <div className="space-y-sm">
                    {meetings.map(meet => (
                      <div key={meet.id} className="flex justify-between items-center p-md border border-border rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
                        <div className="flex gap-sm items-center">
                          <div className="p-xs bg-primary-100 dark:bg-primary-900/40 text-primary rounded-xl">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{meet.title}</p>
                            <p className="text-xs text-text-secondary">{meet.time}</p>
                          </div>
                        </div>
                        <Button variant="primary" onClick={() => handleTriggerCall('video', 'Tech Sprint Group')} className="gap-sm">
                          <Video className="h-4 w-4" />
                          Join Call
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team announcements */}
                <div className="card p-lg space-y-md border border-border bg-card">
                  <h3 className="text-md font-bold text-text-primary">Colleague Birthdays</h3>
                  <div className="space-y-md text-sm text-text-secondary">
                    <div className="flex gap-sm items-center p-xs border-b border-border">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        AS
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">Alice Smith</p>
                        <p className="text-xs">Engineering • July 28</p>
                      </div>
                    </div>
                    <div className="flex gap-sm items-center p-xs border-b border-border">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        BJ
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">Bob Johnson</p>
                        <p className="text-xs">HR • August 12</p>
                      </div>
                    </div>
                  </div>
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
              className="flex-1 flex"
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
                    <div className="flex-1 overflow-y-auto p-lg space-y-md scrollbar-thin">
                      {(messages[activeChatId] || []).map((msg) => {
                        const isMyMessage = msg.senderId === currentEmployeeId
                        return (
                          <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className="group relative max-w-[70%]">
                              {/* Reactions drawer */}
                              <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-lg rounded-full border border-border px-xs py-0.5 flex gap-1 z-10">
                                {['👍', '🔥', '🎉', '❤️'].map(emoji => (
                                  <button 
                                    key={emoji} 
                                    onClick={() => handleAddReaction(msg.id, emoji)}
                                    className="hover:scale-125 transition-transform px-1 text-xs"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>

                              <div className={`rounded-2xl p-md shadow-sm border ${
                                isMyMessage
                                  ? 'bg-primary-600 text-white border-primary-700 rounded-tr-none'
                                  : 'bg-card text-text-primary border-border rounded-tl-none'
                              }`}>
                                {!isMyMessage && (
                                  <div className="flex items-center gap-xs text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">
                                    {msg.senderName} ({msg.senderRole.replace('_', ' ')})
                                  </div>
                                )}
                                <p className="text-sm break-words leading-relaxed">{msg.text}</p>
                                
                                {msg.reactions && msg.reactions.length > 0 && (
                                  <div className="flex flex-wrap gap-xs mt-sm">
                                    {Array.from(new Set(msg.reactions)).map(emoji => (
                                      <span key={emoji} className="inline-flex items-center gap-xs rounded-full bg-slate-100 dark:bg-slate-800 px-sm py-0.5 text-[10px] text-text-secondary border border-border">
                                        {emoji} {msg.reactions?.filter(r => r === emoji).length}
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
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat composer */}
                    <div className="flex-shrink-0 border-t border-border bg-card p-md flex gap-sm items-center no-print">
                      <Button variant="ghost" className="p-xs text-text-secondary shrink-0">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <input
                        type="text"
                        placeholder="Type your message here..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }}
                        className="flex-1 rounded-xl border border-border bg-background px-md py-sm text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                      <Button variant="ghost" onClick={() => handleSendMessage('👍')} className="p-xs text-text-secondary shrink-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button variant="primary" className="p-sm rounded-xl shrink-0" onClick={() => handleSendMessage()}>
                        <Send className="h-4 w-4" />
                      </Button>
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
                        <div className="grid grid-cols-3 gap-xs">
                          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-text-secondary font-semibold">Image 1</div>
                          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-text-secondary font-semibold">Image 2</div>
                          <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-text-secondary font-semibold">Asset 3</div>
                        </div>
                      </div>

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
              className="flex-1 overflow-y-auto p-lg space-y-md"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Interactive Meeting Schedule</h2>
                  <p className="text-sm text-text-secondary">Plan sprint discussions and standups</p>
                </div>
                <Button variant="primary" onClick={() => setShowScheduleModal(true)}>
                  <Plus className="h-4 w-4 mr-xs" />
                  Schedule Meeting
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {meetings.map(meet => (
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
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div 
              key="files" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-lg space-y-md"
            >
              <div>
                <h2 className="text-lg font-bold text-text-primary">Shared Team Files</h2>
                <p className="text-sm text-text-secondary">Manage collaborative documents and mockups</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md">
                {files.map(file => (
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
                      <Button variant="ghost" className="p-xs">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" className="p-xs">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
              className="relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900 shadow-2xl flex flex-col text-white h-[80vh]"
            >
              {/* Call Header */}
              <div className="flex items-center justify-between p-lg border-b border-slate-800">
                <div className="flex items-center gap-sm">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <h3 className="text-md font-bold">{activeCall.partnerName}</h3>
                    <p className="text-xs text-slate-400">
                      {activeCall.status === 'ringing' ? 'Connecting Securely...' : `Live Session • ${Math.floor(activeCall.duration / 60)}:${String(activeCall.duration % 60).padStart(2, '0')}`}
                    </p>
                  </div>
                </div>
                <div className="px-md py-xs rounded-full bg-slate-800 text-xs font-semibold">
                  Secure Call Channel
                </div>
              </div>

              {/* Call Body */}
              <div className="flex-1 bg-slate-950 flex items-center justify-center relative p-md">
                {activeCall.type === 'video' ? (
                  <div className="grid grid-cols-2 gap-md w-full h-full">
                    {/* Remote Stream Video */}
                    <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                      <div className="text-center space-y-md">
                        <div className="h-20 w-20 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-4xl font-bold mx-auto">
                          {activeCall.partnerName[0]}
                        </div>
                        <p className="text-sm font-semibold">{activeCall.partnerName}</p>
                      </div>
                      <div className="absolute bottom-md left-md bg-slate-950/80 px-md py-xs rounded-lg text-xs">
                        Remote Peer Feed
                      </div>
                    </div>
                    {/* Local Stream Video */}
                    <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                      {activeCall.isCameraOff ? (
                        <div className="text-center space-y-md">
                          <VideoOff className="h-10 w-10 text-slate-500 mx-auto" />
                          <p className="text-xs text-slate-500">Your Camera is Off</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-md">
                          <div className="h-20 w-20 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-4xl font-bold mx-auto">
                            ME
                          </div>
                          <p className="text-sm font-semibold">Self Stream (Host)</p>
                        </div>
                      )}
                      <div className="absolute bottom-md left-md bg-slate-950/80 px-md py-xs rounded-lg text-xs">
                        Host Preview (Me)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-lg">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white text-5xl font-black mx-auto shadow-2xl relative">
                      {activeCall.partnerName[0]}
                      {/* Pulse soundwaves */}
                      <span className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
                    </div>
                    <h3 className="text-2xl font-black">{activeCall.partnerName}</h3>
                    <p className="text-xs text-slate-500">Voice Link Connection Established</p>
                  </div>
                )}

                {/* Hand Raised overlay */}
                {activeCall.isHandRaised && (
                  <div className="absolute top-md right-md bg-amber-500/90 text-slate-950 px-md py-sm rounded-full text-xs font-extrabold flex items-center gap-xs">
                    <Hand className="h-4 w-4 animate-bounce" />
                    Hand Raised
                  </div>
                )}
              </div>

              {/* Call Controls HUD */}
              <div className="flex items-center justify-center gap-md p-lg border-t border-slate-800 bg-slate-900">
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)}
                  className={`p-md rounded-full shadow-md ${activeCall.isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  {activeCall.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                {activeCall.type === 'video' && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setActiveCall(prev => prev ? { ...prev, isCameraOff: !prev.isCameraOff } : null)}
                    className={`p-md rounded-full shadow-md ${activeCall.isCameraOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    {activeCall.isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveCall(prev => prev ? { ...prev, isHandRaised: !prev.isHandRaised } : null)}
                  className={`p-md rounded-full shadow-md ${activeCall.isHandRaised ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  <Hand className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveCall(null)}
                  className="p-md rounded-full shadow-md bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
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
              </div>

              <div className="flex gap-sm justify-end pt-sm border-t border-border mt-md">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateGroup}>Create Channel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SCHEDULE MEETING MODAL */}
      <AnimatePresence>
        {showScheduleModal && (
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
                  label="Meeting Time"
                  placeholder="e.g. 10:00 AM - 10:30 AM"
                  value={meetingForm.time}
                  onChange={e => setMeetingForm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>

              <div className="flex gap-sm justify-end pt-sm border-t border-border mt-md">
                <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleScheduleMeeting}>Schedule Meeting</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
