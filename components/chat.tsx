'use client'

import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Send, Bot, Paperclip } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/server/client-trpc'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { DEFAULT_MODEL } from '@/lib/config'
import { ModelSelector } from '@/components/model-selector'

const QUICK_PROMPTS = [
  'How does AI work?',
  'Are black holes real?',
  'How many Rs are in the word "strawberry"?',
  'What is the meaning of life?',
]

interface ChatProps {
  conversationId: string
  onTitleUpdate?: (title: string) => void
}

export function Chat({ conversationId, onTitleUpdate }: ChatProps) {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [input, setInput] = useState('')
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const [hasTitleBeenGenerated, setHasTitleBeenGenerated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { data: session } = useSession()
  const utils = trpc.useUtils()

  const { data: conversationWithMessages, isLoading } = trpc.conversation.getById.useQuery(
    { id: conversationId },
    { enabled: !!conversationId && conversationId !== 'new' }
  )

  const createMessage = trpc.message.createMessage.useMutation()
  const updateTitle = trpc.conversation.updateTitle.useMutation({
    onSuccess: () => {
      utils.conversation.getAllConversations.invalidate()
    }
  })

  const { messages, setMessages, sendMessage, status } = useChat({
    onFinish: async (message) => {
      console.log(message)
      const textContent = message.message.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('')

      await createMessage.mutateAsync({
        content: textContent,
        role: 'assistant',
        model: selectedModel.id,
        conversationId
      })

      // Auto-generate title after first assistant response
      if (!hasTitleBeenGenerated && messages.length >= 1) {
        const firstUserMessage = messages.find(m => m.role === 'user')
        if (firstUserMessage) {
          const userContent = firstUserMessage.parts
            .filter(part => part.type === 'text')
            .map(part => part.text)
            .join('')

          // Generate a smart title from the first message
          const generatedTitle = generateTitle(userContent, textContent)

          try {
            await updateTitle.mutateAsync({
              id: conversationId,
              title: generatedTitle
            })
            setHasTitleBeenGenerated(true)
            onTitleUpdate?.(generatedTitle)
          } catch (error) {
            console.error('Failed to update title:', error)
          }
        }
      }
    }
  })

  // Generate a concise title from the conversation
  function generateTitle(userMessage: string, assistantResponse: string): string {
    // Try to create a meaningful title from the user's first message
    const cleanedMessage = userMessage.trim()

    // If it's a question, use the first part
    if (cleanedMessage.includes('?')) {
      const questionPart = cleanedMessage.split('?')[0] + '?'
      return questionPart.length > 40 ? questionPart.substring(0, 37) + '...' : questionPart
    }

    // For statements, extract key topic
    const words = cleanedMessage.split(' ')
    if (words.length <= 5) {
      return cleanedMessage
    }

    // Take first 5-6 meaningful words
    const title = words.slice(0, 6).join(' ')
    return title.length > 40 ? title.substring(0, 37) + '...' : title
  }

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Load conversation messages when conversation changes
  useEffect(() => {
    console.log('Debug - conversationId:', conversationId)
    console.log('Debug - conversationWithMessages:', conversationWithMessages)

    if (conversationWithMessages?.messages) {
      console.log('Debug - raw messages:', conversationWithMessages.messages)
      const formattedMessages = conversationWithMessages.messages.map(msg => ({
        id: msg.id,
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
        parts: [{ type: 'text' as const, text: msg.content }]
      }))
      console.log('Debug - formattedMessages:', formattedMessages)
      setMessages(formattedMessages)
      setIsFirstMessage(conversationWithMessages.messages.length === 0)
      setHasTitleBeenGenerated(conversationWithMessages.title !== 'New Chat')
    } else if (conversationId === 'new') {
      setMessages([])
      setIsFirstMessage(true)
      setHasTitleBeenGenerated(false)
    }
  }, [conversationWithMessages, conversationId, setMessages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    setIsFirstMessage(false)

    // Save user message to database if we have a valid conversation
    if (conversationId && conversationId !== 'new') {
      try {
        await createMessage.mutateAsync({
          content: text,
          role: 'user',
          model: selectedModel.id,
          conversationId
        })
      } catch (error) {
        console.error('Failed to save user message:', error)
      }
    }

    sendMessage({
      text,
      metadata: {
        model: selectedModel.id,
        conversationId: conversationId
      }
    })

    setInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(input)
  }

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt)
  }

  const isStreaming = status === 'streaming'

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h2 className="text-3xl font-semibold text-foreground mb-8">How can I help you?</h2>
              {/* Quick Prompts */}
              <div className="space-y-3 w-full max-w-lg">
                {QUICK_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors py-2 text-base"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-xl px-4 py-3 rounded-2xl ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                      }`}
                  >
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return <span key={`${message.id}-${i}`}>{part.text}</span>;
                        }
                      })}
                    </div>
                  </div>
                  {message.role === 'user' && session?.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="user"
                      width={32}
                      height={32}
                      className="rounded-full shrink-0 mt-0.5"
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="bg-background px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            {/* Single unified input box */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Text Area */}
              <textarea
                ref={textareaRef}
                placeholder="Type your message here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none px-4 pt-4 pb-2 text-[15px] min-h-[80px]"
                rows={1}
                style={{ maxHeight: '200px' }}
              />

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  {/* Model Selector */}
                  <ModelSelector
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                  />

                  {/* Attachment Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>

                {/* Send Button */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isStreaming}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
