"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Copy, Check } from 'lucide-react'

interface MetaDescriptionGeneratorProps {
  clientId: number
  onSuccess?: () => void
}

export function MetaDescriptionGenerator({ clientId, onSuccess }: MetaDescriptionGeneratorProps) {
  const [pageUrl, setPageUrl] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!pageUrl.trim() || !content.trim()) {
      setError('Please provide both page URL and content')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/content/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          pageUrl: pageUrl.trim(),
          content: content.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate meta description')
      }

      const data = await response.json()
      setGenerated(data.metaDescription)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate meta description')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pageUrl">Page URL</Label>
        <Input
          id="pageUrl"
          type="url"
          placeholder="https://example.com/page"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Page Content Summary</Label>
        <Textarea
          id="content"
          placeholder="Brief summary of the page content or paste the full content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
        />
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate Meta Description
      </Button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {generated && (
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Generated Meta Description:</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <><Check className="mr-2 h-4 w-4" /> Copied</>
              ) : (
                <><Copy className="mr-2 h-4 w-4" /> Copy</>
              )}
            </Button>
          </div>
          <p className="text-sm rounded-lg border bg-background p-3">{generated}</p>
          <p className="text-xs text-muted-foreground">
            Character count: {generated.length} (recommended: 150-160)
          </p>
        </div>
      )}
    </div>
  )
}
