'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type FileUIPart } from 'ai'
import { Brain, ChevronDown, ChevronRight, FileText, ImageIcon, Film, Music, Download } from 'lucide-react'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { trpc } from '@/server/client-trpc'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { DEFAULT_MODEL } from '@/lib/config'
import { InputModel, type PendingAttachment } from './input-box'
import Markdown from 'react-markdown'
import { useRouter } from 'next/navigation'

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
  activeProfileId?: string | null
  onTitleUpdate?: (title: string) => void
  onConversationCreated?: (id: string) => void
}

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
  if (mimeType.startsWith('video/')) return <Film className="w-4 h-4" />
  if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />
  return <FileText className="w-4 h-4" />
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentDisplay({ att }: { att: StoredAttachment }) {
  const { data, isLoading } = trpc.attachment.getSignedUrl.useQuery(
    { key: att.key },
    { staleTime: 50 * 60 * 1000 } // cache for 50 min (URL valid for 60)
  )

  const url = data?.url

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
        {getFileIcon(att.mimeType)}
        <span className="max-w-[120px] truncate">{att.fileName}</span>
        <span className="animate-pulse">Loading...</span>
      </div>
    )
  }

  if (!url) return null

  if (att.mimeType.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img
          src={url}
          alt={att.fileName}
          className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-border/50"
        />
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
    >
      {getFileIcon(att.mimeType)}
      <span className="max-w-[120px] truncate">{att.fileName}</span>
      <span className="text-muted-foreground">{formatFileSize(att.size)}</span>
      <Download className="w-3 h-3 text-muted-foreground" />
    </a>
  )
}

export type StoredAttachment = {
  id: string
  fileName: string
  mimeType: string
  size: number
  key: string
  url: string
}

export function Chat({ conversationId, activeProfileId, onTitleUpdate, onConversationCreated }: ChatProps) {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [input, setInput] = useState('')
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const [hasTitleBeenGenerated, setHasTitleBeenGenerated] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [messageAttachments, setMessageAttachments] = useState<Record<string, StoredAttachment[]>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { data: session } = useSession()
  const utils = trpc.useUtils()
  const router = useRouter()

  const { data: conversationWithMessages, isLoading } = trpc.conversation.getById.useQuery(
    { id: conversationId },
    { enabled: !!conversationId && conversationId !== 'new' }
  )

  const createMessage = trpc.message.createMessage.useMutation()
  const createConversation = trpc.conversation.createConversation.useMutation()
  const updateTitle = trpc.conversation.updateTitle.useMutation({
    onSuccess: () => {
      utils.conversation.getAllConversations.invalidate()
    }
  })

  const handleAddAttachments = useCallback(async (files: FileList) => {
    const newAttachments: PendingAttachment[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      key: '',
      url: '',
      status: 'uploading' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))

    setPendingAttachments(prev => [...prev, ...newAttachments])

    for (const attachment of newAttachments) {
      try {
        const key = `attachments/${Date.now()}-${attachment.fileName}`

        const formData = new FormData()
        formData.append('file', attachment.file)
        formData.append('key', key)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Failed to upload file')
        const { url } = await res.json()

        setPendingAttachments(prev =>
          prev.map(a =>
            a.id === attachment.id
              ? { ...a, status: 'ready' as const, key, url }
              : a
          )
        )
      } catch (error) {
        console.error('Upload failed:', error)
        setPendingAttachments(prev =>
          prev.map(a =>
            a.id === attachment.id ? { ...a, status: 'error' as const } : a
          )
        )
      }
    }
  }, [])

  const handleRemoveAttachment = useCallback((id: string) => {
    setPendingAttachments(prev => {
      const attachment = prev.find(a => a.id === id)
      if (attachment?.preview) URL.revokeObjectURL(attachment.preview)
      return prev.filter(a => a.id !== id)
    })
  }, [])

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
  }), [])

  const { messages, setMessages, sendMessage, status } = useChat({
    transport,
    onFinish: async ({ message, messages: allMessages }) => {
      console.log(message)
      if (conversationId === 'new') return; // Don't save if we don't have an ID yet

      const textContent = message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map(part => part.text)
        .join('')
      
      const reasoningContent = message.parts
        .filter((part): any => part.type === 'reasoning')
        .map((part: any) => part.reasoning || part.text || '')
        .join('')

      try {
        await createMessage.mutateAsync({
          content: textContent,
          role: 'assistant',
          model: selectedModel.id,
          conversationId,
          reasoningText: reasoningContent || undefined,
          hasReasoned: !!reasoningContent
        })
      } catch (error) {
        console.error('Failed to save assistant message:', error)
      }

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
    if (conversationWithMessages?.messages) {
      const attachmentsMap: Record<string, StoredAttachment[]> = {}
      const formattedMessages = conversationWithMessages.messages.map(msg => {
        const parts: any[] = [{ type: 'text' as const, text: msg.content }];
        if (msg.reasoningText) {
          parts.unshift({ type: 'reasoning' as const, text: msg.reasoningText });
        }
        if ((msg as any).attachments && (msg as any).attachments.length > 0) {
          attachmentsMap[msg.id] = (msg as any).attachments
        }
        return {
          id: msg.id,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
          parts
        };
      })
      setMessageAttachments(attachmentsMap)
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
    if (!text.trim() && pendingAttachments.length === 0) return

    const readyAttachments = pendingAttachments.filter(a => a.status === 'ready')
    const attachmentsPayload = readyAttachments.map(a => ({
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
      key: a.key,
      url: a.url,
    }))

    setIsFirstMessage(false)
    let currentConversationId = conversationId

    if (currentConversationId === 'new') {
      if (!activeProfileId) {
        console.error('No active profile selected')
        return
      }
      try {
        const newConversation = await createConversation.mutateAsync({
          title: 'New Chat',
          profileId: activeProfileId
        })
        currentConversationId = newConversation.id
        onConversationCreated?.(currentConversationId)
        
        const savedMsg = await createMessage.mutateAsync({
          content: text || '(attachment)',
          role: 'user',
          model: selectedModel.id,
          conversationId: currentConversationId,
          attachments: attachmentsPayload.length > 0 ? attachmentsPayload : undefined,
        })

        if (savedMsg && attachmentsPayload.length > 0) {
          setMessageAttachments(prev => ({
            ...prev,
            [savedMsg.id]: (savedMsg as any).attachments || attachmentsPayload.map((a, i) => ({ ...a, id: `temp-${i}`, messageId: savedMsg.id })),
          }))
        }
        
        router.push(`/chat/${currentConversationId}`)
      } catch (error) {
        console.error('Failed to create conversation or save message:', error)
        return
      }
    } else {
      try {
        const savedMsg = await createMessage.mutateAsync({
          content: text || '(attachment)',
          role: 'user',
          model: selectedModel.id,
          conversationId: currentConversationId,
          attachments: attachmentsPayload.length > 0 ? attachmentsPayload : undefined,
        })

        if (savedMsg && attachmentsPayload.length > 0) {
          setMessageAttachments(prev => ({
            ...prev,
            [savedMsg.id]: (savedMsg as any).attachments || attachmentsPayload.map((a, i) => ({ ...a, id: `temp-${i}`, messageId: savedMsg.id })),
          }))
        }
      } catch (error) {
        console.error('Failed to save user message:', error)
      }
    }

    // Build FileUIPart[] for the AI SDK so attachments are sent to the model
    const fileParts: FileUIPart[] = readyAttachments
      .filter(a => a.url)
      .map(a => ({
        type: 'file' as const,
        filename: a.fileName,
        mediaType: a.mimeType,
        url: a.url,
      }))

    // Clear pending attachments (only stored in DB after message sent)
    pendingAttachments.forEach(a => {
      if (a.preview) URL.revokeObjectURL(a.preview)
    })
    setPendingAttachments([])

    sendMessage(
      {
        text: text || '(attachment)',
        ...(fileParts.length > 0 ? { files: fileParts } : {}),
      },
      {
        body: {
          model: selectedModel.id,
          conversationId: currentConversationId,
          profileId: activeProfileId,
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
                    {/* Attachments */}
                    {messageAttachments[message.id] && messageAttachments[message.id].length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {messageAttachments[message.id].map((att) => (
                          <div key={att.id} className="group/att relative">
                            <AttachmentDisplay att={att} />
                          </div>
                        ))}
                      </div>
                    )}
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
                          case 'file':
                            const filePart = part as any;
                            if (filePart.mediaType?.startsWith('image/')) {
                              return (
                                <a key={`${message.id}-${i}`} href={filePart.url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={filePart.url}
                                    alt={filePart.filename || 'attachment'}
                                    className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-border/50 my-1"
                                  />
                                </a>
                              );
                            }
                            return (
                              <a
                                key={`${message.id}-${i}`}
                                href={filePart.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs hover:bg-muted/50 transition-colors my-1"
                              >
                                {getFileIcon(filePart.mediaType || '')}
                                <span className="max-w-[120px] truncate">{filePart.filename || 'file'}</span>
                                <Download className="w-3 h-3 text-muted-foreground" />
                              </a>
                            );
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
              {status === 'submitted' && (
                <div className="flex gap-3 justify-start items-start">
                  <div className="flex items-center gap-1 px-1 py-3">
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-background px-6 py-4 shrink-0">
       <InputModel handleSubmit={handleSubmit} input={input} selectedModel={selectedModel} setInput={setInput} setSelectedModel={setSelectedModel} textareaRef={textareaRef} isStreaming={isStreaming} isLoggedIn={!!session} pendingAttachments={pendingAttachments} onAddAttachments={handleAddAttachments} onRemoveAttachment={handleRemoveAttachment}/>
      </div>
    </div>
  )
}
