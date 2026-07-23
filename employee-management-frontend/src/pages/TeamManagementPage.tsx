import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Users, UserPlus, Trash2, Edit2, Send, Plus, X, Building, Shield, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/hooks/useEmployees'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  text: string
  timestamp: string
}

interface ChatGroup {
  id: string
  name: string
  description: string
  members: string[] // employee IDs
  createdAt: string
}

export const TeamManagementPage: React.FC = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'employee'
  const isEmployee = role === 'employee'
  const currentUserName = user?.name ?? 'User'

  const { employees } = useEmployees()

  // Find logged in employee's department and ID
  const currentEmployee = useMemo(() => {
    return employees.find(e => e.email.toLowerCase() === user?.email?.toLowerCase())
  }, [employees, user?.email])

  const userDepartment = currentEmployee?.department || 'Unassigned'
  const currentEmployeeId = currentEmployee?.id || 'temp'

  // Local storage state for groups & messages
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({}) // Keyed by Group ID or User ID (for DMs)

  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeChatType, setActiveChatType] = useState<'group' | 'dm'>('group')
  const [inputText, setInputText] = useState('')

  // Modals / Modifiers
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<ChatGroup | null>(null)
  const [groupForm, setGroupForm] = useState({ name: '', description: '', members: [] as string[] })

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Load persistent data
  useEffect(() => {
    const savedGroups = localStorage.getItem('ems_chat_groups')
    const savedMessages = localStorage.getItem('ems_chat_messages')

    if (savedGroups) {
      setGroups(JSON.parse(savedGroups))
    } else {
      // Default initial groups
      const initialGroups: ChatGroup[] = [
        {
          id: 'grp-all',
          name: 'Company Announcements Feed',
          description: 'General communication feed for all departments.',
          members: employees.map(e => e.id),
          createdAt: new Date().toISOString()
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
      localStorage.setItem('ems_chat_groups', JSON.stringify(initialGroups))
    }

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    } else {
      const initialMessages: Record<string, ChatMessage[]> = {
        'grp-all': [
          {
            id: 'm1',
            senderId: 'system',
            senderName: 'HR Assistant',
            senderRole: 'admin_hr',
            text: 'Welcome to the Workforce Hub general feed! Feel free to ask questions here.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      }
      setMessages(initialMessages)
      localStorage.setItem('ems_chat_messages', JSON.stringify(initialMessages))
    }
  }, [employees])

  // Save to localStorage when changed
  const saveGroups = (updated: ChatGroup[]) => {
    setGroups(updated)
    localStorage.setItem('ems_chat_groups', JSON.stringify(updated))
  }

  const saveMessages = (updated: Record<string, ChatMessage[]>) => {
    setMessages(updated)
    localStorage.setItem('ems_chat_messages', JSON.stringify(updated))
  }

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChatId])

  // Filter groups: Employees only see groups they are a member of
  const visibleGroups = useMemo(() => {
    if (!isEmployee) return groups
    return groups.filter(g => g.members.includes(currentEmployeeId) || g.id === 'grp-all')
  }, [groups, isEmployee, currentEmployeeId])

  // Direct Messaging List:
  // Employees can direct chat only with department peers.
  // Admins/HR can message everyone in the workforce.
  const dmPartners = useMemo(() => {
    if (isEmployee) {
      return employees.filter(e => e.department === userDepartment && e.id !== currentEmployeeId)
    }
    return employees
  }, [employees, isEmployee, userDepartment, currentEmployeeId])

  // Select default chat on load
  useEffect(() => {
    if (!activeChatId && visibleGroups.length > 0) {
      setActiveChatId(visibleGroups[0].id)
      setActiveChatType('group')
    }
  }, [visibleGroups, activeChatId])

  // Chat metadata
  const activeChatDetails = useMemo(() => {
    if (!activeChatId) return null
    if (activeChatType === 'group') {
      return groups.find(g => g.id === activeChatId)
    } else {
      const partner = employees.find(e => e.id === activeChatId)
      return partner ? { name: `${partner.firstName} ${partner.lastName}`, description: `${partner.position} • ${partner.department}` } : null
    }
  }, [activeChatId, activeChatType, groups, employees])

  // Send Message
  const handleSendMessage = useCallback(() => {
    if (!inputText.trim() || !activeChatId) return

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      senderId: currentEmployeeId,
      senderName: currentUserName,
      senderRole: role,
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    }

    const currentChatMsgs = messages[activeChatId] || []
    const updatedMessages = {
      ...messages,
      [activeChatId]: [...currentChatMsgs, newMsg]
    }

    saveMessages(updatedMessages)
    setInputText('')

    // Trigger simulated response
    setTimeout(() => {
      const responses = [
        "Sounds like a plan! Let's sync up on this later.",
        "Got it, thanks for sharing. I am looking into this now.",
        "Understood. Let me discuss this with the team and get back to you.",
        "Interesting point! Let's cover this in our daily standup.",
        "Thanks for the update. Keep up the great work!"
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      let responderName = 'Team Bot'
      let responderRole = 'employee'

      if (activeChatType === 'dm') {
        const partner = employees.find(e => e.id === activeChatId)
        if (partner) {
          responderName = `${partner.firstName} ${partner.lastName}`
          responderRole = 'employee'
        }
      } else {
        const group = groups.find(g => g.id === activeChatId)
        if (group && group.members.length > 0) {
          const otherMembers = group.members.filter(m => m !== currentEmployeeId)
          const targetMemberId = otherMembers.length > 0 ? otherMembers[Math.floor(Math.random() * otherMembers.length)] : currentEmployeeId
          const targetEmp = employees.find(e => e.id === targetMemberId)
          if (targetEmp) {
            responderName = `${targetEmp.firstName} ${targetEmp.lastName}`
            responderRole = 'employee'
          }
        }
      }

      setMessages(prev => {
        const updated = {
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), {
            id: Math.random().toString(36).substring(7),
            senderId: 'bot',
            senderName: responderName,
            senderRole: responderRole,
            text: randomResponse,
            timestamp: new Date().toISOString()
          }]
        }
        localStorage.setItem('ems_chat_messages', JSON.stringify(updated))
        return updated
      })
    }, 1500)
  }, [inputText, activeChatId, activeChatType, currentEmployeeId, currentUserName, role, messages, employees, groups])

  // CRUD Actions (Admins / HR only)
  const handleCreateGroup = () => {
    if (!groupForm.name.trim()) return

    const newGroup: ChatGroup = {
      id: `grp-${Math.random().toString(36).substring(7)}`,
      name: groupForm.name.trim(),
      description: groupForm.description.trim(),
      members: [...groupForm.members, currentEmployeeId],
      createdAt: new Date().toISOString()
    }

    saveGroups([...groups, newGroup])
    setGroupForm({ name: '', description: '', members: [] })
    setShowCreateModal(false)
    setActiveChatId(newGroup.id)
    setActiveChatType('group')
  }

  const handleUpdateGroup = () => {
    if (!showEditModal || !groupForm.name.trim()) return

    const updated = groups.map(g => {
      if (g.id === showEditModal.id) {
        return {
          ...g,
          name: groupForm.name.trim(),
          description: groupForm.description.trim(),
          members: groupForm.members.includes(currentEmployeeId) ? groupForm.members : [...groupForm.members, currentEmployeeId]
        }
      }
      return g
    })

    saveGroups(updated)
    setGroupForm({ name: '', description: '', members: [] })
    setShowEditModal(null)
  }

  const handleDeleteGroup = (id: string) => {
    const updated = groups.filter(g => g.id !== id)
    saveGroups(updated)
    if (activeChatId === id) {
      setActiveChatId(updated.length > 0 ? updated[0].id : null)
      setActiveChatType('group')
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-md overflow-hidden rounded-[2rem] border border-border bg-card p-sm shadow-xl relative">
      
      {/* Sidebar List */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-border bg-background/50 rounded-2xl overflow-hidden p-md space-y-md">
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-bold text-text-primary flex items-center gap-xs">
              <MessageSquare className="h-5 w-5 text-primary" />
              Chat Workspace
            </h3>
            <p className="text-xs text-text-secondary mt-xs">Collab with your department and teams</p>
          </div>
          {!isEmployee && (
            <Button
              variant="primary"
              className="p-sm rounded-xl"
              onClick={() => {
                setGroupForm({ name: '', description: '', members: [] })
                setShowCreateModal(true)
              }}
              title="Create Channel"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto space-y-md pr-xs">
          
          {/* Groups Section */}
          <div className="space-y-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Channels / Groups</p>
            <div className="space-y-xs">
              {visibleGroups.map(g => (
                <div
                  key={g.id}
                  onClick={() => {
                    setActiveChatId(g.id)
                    setActiveChatType('group')
                  }}
                  className={`flex items-center justify-between p-sm rounded-xl cursor-pointer transition-all duration-200 group ${
                    activeChatId === g.id && activeChatType === 'group'
                      ? 'bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-sm min-w-0">
                    <div className="rounded-lg bg-primary-100 dark:bg-primary-900/40 p-xs text-primary shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{g.name}</p>
                      <p className="text-[10px] text-text-secondary truncate">{g.description || 'Collaborative chat room'}</p>
                    </div>
                  </div>
                  {!isEmployee && g.id !== 'grp-all' && (
                    <div className="flex gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setGroupForm({ name: g.name, description: g.description, members: g.members })
                          setShowEditModal(g)
                        }}
                        className="p-1 text-text-secondary hover:text-primary transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteGroup(g.id)
                        }}
                        className="p-1 text-text-secondary hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {visibleGroups.length === 0 && (
                <p className="text-xs text-text-secondary py-xs">You are not a member of any custom channels yet.</p>
              )}
            </div>
          </div>

          {/* DMs Section */}
          <div className="space-y-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
              {isEmployee ? 'Department Contacts' : 'All Direct Messages'}
            </p>
            <div className="space-y-xs">
              {dmPartners.map(e => (
                <div
                  key={e.id}
                  onClick={() => {
                    setActiveChatId(e.id)
                    setActiveChatType('dm')
                  }}
                  className={`flex items-center gap-sm p-sm rounded-xl cursor-pointer transition-all duration-200 border ${
                    activeChatId === e.id && activeChatType === 'dm'
                      ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border-transparent'
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-text-primary text-xs font-bold relative shrink-0">
                    {e.firstName[0]}{e.lastName[0]}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card bg-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{e.firstName} {e.lastName}</p>
                    <p className="text-[10px] text-text-secondary truncate">{e.position} • {e.department}</p>
                  </div>
                </div>
              ))}
              {dmPartners.length === 0 && (
                <p className="text-xs text-text-secondary py-xs">No direct messaging contacts available.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col rounded-2xl bg-slate-50/40 dark:bg-slate-900/10 overflow-hidden relative">
        {activeChatId ? (
          <>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-lg py-md">
              <div className="min-w-0">
                <h4 className="text-md font-bold text-text-primary truncate">{activeChatDetails?.name}</h4>
                <p className="text-xs text-text-secondary truncate mt-xs">{activeChatDetails?.description}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-xs text-xs font-bold text-text-secondary inline-flex items-center gap-xs">
                {activeChatType === 'group' ? (
                  <>
                    <Users className="h-4 w-4" />
                    Channel
                  </>
                ) : (
                  <>
                    <Building className="h-4 w-4" />
                    Direct Message
                  </>
                )}
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-lg space-y-md">
              {(messages[activeChatId] || []).map((msg) => {
                const isMyMessage = msg.senderId === currentEmployeeId
                return (
                  <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-md shadow-sm border ${
                      isMyMessage
                        ? 'bg-primary-600 text-white border-primary-700 rounded-tr-none'
                        : 'bg-card text-text-primary border-border rounded-tl-none'
                    }`}>
                      {!isMyMessage && (
                        <div className="flex items-center gap-xs text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">
                          <Shield className="h-3 w-3" />
                          {msg.senderName} ({msg.senderRole.replace('_', ' ')})
                        </div>
                      )}
                      <p className="text-sm break-words leading-relaxed">{msg.text}</p>
                      <p className={`text-[9px] mt-xs text-right ${isMyMessage ? 'text-white/70' : 'text-text-secondary'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="flex-shrink-0 border-t border-border bg-card p-md flex gap-sm items-center">
              <input
                type="text"
                placeholder="Type your message here..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage() }}
                className="flex-1 rounded-xl border border-border bg-background px-md py-sm text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <Button variant="primary" className="p-sm rounded-xl shrink-0" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-xl">
            <MessageSquare className="h-16 w-16 text-text-secondary mb-md animate-pulse" />
            <h4 className="text-lg font-bold text-text-primary">No Active Conversations</h4>
            <p className="text-sm text-text-secondary mt-xs max-w-sm">Select a channel or direct message from the sidebar to begin communicating.</p>
          </div>
        )}
      </div>

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
                
                {/* Members Checklist */}
                <div className="space-y-xs">
                  <label className="text-xs font-semibold text-text-secondary">Select Group Members</label>
                  <div className="max-h-40 overflow-y-auto border border-border rounded-xl bg-background p-sm space-y-xs">
                    {employees.map(emp => {
                      const isSelected = groupForm.members.includes(emp.id)
                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setGroupForm(prev => {
                              const alreadyAdded = prev.members.includes(emp.id)
                              const updated = alreadyAdded
                                ? prev.members.filter(id => id !== emp.id)
                                : [...prev.members, emp.id]
                              return { ...prev, members: updated }
                            })
                          }}
                          className={`flex items-center justify-between p-xs rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-50/50 dark:bg-primary-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="text-xs">
                            <p className="font-semibold text-text-primary">{emp.firstName} {emp.lastName}</p>
                            <p className="text-text-secondary">{emp.department} • {emp.position}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-border bg-background'}`}>
                            {isSelected && <Check className="h-3 w-3 animate-ping" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-sm justify-end pt-sm border-t border-border mt-md">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateGroup}>Create Channel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowEditModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-border bg-card p-lg shadow-2xl flex flex-col text-left space-y-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-md mb-xs">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-xs">
                  <Edit2 className="h-4 w-4 text-primary" />
                  Edit Channel
                </h3>
                <button onClick={() => setShowEditModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-text-secondary">
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
                
                {/* Members Checklist */}
                <div className="space-y-xs">
                  <label className="text-xs font-semibold text-text-secondary">Manage Group Members</label>
                  <div className="max-h-40 overflow-y-auto border border-border rounded-xl bg-background p-sm space-y-xs">
                    {employees.map(emp => {
                      const isSelected = groupForm.members.includes(emp.id)
                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setGroupForm(prev => {
                              const alreadyAdded = prev.members.includes(emp.id)
                              const updated = alreadyAdded
                                ? prev.members.filter(id => id !== emp.id)
                                : [...prev.members, emp.id]
                              return { ...prev, members: updated }
                            })
                          }}
                          className={`flex items-center justify-between p-xs rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-50/50 dark:bg-primary-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="text-xs">
                            <p className="font-semibold text-text-primary">{emp.firstName} {emp.lastName}</p>
                            <p className="text-text-secondary">{emp.department} • {emp.position}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-border bg-background'}`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-sm justify-end pt-sm border-t border-border mt-md">
                <Button variant="secondary" onClick={() => setShowEditModal(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdateGroup}>Save Changes</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
