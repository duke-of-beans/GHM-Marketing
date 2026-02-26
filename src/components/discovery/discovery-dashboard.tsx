"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, HelpCircle } from "lucide-react";
import { CSVImportDialog } from "@/components/leads/csv-import-dialog";
import { toast } from "sonner";

type DiscoveryResult = {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  website: string | null;
  rating: number;
  reviewCount: number;
  category: string;
  qualificationScore: number;
  reasons: string[];
};

export function DiscoveryDashboard() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [minReviews, setMinReviews] = useState("10");
  const [minRating, setMinRating] = useState("3.5");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const handleSearch = async () => {
    // Validation
    if (!keyword.trim()) {
      toast.error('Business type is required', {
        description: 'Please enter a type of business (e.g., plumber, dentist)'
      });
      return;
    }
    
    if (!location.trim()) {
      toast.error('Location is required', {
        description: 'Please enter a city, state, or zip code'
      });
      return;
    }

    setIsSearching(true);
    setResults([]);
    setSelected(new Set());
    setHasSearched(true);

    try {
      const response = await fetch("/api/discovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          location,
          minReviews: parseInt(minReviews) || 10,
          minRating: parseFloat(minRating) || 3.5,
          limit: 50,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        if (data.results && data.results.length > 0) {
          toast.success(`Found ${data.results.length} businesses`, {
            description: 'Review and select leads to import'
          });
        }
      } else {
        toast.error('Search failed', {
          description: 'Please try again or adjust your search criteria'
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error('Search failed', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelect = (placeId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(placeId)) {
      newSelected.delete(placeId);
    } else {
      newSelected.add(placeId);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((r) => r.placeId)));
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;

    setIsImporting(true);
    try {
      const selectedResults = results.filter((r) => selected.has(r.placeId));
      
      const response = await fetch("/api/discovery/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: selectedResults }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully imported ${data.imported} ${data.imported === 1 ? 'lead' : 'leads'}!`, {
          description: 'New leads added to your sales pipeline'
        });
        // Remove imported from results
        setResults(results.filter((r) => !selected.has(r.placeId)));
        setSelected(new Set());
      } else {
        toast.error('Failed to import leads', {
          description: 'Please try again or contact support'
        });
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error('Import failed', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-status-success bg-status-success-bg";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800";
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Business Type</Label>
              <Input
                id="keyword"
                placeholder="plumber, dentist, lawyer..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">What type of business are you looking for?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Austin, TX or 78701"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">City, state, or zip code</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minReviews">Minimum Reviews</Label>
              <Input
                id="minReviews"
                type="number"
                placeholder="10"
                value={minReviews}
                onChange={(e) => setMinReviews(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">More reviews = more established</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minRating">Minimum Star Rating</Label>
              <Input
                id="minRating"
                type="number"
                step="0.1"
                placeholder="3.5"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Rating from 1.0 to 5.0</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={handleSearch}
              disabled={!keyword || !location || isSearching}
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "Search Maps"}
            </Button>
            <span className="text-sm text-muted-foreground">or</span>
            <CSVImportDialog onComplete={() => {}} />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-14 text-center space-y-3 border rounded-lg bg-muted/20">
          <div className="text-4xl">🗺️</div>
          <p className="font-semibold text-base">Ready to find leads</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Enter a business type and location above to search Google Maps for prospects that match your criteria. Each result gets an instant quality score.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Or skip the search and <span className="font-medium">import a CSV</span> of leads you already have.
          </p>
        </div>
      )}

      {hasSearched && results.length === 0 && !isSearching && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-3xl mb-3">🔎</div>
            <p className="font-semibold mb-1">No businesses found</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Try a broader location (e.g. &quot;Dallas&quot; instead of &quot;Downtown Dallas&quot;), different keywords (e.g. &quot;lawyer&quot; instead of &quot;attorney&quot;), or a lower minimum review count.
            </p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Discovery Results ({results.length} found, {selected.size} selected)
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selected.size === results.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={selected.size === 0 || isImporting}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isImporting ? "Importing..." : `Import ${selected.size} Leads`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.placeId}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <Checkbox
                    checked={selected.has(result.placeId)}
                    onCheckedChange={() => toggleSelect(result.placeId)}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-semibold">{result.name}</h4>
                        <p className="text-sm text-muted-foreground">{result.address}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <Badge className={getScoreColor(result.qualificationScore)}>
                              Quality: {result.qualificationScore}/100
                            </Badge>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Automated quality score (0-100) based on reviews, rating, website presence, and verification status. Higher scores indicate better lead quality.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                      <span>⭐ {result.rating} ({result.reviewCount} reviews)</span>
                      {result.phone && <span>📞 {result.phone}</span>}
                      {result.website && (
                        <a
                          href={result.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          🌐 Website
                        </a>
                      )}
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {result.category}
                      </span>
                    </div>
                    {result.reasons.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {result.reasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </TooltipProvider>
  );
}
