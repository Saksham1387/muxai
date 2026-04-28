import { Forward, Paperclip } from "lucide-react"
import { ModelSelector } from "./model-selector"
import { Button } from "./ui/button"

interface InputModelProps {
    input: string
  setInput: (value: string) => void
   selectedModel: { id: string; name: string }
    setSelectedModel: (model: { id: string; name: string }) => void
   handleSubmit: (e: React.FormEvent) => void
     isStreaming: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  isLoggedIn: boolean
}

export const InputModel = ({handleSubmit,input,
    setInput,setSelectedModel,selectedModel,isStreaming,textareaRef,isLoggedIn
}:InputModelProps) => {
    return (

        <div className="max-w-3xl mx-auto">
        <form onSubmit={isLoggedIn ? handleSubmit : (e) => e.preventDefault()}>
          {/* Single unified input box */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Text Area */}
            <textarea
              ref={textareaRef}
              placeholder={isLoggedIn ? "Type your message here..." : "Sign in to start chatting..."}
              value={input}
              disabled={!isLoggedIn}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && isLoggedIn) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none px-4 pt-4 pb-2 text-[15px] min-h-[56px] disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
              style={{ maxHeight: '200px' }}
            />

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-between px-3 py-2.5  border-border/50 ">
              <div className="flex items-center gap-2">
                {/* Model Selector */}
                <ModelSelector
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                />

                {/* Attachment Button */}
                {/* <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                >
                  <Paperclip className="w-4 h-4" />
                </Button> */}
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                size="sm"
                disabled={!isLoggedIn || !input.trim() || isStreaming}
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