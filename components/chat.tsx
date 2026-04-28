'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Bot, Brain, ChevronDown, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { trpc } from '@/server/client-trpc'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { DEFAULT_MODEL } from '@/lib/config'
import { InputModel } from './input-box'
import Markdown from 'react-markdown'

const ReasoningBlock = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-3 border-l-2 border-muted pl-4 py-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Brain className='w-4 h-4'/>
        <span>Reasoning</span>
      </button>
      {isOpen && (
        <div className="mt-2 text-sm text-muted-foreground italic">
          {children}
        </div>
      )}
    </div>
  )
}

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

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
  }), [])

  const { messages, setMessages, sendMessage, status } = useChat({
    transport,
    onFinish: async ({ message, messages: allMessages }) => {
      console.log(message)
      const textContent = message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map(part => part.text)
        .join('')
      
      const reasoningContent = message.parts
        .filter((part): any => part.type === 'reasoning')
        .map((part: any) => part.reasoning || part.text || '')
        .join('')

      await createMessage.mutateAsync({
        content: textContent,
        role: 'assistant',
        model: selectedModel.id,
        conversationId,
        reasoningText: reasoningContent || undefined,
        hasReasoned: !!reasoningContent
      })

      if (!hasTitleBeenGenerated && allMessages.length >= 1) {
        const firstUserMessage = allMessages.find(m => m.role === 'user')
        if (firstUserMessage) {
          const userContent = firstUserMessage.parts
            .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
            .map(part => part.text)
            .join('')

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
      const formattedMessages = conversationWithMessages.messages.map(msg => {
        const parts: any[] = [{ type: 'text' as const, text: msg.content }];
        if (msg.reasoningText) {
          parts.unshift({ type: 'reasoning' as const, text: msg.reasoningText });
        }
        return {
          id: msg.id,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
          parts
        };
      })
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

    sendMessage(
      { text },
      {
        body: {
          model: selectedModel.id,
          conversationId: conversationId,
        },
      },
    )

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
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-start justify-center min-h-[60vh] text-center pl-10">
              <h2 className="text-3xl font-semibold text-foreground mb-8 ">How can I help you, {session?.user.name} ?</h2>
              <div className="space-y-3 w-full max-w-lg">
                {QUICK_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="block w-full text-left text-foreground/80 hover:text-foreground transition-colors py-3.5 px-4 text-base rounded-none hover:bg-muted/50 border-b border-primary/10"
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
                  {/* {message.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )} */}
                  <div
                    className={`max-w-[85%] ${message.role === 'user'
                      ? 'bg-muted text-primary-foreground px-4 py-3 rounded-2xl'
                      : 'text-foreground'
                      }`}
                  >
                    <div className="text-[15px] leading-relaxed">
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return <Markdown key={`${message.id}-${i}`}>{part.text}</Markdown>;
                          case 'reasoning':
                            const reasoningText = (part as any).reasoning || (part as any).text;
                            return reasoningText ? (
                              <ReasoningBlock key={`${message.id}-${i}`}>
                                <Markdown>{reasoningText}</Markdown>
                              </ReasoningBlock>
                            ) : null;
                        }
                      })}
                    </div>
                  </div>
                  {message.role === 'user' && session?.user?.image && (
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0  border border-border/50">
                      <Image
                        src={session.user.image}
                        alt="user"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
              {/* {status === 'loading' && (
                <div className="flex gap-3 justify-start items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 animate-pulse">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted px-4 py-3 rounded-2xl">
                    <div className="flex gap-1.5 items-center h-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )} */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-background px-6 py-4 shrink-0">
       <InputModel handleSubmit={handleSubmit} input={input} selectedModel={selectedModel} setInput={setInput} setSelectedModel={setSelectedModel} textareaRef={textareaRef} isStreaming={isStreaming}/>
      </div>
    </div>
  )
}
