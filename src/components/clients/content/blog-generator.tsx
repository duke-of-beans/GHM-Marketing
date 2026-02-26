"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [hasVoiceProfile, setHasVoiceProfile] = useState(false);
  const [useVoiceProfile, setUseVoiceProfile] = useState(false);

  // Check if client has voice profile
  useEffect(() => {
    fetch(`/api/clients/${clientId}/voice-profile`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setHasVoiceProfile(true);
          setUseVoiceProfile(true); // Auto-enable if available
        }
      })
      .catch(() => {
        // Voice profile doesn&apos;t exist, that's fine
      });
  }, [clientId]);

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
          tone: useVoiceProfile ? "client-voice" : tone,
          wordCount: parseInt(wordCount),
          useVoiceProfile,
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tone</label>
            <Select 
              value={useVoiceProfile ? "client-voice" : tone} 
              onValueChange={setTone} 
              disabled={generating || useVoiceProfile}
            >
              <SelectTrigger>
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
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
            {hasVoiceProfile && useVoiceProfile && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Using captured brand voice
              </p>
            )}
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

        {hasVoiceProfile && (
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="use-voice"
              checked={useVoiceProfile}
              onCheckedChange={(checked) => setUseVoiceProfile(checked as boolean)}
              disabled={generating}
            />
            <label
              htmlFor="use-voice"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Use client&apos;s captured brand voice
            </label>
          </div>
        )}

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
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm font-medium">Creating your blog post...</p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Researching industry trends and local market data for {industry || 'your business'}</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Analyzing competitor content and identifying content gaps</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Incorporating target keywords naturally while maintaining readability</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary animate-pulse">→</span>
                <span>Writing engaging, SEO-optimized content tailored to your audience</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              This sophisticated analysis typically takes 15-30 seconds. Your content will be ready shortly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


