'use client'

import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Send, ChevronDown, Sparkles, RibbonIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { trpc } from '@/server/client-trpc'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

export const SUPPORTED_MODELS = [
  {provider:'openai', name: "OpenAI", models:[
    {id: 'openai/gpt-4o-mini', name: 'GPT-4o-mini'},
    {id: 'openai/gpt-5.2',name:'GPT-5-mini'}
  ]},
  {provider:'anthropic', name: "Anthropic", models:[
    {id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5'},
  ]}
]

const QUICK_PROMPTS = [
  'How does AI work?',
  'Are black holes real?',
  'How many Rs are in the word "strawberry"?',
  'What is the meaning of life?',
]

interface ChatProps {
  conversationId: string
  onNewConversation: (title: string) => void
}

export function Chat({ conversationId, onNewConversation }: ChatProps) {
  const [selectedModel, setSelectedModel] = useState(SUPPORTED_MODELS[0].models[0])
  const [input, setInput] = useState('')
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const {data:session} = useSession()
  const { data: conversationWithMessages, isLoading } = trpc.conversation.getById.useQuery(
    { id: conversationId },
    { enabled: !!conversationId && conversationId !== 'new' }
  )

  const createMessage = trpc.message.createMessage.useMutation()

  const { messages, setMessages, sendMessage } = useChat({
    onFinish: (message) => {
      console.log(message)
      const textContent = message.message.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('')
      
      createMessage.mutateAsync({
        content: textContent,
        role: 'assistant',
        model: selectedModel.id,
        conversationId
      })
    }
  })

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
    } else if (conversationId === 'new') {
      setMessages([])
      setIsFirstMessage(true)
    }
  }, [conversationWithMessages, conversationId, setMessages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    if (isFirstMessage) {
      onNewConversation(text.substring(0, 50))
      setIsFirstMessage(false)
    }

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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h2 className="text-4xl font-bold text-foreground mb-8">How can I help you?</h2>

              {/* Quick Action Buttons */}
              <div className="flex gap-4 mb-12 flex-wrap justify-center">
                <Button
                  variant="outline"
                  className="gap-2 border-border hover:bg-card bg-transparent"
                >
                  <Sparkles className="w-4 h-4" />
                  Create
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-border hover:bg-card bg-transparent"
                >
                  📋 Explore
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-border hover:bg-card bg-transparent"
                >
                  {'<>'} Code
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-border hover:bg-card bg-transparent"
                >
                  📚 Learn
                </Button>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-3 w-full">
                {QUICK_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="block w-full text-left text-foreground hover:text-accent transition-colors py-2 text-lg"
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
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-lg px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'text-primary-foreground'
                        : 'bg-card text-foreground border border-border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {message.role === 'user' ? <div>
                        <Image src={session?.user.image || ""} alt="user-avatar" width={30} height={30} className='rounded-full'/>
                      </div> : <div>
                        <RibbonIcon/>
                        </div>}
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return <div key={`${message.id}-${i}`}>{part.text}</div>;
                        }
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className=" border-border bg-background px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Large Input Box with Model Selector */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Text Area */}
            <form onSubmit={handleSubmit}>
              <div className="p-3 pb-2">
                <textarea
                  placeholder="Type your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none min-h-[60px] max-h-[150px]"
                  rows={2}
                />
              </div>
              
              {/* Bottom Bar with Model Selector and Send */}
              <div className="flex items-center justify-between p-2 pt-1 border-t border-border bg-muted/30">
                {/* Model Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Model:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-auto p-1 text-foreground hover:bg-card/80 text-xs"
                      >
                        <span className="font-medium">{selectedModel.name}</span>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border max-h-80 overflow-y-auto">
                      {SUPPORTED_MODELS.map((provider) => (
                        <div key={provider.provider}>
                          {/* Provider Header */}
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {provider.name}
                          </div>
                          
                          {/* Provider Models */}
                          {provider.models.map((model) => (
                            <DropdownMenuItem
                              key={model.id}
                              onClick={() => setSelectedModel(model)}
                              className={`cursor-pointer pl-6 ${selectedModel.id === model.id ? 'bg-accent' : ''}`}
                            >
                              <div>
                                <div className="font-medium text-foreground">{model.name}</div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={!input.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
