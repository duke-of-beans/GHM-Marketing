"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, Plus } from "lucide-react";

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
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    setResults([]);
    setSelected(new Set());

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
      }
    } catch (error) {
      console.error("Search failed:", error);
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
        alert(`Successfully imported ${data.imported} leads!`);
        // Remove imported from results
        setResults(results.filter((r) => !selected.has(r.placeId)));
        setSelected(new Set());
      }
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword / Industry</Label>
              <Input
                id="keyword"
                placeholder="plumber, dentist, lawyer..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Austin, TX"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minReviews">Min Reviews</Label>
              <Input
                id="minReviews"
                type="number"
                value={minReviews}
                onChange={(e) => setMinReviews(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minRating">Min Rating</Label>
              <Input
                id="minRating"
                type="number"
                step="0.1"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={handleSearch}
            disabled={!keyword || !location || isSearching}
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? "Searching..." : "Search Maps"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
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
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
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
                      <Badge className={getScoreColor(result.qualificationScore)}>
                        Score: {result.qualificationScore}
                      </Badge>
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
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
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
  );
}
