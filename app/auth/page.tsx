'use client'
import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { FcGoogle } from "react-icons/fc";
export default function AuthPage() {
  const { data: session, status } = useSession()
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  if (session) {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    return null
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome to Muxai
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to start chatting with AI models
          </p>
        </div>
        
        <div className="mt-8">
          <Button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full"
            size="lg"
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  )
}