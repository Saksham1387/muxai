'use client'

import { AppSidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const [activeConversation, setActiveConversation] = useState<string | null>(conversationId)

  useEffect(() => {
    setActiveConversation(conversationId)
  }, [conversationId])

  const handleSelectConversation = (id: string | null) => {
    if (id) {
      router.push(`/chat/${id}`)
    } else {
      router.push('/')
    }
  }

  const handleNewConversation = (title: string) => {
    // The conversation creation is handled in the sidebar component
    // This function is called when a new conversation is created from the chat
  }

  return (
    <SidebarProvider>
      <AppSidebar
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
      />
      <SidebarInset>
        <div className="flex h-screen bg-background">
          {/* Header with Sidebar Trigger */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
          </header>
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col h-screen">
            <Chat
              conversationId={conversationId}
              onNewConversation={handleNewConversation}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}