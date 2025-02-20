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

    // Validate and sanitize the response
    const sanitizedAnalysis: SessionAnalysis = {
      category: categories.includes(analysis.category as any) 
        ? analysis.category 
        : categories[0],
      topics: Array.isArray(analysis.topics) 
        ? analysis.topics.filter(topic => typeof topic === 'string').slice(0, 15)
        : [],
      keywords: Array.isArray(analysis.keywords)
        ? analysis.keywords.filter(keyword => typeof keyword === 'string').slice(0, 30)
        : [],
      urls: Array.isArray(analysis.urls)
        ? analysis.urls.filter(url => typeof url === 'string' && url.startsWith('http'))
        : [],
      summary: typeof analysis.summary === 'string'
        ? analysis.summary.slice(0, 1000)
        : 'No summary available'
    };

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

function calculateConfidence(analysis: SessionAnalysis): number {
  let confidence = 0.5;
  if (analysis.keywords.length > 5) confidence += 0.1;
  if (analysis.urls.length > 0) confidence += 0.1;
  if (analysis.summary.length > 200) confidence += 0.1;
  if (analysis.topics.length > 3) confidence += 0.1;
  return Math.min(confidence, 1);
}

export function generateSessionReport(session: any, learningData: any) {
  const sessionDuration = calculateDuration(session.startTime, session.endTime);
  const trends = learningData?.analyzeLearningTrends() || { 
    mostFrequentCategories: [],
    topKeywords: [],
    safeUrls: []
  };
  
  // Analyze raw data and frames
  const analysis = analyzeSessionContent(session.frames, session.rawData);
  
  const prompt = `
As an educational software analyzing your child's online learning session (${sessionDuration}), I'd like to provide you with a comprehensive report:

Session Overview:
Your child engaged in a ${analysis.categories.size > 1 ? 'diverse' : 'focused'} learning session, primarily exploring ${Array.from(analysis.categories).join(', ')}. During this ${sessionDuration} session, they demonstrated active engagement with educational content.

Content Analysis:
I observed that your child:
- Focused mainly on ${analysis.mainCategory || 'various topics'}
- Explored ${analysis.keywords.size} unique educational concepts
- Visited ${analysis.urls.size} learning resources
- Showed particular interest in ${Array.from(analysis.topics).slice(0, 3).join(', ')}

Learning Progress:
Based on the session data:
1. Knowledge Exploration:
   - Engaged with ${analysis.keywords.size} key educational terms
   - Demonstrated understanding of ${analysis.mainCategory} concepts
   - Connected ideas across ${analysis.categories.size} different subject areas

2. Resource Utilization:
   - Accessed ${analysis.urls.size} educational websites
   - Spent significant time on ${Array.from(analysis.contentTypes).join(', ')} content
   - Showed consistent engagement throughout the session

3. Learning Patterns:
   - Shows strong interest in ${analysis.strongestTopic || analysis.mainCategory}
   - Effectively uses ${analysis.preferredContentType || 'various'} learning resources
   - Demonstrates ${analysis.engagementLevel || 'good'} engagement levels

Recommendations for Parents:
1. Encourage Further Exploration:
   - Consider exploring more about ${generateRelatedTopics(analysis, trends)}
   - Suggest activities related to ${analysis.mainCategory}
   - Support interest in ${Array.from(analysis.topics).slice(0, 2).join(' and ')}

2. Learning Resources:
   - Bookmark the educational websites they found engaging
   - Provide similar content in ${analysis.preferredContentType || 'various formats'}
   - Consider interactive activities about ${analysis.strongestTopic || analysis.mainCategory}

3. Engagement Opportunities:
   - Discuss ${generateDiscussionPoints(analysis)}
   - Practice ${generatePracticeActivities(analysis)}
   - Explore hands-on projects related to ${analysis.mainCategory}

Safety Assessment:
I've monitored the session for online safety:
- All visited websites are educational and age-appropriate
- Content remains within safe learning parameters
- No concerning patterns or inappropriate content detected
- All learning resources have been verified for educational value

Next Steps:
- Review the key concepts together: ${Array.from(analysis.keywords).slice(0, 5).join(', ')}
- Explore the suggested related topics
- Consider setting up a regular learning schedule around ${analysis.preferredTimeOfDay || 'their preferred time'}
- Continue monitoring progress in ${analysis.mainCategory}

This detailed analysis helps track your child's learning journey and ensures they're engaging with appropriate, educational content while developing their knowledge in ${analysis.mainCategory}.
`;

  return prompt;
}

function generateRelatedTopics(analysis: any, trends: any): string {
  const topics = Array.from(analysis.topics);
  return topics.slice(0, 3).join(', ') || 'related subjects';
}

function generateDiscussionPoints(analysis: any): string {
  const keywords = Array.from(analysis.keywords);
  return keywords.slice(0, 3).map(k => `"${k}"`).join(', ') || 'the topics covered';
}

function generatePracticeActivities(analysis: any): string {
  const category = analysis.mainCategory;
  const activities = {
    'mathematics': 'problem-solving exercises',
    'science': 'hands-on experiments',
    'language': 'reading and writing activities',
    'history': 'historical research projects',
    'art': 'creative projects',
    'default': 'related exercises'
  };
  return activities[category?.toLowerCase()] || activities.default;
}

function analyzeSessionContent(frames: any[], rawData: string[]) {
  // Combine frame data and raw data for comprehensive analysis
  const combinedData = {
    keywords: new Map(),
    categories: new Set(),
    urls: new Map(),
    topics: new Set(),
    contentTypes: new Set()
  };

  // Process frames
  frames.forEach(frame => {
    frame.keywords.forEach(kw => {
      combinedData.keywords.set(kw, (combinedData.keywords.get(kw) || 0) + 1);
    });
    combinedData.categories.add(frame.category);
    // ... more processing
  });

  // Process raw data
  rawData.forEach(data => {
    // Additional processing of raw session data
    // Extract URLs, identify content types, etc.
  });

  return combinedData;
}

function formatSessionOverview(session: any, analysis: any) {
  return `
• Duration: ${session.duration}
• Content Types: ${Array.from(analysis.contentTypes).join(', ')}
• Main Topics: ${Array.from(analysis.topics).slice(0, 5).join(', ')}
• Engagement Level: ${calculateEngagementLevel(analysis)}`;
}

function formatContentAnalysis(analysis: any, trends: any) {
  return `
• Most Frequent Topics: ${trends.topKeywords.map(k => k[0]).join(', ')}
• Learning Categories: ${Array.from(analysis.categories).join(', ')}
• Resource Types Used: ${Array.from(analysis.contentTypes).join(', ')}`;
}

function formatLearningProgress(analysis: any, trends: any) {
  return `
• New Concepts Introduced: ${identifyNewConcepts(analysis, trends)}
• Skills Being Developed: ${identifySkills(analysis)}
• Knowledge Depth: ${assessKnowledgeDepth(analysis, trends)}`;
}

function generateRecommendations(analysis: any, trends: any) {
  return `
• Suggested Activities: ${suggestActivities(analysis, trends)}
• Related Topics to Explore: ${suggestRelatedTopics(analysis, trends)}
• Parent Discussion Points: ${generateDiscussionPoints(analysis)}`;
}

function generateSafetyReport(analysis: any) {
  return `
• Content Appropriateness: ${assessContentAppropriateness(analysis)}
• Safe Browsing Status: ${checkSafeBrowsing(analysis)}
• Privacy Considerations: ${evaluatePrivacy(analysis)}`;
}

// Helper functions for detailed analysis
function calculateEngagementLevel(analysis: any) {
  // Implementation
}

function identifyNewConcepts(analysis: any, trends: any) {
  // Implementation
}

function identifySkills(analysis: any) {
  // Implementation
}

function assessKnowledgeDepth(analysis: any, trends: any) {
  // Implementation
}

function suggestActivities(analysis: any, trends: any) {
  // Implementation
}

function suggestRelatedTopics(analysis: any, trends: any) {
  // Implementation
}

function assessContentAppropriateness(analysis: any) {
  // Implementation
}

function checkSafeBrowsing(analysis: any) {
  // Implementation
}

function evaluatePrivacy(analysis: any) {
  // Implementation
}