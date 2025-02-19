import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SessionAnalysis } from '../types';

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

export async function processText(text: string, isFullSession: boolean = false): Promise<SessionAnalysis | null> {
  try {
    if (!text || text.trim() === '') {
      return null;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }

    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Prepare prompt for analysis
    const prompt = `Analyze the following content and provide a structured analysis.
    
Content to analyze:
${isFullSession ? 'Full session data:' : 'Current capture:'} ${text}
${urls.length > 0 ? `Found URLs: ${urls.join(', ')}` : 'No URLs found'}

Instructions:
1. Categorize the content into exactly one of these categories: ${categories.join(', ')}
2. Extract topics and keywords, considering these predefined keywords: ${Object.values(keywordsByCategory).flat().join(', ')}
3. Provide a brief summary (max 100 words)

Format your response EXACTLY as follows (replace placeholders with actual values):
{
  "category": "one_of_the_predefined_categories",
  "topics": ["topic1", "topic2"],
  "keywords": ["keyword1", "keyword2"],
  "urls": ["url1", "url2"],
  "summary": "brief_summary"
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

    // Save to MongoDB
    try {
      await updateKeywordsAndUrls(
        analysis.category,
        analysis.keywords || [],
        analysis.urls || []
      );
    } catch (error) {
      console.error('Failed to save analysis to MongoDB:', error);
    }

    // Validate and sanitize the response
    const sanitizedAnalysis: SessionAnalysis = {
      category: categories.includes(analysis.category as any) 
        ? analysis.category 
        : categories[0],
      topics: Array.isArray(analysis.topics) 
        ? analysis.topics.filter(topic => typeof topic === 'string').slice(0, 10)
        : [],
      keywords: Array.isArray(analysis.keywords)
        ? analysis.keywords.filter(keyword => typeof keyword === 'string').slice(0, 20)
        : [],
      urls: Array.isArray(analysis.urls)
        ? [...new Set([...urls, ...analysis.urls.filter(url => typeof url === 'string')])]
        : urls,
      summary: typeof analysis.summary === 'string'
        ? analysis.summary.slice(0, 300)
        : 'No summary available'
    };

    return sanitizedAnalysis;
  } catch (error) {
    console.error('Error processing text:', error);
    return {
      category: categories[0],
      topics: [],
      keywords: [],
      urls: [],
      summary: 'Analysis failed due to technical issues. Please try again.'
    };
  }
}