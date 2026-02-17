"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Sparkles } from 'lucide-react'

interface SocialMediaGeneratorProps {
  clientId: number
  onSuccess?: () => void
}

interface GeneratedContent {
  platform: string
  content: string
  hashtags: string[]
}

export function SocialMediaGenerator({ clientId, onSuccess }: SocialMediaGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<string>('twitter')
  const [tone, setTone] = useState<string>('professional')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<GeneratedContent[]>([])
  const [error, setError] = useState<string | null>(null)
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
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/content/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          topic: topic.trim(),
          platform,
          tone: useVoiceProfile ? 'client-voice' : tone,
          useVoiceProfile,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setGenerated(data.posts)
      setTopic('')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic">Topic or Source Content</Label>
        <Textarea
          id="topic"
          placeholder="Enter the topic or paste blog content to generate social media posts from..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger id="platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="twitter">Twitter/X</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <Select value={useVoiceProfile ? 'client-voice' : tone} onValueChange={setTone} disabled={useVoiceProfile}>
            <SelectTrigger id="tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hasVoiceProfile && (
                <SelectItem value="client-voice">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Client&apos;s Voice
                  </span>
                </SelectItem>
              )}
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasVoiceProfile && (
        <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            id="use-voice-social"
            checked={useVoiceProfile}
            onCheckedChange={(checked) => setUseVoiceProfile(checked as boolean)}
            disabled={loading}
          />
          <label
            htmlFor="use-voice-social"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Use client's captured brand voice
          </label>
        </div>
      )}

      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate Social Media Posts
      </Button>

      {loading && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm font-medium">Crafting platform-optimized content...</p>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Analyzing {platform === 'twitter' ? 'Twitter/X' : platform.charAt(0).toUpperCase() + platform.slice(1)} best practices and character limits</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Researching trending hashtags and engagement patterns</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary animate-pulse">→</span>
              <span>Creating compelling copy designed to maximize reach and engagement</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Generating strategic social content that resonates with your audience...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {generated.length > 0 && (
        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
          <p className="text-sm font-medium">Generated Posts:</p>
          {generated.map((post, idx) => (
            <div key={idx} className="rounded-lg border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {post.platform}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(post.content)}
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              {post.hashtags.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {post.hashtags.join(' ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
