"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CollapsibleCard } from '@/components/ui/collapsible-card'
import { BlogGenerator } from '../clients/content/blog-generator'
import { SocialMediaGenerator } from './SocialMediaGenerator'
import { MetaDescriptionGenerator } from './MetaDescriptionGenerator'
import { ContentStrategyPanel } from './ContentStrategyPanel'
import { PPCGenerator } from './PPCGenerator'
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
          AI-powered content generation that goes beyond generic templates. Our system researches your client&apos;s industry, analyzes local market trends, studies competitor strategies, and creates tailored content that resonates with their specific audience.
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="library">Content Library</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid gap-4">
            <CollapsibleCard
              panelKey="strategy"
              title="Content Strategy"
              description="Generate topic ideas and target keywords to plan your content calendar before writing"
              defaultOpen={false}
            >
              <ContentStrategyPanel clientId={clientId} />
            </CollapsibleCard>

            <CollapsibleCard
              panelKey="blog"
              title="Blog Post Generator"
              description="AI-powered content creation that researches your industry, analyzes competitors, and incorporates local market data to generate SEO-optimized blog posts"
              defaultOpen={false}
            >
              <BlogGenerator
                clientId={clientId}
                onGenerated={handleContentGenerated}
              />
            </CollapsibleCard>

            <CollapsibleCard
              panelKey="social"
              title="Social Media Content"
              description="Generate platform-optimized posts with trending hashtags and engagement strategies designed to maximize reach and audience interaction"
              defaultOpen={false}
            >
              <SocialMediaGenerator
                clientId={clientId}
                onSuccess={handleContentGenerated}
              />
            </CollapsibleCard>

            <CollapsibleCard
              panelKey="meta"
              title="Meta Description Generator"
              description="Create compelling, click-worthy meta descriptions optimized for search engines and designed to improve organic click-through rates"
              defaultOpen={false}
            >
              <MetaDescriptionGenerator
                clientId={clientId}
                onSuccess={handleContentGenerated}
              />
            </CollapsibleCard>

            <CollapsibleCard
              panelKey="ppc"
              title="PPC Ad Copy Generator"
              description="Create Google Ads-formatted headlines and descriptions with multiple variants for A/B testing paid search campaigns"
              defaultOpen={false}
            >
              <PPCGenerator clientId={clientId} />
            </CollapsibleCard>
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
