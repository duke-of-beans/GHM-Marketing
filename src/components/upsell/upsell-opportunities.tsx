"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, X, DollarSign, Mail } from "lucide-react";
import { toast } from "sonner";

type Opportunity = {
  id?: number;
  productId: number;
  productName: string;
  category: string;
  gapCategory: string;
  opportunityScore: number;
  reasoning: string;
  projectedMrr: number;
  projectedRoi: number | null;
  status?: string;
};

export function UpsellOpportunities({
  clientId,
  opportunities,
}: {
  clientId: number;
  opportunities: Opportunity[];
}) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedOpps, setDetectedOpps] = useState<Opportunity[]>(opportunities);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [emailingId, setEmailingId] = useState<number | null>(null);
  const router = useRouter();

  const handleDetect = async () => {
    setIsDetecting(true);
    try {
      const response = await fetch("/api/upsell/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (response.ok) {
        const data = await response.json();
        setDetectedOpps(data.opportunities || []);
      }
    } catch (error) {
      console.error("Failed to detect opportunities:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handlePresent = async (oppId: number) => {
    if (!oppId) return;
    
    setProcessingId(oppId);
    try {
      const response = await fetch(`/api/upsell/${oppId}/present`, {
        method: "POST",
      });

      if (response.ok) {
        setDetectedOpps((prev) => prev.filter((o) => o.id !== oppId));
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to present opportunity:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (oppId: number) => {
    if (!oppId) return;
    
    setProcessingId(oppId);
    try {
      const response = await fetch(`/api/upsell/${oppId}/dismiss`, {
        method: "POST",
      });

      if (response.ok) {
        setDetectedOpps((prev) => prev.filter((o) => o.id !== oppId));
      }
    } catch (error) {
      console.error("Failed to dismiss opportunity:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEmailUpsell = async (oppId: number) => {
    if (!oppId) return;
    
    setEmailingId(oppId);
    try {
      const response = await fetch("/api/email/send-upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: oppId }),
      });

      if (response.ok) {
        toast.success("Service recommendation sent");
        setDetectedOpps((prev) => prev.filter((o) => o.id !== oppId));
        router.refresh();
      } else {
        toast.error("Failed to send notification");
      }
    } catch (error) {
      console.error("Failed to send upsell email:", error);
      toast.error("Failed to send notification");
    } finally {
      setEmailingId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-status-danger bg-status-danger-bg border-status-danger-border";
    if (score >= 60) return "text-status-warning bg-status-warning-bg border-status-warning-border";
    return "text-status-warning bg-status-warning-bg border-status-warning-border";
  };

  const getScoreBadgeVariant = (score: number): "destructive" | "default" | "secondary" => {
    if (score >= 80) return "destructive";
    if (score >= 60) return "default";
    return "secondary";
  };

  if (detectedOpps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Service Recommendations</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDetect}
              disabled={isDetecting}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              {isDetecting ? "Detecting..." : "Detect Opportunities"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No service recommendations detected. Run detection to identify potential product recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Service Recommendations</h3>
          <p className="text-sm text-muted-foreground">
            {detectedOpps.length} potential product {detectedOpps.length === 1 ? "recommendation" : "recommendations"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDetect}
          disabled={isDetecting}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {detectedOpps.slice(0, 5).map((opp, idx) => (
        <Card key={idx} className={`border-l-4 ${getScoreColor(opp.opportunityScore)}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{opp.productName}</CardTitle>
                  <Badge variant={getScoreBadgeVariant(opp.opportunityScore)}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{opp.opportunityScore} Score</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">AI-generated opportunity score (0–100) based on the client&apos;s current service gaps and competitive position. 80+ = high priority, 60–79 = moderate, below 60 = low. Higher scores mean a stronger case for recommending this service.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {opp.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{opp.reasoning}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">MRR: </span>
                  <span className="font-semibold">${opp.projectedMrr}/mo</span>
                </div>
                {opp.projectedRoi !== null && (
                  <div>
                    <span className="text-muted-foreground">Est. ROI: </span>
                    <span className="font-semibold text-status-success">{opp.projectedRoi}%</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {opp.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(opp.id!)}
                    disabled={processingId === opp.id || emailingId === opp.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => opp.id && handleEmailUpsell(opp.id)}
                  disabled={!opp.id || processingId === opp.id || emailingId === opp.id}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  {emailingId === opp.id ? "Sending..." : "Email"}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => opp.id && handlePresent(opp.id)}
                  disabled={!opp.id || processingId === opp.id || emailingId === opp.id}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  {processingId === opp.id ? "Processing..." : "Present"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {detectedOpps.length > 5 && (
        <p className="text-sm text-center text-muted-foreground">
          +{detectedOpps.length - 5} more {detectedOpps.length - 5 === 1 ? "opportunity" : "opportunities"}
        </p>
      )}
    </div>
  );
}
