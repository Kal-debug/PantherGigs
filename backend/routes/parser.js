// routes/parser.js
// API routes for social media caption parsing

const express = require('express');
const router = express.Router();
const { parseSocialMediaPost, suggestImprovements } = require('../utils/socialMediaParser');

// @route   POST /api/parser/parse-social-post
// @desc    Parse social media caption to extract service information
// @access  Public
router.post('/parse-social-post', (req, res) => {
  try {
    const { caption } = req.body;

    if (!caption) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a caption to parse'
      });
    }

    // Parse the caption
    const result = parseSocialMediaPost(caption);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    // Add suggestions for improvement
    const suggestions = suggestImprovements(result);

    res.json({
      success: true,
      message: 'Caption parsed successfully',
      data: result.data,
      metadata: {
        ...result.metadata,
        suggestions: suggestions.length > 0 ? suggestions : null
      },
      originalCaption: result.originalCaption
    });

  } catch (error) {
    console.error('Parse caption error:', error);
    res.status(500).json({
      success: false,
      message: 'Error parsing caption'
    });
  }
});

// @route   GET /api/parser/test-examples
// @desc    Get example captions for testing
// @access  Public
router.get('/test-examples', (req, res) => {
  const examples = [
    {
      name: 'Academic Tutoring',
      caption: '📚 Math Tutoring Available! $25/hour for Calculus & Algebra help. Sessions are 60 minutes. DM me to book! #GSUTutoring #MathHelp'
    },
    {
      name: 'Photography Service',
      caption: 'Hey! Offering Photography Services 📸 Professional portraits and event coverage. $50 per hour session. Contact for booking! #GSUPhotographer'
    },
    {
      name: 'Fitness Training',
      caption: 'Personal Training Sessions 💪 Get fit this semester! 45 minute workouts, $30 per session. Available Mon-Fri at campus gym. #GSUFitness'
    },
    {
      name: 'Moving Help',
      caption: 'Need help moving? 🚚 Strong and reliable! $40 for 2 hours of moving assistance. Furniture, boxes, whatever you need. HMU!'
    },
    {
      name: 'Resume Review',
      caption: 'Professional Resume Review ✍️ Help you land that internship! $20 for detailed feedback and editing. 30 minute consultation included.'
    }
  ];

  res.json({
    success: true,
    count: examples.length,
    examples: examples
  });
});

module.exports = router;
