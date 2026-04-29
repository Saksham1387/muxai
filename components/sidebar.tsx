'use client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import { Search, LogOut, Trash2, PanelLeft, MessageSquareDot, Brain, ChevronUp, User } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/server/client-trpc'
import { NavUser } from './nav-user'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  activeConversation: string | null
  onSelectConversation: (id: string | null) => void
  activeProfileId: string | null
  onSelectProfile: (id: string) => void
}

function groupConversationsByTime(conversations: { id: string; title: string; createdAt: Date }[]) {
  const now = new Date()
  const dayMs = 86400000
  const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs)

  const groups: { label: string; items: typeof conversations }[] = []

  const last7 = conversations.filter(c => new Date(c.createdAt) >= sevenDaysAgo)
  const last30 = conversations.filter(
    c => new Date(c.createdAt) < sevenDaysAgo && new Date(c.createdAt) >= thirtyDaysAgo
  )
  const older = conversations.filter(c => new Date(c.createdAt) < thirtyDaysAgo)

  if (last7.length) groups.push({ label: 'Last 7 Days', items: last7 })
  if (last30.length) groups.push({ label: 'Last 30 Days', items: last30 })
  if (older.length) groups.push({ label: 'Older', items: older })

  return groups
}

export function AppSidebar({
  activeConversation,
  onSelectConversation,
  activeProfileId,
  onSelectProfile,
}: SidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toggleSidebar } = useSidebar()
  const [searchQuery, setSearchQuery] = useState('')

  const utils = trpc.useUtils()

  const { data: conversations = [] } = trpc.conversation.getAllConversations.useQuery()
  const { data: profiles = [] } = trpc.profile.listProfiles.useQuery(undefined, {
    enabled: !!session?.user
  })
  
  // Auto-select first profile if none selected
  useEffect(() => {
    if (profiles.length > 0 && !activeProfileId) {
      onSelectProfile(profiles[0].id)
    }
  }, [profiles, activeProfileId, onSelectProfile])

  const activeProfile = useMemo(() => 
    profiles.find(p => p.id === activeProfileId) || profiles[0]
  , [profiles, activeProfileId])

  const createConversation = trpc.conversation.createConversation.useMutation()
  const deleteConversation = trpc.conversation.deleteConversation.useMutation()

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped = useMemo(
    () => groupConversationsByTime(filteredConversations),
    [filteredConversations]
  )


  const handleNewChat = async () => {
    try {
      const result = await createConversation.mutateAsync({ title: 'New Chat' , profileId: activeProfileId! })
      router.push(`/chat/${result.id}`)
      onSelectConversation(result.id)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation()

    try {
      await deleteConversation.mutateAsync({ id: convId })
      await utils.conversation.getAllConversations.invalidate()
      toast.success('Conversation deleted')
      if (activeConversation === convId) {
        router.push('/')
        onSelectConversation(null)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  return (
    <Sidebar>
      {/* Header: toggle | title | settings */}
      <SidebarHeader className="px-3 pt-3 pb-0">
        <div className="flex items-center">
          {/* <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button> */}
          <div className="flex-1 flex justify-center gap-x-2">
          <MessageSquareDot className='h-5 w-5'/>
            <h1 className="text-base font-semibold tracking-tight pr-7">Muxai</h1>
           
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pt-3">
        {/* New Chat */}
        <Button
          onClick={handleNewChat}
          disabled={createConversation.isPending}
          className="w-full h-9 relative overflow-hidden bg-primary/80 hover:bg-primary text-white rounded-lg text-sm font-medium shadow-md
            before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:via-primary/50 before:to-transparent
            after:content-[''] after:absolute after:inset-0 after:rounded-lg after:shadow-inner after:shadow-primary/20"
        >
          New Chat
        </Button>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search your threads..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-sidebar-foreground placeholder:text-muted-foreground pl-6 pr-2 py-1.5 border-b border-sidebar-border focus:outline-none focus:border-sidebar-primary transition-colors"
          />
        </div>

        {/* Conversations grouped by time */}
        <ScrollArea className="flex-1 mt-2 mx-1">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conversations yet
            </p>
          ) : (
            <SidebarMenu>
              {grouped.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-primary px-2 pt-4 pb-1.5">
                    {group.label}
                  </p>
                  {group.items.map(conv => (
                    <SidebarMenuItem key={conv.id}>
                      <div className="relative group/item flex items-center">
                        <SidebarMenuButton
                          isActive={activeConversation === conv.id}
                          onClick={() => {
                            router.push(`/chat/${conv.id}`)
                            onSelectConversation(conv.id)
                          }}
                          className="w-full h-8 px-2 pr-7"
                        >
                          <span className="truncate text-sm">{conv.title}</span>
                        </SidebarMenuButton>
                        <button
                          onClick={e => handleDeleteConversation(e, conv.id)}
                          className="absolute right-1 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-in-out p-0.5 hover:bg-destructive/20 rounded shrink-0"
                          disabled={deleteConversation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </div>
              ))}
            </SidebarMenu>
          )}
        </ScrollArea>
      </SidebarContent>

      {/* Footer: avatar left, add-user right */}
      <SidebarFooter className="px-3 pb-3 pt-2">
        {session?.user ? (
          <div className="flex flex-col gap-2">
            {/* Profile Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors text-left">
                  <div className="w-5 h-5 rounded-full border border-primary/50 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <span className="truncate flex-1">
                    {activeProfile?.name || 'Loading profile...'}
                  </span>
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[200px]">
                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Profile
                </p>
                {profiles.map((profile) => (
                  <DropdownMenuItem 
                    key={profile.id}
                    onClick={() => onSelectProfile(profile.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full ${profile.id === activeProfileId ? 'bg-primary' : 'bg-transparent'}`} />
                    {profile.name}
                  </DropdownMenuItem>
                ))}
                {profiles.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground italic">
                    No profiles found
                  </p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center justify-between">
              <NavUser user={{
                image: session.user.image || null,
                name: session.user.name || null,
                email: session.user.email || null,
              }} />
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={() => (window.location.href = '/auth')}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Login
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
