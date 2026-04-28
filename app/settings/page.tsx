'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  ChevronDown,
  Plus,
  X
} from 'lucide-react'
import { DEFAULT_MODEL } from '@/lib/config'
import { trpc } from '@/server/client-trpc'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const TABS = [
  'Account',
  'Customization'
] as const

type Tab = (typeof TABS)[number]

const SUGGESTED_TRAITS = ['friendly', 'witty', 'concise', 'curious', 'empathetic', 'creative', 'patient']

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Account')
  const utils = trpc.useUtils()

  // Customization state
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [occupation, setOccupation] = useState('')
  const [traits, setTraits] = useState<string[]>([])
  const [traitInput, setTraitInput] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL.id)
  const traitInputRef = useRef<HTMLInputElement>(null)

  // Profile creation state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  const { data: profiles } = trpc.profile.listProfiles.useQuery(undefined, {
    enabled: status === 'authenticated'
  })

  // Auto-select first profile on load
  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfileId) {
      handleProfileSelect(profiles[0])
    }
  }, [profiles])

  const createProfile = trpc.profile.createProfile.useMutation({
    onSuccess: (newProfile) => {
      utils.profile.listProfiles.invalidate()
      setSelectedProfileId(newProfile.id)
      setDisplayName('')
      setOccupation('')
      setTraits([])
      setAdditionalInfo('')
      setIsDialogOpen(false)
      setNewProfileName('')
      toast.success('New profile created')
    }
  })

  const updatePreferences = trpc.profile.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Preferences saved')
    }
  })

  const handleProfileSelect = (profile: any) => {
    setSelectedProfileId(profile.id)
    const prefs = profile.prefrences as any
    if (prefs) {
      setDisplayName(prefs.userName || '')
      setOccupation(prefs.userOccupation || '')
      setTraits(prefs.preferredTraits ? prefs.preferredTraits.split(',').filter(Boolean) : [])
      setAdditionalInfo(prefs.userDescription || '')
    } else {
      setDisplayName('')
      setOccupation('')
      setTraits([])
      setAdditionalInfo('')
    }
  }

  const handleSave = async () => {
    if (!selectedProfileId) {
      toast.error('Please select or create a profile first')
      return
    }

    try {
      await updatePreferences.mutateAsync({
        id: selectedProfileId,
        userName: displayName,
        userOccupation: occupation,
        preferredTraits: traits.join(','),
        userDescription: additionalInfo
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
    }
  }

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Profile name is required')
      return
    }
    await createProfile.mutateAsync({ name: newProfileName })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const user = session?.user

  const addTrait = (trait: string) => {
    const trimmed = trait.trim().toLowerCase()
    if (trimmed && !traits.includes(trimmed) && traits.length < 10) {
      setTraits([...traits, trimmed])
      setTraitInput('')
    }
  }

  const removeTrait = (trait: string) => {
    setTraits(traits.filter(t => t !== trait))
  }

  const handleTraitKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && traitInput.trim()) {
      e.preventDefault()
      addTrait(traitInput)
    }
    if (e.key === 'Backspace' && !traitInput && traits.length > 0) {
      setTraits(traits.slice(0, -1))
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground ">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => router.push('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>

      <div className="flex  mx-auto min-h-[calc(100vh-49px)] justify-center ">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 border-r border-border p-6 flex flex-col">
          {/* User info */}
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
              <AvatarFallback className="text-xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-semibold text-lg">{user?.name || 'Guest'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
            <span className="mt-1.5 text-xs bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground">
              Free Plan
            </span>
          </div>

          {/* <Separator className="mb-6" /> */}

          {/* Usage */}
          {/* <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Usage Limits</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Base</p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '35%' }} />
            </div>
          </div> */}

          {/* <Separator className="mb-6" /> */}

          {/* Keyboard shortcuts */}
          {/* <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2.5">
              {SHORTCUTS.map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <div className="flex gap-0.5">
                    {s.keys.map((k, i) => (
                      <kbd
                        key={i}
                        className="min-w-[22px] h-5 flex items-center justify-center text-[10px] font-medium bg-muted border border-border rounded px-1"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="text-xs text-primary hover:underline mt-3">
              Customize shortcuts
            </button>
          </div> */}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 max-w-3xl">
          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-border">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'Account' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="max-w-md bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Connected via Google sign-in
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Display Name</label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="max-w-md bg-muted/50"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Customization' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Customize Muxai</h2>

              <div className="space-y-6">
               
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Profile</label>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="w-3 h-3 rounded-full border-2 border-primary" />
                          <span className="text-sm">
                            {profiles?.find(p => p.id === selectedProfileId)?.name || 'Select a profile'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        {profiles?.map((profile) => (
                          <DropdownMenuItem 
                            key={profile.id}
                            onClick={() => handleProfileSelect(profile)}
                          >
                            {profile.name}
                          </DropdownMenuItem>
                        ))}
                        {profiles?.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No profiles found</div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0 h-10 w-10"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

               
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    What should Muxai call you?
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your name"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      maxLength={50}
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {displayName.length}/50
                    </span>
                  </div>
                </div>

                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">What do you do?</label>
                  <div className="relative">
                    <Input
                      placeholder="Engineer, student, etc."
                      value={occupation}
                      onChange={e => setOccupation(e.target.value)}
                      maxLength={100}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {occupation.length}/100
                    </span>
                  </div>
                </div>

               
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    What traits should Muxai have?
                  </label>
                  <div className="relative">
                    <Input
                      ref={traitInputRef}
                      placeholder="Type a trait and press Enter or Tab..."
                      value={traitInput}
                      onChange={e => setTraitInput(e.target.value)}
                      onKeyDown={handleTraitKeyDown}
                      maxLength={100}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {traits.length}/10
                    </span>
                  </div>

                 
                  {traits.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {traits.map(trait => (
                        <span
                          key={trait}
                          className="inline-flex items-center gap-1 bg-primary/15 text-primary text-sm px-2.5 py-1 rounded-full"
                        >
                          {trait}
                          <button
                            onClick={() => removeTrait(trait)}
                            className="hover:text-primary/70 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                 
                  <div className="flex flex-wrap gap-2 mt-3">
                    {SUGGESTED_TRAITS.filter(t => !traits.includes(t)).map(trait => (
                      <button
                        key={trait}
                        onClick={() => addTrait(trait)}
                        className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {trait}
                        <Plus className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>

               
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Anything else Muxai should know about you?
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Interests, values, or preferences to keep in mind"
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                      maxLength={3000}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px] min-h-[120px]"
                    />
                    <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                      {additionalInfo.length}/3000
                    </span>
                  </div>
                </div>

               
                <div className="flex justify-end">
                  <Button 
                    className="px-6" 
                    onClick={handleSave}
                    disabled={updatePreferences.isPending}
                  >
                    {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Profile</DialogTitle>
            <DialogDescription>
              Give your new profile a name to get started with custom preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                placeholder="e.g. Work, Creative, Coding"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProfile()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={createProfile.isPending}>
              {createProfile.isPending ? 'Creating...' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
