"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlogGenerator } from "./blog-generator";
import { toast } from "sonner";
import { FileText, Share2, Tag, Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface ContentStudioTabProps {
  clientId: number;
  businessName: string;
  industry: string;
}

type ContentItem = {
  id: number;
  contentType: string;
  title: string | null;
  content: string;
  keywords: string[];
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
  metadata: any;
};

export function ContentStudioTab({ clientId, businessName, industry }: ContentStudioTabProps) {
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("blog");

  async function loadContent() {
    try {
      const res = await fetch(`/api/content/list?clientId=${clientId}`);
      if (!res.ok) throw new Error("Failed to load content");
      const data = await res.json();
      setContentList(data.content);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, [clientId]);

  const blogPosts = contentList.filter(c => c.contentType === "blog");
  const socialPosts = contentList.filter(c => c.contentType === "social");
  const metaDescriptions = contentList.filter(c => c.contentType === "meta");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Content Studio</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered content generation for {businessName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            {blogPosts.length} blogs
          </Badge>
          <Badge variant="outline">
            <Share2 className="h-3 w-3 mr-1" />
            {socialPosts.length} social
          </Badge>
          <Badge variant="outline">
            <Tag className="h-3 w-3 mr-1" />
            {metaDescriptions.length} meta
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="blog">
            <FileText className="h-4 w-4 mr-2" />
            Blog Posts
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="meta">
            <Tag className="h-4 w-4 mr-2" />
            Meta Descriptions
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Content Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="space-y-4">
          <BlogGenerator 
            clientId={clientId} 
            industry={industry}
            onGenerated={loadContent}
          />
          <ContentList 
            items={blogPosts} 
            type="blog"
            onUpdate={loadContent}
          />
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <SocialGenerator 
            clientId={clientId}
            blogPosts={blogPosts}
            onGenerated={loadContent}
          />
          <ContentList 
            items={socialPosts} 
            type="social"
            onUpdate={loadContent}
          />
        </TabsContent>

        <TabsContent value="meta" className="space-y-4">
          <MetaGenerator 
            clientId={clientId}
            onGenerated={loadContent}
          />
          <ContentList 
            items={metaDescriptions} 
            type="meta"
            onUpdate={loadContent}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <ContentCalendar 
            content={contentList.filter(c => c.scheduledFor)}
            onUpdate={loadContent}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContentList({ items, type, onUpdate }: { items: ContentItem[]; type: string; onUpdate: () => void }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No {type} content yet. Generate some using the form above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Generated Content ({items.length})</h3>
      {items.map((item) => (
        <ContentCard key={item.id} item={item} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

function ContentCard({ item, onUpdate }: { item: ContentItem; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch("/api/content/list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: item.id,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Status updated");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  const statusColor = (status: string) => {
    if (status === "published") return "bg-green-100 text-green-800";
    if (status === "approved") return "bg-blue-100 text-blue-800";
    if (status === "review") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardContent className="py-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {item.title || "Untitled"}
                </span>
                <Badge variant="outline" className={`text-xs ${statusColor(item.status)}`}>
                  {item.status}
                </Badge>
                {item.keywords.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {item.keywords.slice(0, 3).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {kw}
                      </Badge>
                    ))}
                    {item.keywords.length > 3 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{item.keywords.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {item.status === "draft" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => updateStatus("review")}
                  disabled={updating}
                >
                  Submit for Review
                </Button>
              )}
              {item.status === "review" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => updateStatus("approved")}
                  disabled={updating}
                >
                  Approve
                </Button>
              )}
              {item.status === "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => updateStatus("published")}
                  disabled={updating}
                >
                  Publish
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 p-3 bg-muted rounded text-sm max-h-96 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: item.content }} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SocialGenerator({ clientId, blogPosts, onGenerated }: { clientId: number; blogPosts: ContentItem[]; onGenerated: () => void }) {
  // Placeholder - implementation similar to BlogGenerator
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-muted-foreground">Social media generator coming soon...</p>
      </CardContent>
    </Card>
  );
}

function MetaGenerator({ clientId, onGenerated }: { clientId: number; onGenerated: () => void }) {
  // Placeholder - implementation similar to BlogGenerator
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-muted-foreground">Meta description generator coming soon...</p>
      </CardContent>
    </Card>
  );
}

function ContentCalendar({ content, onUpdate }: { content: ContentItem[]; onUpdate: () => void }) {
  // Placeholder - calendar view
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-muted-foreground">Content calendar coming soon...</p>
      </CardContent>
    </Card>
  );
}
