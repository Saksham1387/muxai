'use client'
import { AppSidebar } from '@/components/sidebar'
import { Chat } from '@/components/chat'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { useEffect, useState } from 'react'
import { trpc } from '@/server/client-trpc'

export default function Home() {
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const utils = trpc.useUtils()
  
  const { data: profiles } = trpc.profile.listProfiles.useQuery()

  useEffect(() => {
    if (profiles && profiles.length > 0 && !activeProfileId) {
      setActiveProfileId(profiles[0].id)
    }
  }, [profiles, activeProfileId])

  const handleTitleUpdate = (title: string) => {
    utils.conversation.getAllConversations.invalidate()
  }

  return (
    <SidebarProvider>
      <AppSidebar
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
        activeProfileId={activeProfileId}
        onSelectProfile={setActiveProfileId}
      />
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
        </header>

        <div className="flex-1 overflow-hidden">
          <Chat
            conversationId={activeConversation || 'new'}
            activeProfileId={activeProfileId}
            onTitleUpdate={handleTitleUpdate}
            onConversationCreated={(id) => {
              setActiveConversation(id)
              utils.conversation.getAllConversations.invalidate()
            }}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
