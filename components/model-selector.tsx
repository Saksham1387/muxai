'use client'

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, Search, Sparkles, Star, Zap, Bot, Brain } from 'lucide-react'
import { SUPPORTED_MODELS, type ModelOption } from '@/lib/config'

interface ModelSelectorProps {
  selectedModel: ModelOption
  onSelectModel: (model: ModelOption) => void
  trigger?: React.ReactNode
}

// Provider icon mapping
const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  auto: <Zap className="w-4 h-4" />,
  google: <img src="/gemini-color.svg" alt="Google" className="w-4 h-4" />,
  openai: <img src="/openai.svg" alt="OpenAI" className="w-4 h-4 rounded-sm bg-foreground/90 p-px" />,
  anthropic: <img src="/anthropic.svg" alt="Anthropic" className="w-4 h-4 rounded-sm bg-foreground/90 p-px" />,
}

// Model descriptions
const MODEL_DESCRIPTIONS: Record<string, string> = {
  'auto': 'Automatically selects the best model',
  'google/gemini-2.0-flash': 'Lightning-fast with surprising capability',
  'google/gemini-1.5-pro': 'Advanced reasoning with multimodal support',
  'openai/gpt-4o-mini': 'Fast and efficient for everyday tasks',
  'openai/gpt-5.2': 'Most advanced reasoning capabilities',
  'anthropic/claude-sonnet-4.5': 'Anthropic\'s most advanced Sonnet yet',
}

export function ModelSelector({ selectedModel, onSelectModel, trigger }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProvider, setSelectedProvider] = useState(
    SUPPORTED_MODELS.find(p => p.models.some(m => m.id === selectedModel.id))?.provider || 'openai/gpt-oss-20b:free:thinking'
  )

  const currentProvider = SUPPORTED_MODELS.find(p => p.provider === selectedProvider)
  const filteredModels = currentProvider?.models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleSelectModel = (model: ModelOption) => {
    onSelectModel(model)
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8 px-3 rounded-full hover:bg-muted"
          >
            {selectedModel.id === 'auto' && <Zap className="w-3.5 h-3.5 text-yellow-500" />}
            <span className="font-medium text-sm">{selectedModel.name}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[500px] p-0" 
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[500px]">
          {/* Search Bar */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Providers */}
            <div className="w-16 border-r bg-muted/20 flex flex-col items-center py-3 gap-1.5">
              {SUPPORTED_MODELS.map((provider) => (
                <button
                  key={provider.provider}
                  onClick={() => setSelectedProvider(provider.provider)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    selectedProvider === provider.provider
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground '
                  }`}
                  title={provider.name}
                >
                  {PROVIDER_ICONS[provider.provider] || <Bot className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Right Side - Models List */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 max-h-[380px]">
                <div className="p-2 space-y-1">
                  {filteredModels.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">No models found</p>
                  ) : (
                    filteredModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleSelectModel(model)}
                        className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 hover:bg-accent/50 ${
                          selectedModel.id === model.id
                            ? 'border-primary bg-accent'
                            : 'border-transparent bg-card hover:border-border'
                        } `}
                        disabled={model.disabled ? true: false}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Model Icon */}
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                              {PROVIDER_ICONS[currentProvider?.provider || 'openai/gpt-oss-20b:free:thinking']}
                            </div>

                            {/* Model Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="font-semibold text-sm text-foreground">
                                  {model.name}
                                </h3>
                                {model.id === 'auto' && (
                                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {MODEL_DESCRIPTIONS[model.id] || 'Advanced AI model'}
                              </p>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {selectedModel.id === model.id && (
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 shrink-0" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
