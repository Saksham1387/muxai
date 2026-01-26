'use client'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Plus, Search, LogOut, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { NavUser } from './nav-user'
import { trpc } from '@/server/client-trpc'

interface Conversation {
  id: string
  title: string
  createdAt: Date
}

interface SidebarProps {
  activeConversation: string | null
  onSelectConversation: (id: string | null) => void
}

export function AppSidebar({
  activeConversation,
  onSelectConversation,
}: SidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: conversations = [], isLoading } = trpc.conversation.getAllConversations.useQuery()
  const createConversation = trpc.conversation.createConversation.useMutation()
  const deleteConversation = trpc.conversation.deleteConversation.useMutation()

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewChat = async () => {
    try {
      const result = await createConversation.mutateAsync({
        title: 'New Chat'
      })
      router.push(`/chat/${result.id}`)
      onSelectConversation(result.id)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return
    }
    
    try {
      await deleteConversation.mutateAsync({ id: convId })
      if (activeConversation === convId) {
        router.push('/')
        onSelectConversation(null)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Muxai</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* New Chat Button */}
        <div className="p-2">
          <Button
            onClick={handleNewChat}
            disabled={createConversation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="px-2 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <SidebarInput
              placeholder="Search your threads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          <SidebarMenu>
            {filteredConversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 px-3">
                No conversations yet
              </p>
            ) : (
               filteredConversations.map(conv => (
                 <SidebarMenuItem key={conv.id}>
                   <SidebarMenuButton
                     isActive={activeConversation === conv.id}
                     onClick={() => {
                       router.push(`/chat/${conv.id}`)
                       onSelectConversation(conv.id)
                     }}
                     className="w-full justify-between group"
                   >
                     <div className="flex-1 text-left">
                       <div className="truncate font-medium">{conv.title}</div>
                     </div>
                     <button
                       onClick={(e) => handleDeleteConversation(e, conv.id)}
                       className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                       disabled={deleteConversation.isPending}
                     >
                       <Trash2 className="w-4 h-4 text-red-500" />
                     </button>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))
            )}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {session?.user ? (
          <NavUser 
            user={{
              name:session.user?.name!,
              avatar:session.user?.image!,
              email:session.user?.email!
            }}
          />
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => window.location.href = '/auth'}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Login
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}