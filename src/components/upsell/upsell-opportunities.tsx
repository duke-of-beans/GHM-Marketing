"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, X, Eye, DollarSign } from "lucide-react";

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600 bg-red-50 border-red-200";
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-yellow-600 bg-yellow-50 border-yellow-200";
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
            <CardTitle className="text-lg">Upsell Opportunities</CardTitle>
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
            No upsell opportunities detected. Run detection to identify potential product recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Upsell Opportunities</h3>
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
                    {opp.opportunityScore} Score
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
                    <span className="font-semibold text-green-600">{opp.projectedRoi}%</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Product
                </Button>
                <Button variant="default" size="sm">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Present
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
