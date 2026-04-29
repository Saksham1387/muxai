'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useRef, KeyboardEvent, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  ChevronDown,
  Plus,
  X,
  Trash2,
  Moon,
  Sun,
  Paperclip,
  FileText,
  ImageIcon,
  Film,
  Music,
  Download,
  Upload,
} from 'lucide-react'
import { DEFAULT_MODEL } from '@/lib/config'
import { trpc } from '@/server/client-trpc'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getFileIcon } from '@/components/chat'

const TABS = [
  'Account',
  'Customization',
  'History',
  'Attachments',
] as const

type Tab = (typeof TABS)[number]

const SUGGESTED_TRAITS = ['friendly', 'witty', 'concise', 'curious', 'empathetic', 'creative', 'patient']

type ProfileAttachment = {
  id: string
  fileName: string
  mimeType: string
  size: number
  key: string
  url: string
  messageId: string
  message: {
    conversation: {
      title: string
      id: string
    }
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Account')
  const utils = trpc.useUtils()

  // Customization state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [occupation, setOccupation] = useState('')
  const [traits, setTraits] = useState<string[]>([])
  const [traitInput, setTraitInput] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL.id)
  const traitInputRef = useRef<HTMLInputElement>(null)

  // Profile creation state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  // History tab state
  const [historyProfileId, setHistoryProfileId] = useState<string | null>(null)
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Attachments tab state
  const [attachmentsProfileId, setAttachmentsProfileId] = useState<string | null>(null)
  const [selectedAttIds, setSelectedAttIds] = useState<Set<string>>(new Set())
  const [deleteAttDialogOpen, setDeleteAttDialogOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const { data: profiles } = trpc.profile.listProfiles.useQuery(undefined, {
    enabled: status === 'authenticated'
  })

  const { data: historyConversations = [], isLoading: historyLoading } = trpc.conversation.getByProfile.useQuery(
    { profileId: historyProfileId! },
    { enabled: !!historyProfileId && activeTab === 'History' }
  )

  const deleteMultiple = trpc.conversation.deleteMultiple.useMutation({
    onSuccess: () => {
      utils.conversation.getByProfile.invalidate()
      utils.conversation.getAllConversations.invalidate()
      setSelectedConvIds(new Set())
      setDeleteDialogOpen(false)
      toast.success('Conversations deleted')
    },
    onError: () => {
      toast.error('Failed to delete conversations')
    }
  })

  const deleteSingle = trpc.conversation.deleteConversation.useMutation({
    onSuccess: () => {
      utils.conversation.getByProfile.invalidate()
      utils.conversation.getAllConversations.invalidate()
      toast.success('Conversation deleted')
    },
    onError: () => {
      toast.error('Failed to delete conversation')
    }
  })

  // Attachments queries & mutations
  const { data: profileAttachmentsData, isLoading: attachmentsLoading } = trpc.attachment.getByProfile.useQuery(
    { profileId: attachmentsProfileId! },
    { enabled: !!attachmentsProfileId && activeTab === 'Attachments' }
  )
  const profileAttachments = (profileAttachmentsData ?? []) as ProfileAttachment[]

  const deleteAttachment = trpc.attachment.delete.useMutation({
    onSuccess: () => {
      utils.attachment.getByProfile.invalidate()
      toast.success('Attachment deleted')
    },
    onError: () => toast.error('Failed to delete attachment'),
  })

  const deleteMultipleAttachments = trpc.attachment.deleteMultiple.useMutation({
    onSuccess: () => {
      utils.attachment.getByProfile.invalidate()
      setSelectedAttIds(new Set())
      setDeleteAttDialogOpen(false)
      toast.success('Attachments deleted')
    },
    onError: () => toast.error('Failed to delete attachments'),
  })

  // Auto-select first profile on load
  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfileId) {
      handleProfileSelect(profiles[0])
    }
  }, [profiles])

  // Auto-select first profile for history tab
  useEffect(() => {
    if (profiles && profiles.length > 0 && !historyProfileId) {
      setHistoryProfileId(profiles[0].id)
    }
  }, [profiles, historyProfileId])

  // Auto-select first profile for attachments tab
  useEffect(() => {
    if (profiles && profiles.length > 0 && !attachmentsProfileId) {
      setAttachmentsProfileId(profiles[0].id)
    }
  }, [profiles, attachmentsProfileId])

  const historyProfileName = useMemo(() =>
    profiles?.find(p => p.id === historyProfileId)?.name || 'Default',
    [profiles, historyProfileId]
  )

  const attachmentsProfileName = useMemo(() =>
    profiles?.find(p => p.id === attachmentsProfileId)?.name || 'Default',
    [profiles, attachmentsProfileId]
  )

  const createProfile = trpc.profile.createProfile.useMutation({
    onSuccess: (newProfile) => {
      utils.profile.listProfiles.invalidate()
      setSelectedProfileId(newProfile.id)
      setDisplayName('')
      setOccupation('')
      setTraits([])
      setAdditionalInfo('')
      setIsDialogOpen(false)
      setNewProfileName('')
      toast.success('New profile created')
    }
  })

  const updatePreferences = trpc.profile.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Preferences saved')
    }
  })

  const handleProfileSelect = (profile: any) => {
    setSelectedProfileId(profile.id)
    const prefs = profile.prefrences as any
    if (prefs) {
      setDisplayName(prefs.userName || '')
      setOccupation(prefs.userOccupation || '')
      setTraits(prefs.preferredTraits ? prefs.preferredTraits.split(',').filter(Boolean) : [])
      setAdditionalInfo(prefs.userDescription || '')
    } else {
      setDisplayName('')
      setOccupation('')
      setTraits([])
      setAdditionalInfo('')
    }
  }

  const handleSave = async () => {
    if (!selectedProfileId) {
      toast.error('Please select or create a profile first')
      return
    }

    try {
      await updatePreferences.mutateAsync({
        id: selectedProfileId,
        userName: displayName,
        userOccupation: occupation,
        preferredTraits: traits.join(','),
        userDescription: additionalInfo
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
    }
  }

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Profile name is required')
      return
    }
    await createProfile.mutateAsync({ name: newProfileName })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const user = session?.user

  const addTrait = (trait: string) => {
    const trimmed = trait.trim().toLowerCase()
    if (trimmed && !traits.includes(trimmed) && traits.length < 10) {
      setTraits([...traits, trimmed])
      setTraitInput('')
    }
  }

  const removeTrait = (trait: string) => {
    setTraits(traits.filter(t => t !== trait))
  }

  const handleTraitKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && traitInput.trim()) {
      e.preventDefault()
      addTrait(traitInput)
    }
    if (e.key === 'Backspace' && !traitInput && traits.length > 0) {
      setTraits(traits.slice(0, -1))
    }
  }

  const toggleConvSelection = (id: string) => {
    setSelectedConvIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllConversations = () => {
    if (selectedConvIds.size === historyConversations.length) {
      setSelectedConvIds(new Set())
    } else {
      setSelectedConvIds(new Set(historyConversations.map(c => c.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedConvIds.size === 0) return
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSelected = async () => {
    await deleteMultiple.mutateAsync({ ids: Array.from(selectedConvIds) })
  }

  const handleDeleteSingle = async (id: string) => {
    await deleteSingle.mutateAsync({ id })
  }

  function formatRelativeTime(date: Date) {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    const months = Math.floor(days / 30)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `about ${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    return `${months} month${months > 1 ? 's' : ''} ago`
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (mimeType.startsWith('video/')) return <Film className="w-4 h-4" />
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const toggleAttSelection = (id: string) => {
    setSelectedAttIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllAttachments = () => {
    if (selectedAttIds.size === profileAttachments.length) {
      setSelectedAttIds(new Set())
    } else {
      setSelectedAttIds(new Set(profileAttachments.map(a => a.id)))
    }
  }

  const handleDeleteSelectedAttachments = () => {
    if (selectedAttIds.size === 0) return
    setDeleteAttDialogOpen(true)
  }

  const confirmDeleteSelectedAttachments = async () => {
    await deleteMultipleAttachments.mutateAsync({ ids: Array.from(selectedAttIds) })
  }

  const handleDeleteSingleAttachment = async (id: string) => {
    await deleteAttachment.mutateAsync({ id })
  }

  return (
    <div className="min-h-screen bg-background text-foreground ">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user && (
            <button
              onClick={() => router.push('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>

      <div className="flex  mx-auto min-h-[calc(100vh-49px)] justify-center ">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 border-r border-border p-6 flex flex-col">
          {/* User info */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
              <AvatarFallback className="text-xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-semibold text-lg">{user?.name || 'Guest'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
            <span className="mt-1.5 text-xs bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground">
              Free Plan
            </span>
          </div>

          {/* <Separator className="mb-6" /> */}

          {/* Usage */}
          {/* <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Usage Limits</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Base</p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '35%' }} />
            </div>
          </div> */}

          {/* <Separator className="mb-6" /> */}

          {/* Keyboard shortcuts */}
          {/* <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2.5">
              {SHORTCUTS.map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <div className="flex gap-0.5">
                    {s.keys.map((k, i) => (
                      <kbd
                        key={i}
                        className="min-w-[22px] h-5 flex items-center justify-center text-[10px] font-medium bg-muted border border-border rounded px-1"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="text-xs text-primary hover:underline mt-3">
              Customize shortcuts
            </button>
          </div> */}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 max-w-3xl">
          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'Account' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="max-w-md bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Connected via Google sign-in
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Display Name</label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="max-w-md bg-muted/50"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Customization' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Customize Muxai</h2>

              <div className="space-y-6">
               
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Profile</label>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="w-3 h-3 rounded-full border-2 border-primary" />
                          <span className="text-sm">
                            {profiles?.find(p => p.id === selectedProfileId)?.name || 'Select a profile'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        {profiles?.map((profile) => (
                          <DropdownMenuItem 
                            key={profile.id}
                            onClick={() => handleProfileSelect(profile)}
                          >
                            {profile.name}
                          </DropdownMenuItem>
                        ))}
                        {profiles?.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No profiles found</div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0 h-10 w-10"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

               
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    What should Muxai call you?
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your name"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      maxLength={50}
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {displayName.length}/50
                    </span>
                  </div>
                </div>

                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">What do you do?</label>
                  <div className="relative">
                    <Input
                      placeholder="Engineer, student, etc."
                      value={occupation}
                      onChange={e => setOccupation(e.target.value)}
                      maxLength={100}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {occupation.length}/100
                    </span>
                  </div>
                </div>

               
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    What traits should Muxai have?
                  </label>
                  <div className="relative">
                    <Input
                      ref={traitInputRef}
                      placeholder="Type a trait and press Enter or Tab..."
                      value={traitInput}
                      onChange={e => setTraitInput(e.target.value)}
                      onKeyDown={handleTraitKeyDown}
                      maxLength={100}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {traits.length}/10
                    </span>
                  </div>

                 
                  {traits.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {traits.map(trait => (
                        <span
                          key={trait}
                          className="inline-flex items-center gap-1 bg-primary/15 text-primary text-sm px-2.5 py-1 rounded-full"
                        >
                          {trait}
                          <button
                            onClick={() => removeTrait(trait)}
                            className="hover:text-primary/70 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                 
                  <div className="flex flex-wrap gap-2 mt-3">
                    {SUGGESTED_TRAITS.filter(t => !traits.includes(t)).map(trait => (
                      <button
                        key={trait}
                        onClick={() => addTrait(trait)}
                        className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {trait}
                        <Plus className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>

               
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Anything else Muxai should know about you?
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Interests, values, or preferences to keep in mind"
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                      maxLength={3000}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px] min-h-[120px]"
                    />
                    <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                      {additionalInfo.length}/3000
                    </span>
                  </div>
                </div>

               
                <div className="flex justify-end">
                  <Button 
                    className="px-6" 
                    onClick={handleSave}
                    disabled={updatePreferences.isPending}
                  >
                    {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'History' && (
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-xl font-semibold">Chat History</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    View and manage your conversation history by profile.
                  </p>
                </div>
                {selectedConvIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete {selectedConvIds.size}
                  </Button>
                )}
              </div>

              {/* Profile filter */}
              <div className="mb-5 mt-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="inline-flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{historyProfileName}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {profiles?.map((profile) => (
                      <DropdownMenuItem
                        key={profile.id}
                        onClick={() => {
                          setHistoryProfileId(profile.id)
                          setSelectedConvIds(new Set())
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${profile.id === historyProfileId ? 'bg-primary' : 'bg-transparent border border-muted-foreground'}`} />
                        {profile.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Conversation table */}
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Table header */}
                <div className="flex items-center px-4 py-3 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="w-8 shrink-0">
                    <button
                      onClick={toggleAllConversations}
                      className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                        historyConversations.length > 0 && selectedConvIds.size === historyConversations.length
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      {historyConversations.length > 0 && selectedConvIds.size === historyConversations.length && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </button>
                  </div>
                  <div className="flex-1">Title</div>
                  <div className="w-24 text-right">Profile</div>
                  <div className="w-32 text-right pr-1">Created</div>
                  <div className="w-10" />
                </div>

                {/* Table body */}
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  </div>
                ) : historyConversations.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-12">
                    No conversations found for this profile.
                  </div>
                ) : (
                  historyConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center px-4 py-3 border-b border-border last:border-b-0 group hover:bg-muted/20 transition-colors ${
                        selectedConvIds.has(conv.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="w-8 shrink-0">
                        <button
                          onClick={() => toggleConvSelection(conv.id)}
                          className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                            selectedConvIds.has(conv.id)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          {selectedConvIds.has(conv.id) && (
                            <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{conv.title}</span>
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-xs text-muted-foreground">{historyProfileName}</span>
                      </div>
                      <div className="w-32 text-right pr-1">
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(conv.createdAt)}</span>
                      </div>
                      <div className="w-10 flex justify-end">
                        <button
                          onClick={() => handleDeleteSingle(conv.id)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                          disabled={deleteSingle.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {historyConversations.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {historyConversations.length} conversation{historyConversations.length !== 1 ? 's' : ''}
                  {selectedConvIds.size > 0 && ` · ${selectedConvIds.size} selected`}
                </p>
              )}
            </div>
          )}

          {activeTab === 'Attachments' && (
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-xl font-semibold">Attachments</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    View and manage all files uploaded across your conversations.
                  </p>
                </div>
                {selectedAttIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelectedAttachments}
                    className="shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Delete {selectedAttIds.size}
                  </Button>
                )}
              </div>

              {/* Profile filter */}
              <div className="mb-5 mt-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="inline-flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{attachmentsProfileName}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {profiles?.map((profile) => (
                      <DropdownMenuItem
                        key={profile.id}
                        onClick={() => {
                          setAttachmentsProfileId(profile.id)
                          setSelectedAttIds(new Set())
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${profile.id === attachmentsProfileId ? 'bg-primary' : 'bg-transparent border border-muted-foreground'}`} />
                        {profile.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Attachments table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center px-4 py-3 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="w-8 shrink-0">
                    <button
                      onClick={toggleAllAttachments}
                      className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                        profileAttachments.length > 0 && selectedAttIds.size === profileAttachments.length
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      {profileAttachments.length > 0 && selectedAttIds.size === profileAttachments.length && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </button>
                  </div>
                  <div className="w-8 shrink-0" />
                  <div className="flex-1">File Name</div>
                  <div className="w-20 text-right">Size</div>
                  <div className="w-32 text-right">Conversation</div>
                  <div className="w-16" />
                </div>

                {attachmentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  </div>
                ) : profileAttachments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Paperclip className="w-8 h-8 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No attachments found for this profile.</p>
                    <p className="text-xs text-muted-foreground mt-1">Files attached to messages will appear here.</p>
                  </div>
                ) : (
                  profileAttachments.map((att) => (
                    <div
                      key={att.id}
                      className={`flex items-center px-4 py-3 border-b border-border last:border-b-0 group hover:bg-muted/20 transition-colors ${
                        selectedAttIds.has(att.id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="w-8 shrink-0">
                        <button
                          onClick={() => toggleAttSelection(att.id)}
                          className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                            selectedAttIds.has(att.id)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          {selectedAttIds.has(att.id) && (
                            <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </button>
                      </div>
                      <div className="w-8 shrink-0 text-muted-foreground">
                        <AttachmentThumbnail att={att} />
                      </div>
                      <div className="flex-1 min-w-0 pl-2">
                        <span className="text-sm font-medium truncate block">{att.fileName}</span>
                        <span className="text-[10px] text-muted-foreground">{att.mimeType}</span>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-xs text-muted-foreground">{formatFileSize(att.size)}</span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-xs text-muted-foreground truncate block">
                          {(att as any).message?.conversation?.title || '—'}
                        </span>
                      </div>
                      <div className="w-16 flex justify-end gap-1">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                        <button
                          onClick={() => handleDeleteSingleAttachment(att.id)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                          disabled={deleteAttachment.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {profileAttachments.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {profileAttachments.length} attachment{profileAttachments.length !== 1 ? 's' : ''}
                  {selectedAttIds.size > 0 && ` · ${selectedAttIds.size} selected`}
                </p>
              )}
            </div>
          )}

          
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Profile</DialogTitle>
            <DialogDescription>
              Give your new profile a name to get started with custom preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                placeholder="e.g. Work, Creative, Coding"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProfile()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={createProfile.isPending}>
              {createProfile.isPending ? 'Creating...' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Conversations</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedConvIds.size} conversation{selectedConvIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSelected} disabled={deleteMultiple.isPending}>
              {deleteMultiple.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAttDialogOpen} onOpenChange={setDeleteAttDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Attachments</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAttIds.size} attachment{selectedAttIds.size !== 1 ? 's' : ''}? This will remove the files permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAttDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSelectedAttachments} disabled={deleteMultipleAttachments.isPending}>
              {deleteMultipleAttachments.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


function AttachmentThumbnail({ att }: { att: ProfileAttachment }) {
  const { data } = trpc.attachment.getSignedUrl.useQuery(
    { key: att.key },
    { staleTime: 50 * 60 * 1000, enabled: !!att.key }
  )

  if (att.mimeType.startsWith('image/') && data?.url) {
    return (
      <img
        src={data.url}
        alt={att.fileName}
        className="w-7 h-7 rounded object-cover border border-border/50"
      />
    )
  }

  return <span>{getFileIcon(att.mimeType)}</span>
}