// utils/socialMediaParser.js
// Parse social media post captions to extract service information

/**
 * Extract price from text
 * Matches patterns like: $25, 25 dollars, $25/hour, 25.00, etc.
 */
function extractPrice(text) {
  // Pattern 1: $XX or $XX.XX
  const dollarPattern = /\$(\d+(?:\.\d{2})?)/;
  const dollarMatch = text.match(dollarPattern);
  if (dollarMatch) {
    return parseFloat(dollarMatch[1]);
  }

  // Pattern 2: XX dollars, XX bucks
  const wordsPattern = /(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?|usd)/i;
  const wordsMatch = text.match(wordsPattern);
  if (wordsMatch) {
    return parseFloat(wordsMatch[1]);
  }

  return null;
}

/**
 * Extract duration from text
 * Matches patterns like: 60 minutes, 1 hour, 90 min, 1.5 hours, etc.
 */
function extractDuration(text) {
  // Pattern 1: XX minutes/mins
  const minutePattern = /(\d+(?:\.\d+)?)\s*(?:minutes?|mins?)/i;
  const minuteMatch = text.match(minutePattern);
  if (minuteMatch) {
    return Math.round(parseFloat(minuteMatch[1]));
  }

  // Pattern 2: XX hours/hrs (convert to minutes)
  const hourPattern = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i;
  const hourMatch = text.match(hourPattern);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }

  return null;
}

/**
 * Extract service title from text
 * Looks for patterns like: "Math Tutoring", "Photography Services", etc.
 */
function extractTitle(text) {
  // Remove URLs, hashtags, emojis for cleaner text
  let cleanText = text
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/#\w+/g, '') // Remove hashtags
    .replace(/[@]\w+/g, '') // Remove mentions
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .trim();

  // Look for title patterns at the start
  // Pattern 1: "Service Name Available", "Offering Service Name"
  const offeringPattern = /^(?:offering|providing|available for)?\s*([A-Z][A-Za-z\s&-]+?)(?:available|services?|help|assistance)/i;
  const offeringMatch = cleanText.match(offeringPattern);
  if (offeringMatch) {
    return offeringMatch[1].trim();
  }

  // Pattern 2: First sentence that's not too long
  const firstSentence = cleanText.split(/[.!?]/)[0].trim();
  if (firstSentence && firstSentence.length < 50 && firstSentence.length > 5) {
    // Remove common intro words
    const title = firstSentence
      .replace(/^(?:hey|hi|hello|offering|providing|i'm offering|i offer|available for)\s*/i, '')
      .trim();
    
    if (title.length > 0) {
      return title;
    }
  }

  // Pattern 3: Look for capitalized words that might be a service
  const capsPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/;
  const capsMatch = cleanText.match(capsPattern);
  if (capsMatch && capsMatch[1].length < 40) {
    return capsMatch[1];
  }

  return null;
}

/**
 * Classify service category based on keywords
 */
function classifyCategory(text) {
  const lowerText = text.toLowerCase();
  
  const categories = {
    'Academic': [
      'tutor', 'tutoring', 'homework', 'study', 'test prep', 'exam', 'math', 
      'calculus', 'algebra', 'science', 'chemistry', 'physics', 'biology',
      'english', 'writing', 'essay', 'research', 'paper', 'assignment'
    ],
    'Physical': [
      'moving', 'fitness', 'training', 'gym', 'workout', 'exercise', 
      'sports', 'coaching', 'yoga', 'lifting', 'cardio', 'muscle',
      'yard work', 'landscaping', 'cleaning', 'hauling'
    ],
    'Professional': [
      'resume', 'cv', 'career', 'interview', 'professional', 'consulting',
      'business', 'linkedin', 'portfolio', 'networking', 'job search'
    ],
    'Creative': [
      'photo', 'photography', 'picture', 'portrait', 'design', 'graphic',
      'art', 'drawing', 'painting', 'video', 'editing', 'creative',
      'logo', 'poster', 'illustration', 'visual'
    ],
    'Health': [
      'meal prep', 'nutrition', 'diet', 'health', 'wellness', 'mental health',
      'therapy', 'counseling', 'mindfulness', 'meditation', 'food', 'cooking'
    ],
    'Technology': [
      'coding', 'programming', 'web', 'app', 'software', 'tech', 'computer',
      'laptop', 'phone', 'repair', 'setup', 'installation', 'data', 'debug'
    ],
    'Music': [
      'music', 'guitar', 'piano', 'drums', 'singing', 'vocal', 'dj',
      'instrument', 'lesson', 'band', 'performance', 'audio', 'production'
    ],
    'Transportation': [
      'ride', 'drive', 'transport', 'shuttle', 'delivery', 'pickup',
      'airport', 'uber', 'lyft', 'moving', 'haul', 'car'
    ]
  };

  // Count keyword matches for each category
  const scores = {};
  for (const [category, keywords] of Object.entries(categories)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[category]++;
      }
    }
  }

  // Return category with highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    const bestCategory = Object.keys(scores).find(cat => scores[cat] === maxScore);
    return bestCategory;
  }

  return null;
}

/**
 * Extract full description (clean up the caption)
 */
function extractDescription(text) {
  // Remove excessive emojis and clean up
  let description = text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/#\w+/g, '') // Remove hashtags
    .replace(/[@]\w+/g, '') // Remove mentions
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Limit to reasonable length
  if (description.length > 500) {
    description = description.substring(0, 500) + '...';
  }

  return description || null;
}

/**
 * Main parser function - extract all service information from social media caption
 */
function parseSocialMediaPost(caption) {
  if (!caption || typeof caption !== 'string') {
    return {
      success: false,
      error: 'Invalid caption text'
    };
  }

  const price = extractPrice(caption);
  const duration = extractDuration(caption);
  const title = extractTitle(caption);
  const category = classifyCategory(caption);
  const description = extractDescription(caption);

  // Calculate confidence score (how much info we extracted)
  const extracted = [price, duration, title, category, description].filter(v => v !== null).length;
  const confidence = (extracted / 5) * 100;

  return {
    success: true,
    data: {
      title: title,
      category: category,
      description: description,
      duration_min: duration,
      base_price_usd: price
    },
    metadata: {
      confidence: Math.round(confidence),
      extracted: {
        price: price !== null,
        duration: duration !== null,
        title: title !== null,
        category: category !== null,
        description: description !== null
      }
    },
    originalCaption: caption
  };
}

/**
 * Suggest improvements for poorly formatted captions
 */
function suggestImprovements(parseResult) {
  const suggestions = [];

  if (!parseResult.data.base_price_usd) {
    suggestions.push('Add price information (e.g., "$25" or "25 dollars")');
  }

  if (!parseResult.data.duration_min) {
    suggestions.push('Add duration information (e.g., "60 minutes" or "1 hour")');
  }

  if (!parseResult.data.title) {
    suggestions.push('Make your service name more clear at the beginning');
  }

  if (!parseResult.data.category) {
    suggestions.push('Include keywords related to your service type (tutoring, photography, etc.)');
  }

  return suggestions;
}

module.exports = {
  parseSocialMediaPost,
  suggestImprovements,
  extractPrice,
  extractDuration,
  extractTitle,
  classifyCategory,
  extractDescription
};
