import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SessionAnalysis } from '../types';
import api from './api';

export const categories = [
  'entertainment',
  'sports',
  'gaming',
  'coding',
  'adult',
] as const;

export const commonUrls: Record<typeof categories[number], string[]> = {
  entertainment: [
    'https://netflix.com',
    'https://spotify.com',
    'https://youtube.com',
  ],
  sports: [
    'https://espn.com',
    'https://nba.com',
    'https://fifa.com',
  ],
  gaming: [
    'https://twitch.tv',
    'https://steam.com',
    'https://epicgames.com',
  ],
  coding: [
    'https://github.com',
    'https://stackoverflow.com',
    'https://dev.to',
  ],
  adult: [
    'https://reddit.com/r/nsfw',
    'https://onlyfans.com',
  ],
};

export const keywordsByCategory: Record<typeof categories[number], string[]> = {
  entertainment: ['movie', 'music', 'show', 'celebrity', 'streaming'],
  sports: ['game', 'match', 'player', 'team', 'score'],
  gaming: ['game', 'player', 'level', 'score', 'achievement'],
  coding: ['code', 'programming', 'developer', 'software', 'git'],
  adult: ['18+', 'mature', 'adult', 'nsfw'],
};

const updateKeywordsAndUrls = async (category: string, newKeywords: string[], newUrls: string[]) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    const response = await fetch('http://localhost:3000/api/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        category,
        keywords: newKeywords,
        urls: newUrls,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update analysis data');
    }

    const data = await response.json();
    console.log('Analysis data saved:', data);

    // Update local data
    if (category in keywordsByCategory) {
      keywordsByCategory[category] = [...new Set([...keywordsByCategory[category], ...newKeywords])];
    }
    if (category in commonUrls) {
      commonUrls[category] = [...new Set([...commonUrls[category], ...newUrls])];
    }
  } catch (error) {
    console.error('Error updating analysis data:', error);
    throw error;
  }
};

// Improved URL extraction function
function extractUrls(text: string): string[] {
  // Enhanced regex for better URL detection - captures various formats including those with/without protocol
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  
  // Extract all potential URLs
  const matches = text.match(urlRegex) || [];
  
  // Process and normalize URLs
  return matches
    .map(url => {
      // Ensure URLs have proper protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    })
    .filter(url => {
      try {
        // Validate URL structure
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    });
}

// More advanced URL extraction that checks for embedded URLs within text
function extractAllPossibleUrls(text: string): string[] {
  // Basic URL extraction
  const simpleUrls = extractUrls(text);
  
  // Look for URL-like patterns within text
  const domainPattern = /\b([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}\b/gi;
  const potentialDomains = text.match(domainPattern) || [];
  
  // Filter domains and convert to URLs
  const domainUrls = potentialDomains
    .filter(domain => !simpleUrls.some(url => url.includes(domain))) // Avoid duplicates
    .map(domain => `https://${domain}`);
  
  return [...simpleUrls, ...domainUrls];
}

export async function processText(text: string, isFullSession: boolean = false): Promise<SessionAnalysis | null> {
  try {
    if (!text || text.trim() === '') {
      return null;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }

    // Extract URLs with improved function
    const extractedUrls = extractAllPossibleUrls(text);
    console.log('Extracted URLs:', extractedUrls);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Improved prompt for better extraction
    const prompt = `Analyze the following content and extract specific information.
    
Content to analyze:
${isFullSession ? 'Full session data:' : 'Current capture:'} ${text}
${extractedUrls.length > 0 ? `Already extracted URLs: ${extractedUrls.join(', ')}` : 'No URLs extracted yet'}

Instructions:
1. Categorize the content into exactly one of these categories: ${categories.join(', ')}

2. Extract SPECIFIC and MEANINGFUL keywords:
   - DO NOT use generic terms like "content", "information", "website", etc.
   - Focus on specific subject matter and technical terminology
   - Identify product names, brand names, technical terms, and domain-specific jargon
   - Extract proper nouns and named entities
   - For coding content, extract programming languages, frameworks, and technical concepts
   - For entertainment, extract titles, artist names, genres, and platform names
   - For gaming, extract game titles, gaming terms, and platform names

3. For URLs and domains:
   - Look for ALL possible URLs and domain names in the text
   - Include partial URLs, mentioned domains, and website references
   - Identify embedded links and URL patterns even if not fully formed
   - Check for social media handles and convert them to URLs when possible

4. Provide a concise summary that highlights the specific content focus

Format your response EXACTLY as follows (JSON format only):
{
  "category": "one_of_the_predefined_categories",
  "topics": ["specific_topic1", "specific_topic2"],
  "keywords": ["specific_keyword1", "specific_keyword2"],
  "extractedUrls": ["url1", "url2"],
  "potentialDomains": ["domain1.com", "domain2.org"],
  "summary": "concise_summary"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const jsonStr = jsonMatch[0];
    const analysis = JSON.parse(jsonStr);

    // Combine all URLs from different sources
    const allExtractedUrls = [
      ...extractedUrls,
      ...(Array.isArray(analysis.extractedUrls) ? analysis.extractedUrls : []),
      ...(Array.isArray(analysis.potentialDomains) ? 
          analysis.potentialDomains.map(d => d.startsWith('http') ? d : `https://${d}`) : 
          [])
    ];
    
    // Remove duplicates and normalize URLs
    const uniqueUrls = [...new Set(allExtractedUrls)].map(url => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    }).filter(url => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    });

    // Validate and sanitize the response
    const sanitizedAnalysis: SessionAnalysis = {
      category: categories.includes(analysis.category as any) 
        ? analysis.category 
        : categories[0],
      topics: Array.isArray(analysis.topics) 
        ? analysis.topics
            .filter(topic => typeof topic === 'string')
            .filter(topic => topic.length > 2)
            .filter(topic => !['content', 'information', 'website', 'online', 'internet'].includes(topic.toLowerCase()))
            .slice(0, 15)
        : [],
      keywords: Array.isArray(analysis.keywords)
        ? analysis.keywords
            .filter(keyword => typeof keyword === 'string')
            .filter(keyword => keyword.length > 2)
            .filter(keyword => !['content', 'information', 'website', 'online', 'internet', 'user', 'page', 'site'].includes(keyword.toLowerCase()))
            .slice(0, 30)
        : [],
      urls: uniqueUrls,
      summary: typeof analysis.summary === 'string'
        ? analysis.summary.slice(0, 1000)
        : 'No summary available'
    };

    // Log detailed information for debugging
    console.log('Text Analysis Results:', {
      category: sanitizedAnalysis.category,
      topics: sanitizedAnalysis.topics,
      keywordsCount: sanitizedAnalysis.keywords.length,
      urlsExtracted: sanitizedAnalysis.urls
    });

    // Save to learning system
    try {
      await api.post('/api/learning-data', {
        category: sanitizedAnalysis.category,
        keywords: sanitizedAnalysis.keywords,
        urls: sanitizedAnalysis.urls,
        confidence: calculateConfidence(sanitizedAnalysis)
      });
    } catch (error) {
      console.error('Failed to save to learning system:', error);
    }

    return sanitizedAnalysis;
  } catch (error) {
    console.error('Error processing text:', error);
    return null;
  }
}

// Enhanced confidence calculation
function calculateConfidence(analysis: SessionAnalysis): number {
  let confidence = 0.5;
  
  // More nuanced confidence calculations
  if (analysis.keywords.length > 5) confidence += 0.1;
  if (analysis.keywords.length > 10) confidence += 0.05;
  
  if (analysis.urls.length > 0) confidence += 0.1;
  if (analysis.urls.length > 3) confidence += 0.05;
  
  if (analysis.summary.length > 200) confidence += 0.05;
  if (analysis.summary.length > 500) confidence += 0.05;
  
  if (analysis.topics.length > 3) confidence += 0.05;
  if (analysis.topics.length > 7) confidence += 0.05;
  
  return Math.min(confidence, 1);
}

// Simplified session report generation
export function generateSessionReport(session: any, learningData: any) {
  // Simplified implementation that focuses on the extracted data
  const category = session.category || 'unknown';
  const keywords = session.keywords || [];
  const urls = session.urls || [];

  return `
Session Analysis Report:
- Category: ${category}
- Keywords detected: ${keywords.join(', ')}
- URLs visited: ${urls.join(', ')}
- Summary: ${session.summary || 'No summary available'}
`;
}