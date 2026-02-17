"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Copy, Check, Sparkles } from 'lucide-react'

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
  const [hasVoiceProfile, setHasVoiceProfile] = useState(false)
  const [useVoiceProfile, setUseVoiceProfile] = useState(false)

  // Check for voice profile
  useEffect(() => {
    fetch(`/api/clients/${clientId}/voice-profile`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setHasVoiceProfile(true)
          setUseVoiceProfile(true)
        }
      })
      .catch(() => {})
  }, [clientId])

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
          useVoiceProfile,
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

      {hasVoiceProfile && (
        <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            id="use-voice-meta"
            checked={useVoiceProfile}
            onCheckedChange={(checked) => setUseVoiceProfile(checked as boolean)}
            disabled={loading}
          />
          <label
            htmlFor="use-voice-meta"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Use client's captured brand voice
          </label>
        </div>
      )}

      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate Meta Description
      </Button>

      {loading && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm font-medium">Optimizing for search engines...</p>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Analyzing page content and identifying key value propositions</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Optimizing for click-through rate while staying within 160 characters</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary animate-pulse">→</span>
              <span>Crafting compelling meta description to improve search visibility</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Creating SEO-optimized meta description designed to increase organic clicks...
          </p>
        </div>
      )}

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
