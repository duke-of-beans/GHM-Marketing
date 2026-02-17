import Anthropic from '@anthropic-ai/sdk';
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
    
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GHM-VoiceCapture/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fullUrl}: ${response.status}`);
    }
    
    const html = await response.text();
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
    const words = text.split(/\s+/);
    if (words.length > 5000) {
      text = words.slice(0, 5000).join(' ');
    }
    
    return text.trim();
  } catch (error) {
    console.error('Error scraping website:', error);
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Capture voice profile from a website using Claude API
 */
export async function captureVoiceFromWebsite(
  websiteUrl: string
): Promise<VoiceProfile> {
  // Scrape website content
  const websiteContent = await scrapeWebsiteContent(websiteUrl);
  
  if (!websiteContent || websiteContent.length < 100) {
    throw new Error('Insufficient content found on website to analyze voice');
  }
  
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
  
  // Analyze with Claude
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Analyze the writing style and brand voice from this website content:

${websiteContent}

Provide a detailed voice profile in JSON format with this EXACT structure:
{
  "tonality": "brief description of overall tone (e.g., professional yet approachable, technical and authoritative)",
  "vocabulary": ["key", "repeated", "industry", "terms", "that", "define", "the", "voice"],
  "sentenceStructure": "description of typical sentence patterns (e.g., short and punchy, complex with subordinate clauses)",
  "characteristics": {
    "formality": <1-10, where 1 is very casual and 10 is very formal>,
    "enthusiasm": <1-10, where 1 is subdued and 10 is very enthusiastic>,
    "technicality": <1-10, where 1 is plain language and 10 is highly technical>,
    "brevity": <1-10, where 1 is very verbose and 10 is very concise>
  }
}

Return ONLY the JSON object, no other text, no markdown formatting.`
    }]
  });
  
  // Parse JSON response
  const responseText = analysis.content[0].type === 'text' 
    ? analysis.content[0].text 
    : '';
    
  // Clean any markdown formatting
  const cleanedText = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  try {
    const profile = JSON.parse(cleanedText);
    
    // Validate structure
    if (!profile.tonality || !profile.vocabulary || !profile.sentenceStructure || !profile.characteristics) {
      throw new Error('Invalid voice profile structure returned from Claude');
    }
    
    // Generate unique profile ID
    const profileId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      profileId,
      tonality: profile.tonality,
      vocabulary: profile.vocabulary,
      sentenceStructure: profile.sentenceStructure,
      characteristics: {
        formality: Number(profile.characteristics.formality),
        enthusiasm: Number(profile.characteristics.enthusiasm),
        technicality: Number(profile.characteristics.technicality),
        brevity: Number(profile.characteristics.brevity),
      },
    };
  } catch (parseError) {
    console.error('Failed to parse voice profile JSON:', cleanedText);
    throw new Error('Failed to parse voice analysis from Claude API');
  }
}
