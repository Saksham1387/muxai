"use client"

import { trpc } from '@/server/client-trpc'
import { ImageIcon, Film, Music, FileText, Download } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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

export type StoredAttachment = {
  id: string
  fileName: string
  mimeType: string
  size: number
  key: string
  url: string // This `url` might be temporary or direct, we'll use signed URL
}

interface AttachmentPreviewProps {
  att: StoredAttachment
  showFileSize?: boolean
  showFileName?: boolean
  linkClassName?: string
  imageClassName?: string
}

export function AttachmentPreview({ att, showFileSize = false, showFileName = true, linkClassName, imageClassName }: AttachmentPreviewProps) {
  const { data, isLoading } = trpc.attachment.getSignedUrl.useQuery(
    { key: att.key },
    {
      staleTime: 50 * 60 * 1000, // cache for 50 min (URL valid for 60 min)
      enabled: !!att.key, // Only fetch if key exists
    }
  )

  const signedUrl = data?.url

  if (!att.key) {
    console.warn("AttachmentPreview received an attachment without a key:", att);
    return null;
  }

  if (isLoading || !signedUrl) {
    return (
      <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
        {getFileIcon(att.mimeType)}
        <span className="max-w-[120px] truncate">{att.fileName}</span>
        <span className="animate-pulse">Loading...</span>
      </div>
    )
  }

  if (att.mimeType.startsWith('image/')) {
    return (
      <a href={signedUrl} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {/* Using Image from next/image for optimization */}
        <Image
          src={signedUrl}
          alt={att.fileName}
          width={200} // Max width for thumbnail
          height={150} // Max height for thumbnail
          className={cn("max-w-[200px] max-h-[150px] rounded-lg object-cover border border-border/50", imageClassName)}
        />
      </a>
    )
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-2 text-xs hover:bg-muted/50 transition-colors", linkClassName)}
    >
      {getFileIcon(att.mimeType)}
      {showFileName && <span className="max-w-[120px] truncate">{att.fileName}</span>}
      {showFileSize && <span className="text-muted-foreground">{formatFileSize(att.size)}</span>}
      <Download className="w-3 h-3 text-muted-foreground" />
    </a>
  )
}
