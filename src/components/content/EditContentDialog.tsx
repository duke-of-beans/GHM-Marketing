"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditContentDialogProps {
  contentId: number
  initialTitle: string | null
  initialContent: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditContentDialog({
  contentId,
  initialTitle,
  initialContent,
  open,
  onOpenChange,
  onSuccess,
}: EditContentDialogProps) {
  const [title, setTitle] = useState(initialTitle || '')
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      if (!response.ok) {
        throw new Error('Failed to update content')
      }

      toast.success('Content updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
          <DialogDescription>
            Make changes to your generated content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
