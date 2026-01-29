'use client'

import { AppSidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useState } from 'react'
import { trpc } from '@/server/client-trpc'

export default function Home() {
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const utils = trpc.useUtils()

  const handleTitleUpdate = (title: string) => {
    // Invalidate the conversations query to refresh the sidebar
    utils.conversation.getAllConversations.invalidate()
  }

  return (
    <SidebarProvider>
      <AppSidebar
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
      />
      <SidebarInset className="flex flex-col h-screen">
        {/* Header with Sidebar Trigger */}
        <header className="flex h-14 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger />
        </header>

        {/* Main Chat Area - fills remaining space */}
        <div className="flex-1 overflow-hidden">
          <Chat
            conversationId={activeConversation || 'new'}
            onTitleUpdate={handleTitleUpdate}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
