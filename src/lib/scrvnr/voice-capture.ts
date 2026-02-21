import { callAI } from "@/lib/ai";
import * as cheerio from 'cheerio';

export interface VoiceProfile {
  profileId: string;
  tonality: string;
  vocabulary: string[];
  sentenceStructure: string;
  characteristics: {
    formality: number;      // 1-10
    enthusiasm: number;     // 1-10
    technicality: number;   // 1-10
    brevity: number;        // 1-10
  };
}

/**
 * Scrape text content from a website
 */
async function scrapeWebsiteContent(url: string): Promise<string> {
  try {
    // Add protocol if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    console.log(`Fetching ${fullUrl}...`);
    
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GHM-VoiceCapture/1.0)',
      },
      // Add timeout
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(`Website blocked our request (403 Forbidden). The site may have bot protection enabled.`);
      } else if (response.status === 404) {
        throw new Error(`Website not found (404). Please verify the URL is correct.`);
      } else if (response.status >= 500) {
        throw new Error(`Website server error (${response.status}). The site may be temporarily unavailable.`);
      }
      throw new Error(`Failed to fetch ${fullUrl}: HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    if (!html || html.length < 100) {
      throw new Error('Website returned very little content. It may be a single-page app or have restricted access.');
    }
    
    const $ = cheerio.load(html);
    
    // Remove script, style, nav, footer elements
    $('script, style, nav, footer, header').remove();
    
    // Extract text from main content areas
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '.content',
      '#content',
      'p',
      'h1, h2, h3, h4, h5, h6',
    ];
    
    let text = '';
    contentSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const elementText = $(el).text().trim();
        if (elementText.length > 20) { // Avoid short fragments
          text += elementText + '\n\n';
        }
      });
    });
    
    // Limit to ~5000 words for API efficiency
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 5000) {
      text = words.slice(0, 5000).join(' ');
    }
    
    const finalText = text.trim();
    
    if (!finalText || finalText.length < 100) {
      throw new Error('Could not extract meaningful text content from the website. The site may be JavaScript-heavy or have minimal text.');
    }
    
    return finalText;
  } catch (error) {
    console.error('Error scraping website:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Website took too long to respond (timeout after 15 seconds). The site may be slow or unreachable.`);
      }
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        throw new Error(`Could not connect to website. Please verify the URL is correct and the site is online.`);
      }
      throw error;
    }
    
    throw new Error(`Failed to scrape website: Unknown error`);
  }
}

/**
 * Capture voice profile from a website using Claude API
 */
export async function captureVoiceFromWebsite(
  websiteUrl: string,
  clientId = 0,
  clientName = "Unknown"
): Promise<VoiceProfile> {
  // Scrape website content
  console.log(`Scraping website: ${websiteUrl}`);
  const websiteContent = await scrapeWebsiteContent(websiteUrl);

  if (!websiteContent || websiteContent.length < 100) {
    throw new Error('Insufficient content found on website to analyze voice. The website may be blocking scrapers or has minimal text content.');
  }

  console.log(`Scraped ${websiteContent.length} characters of content`);
  console.log('Sending content to Claude for voice analysis...');

  const result = await callAI({
    feature: "voice_capture",
    prompt: `Analyze the writing style and brand voice from this website content:\n\n${websiteContent}`,
    context: {
      feature: "voice_capture",
      clientId,
      clientName,
    },
    maxTokens: 1200,
  });

  if (!result.ok) {
    throw new Error(`Voice capture AI call failed: ${result.error}`);
  }

  console.log('Received voice analysis from Claude');

  // Clean any residual markdown fencing (system prompt forbids it, but defensive)
  const cleanedText = result.content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  console.log('Parsing voice profile JSON...');
  let profile: {
    tonality: string;
    vocabulary: string[];
    sentenceStructure: string;
    characteristics: {
      formality: number;
      enthusiasm: number;
      technicality: number;
      brevity: number;
    };
  };

  try {
    profile = JSON.parse(cleanedText);
  } catch {
    throw new Error('Failed to parse voice analysis from Claude API. The response was not valid JSON.');
  }

  // Validate structure
  if (!profile.tonality || !profile.vocabulary || !profile.sentenceStructure || !profile.characteristics) {
    console.error('Invalid profile structure:', profile);
    throw new Error('Invalid voice profile structure returned from Claude. Missing required fields.');
  }

  if (!Array.isArray(profile.vocabulary)) {
    throw new Error('Invalid vocabulary format - must be an array');
  }

  const { formality, enthusiasm, technicality, brevity } = profile.characteristics;
  if (!formality || !enthusiasm || !technicality || !brevity) {
    throw new Error('Missing characteristic scores in voice profile');
  }

  // Generate unique profile ID
  const profileId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('Voice profile generated successfully');

  return {
    profileId,
    tonality: profile.tonality,
    vocabulary: profile.vocabulary,
    sentenceStructure: profile.sentenceStructure,
    characteristics: {
      formality: Number(formality),
      enthusiasm: Number(enthusiasm),
      technicality: Number(technicality),
      brevity: Number(brevity),
    },
  };
}
