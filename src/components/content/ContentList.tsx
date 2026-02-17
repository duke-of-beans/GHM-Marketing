"use client"

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Loader2, FileText, Share2, Hash, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EditContentDialog } from './EditContentDialog'
import { toast } from 'sonner'

interface ContentListProps {
  clientId: number
  refreshTrigger?: number
}

interface ContentItem {
  id: number
  contentType: string
  title: string | null
  content: string
  metadata: Record<string, any>
  createdAt: string
}

export function ContentList({ clientId, refreshTrigger }: ContentListProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)

  const loadContent = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/content/list?clientId=${clientId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load content')
      }

      const data = await response.json()
      setContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [clientId, refreshTrigger])

  const handleDelete = async () => {
    if (!selectedContent) return

    try {
      const response = await fetch(`/api/content/${selectedContent.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete content')
      }

      toast.success('Content deleted successfully')
      setContent(prev => prev.filter(item => item.id !== selectedContent.id))
      setDeleteDialogOpen(false)
      setSelectedContent(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete content')
    }
  }

  const handleEditSuccess = () => {
    loadContent()
  }

  const getIcon = (contentType: string) => {
    switch (contentType) {
      case 'blog':
        return FileText
      case 'social':
        return Share2
      case 'meta':
        return Hash
      default:
        return FileText
    }
  }

  const getTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'blog':
        return 'Blog Post'
      case 'social':
        return 'Social Media'
      case 'meta':
        return 'Meta Description'
      default:
        return contentType
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    )
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">No content yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate content using the tools above to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Generated Content</h3>
        <Button variant="outline" size="sm" onClick={loadContent}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {content.map((item) => {
          const Icon = getIcon(item.contentType)
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">
                        {item.title || getTypeLabel(item.contentType)}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{getTypeLabel(item.contentType)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content}
                  </p>
                  
                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.metadata.keywords && (
                        <Badge variant="outline" className="text-xs">
                          {item.metadata.keywords.join(', ')}
                        </Badge>
                      )}
                      {item.metadata.url && (
                        <a
                          href={item.metadata.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Page
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(item.content)}
                    >
                      Copy Content
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedContent(item)
                        setEditDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedContent(item)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
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

      {/* Edit Dialog */}
      {selectedContent && (
        <EditContentDialog
          contentId={selectedContent.id}
          initialTitle={selectedContent.title}
          initialContent={selectedContent.content}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
