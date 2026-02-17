"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface BlogGeneratorProps {
  clientId: number;
  industry?: string;
  onGenerated?: () => void;
}

export function BlogGenerator({ clientId, industry, onGenerated }: BlogGeneratorProps) {
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  const [wordCount, setWordCount] = useState("1200");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!keywords.trim()) {
      toast.error("Please enter at least one keyword");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/content/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          industry,
          keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
          tone,
          wordCount: parseInt(wordCount),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate blog post");
      }

      const data = await res.json();
      toast.success(`Blog post "${data.content.title}" generated successfully!`);
      setKeywords("");
      onGenerated?.();
    } catch (error) {
      console.error("Error generating blog:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate blog post");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          AI Blog Post Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Target Keywords
          </label>
          <Input
            placeholder="Enter keywords separated by commas (e.g., plumbing services, emergency plumber)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            disabled={generating}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter 1-5 keywords for SEO optimization
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tone</label>
            <Select value={tone} onValueChange={setTone} disabled={generating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Word Count</label>
            <Select value={wordCount} onValueChange={setWordCount} disabled={generating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="800">800 words</SelectItem>
                <SelectItem value="1200">1200 words</SelectItem>
                <SelectItem value="1500">1500 words</SelectItem>
                <SelectItem value="2000">2000 words</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!keywords.trim() || generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating blog post...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Blog Post
            </>
          )}
        </Button>

        {generating && (
          <div className="text-xs text-muted-foreground text-center p-4 bg-muted rounded">
            This usually takes 10-20 seconds. Claude is writing SEO-optimized content for you...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
