/**
 * Keyword Ranking Tracker
 * 
 * Fetches keyword rankings using Ahrefs Rank Tracker API.
 * Tracks position changes for client's target keywords.
 */

// ============================================================================
// Types
// ============================================================================

export interface KeywordRanking {
  keyword: string;
  position: number | null;
  url: string | null;
  searchVolume: number;
  difficulty: number;
  previousPosition?: number | null;
}

export interface RankingsData {
  domain: string;
  rankings: KeywordRanking[];
  lastChecked: string;
}

// ============================================================================
// Ahrefs Rank Tracker
// ============================================================================

interface AhrefsRankingResponse {
  rankings: Array<{
    keyword: string;
    position: number;
    url: string;
    volume: number;
    difficulty: number;
  }>;
}

export async function fetchKeywordRankings(params: {
  domain: string;
  keywords: string[];
  country?: string;
}): Promise<RankingsData> {
  const { domain, keywords, country = 'us' } = params;
  
  const apiKey = process.env.AHREFS_API_TOKEN;
  if (!apiKey) {
    console.warn('[Rankings] No Ahrefs API key configured');
    return {
      domain,
      rankings: keywords.map(kw => ({
        keyword: kw,
        position: null,
        url: null,
        searchVolume: 0,
        difficulty: 0,
      })),
      lastChecked: new Date().toISOString(),
    };
  }
  
  try {
    // Note: Ahrefs Rank Tracker API endpoint
    // In production, you'd use their actual rank tracker API
    // For now, using organic keywords endpoint as fallback
    const url = new URL('https://api.ahrefs.com/v3/site-explorer/organic-keywords');
    url.searchParams.set('target', domain);
    url.searchParams.set('country', country);
    url.searchParams.set('output', 'json');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[Rankings] Ahrefs API error:', response.status);
      return fallbackRankings(domain, keywords);
    }
    
    const data = await response.json() as AhrefsRankingResponse;
    
    // Match tracked keywords with Ahrefs results
    const rankings = keywords.map(keyword => {
      const match = data.rankings.find(r => 
        r.keyword.toLowerCase() === keyword.toLowerCase()
      );
      
      return {
        keyword,
        position: match?.position ?? null,
        url: match?.url ?? null,
        searchVolume: match?.volume ?? 0,
        difficulty: match?.difficulty ?? 0,
      };
    });
    
    return {
      domain,
      rankings,
      lastChecked: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('[Rankings] Fetch failed:', error);
    return fallbackRankings(domain, keywords);
  }
}

// ============================================================================
// Helpers
// ============================================================================

function fallbackRankings(domain: string, keywords: string[]): RankingsData {
  return {
    domain,
    rankings: keywords.map(kw => ({
      keyword: kw,
      position: null,
      url: null,
      searchVolume: 0,
      difficulty: 0,
    })),
    lastChecked: new Date().toISOString(),
  };
}

// ============================================================================
// Position Change Detection
// ============================================================================

export function calculatePositionChanges(params: {
  current: KeywordRanking[];
  previous: KeywordRanking[];
}): {
  improved: Array<{ keyword: string; from: number; to: number }>;
  declined: Array<{ keyword: string; from: number; to: number }>;
  new_rankings: Array<{ keyword: string; position: number }>;
  lost_rankings: Array<{ keyword: string; previousPosition: number }>;
} {
  const { current, previous } = params;
  
  const improved: Array<{ keyword: string; from: number; to: number }> = [];
  const declined: Array<{ keyword: string; from: number; to: number }> = [];
  const new_rankings: Array<{ keyword: string; position: number }> = [];
  const lost_rankings: Array<{ keyword: string; previousPosition: number }> = [];
  
  current.forEach(curr => {
    const prev = previous.find(p => p.keyword === curr.keyword);
    
    if (!prev) {
      // New keyword
      if (curr.position !== null) {
        new_rankings.push({ keyword: curr.keyword, position: curr.position });
      }
      return;
    }
    
    // Both have positions - compare
    if (curr.position !== null && prev.position !== null) {
      if (curr.position < prev.position) {
        improved.push({ keyword: curr.keyword, from: prev.position, to: curr.position });
      } else if (curr.position > prev.position) {
        declined.push({ keyword: curr.keyword, from: prev.position, to: curr.position });
      }
    }
    // Lost ranking
    else if (curr.position === null && prev.position !== null) {
      lost_rankings.push({ keyword: curr.keyword, previousPosition: prev.position });
    }
    // Gained ranking
    else if (curr.position !== null && prev.position === null) {
      new_rankings.push({ keyword: curr.keyword, position: curr.position });
    }
  });
  
  return { improved, declined, new_rankings, lost_rankings };
}
