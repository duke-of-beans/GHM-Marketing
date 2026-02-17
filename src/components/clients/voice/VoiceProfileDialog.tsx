"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VoiceProfile {
  profileId: string;
  tonality: string;
  vocabulary: string[];
  sentenceStructure: string;
  characteristics: {
    formality: number;
    enthusiasm: number;
    technicality: number;
    brevity: number;
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  websiteUrl?: string;
  existingProfile?: VoiceProfile | null;
  onSuccess?: () => void;
}

export function VoiceProfileDialog({
  open,
  onOpenChange,
  clientId,
  websiteUrl,
  existingProfile,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<"idle" | "analyzing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [profile, setProfile] = useState<VoiceProfile | null>(existingProfile || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingProfile) {
      setProfile(existingProfile);
      setStatus("success");
    }
  }, [existingProfile]);

  const handleCapture = async () => {
    setStatus("analyzing");
    setProgress(10);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const res = await fetch(`/api/clients/${clientId}/capture-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to capture voice");
      }

      const data = await res.json();
      setProfile(data.voiceProfile);
      setStatus("success");
      toast.success("Voice profile captured!");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to capture voice profile");
      console.error(err);
    }
  };

  const handleRemove = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/voice-profile`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove voice profile");

      toast.success("Voice profile removed");
      setProfile(null);
      setStatus("idle");
      onSuccess?.();
    } catch (err) {
      toast.error("Failed to remove voice profile");
      console.error(err);
    }
  };

  // Auto-start capture when dialog opens (only if no existing profile)
  useEffect(() => {
    if (open && status === "idle" && !existingProfile) {
      handleCapture();
    }
  }, [open]);

  const getCharacteristicLabel = (value: number): string => {
    if (value <= 3) return "Low";
    if (value <= 7) return "Medium";
    return "High";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Brand Voice Analysis
          </DialogTitle>
          <DialogDescription>
            {websiteUrl ? `Analyzing ${websiteUrl}` : "Analyzing client website"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Analyzing State */}
          {status === "analyzing" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Analyzing brand voice...
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Scanning website content and extracting writing samples</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Analyzing tonality, vocabulary patterns, and sentence structure</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Measuring formality, enthusiasm, technical depth, and brevity</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary animate-pulse">→</span>
                  <span>Building comprehensive voice profile for content generation</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground italic pt-2">
                This sophisticated analysis takes 20-40 seconds to ensure accuracy. Your custom voice profile will preserve the unique character of your brand in all generated content.
              </p>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Analysis Failed</span>
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={handleCapture} className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {/* Success State */}
          {status === "success" && profile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Voice Profile Active
                </span>
              </div>

              {/* Tonality Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="text-sm font-medium">Overall Tone</h4>
                <p className="text-sm text-muted-foreground">
                  {profile.tonality}
                </p>
              </div>

              {/* Characteristics */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Writing Characteristics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-xs text-muted-foreground">Formality</span>
                    <Badge variant="secondary" className="text-xs">
                      {getCharacteristicLabel(profile.characteristics.formality)} ({profile.characteristics.formality}/10)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-xs text-muted-foreground">Enthusiasm</span>
                    <Badge variant="secondary" className="text-xs">
                      {getCharacteristicLabel(profile.characteristics.enthusiasm)} ({profile.characteristics.enthusiasm}/10)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-xs text-muted-foreground">Technical</span>
                    <Badge variant="secondary" className="text-xs">
                      {getCharacteristicLabel(profile.characteristics.technicality)} ({profile.characteristics.technicality}/10)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-xs text-muted-foreground">Brevity</span>
                    <Badge variant="secondary" className="text-xs">
                      {getCharacteristicLabel(profile.characteristics.brevity)} ({profile.characteristics.brevity}/10)
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Key Vocabulary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Vocabulary</h4>
                <div className="flex flex-wrap gap-1">
                  {profile.vocabulary.slice(0, 12).map((word, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                  {profile.vocabulary.length > 12 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{profile.vocabulary.length - 12} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Sentence Structure */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Sentence Structure</h4>
                <p className="text-xs text-muted-foreground">
                  {profile.sentenceStructure}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleRemove}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCapture}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Recapture
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                This voice profile will be used as the default tone for all content generation
              </p>
            </div>
          )}

          {/* Idle State - No Profile */}
          {status === "idle" && !profile && (
            <div className="space-y-4 text-center py-4">
              <p className="text-sm text-muted-foreground">
                Ready to capture brand voice from website
              </p>
              <Button onClick={handleCapture} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Analysis
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
