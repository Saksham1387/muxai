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
import { Plus, Search, LogOut } from 'lucide-react'
import { useState } from 'react'

interface Conversation {
  id: string
  title: string
  timestamp: Date
}

interface SidebarProps {
  conversations: Conversation[]
  activeConversation: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
}

export function AppSidebar({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewChat,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            onClick={onNewChat}
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
                    onClick={() => onSelectConversation(conv.id)}
                    className="w-full justify-start"
                  >
                    <div className="flex-1 text-left">
                      <div className="truncate font-medium">{conv.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {conv.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Login
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}