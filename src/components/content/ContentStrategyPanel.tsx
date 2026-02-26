"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Lightbulb, Hash, Copy, ChevronRight } from "lucide-react";

interface TopicResult {
  title: string;
  intent: string;
  why: string;
}

interface KeywordResult {
  keyword: string;
  volume: string;
  type: string;
  intent: string;
}

interface ContentStrategyPanelProps {
  clientId: number;
}

const intentColors: Record<string, string> = {
  informational: "bg-blue-100 text-blue-800 border-blue-200",
  "how-to": "bg-status-success-bg text-status-success border-status-success-border",
  comparison: "bg-purple-100 text-purple-800 border-purple-200",
  local: "bg-status-warning-bg text-status-warning border-status-warning-border",
  transactional: "bg-status-danger-bg text-status-danger border-status-danger-border",
  navigational: "bg-gray-100 text-gray-800 border-gray-200",
};

const volumeColors: Record<string, string> = {
  high: "bg-status-success-bg text-status-success border-status-success-border",
  medium: "bg-status-warning-bg text-status-warning border-status-warning-border",
  low: "bg-gray-100 text-gray-700 border-gray-200",
};

export function ContentStrategyPanel({ clientId }: ContentStrategyPanelProps) {
  const [topicInput, setTopicInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [topics, setTopics] = useState<TopicResult[]>([]);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);

  async function generateTopics() {
    if (!topicInput.trim()) {
      toast.error("Enter a theme or niche to generate topics");
      return;
    }
    setLoadingTopics(true);
    try {
      const res = await fetch("/api/content/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, mode: "topics", input: topicInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate topics");
      setTopics(data.results as TopicResult[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate topics");
    } finally {
      setLoadingTopics(false);
    }
  }

  async function generateKeywords() {
    if (!keywordInput.trim()) {
      toast.error("Enter a topic to research keywords");
      return;
    }
    setLoadingKeywords(true);
    try {
      const res = await fetch("/api/content/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, mode: "keywords", input: keywordInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate keywords");
      setKeywords(data.results as KeywordResult[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate keywords");
    } finally {
      setLoadingKeywords(false);
    }
  }

  function applyTopicToKeywords(title: string) {
    setKeywordInput(title);
    toast.info("Topic copied to keyword research — switch to the Keywords tab");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <Tabs defaultValue="topics" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="topics">
          <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
          Topic Ideas
        </TabsTrigger>
        <TabsTrigger value="keywords">
          <Hash className="h-3.5 w-3.5 mr-1.5" />
          Keyword Research
        </TabsTrigger>
      </TabsList>

      <TabsContent value="topics" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Start here — generate blog topic ideas based on a theme or niche. Then use a topic to seed keyword research.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. HVAC maintenance tips, local plumbing services"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateTopics()}
            disabled={loadingTopics}
            className="flex-1"
          />
          <Button onClick={generateTopics} disabled={loadingTopics || !topicInput.trim()}>
            {loadingTopics ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {topics.length > 0 && (
          <div className="space-y-2">
            {topics.map((topic, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{topic.title}</p>
                  <p className="text-xs text-muted-foreground">{topic.why}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${intentColors[topic.intent] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                  >
                    {topic.intent}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs h-7 px-2"
                  onClick={() => applyTopicToKeywords(topic.title)}
                  title="Research keywords for this topic"
                >
                  <ChevronRight className="h-3.5 w-3.5 mr-1" />
                  Keywords
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="keywords" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter a topic or theme to get a mix of primary and long-tail keyword suggestions with volume estimates.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. emergency plumber services, roof repair cost"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateKeywords()}
            disabled={loadingKeywords}
            className="flex-1"
          />
          <Button onClick={generateKeywords} disabled={loadingKeywords || !keywordInput.trim()}>
            {loadingKeywords ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Research"
            )}
          </Button>
        </div>

        {keywords.length > 0 && (
          <div className="space-y-2">
            {keywords.map((kw, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-sm font-medium truncate">{kw.keyword}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${volumeColors[kw.volume] || ""}`}
                  >
                    {kw.volume} vol
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${intentColors[kw.intent] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                  >
                    {kw.intent}
                  </Badge>
                  {kw.type === "long-tail" && (
                    <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                      long-tail
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-7 w-7"
                  onClick={() => copyToClipboard(kw.keyword)}
                  title="Copy keyword"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
