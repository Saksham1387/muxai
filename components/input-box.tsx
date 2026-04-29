import { Forward, Paperclip, X, FileText, ImageIcon, Film, Music } from "lucide-react"
import { ModelSelector } from "./model-selector"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useRef } from "react"
import type { ModelOption } from "@/lib/config"

export type PendingAttachment = {
  id: string
  file: File
  fileName: string
  mimeType: string
  size: number
  key: string
  url: string
  status: 'uploading' | 'ready' | 'error'
  preview?: string
}

interface InputModelProps {
  input: string
  setInput: (value: string) => void
  selectedModel: ModelOption
  setSelectedModel: (model: ModelOption) => void
  handleSubmit: (e: React.FormEvent) => void
  isStreaming: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  isLoggedIn: boolean
  pendingAttachments: PendingAttachment[]
  onAddAttachments: (files: FileList) => void
  onRemoveAttachment: (id: string) => void
  supportsImage: boolean
}

function getFileIcon(mimeType: string) {
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

export const InputModel = ({
  handleSubmit, input, setInput, setSelectedModel, selectedModel,
  isStreaming, textareaRef, isLoggedIn,
  pendingAttachments, onAddAttachments, onRemoveAttachment, supportsImage
}: InputModelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasUploading = pendingAttachments.some(a => a.status === 'uploading')

  return (
    <div className="max-w-3xl mx-auto">
        <form onSubmit={isLoggedIn && !isStreaming ? handleSubmit : (e) => e.preventDefault()}>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Attachment Previews */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {pendingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`group relative flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2 text-sm max-w-[220px] ${
                    attachment.status === 'error' ? 'border-destructive/50 bg-destructive/5' : ''
                  }`}
                >
                  {attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.fileName}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <span className="text-muted-foreground shrink-0">
                      {getFileIcon(attachment.mimeType)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {attachment.status === 'uploading' ? 'Uploading...' : formatFileSize(attachment.size)}
                    </p>
                  </div>
                  {attachment.status === 'uploading' && (
                    <div className="absolute inset-0 bg-background/40 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            placeholder={isLoggedIn ? "Type your message here..." : "Sign in to start chatting..."}
            value={input}
            disabled={!isLoggedIn}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && isLoggedIn && !isStreaming) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none px-4 pt-4 pb-2 text-[15px] min-h-[56px] disabled:cursor-not-allowed disabled:opacity-50"
            rows={1}
            style={{ maxHeight: '200px' }}
          />

          {/* Bottom Controls Bar */}
          <div className="flex items-center justify-between px-3 py-2.5 border-border/50">
            <div className="flex items-center gap-2">
              <ModelSelector
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
              />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onAddAttachments(e.target.files)
                    e.target.value = ''
                  }
                }}
              />
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        type="button"
                        variant="outline"
                        
                        className="hover:bg-muted border-primary/70 border bg-transparent"
                        disabled={!isLoggedIn || !supportsImage}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="w-4 h-4" /> Attach
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!supportsImage && (
                    <TooltipContent side="top" className="text-xs">
                      <p>This model doesn&apos;t support attachments. Select a different model.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={!isLoggedIn || (!input.trim() && pendingAttachments.length === 0) || isStreaming || hasUploading}
              className="h-8 w-8 p-0 rounded-md"
            >
              <Forward className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
