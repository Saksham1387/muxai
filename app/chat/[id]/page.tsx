'use client'
import { AppSidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { trpc } from '@/server/client-trpc'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const [activeConversation, setActiveConversation] = useState<string | null>(conversationId)
  const utils = trpc.useUtils()

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

  const handleTitleUpdate = (title: string) => {
    utils.conversation.getAllConversations.invalidate()
  }

  return (
    <SidebarProvider>
      <AppSidebar
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
      />
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>

        <div className="flex-1 overflow-hidden">
          <Chat
            conversationId={conversationId}
            onTitleUpdate={handleTitleUpdate}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
