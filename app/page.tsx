'use client'

import { AppSidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useState } from 'react'

interface Conversation {
  id: string
  title: string
  timestamp: Date
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'AI Fundamentals',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: '2',
      title: 'Web Development Tips',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
      id: '3',
      title: 'Machine Learning Basics',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  ])

  const [activeConversation, setActiveConversation] = useState<string | null>(
    conversations[0]?.id || null
  )

  

  const handleNewChat = () => {
    setActiveConversation(null)
  }

  const handleNewConversation = (title: string) => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title,
      timestamp: new Date(),
    }
    setConversations([newConv, ...conversations])
    setActiveConversation(newConv.id)
  }

  return (
    <SidebarProvider>
      <AppSidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
        onNewChat={handleNewChat}
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
              conversationId={activeConversation || 'new'}
              onNewConversation={handleNewConversation}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
