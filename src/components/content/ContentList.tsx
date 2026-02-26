"use client"

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Loader2, FileText, Share2, Hash, ExternalLink,
  Pencil, Trash2, Clock, CheckCheck, Archive, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EditContentDialog } from './EditContentDialog'
import { VersionHistoryDialog } from './versioning/VersionHistoryDialog'
import { toast } from 'sonner'

interface ContentListProps {
  clientId: number
  refreshTrigger?: number
  isMaster?: boolean
}

interface ContentItem {
  id: number
  contentType: string
  title: string | null
  content: string
  status: string
  metadata: Record<string, any>
  currentVersion: number
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-muted text-foreground dark:bg-card',
  review:    'bg-status-warning-bg text-status-warning',
  approved:  'bg-status-success-bg text-status-success',
  published: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  archived:  'bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground',
}

export function ContentList({ clientId, refreshTrigger, isMaster = false }: ContentListProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)

  const loadContent = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelected(new Set())
    try {
      const res = await fetch(`/api/content/list?clientId=${clientId}`)
      if (!res.ok) throw new Error('Failed to load content')
      const data = await res.json()
      setContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { loadContent() }, [loadContent, refreshTrigger])

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleOne = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  const toggleAll = () =>
    setSelected(selected.size === content.length ? new Set() : new Set(content.map(c => c.id)))

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const bulkAction = async (action: 'approve' | 'archive') => {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/content/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selected) }),
      })
      if (!res.ok) throw new Error('Bulk action failed')
      const data = await res.json()
      toast.success(`${data.updated} item${data.updated !== 1 ? 's' : ''} ${action === 'approve' ? 'approved' : 'archived'}`)
      await loadContent()
    } catch {
      toast.error('Bulk action failed. Please try again.')
    } finally {
      setBulkLoading(false)
    }
  }

  // ── Single delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedContent) return
    try {
      const res = await fetch(`/api/content/${selectedContent.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete content')
      toast.success('Content deleted')
      setContent(prev => prev.filter(item => item.id !== selectedContent.id))
      setDeleteDialogOpen(false)
      setSelectedContent(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete content')
    }
  }

  const getIcon = (type: string) =>
    type === 'social' ? Share2 : type === 'meta' ? Hash : FileText

  const getTypeLabel = (type: string) =>
    ({ blog: 'Blog Post', social: 'Social Media', meta: 'Meta Description' }[type] ?? type)

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  if (error) return (
    <div className="rounded-lg border border-status-danger-border bg-status-danger-bg p-4 text-sm text-status-danger">
      {error}
    </div>
  )

  if (content.length === 0) return (
    <div className="text-center py-12">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">No content yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Generate content using the tools above to get started.
      </p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Generated Content</h3>
          <Badge variant="secondary">{content.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={loadContent}>Refresh</Button>
      </div>

      {/* Bulk action bar — visible when items selected */}
      {isMaster && selected.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm">
          <span className="font-medium text-primary">{selected.size} selected</span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkAction('approve')}
            disabled={bulkLoading}
            className="gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkAction('archive')}
            disabled={bulkLoading}
            className="gap-1.5 text-muted-foreground"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            className="gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      )}

      {/* Select-all row */}
      {isMaster && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={selected.size === content.length && content.length > 0}
            onCheckedChange={toggleAll}
          />
          <span>Select all</span>
        </div>
      )}

      {/* Content list */}
      <div className="grid gap-3">
        {content.map(item => {
          const Icon = getIcon(item.contentType)
          const isChecked = selected.has(item.id)
          return (
            <Card key={item.id} className={isChecked ? 'ring-2 ring-primary/30' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  {isMaster && (
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleOne(item.id)}
                      className="mt-0.5"
                    />
                  )}
                  <Icon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">
                      {item.title || getTypeLabel(item.contentType)}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[item.status] ?? STATUS_COLORS.draft}`}>
                      {item.status}
                    </span>
                    <Badge variant="secondary">{getTypeLabel(item.contentType)}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content}
                  </p>
                  {item.metadata?.keywords && (
                    <Badge variant="outline" className="text-xs">
                      {item.metadata.keywords.join(', ')}
                    </Badge>
                  )}
                  {item.metadata?.url && (
                    <a href={item.metadata.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 w-fit">
                      <ExternalLink className="h-3 w-3" />
                      View Page
                    </a>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm"
                      onClick={() => navigator.clipboard.writeText(item.content)}>
                      Copy
                    </Button>
                    <Button variant="outline" size="sm"
                      onClick={() => { setSelectedContent(item); setVersionHistoryOpen(true) }}>
                      <Clock className="h-4 w-4 mr-1" />
                      History
                    </Button>
                    <Button variant="outline" size="sm"
                      onClick={() => { setSelectedContent(item); setEditDialogOpen(true) }}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm"
                      onClick={() => { setSelectedContent(item); setDeleteDialogOpen(true) }}
                      className="text-status-danger hover:text-status-danger">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedContent && (
        <EditContentDialog
          contentId={selectedContent.id}
          initialTitle={selectedContent.title}
          initialContent={selectedContent.content}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={loadContent}
        />
      )}
      {selectedContent && (
        <VersionHistoryDialog
          open={versionHistoryOpen}
          onOpenChange={setVersionHistoryOpen}
          contentId={selectedContent.id}
          currentVersion={selectedContent.currentVersion}
          onRestore={loadContent}
        />
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-status-danger-bg hover:bg-status-danger-bg">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
