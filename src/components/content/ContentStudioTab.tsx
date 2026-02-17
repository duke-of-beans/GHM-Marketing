"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BlogGenerator } from '../clients/content/blog-generator'
import { SocialMediaGenerator } from './SocialMediaGenerator'
import { MetaDescriptionGenerator } from './MetaDescriptionGenerator'
import { ContentList } from './ContentList'

interface ContentStudioTabProps {
  clientId: number
}

export function ContentStudioTab({ clientId }: ContentStudioTabProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleContentGenerated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content Studio</h2>
        <p className="text-muted-foreground">
          Generate blog posts, social media content, and meta descriptions for your client.
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="library">Content Library</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Post Generator</CardTitle>
                <CardDescription>
                  Create SEO-optimized blog posts with AI assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BlogGenerator
                  clientId={clientId}
                  onGenerated={handleContentGenerated}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Media Content</CardTitle>
                <CardDescription>
                  Generate platform-specific social media posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SocialMediaGenerator
                  clientId={clientId}
                  onSuccess={handleContentGenerated}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meta Description Generator</CardTitle>
                <CardDescription>
                  Create compelling meta descriptions for better search visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MetaDescriptionGenerator
                  clientId={clientId}
                  onSuccess={handleContentGenerated}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardContent className="pt-6">
              <ContentList
                clientId={clientId}
                refreshTrigger={refreshTrigger}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
