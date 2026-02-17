"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BlogGenerator } from '../clients/content/blog-generator'
import { SocialMediaGenerator } from './SocialMediaGenerator'
import { MetaDescriptionGenerator } from './MetaDescriptionGenerator'
import { ContentList } from './ContentList'
import { ContentCalendar } from './ContentCalendar'

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
        <p className="text-muted-foreground mt-1">
          AI-powered content generation that goes beyond generic templates. Our system researches your client's industry, analyzes local market trends, studies competitor strategies, and creates tailored content that resonates with their specific audience.
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="library">Content Library</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Post Generator</CardTitle>
                <CardDescription>
                  AI-powered content creation that researches your industry, analyzes competitors, and incorporates local market data to generate SEO-optimized blog posts tailored to your business
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
                  Generate platform-optimized posts with trending hashtags and engagement strategies designed to maximize reach and audience interaction
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
                  Create compelling, click-worthy meta descriptions optimized for search engines and designed to improve organic click-through rates
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

        <TabsContent value="calendar">
          <ContentCalendar clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

