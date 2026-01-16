import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { persistTempleImages, getTempleImages, getAllTempleImages } from './persist_images.js';

import { templesData } from './templeData.js';
import { trainModel, predictCrowd } from './mlService.js';
import { optimizeRoute } from './plannerService.js';
dotenv.config();

const app = express();
// In-memory storage for fallback mode
let inMemoryUsers = [];

// Security & Request Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://temple-yatra.vercel.app',
    'https://yatra-app-nine.vercel.app',
    'https://tirthayatra.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ]
}));

// Request size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per windowMs (relaxed for testing)
  message: 'Too many requests, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per windowMs (more reasonable)
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limit to all routes
app.use(limiter);

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/templetrip';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000 // Fast fail
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('⚠️ Running in In-Memory Mode (No Database Persistence)');
    return false;
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  savedPlans: [{
    name: String,
    date: Date,
    temples: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Temple' }],
    createdAt: { type: Date, default: Date.now }
  }],
  favoriteTemples: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Temple' }],
  visitHistory: [{
    temple: { type: mongoose.Schema.Types.ObjectId, ref: 'Temple' },
    visitDate: { type: Date, required: true },
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String, maxLength: 500 },
    crowdLevel: { type: String, enum: ['low', 'medium', 'high'] },
    checkedInAt: { type: Date, default: Date.now }
  }],
  notifications: [{
    type: { type: String, enum: ['trip_reminder', 'crowd_alert', 'achievement'], default: 'trip_reminder' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedTrip: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    relatedTemple: { type: mongoose.Schema.Types.ObjectId, ref: 'Temple' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['alert', 'info', 'success', 'warning'], default: 'info' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Temple Schema
const templeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  state: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  imageCredit: { type: String },
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 1000 },
  timings: { type: String },
  timingDetails: [{ type: String }],
  darshanTime: { type: String },
  bestTimeToVisit: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  deity: { type: String },
  significance: { type: String },
  dos: [{ type: String }],
  donts: [{ type: String }],
  crowdPattern: {
    type: { type: String, enum: ['general', 'high_traffic', 'pilgrimage', 'tourist'], default: 'general' }
  },
  specialDays: [{ day: String, multiplier: Number }],
  peakMonths: [Number],

  // New fields
  openHour: { type: Number, default: 5 },
  closeHour: { type: Number, default: 22 },
  baseWaitTime: { type: Number, default: 30 }, // in minutes
  uniqueness: {
    spiritual: { type: String },
    scientific: { type: String },
    history: { type: String }
  },

  createdAt: { type: Date, default: Date.now }
});

const Temple = mongoose.model('Temple', templeSchema);

// ============================================
// AI ENHANCEMENT SCHEMAS
// ============================================

// CrowdReport Schema - Real-time crowd reports from users
const crowdReportSchema = new mongoose.Schema({
  templeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Temple', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
  estimatedWait: { type: Number, min: 0, max: 600 }, // minutes
  crowdPercentage: { type: Number, min: 0, max: 100 }, // optional precise percentage
  timestamp: { type: Date, default: Date.now },
  hour: { type: Number, min: 0, max: 23 },
  dayOfWeek: { type: Number, min: 0, max: 6 },
  isVerified: { type: Boolean, default: false },
  trustScore: { type: Number, default: 1.0, min: 0, max: 2.0 } // User reliability weight
});

// TTL index to auto-delete old reports after 90 days
crowdReportSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
// Compound index for efficient aggregation queries
crowdReportSchema.index({ templeId: 1, hour: 1, dayOfWeek: 1 });

const CrowdReport = mongoose.model('CrowdReport', crowdReportSchema);

// WeatherCache Schema - Cached weather forecasts with TTL
const weatherCacheSchema = new mongoose.Schema({
  templeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Temple', required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  forecast: {
    current: {
      temp: Number, // Celsius
      feels_like: Number,
      humidity: Number,
      condition: String, // 'clear', 'clouds', 'rain', 'thunderstorm', 'snow', 'mist'
      description: String,
      icon: String,
      precipitation: Number, // probability 0-100
      windSpeed: Number // km/h
    },
    hourly: [{
      hour: Number,
      temp: Number,
      condition: String,
      precipitation: Number
    }],
    daily: [{
      date: String,
      tempMin: Number,
      tempMax: Number,
      condition: String,
      precipitation: Number
    }]
  },
  weatherMultiplier: { type: Number, default: 1.0 }, // Pre-calculated multiplier
  fetchedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true } // Removed redundant index: true
});

// TTL index for automatic cache expiration
weatherCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
weatherCacheSchema.index({ templeId: 1 }, { unique: true });

const WeatherCache = mongoose.model('WeatherCache', weatherCacheSchema);

// PredictionAccuracy Schema - Track prediction vs actual for ML training
const predictionAccuracySchema = new mongoose.Schema({
  templeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Temple', required: true, index: true },
  date: { type: Date, required: true },
  hour: { type: Number, min: 0, max: 23, required: true },
  dayOfWeek: { type: Number, min: 0, max: 6 },
  predictedLevel: { type: String, enum: ['low', 'medium', 'high'] },
  predictedPercentage: { type: Number, min: 0, max: 100 },
  predictedWait: { type: Number },
  actualLevel: { type: String, enum: ['low', 'medium', 'high'] },
  actualPercentage: { type: Number, min: 0, max: 100 },
  actualWait: { type: Number },
  reportCount: { type: Number, default: 1 }, // How many reports contributed to actual
  accuracyScore: { type: Number }, // 0-1 score of prediction accuracy
  factors: {
    weatherApplied: { type: Boolean, default: false },
    festivalApplied: { type: Boolean, default: false },
    userFeedbackApplied: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries
predictionAccuracySchema.index({ templeId: 1, date: 1, hour: 1 });
// TTL to keep data for 1 year (for ML training)
predictionAccuracySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const PredictionAccuracy = mongoose.model('PredictionAccuracy', predictionAccuracySchema);

// ============================================
// END AI ENHANCEMENT SCHEMAS
// ============================================

// Festival Calendar (2026) - Updated for current year
const festivals = [
  { name: 'Makar Sankranti', date: '2026-01-14', fixedDate: '01-14', multiplier: 1.8, description: 'Major winter harvest festival' },
  { name: 'Republic Day', date: '2026-01-26', fixedDate: '01-26', multiplier: 1.3, description: 'National holiday celebrating India' },
  { name: 'Maha Shivaratri', date: '2026-02-14', multiplier: 2.0, description: 'Festival dedicated to Lord Shiva' },
  { name: 'Holi', date: '2026-03-05', multiplier: 1.6, description: 'Festival of colors and joy' },
  { name: 'Ram Navami', date: '2026-03-19', multiplier: 1.8, description: 'Birth of Lord Rama' },
  { name: 'Mahavir Jayanti', date: '2026-04-02', multiplier: 1.3, description: 'Birth of Mahavira (Jain festival)' },
  { name: 'Good Friday', date: '2026-04-10', multiplier: 1.2, description: 'Christian holy day' },
  { name: 'Baisakhi', date: '2026-04-13', fixedDate: '04-13', multiplier: 1.5, description: 'Punjabi harvest festival' },
  { name: 'Tamil New Year', date: '2026-04-14', fixedDate: '04-14', multiplier: 1.4, description: 'South Indian new year' },
  { name: 'Buddha Purnima', date: '2026-05-04', multiplier: 1.3, description: 'Birth of Buddha' },
  { name: 'Rath Yatra', date: '2026-06-16', multiplier: 2.0, description: 'Chariot festival of Lord Jagannath' },
  { name: 'Guru Purnima', date: '2026-07-09', multiplier: 1.4, description: 'Festival honoring teachers and gurus' },
  { name: 'Raksha Bandhan', date: '2026-08-08', multiplier: 1.3, description: 'Festival of sibling bond' },
  { name: 'Janmashtami', date: '2026-08-15', multiplier: 1.9, description: 'Birth of Lord Krishna' },
  { name: 'Ganesh Chaturthi', date: '2026-08-26', multiplier: 1.8, description: 'Festival of Lord Ganesha' },
  { name: 'Navratri Start', date: '2026-09-17', multiplier: 1.6, description: 'Nine nights of Goddess worship' },
  { name: 'Dussehra', date: '2026-09-27', multiplier: 1.7, description: 'Victory of good over evil' },
  { name: 'Diwali', date: '2026-11-08', multiplier: 1.9, description: 'Festival of lights' },
  { name: 'Govardhan Puja', date: '2026-11-09', multiplier: 1.5, description: 'Celebration of Krishna lifting mountain' },
  { name: 'Chhath Puja', date: '2026-11-23', multiplier: 1.6, description: 'Festival honoring the Sun God' },
  { name: 'Guru Nanak Jayanti', date: '2026-12-04', multiplier: 1.5, description: 'Birth of Guru Nanak (Sikh)' },
  { name: 'Christmas', date: '2026-12-25', fixedDate: '12-25', multiplier: 1.3, description: 'Christian celebration of birth of Jesus' },
];

// Hourly crowd patterns (0-23 hours)
const hourlyPatterns = {
  general: [10, 8, 5, 15, 35, 60, 80, 90, 85, 70, 60, 55, 50, 45, 50, 55, 65, 75, 85, 80, 65, 45, 30, 15],
  high_traffic: [45, 35, 25, 35, 55, 80, 95, 100, 95, 85, 80, 75, 70, 65, 70, 75, 85, 95, 100, 95, 85, 70, 55, 50],
  pilgrimage: [30, 20, 15, 40, 70, 90, 95, 100, 90, 80, 70, 65, 60, 55, 60, 70, 80, 90, 85, 75, 60, 45, 35, 30],
  tourist: [5, 5, 5, 5, 10, 30, 50, 70, 80, 85, 90, 85, 80, 75, 80, 85, 90, 85, 75, 60, 45, 30, 15, 8]
};

// Day of week multipliers (0=Sunday, 6=Saturday)
const dayMultipliers = [1.4, 0.85, 0.8, 0.8, 0.85, 0.95, 1.5];

// ============================================
// AI HELPER FUNCTIONS
// ============================================

// Aggregate historical crowd reports for a temple/hour/day combination
const getHistoricalCrowdData = async (templeId, hour, dayOfWeek) => {
  try {
    // Skip if no DB connection
    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    const aggregation = await CrowdReport.aggregate([
      {
        $match: {
          templeId: new mongoose.Types.ObjectId(templeId),
          hour: hour,
          dayOfWeek: dayOfWeek,
          // Only consider reports from the last 60 days
          timestamp: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          avgCrowdPercentage: { $avg: '$crowdPercentage' },
          avgWait: { $avg: '$estimatedWait' },
          reportCount: { $sum: 1 },
          avgTrustScore: { $avg: '$trustScore' },
          levels: { $push: '$reportedLevel' }
        }
      }
    ]);

    if (aggregation.length === 0) {
      return null;
    }

    const data = aggregation[0];

    // Calculate most common level
    const levelCounts = { low: 0, medium: 0, high: 0 };
    data.levels.forEach(level => levelCounts[level]++);
    const dominantLevel = Object.entries(levelCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Calculate confidence based on sample size
    // More reports = higher confidence, max at 30 reports
    const confidence = Math.min(data.reportCount / 30, 1);

    return {
      avgCrowdPercentage: Math.round(data.avgCrowdPercentage || 0),
      avgWait: Math.round(data.avgWait || 0),
      reportCount: data.reportCount,
      dominantLevel,
      confidence,
      trustWeightedScore: data.avgTrustScore || 1.0
    };
  } catch (error) {
    console.error('Error fetching historical crowd data:', error);
    return null;
  }
};

// Get recent real-time reports (last 2 hours) for live adjustments
const getRecentCrowdReports = async (templeId) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const reports = await CrowdReport.find({
      templeId: new mongoose.Types.ObjectId(templeId),
      timestamp: { $gte: twoHoursAgo }
    }).sort({ timestamp: -1 }).limit(10);

    if (reports.length === 0) {
      return null;
    }

    // Weight more recent reports higher
    let weightedSum = 0;
    let totalWeight = 0;

    reports.forEach((report, index) => {
      // Newer reports get higher weight
      const recencyWeight = 1 / (index + 1);
      const trustWeight = report.trustScore || 1.0;
      const weight = recencyWeight * trustWeight;

      // Convert level to percentage if crowdPercentage not available
      let percentage = report.crowdPercentage;
      if (!percentage) {
        percentage = report.reportedLevel === 'low' ? 25 :
          report.reportedLevel === 'medium' ? 55 : 85;
      }

      weightedSum += percentage * weight;
      totalWeight += weight;
    });

    return {
      livePercentage: Math.round(weightedSum / totalWeight),
      reportCount: reports.length,
      latestReport: reports[0].timestamp,
      isRecent: true
    };
  } catch (error) {
    console.error('Error fetching recent crowd reports:', error);
    return null;
  }
};

import { fetchAndCacheWeather } from './weatherService.js';

// Calculate weather multiplier from cached weather data
const getWeatherMultiplier = async (templeId) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { multiplier: 1.0, condition: null };
    }

    // 1. Try to find valid cache
    const cache = await WeatherCache.findOne({
      templeId: new mongoose.Types.ObjectId(templeId),
      expiresAt: { $gt: new Date() }
    });

    if (cache) {
      return {
        multiplier: cache.weatherMultiplier || 1.0,
        condition: cache.forecast?.current?.condition || null,
        temp: cache.forecast?.current?.temp || null,
        precipitation: cache.forecast?.current?.precipitation || 0
      };
    }

    // 2. If no valid cache, fetch fresh data
    const temple = await Temple.findById(templeId);
    if (temple && temple.lat && temple.lng) {
      // This will fetch from API, save to DB, and return the new data
      return await fetchAndCacheWeather(templeId, temple.lat, temple.lng);
    }

    return { multiplier: 1.0, condition: null };

  } catch (error) {
    console.error('Error fetching weather multiplier:', error);
    return { multiplier: 1.0, condition: null };
  }
};

// Calculate confidence score for a prediction
const calculateConfidenceScore = (historicalData, recentData, weatherData) => {
  let confidence = 0.5; // Base confidence for rule-based prediction

  // Boost confidence if we have historical data
  if (historicalData) {
    confidence += 0.25 * historicalData.confidence;
  }

  // Boost confidence if we have recent reports
  if (recentData && recentData.isRecent) {
    confidence += 0.2;
  }

  // Slight boost if weather data is available
  if (weatherData && weatherData.condition) {
    confidence += 0.05;
  }

  return Math.min(Math.round(confidence * 100), 100);
};

// ============================================
// END AI HELPER FUNCTIONS
// ============================================

// Calculate crowd prediction with AI enhancements
const calculateCrowdPrediction = async (temple, targetDate = null, options = {}) => {
  // 0. Try ML Model Prediction First (Foundation)
  if (mongoose.connection.readyState === 1 && !targetDate) {
    try {
      const now = new Date();
      // Placeholder inputs - in real app would get from weather service/calendar
      const isHoliday = 0;
      const weatherScore = 80;

      const mlPrediction = await predictCrowd(
        now.getHours(),
        now.getDay(),
        now.getMonth(),
        isHoliday,
        weatherScore
      );

      if (mlPrediction !== null) {
        // Return foundation model result if available
        // Note: We still return standard structure so UI doesn't break
        console.log(`Using ML Model for ${temple.name}: ${mlPrediction}%`);
        return {
          crowdLevel: mlPrediction > 70 ? 'high' : mlPrediction > 40 ? 'medium' : 'low',
          crowdPercentage: mlPrediction,
          waitTime: Math.round((temple.baseWaitTime || 30) * (mlPrediction / 100)),
          trend: 'stable',
          confidence: 0.85,
          aiEnhanced: true,
          weather: { condition: 'Sunny', temp: 25, impact: 'Neutral' } // Default
        };
      }
    } catch (err) {
      console.error('ML Prediction failed:', err);
    }
  }

  const date = targetDate ? new Date(targetDate) : new Date();
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  const dateString = date.toISOString().split('T')[0];

  // Check if temple is closed
  // Default to 6 AM - 9 PM if not specified (for backward safety)
  const openHour = temple.openHour !== undefined ? temple.openHour : 5;
  const closeHour = temple.closeHour !== undefined ? temple.closeHour : 22;

  let isClosed = false;

  // Handle overnight opening (e.g., 3 AM to 1 AM) relies on 24h format
  // Simple check for standard day timings
  if (openHour < closeHour) {
    if (hour < openHour || hour >= closeHour) isClosed = true;
  } else {
    // Overnight (e.g. open 5 AM, close 2 AM next day is rare in this simple logic, 
    // but usually temples close at night. We'll simplify to 'hours outside operation')
    // If open 4 AM (4) and close 10 PM (22) -> simple.
    // If closes past midnight, we'd need more complex logic. 
    // For now, let's assume standard day shifts for simplicity in logic or strict 0-23.
  }

  // Get pattern type
  const patternType = temple.crowdPattern?.type || 'general';
  const pattern = hourlyPatterns[patternType];

  // Base crowd from hourly pattern
  let crowdPercentage = pattern[hour];

  // Apply day of week multiplier
  crowdPercentage *= dayMultipliers[dayOfWeek];

  // Check for festivals
  const festival = festivals[dateString];
  if (festival) {
    crowdPercentage *= festival.multiplier;
  }

  // Check for nearby festivals (3 days before and after)
  Object.entries(festivals).forEach(([festDate, fest]) => {
    const festDateTime = new Date(festDate).getTime();
    const currentDateTime = date.getTime();
    const daysDiff = Math.abs(festDateTime - currentDateTime) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0 && daysDiff <= 3) {
      crowdPercentage *= (1 + (fest.multiplier - 1) * 0.3);
    }
  });

  // Peak months adjustment
  if (temple.peakMonths && temple.peakMonths.includes(month)) {
    crowdPercentage *= 1.25;
  }

  // Special days
  if (temple.specialDays) {
    const specialDay = temple.specialDays.find(sd => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayNames[dayOfWeek].toLowerCase() === sd.day.toLowerCase();
    });
    if (specialDay) {
      crowdPercentage *= specialDay.multiplier;
    }
  }

  // Add variability based on temple ID to avoid identical values across temples
  // Use a hash of the temple ID to create a stable but unique offset for each temple
  const templeIdStr = temple._id ? temple._id.toString() : temple.name;
  let hash = 0;
  for (let i = 0; i < templeIdStr.length; i++) {
    hash = ((hash << 5) - hash) + templeIdStr.charCodeAt(i);
    hash |= 0;
  }

  // Normalize hash to -1 to 1 range
  const uniqueOffset = (hash % 100) / 100;

  // Base variability: +/- 15% random swing + 10% consistent temple offset
  const hourRandom = Math.sin(hour * 123.45 + hash) * 0.1; // Pseudo-random based on hour & temple
  const volatility = 0.85 + Math.random() * 0.3; // +/- 15% random noise

  let rulePrediction = crowdPercentage * (1 + (uniqueOffset * 0.1) + hourRandom) * volatility;

  // ============================================
  // AI ENHANCEMENTS: Blend with user feedback
  // ============================================

  const { includeAI = true } = options;
  let historicalData = null;
  let recentData = null;
  let weatherData = { multiplier: 1.0, condition: null };
  let aiApplied = { historical: false, recent: false, weather: false };

  if (includeAI && temple._id) {
    try {
      // Fetch AI data in parallel for performance
      const [historical, recent, weather] = await Promise.all([
        getHistoricalCrowdData(temple._id, hour, dayOfWeek),
        getRecentCrowdReports(temple._id),
        getWeatherMultiplier(temple._id)
      ]);

      historicalData = historical;
      recentData = recent;
      weatherData = weather;
      console.log(`[Weather Debug] Temple: ${temple.name}, Condition: ${weather?.condition}, Multiplier: ${weather?.multiplier}`);

      // Apply weather multiplier to rule-based prediction
      if (weatherData.multiplier !== 1.0) {
        rulePrediction *= weatherData.multiplier;
        aiApplied.weather = true;
      }

      // Blend rule-based with historical user data (60% rule, 40% user)
      if (historicalData && historicalData.reportCount >= 3) {
        crowdPercentage = rulePrediction * 0.6 + historicalData.avgCrowdPercentage * 0.4;
        aiApplied.historical = true;
      } else {
        crowdPercentage = rulePrediction;
      }

      // Override with recent real-time reports if available (they're most accurate)
      if (recentData && recentData.isRecent && recentData.reportCount >= 2) {
        // Blend: 40% rule-based, 60% live reports for very recent data
        crowdPercentage = crowdPercentage * 0.4 + recentData.livePercentage * 0.6;
        aiApplied.recent = true;
      }

    } catch (error) {
      console.error('AI enhancement error, falling back to rule-based:', error);
      crowdPercentage = rulePrediction;
    }
  } else {
    crowdPercentage = rulePrediction;
  }

  // Clamp and handle closed state
  if (isClosed) {
    crowdPercentage = 0;
  } else {
    crowdPercentage = Math.max(5, Math.min(100, Math.round(crowdPercentage)));
  }

  // Determine crowd level
  let crowdLevel;
  if (crowdPercentage === 0) crowdLevel = 'closed';
  else if (crowdPercentage <= 40) crowdLevel = 'low';
  else if (crowdPercentage <= 70) crowdLevel = 'medium';
  else crowdLevel = 'high';

  // Calculate wait time dynamically
  // baseWaitTime is in minutes.
  // Formula: Base * (Crowd% / 50). If Crowd is 100%, wait is 2x Base. If 50%, wait is Base.
  const baseWait = temple.baseWaitTime || 30;
  const estimatedMin = Math.round(baseWait * (crowdPercentage / 40));

  let waitTime;
  if (isClosed) {
    waitTime = 'Closed';
  } else if (estimatedMin < 15) {
    waitTime = '< 15 mins';
  } else if (estimatedMin < 60) {
    waitTime = `${estimatedMin} mins`;
  } else {
    const hours = Math.floor(estimatedMin / 60);
    const mins = estimatedMin % 60;
    waitTime = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hrs`;
  }

  // Find best time today
  // Search only within open hours
  let bestHour = -1;
  let lowestCrowd = Infinity;
  for (let h = 0; h < 24; h++) {
    // Only check if hour is within openWindow
    if (h >= openHour && h < closeHour) {
      if (pattern[h] < lowestCrowd) {
        lowestCrowd = pattern[h];
        bestHour = h;
      }
    }
  }

  let bestTimeToday;
  if (bestHour === -1) {
    bestTimeToday = 'Check timings';
  } else {
    const period = bestHour >= 12 ? 'PM' : 'AM';
    const displayHour = bestHour > 12 ? bestHour - 12 : (bestHour === 0 ? 12 : bestHour);
    bestTimeToday = `${displayHour}:00 ${period}`;
  }

  // Get trend
  const avgCrowd = pattern.reduce((a, b) => a + b, 0) / pattern.length;
  let trend;
  if (crowdPercentage < avgCrowd * 0.85) trend = 'below_average';
  else if (crowdPercentage > avgCrowd * 1.15) trend = 'above_average';
  else trend = 'average';

  // Calculate confidence score
  const confidence = calculateConfidenceScore(historicalData, recentData, weatherData);

  return {
    crowdPercentage,
    crowdLevel,
    waitTime,
    bestTimeToday,
    trend,
    festival: festival?.name || null,
    lastUpdated: new Date().toISOString(),
    // AI Enhancement fields
    confidence, // 0-100 score
    aiEnhanced: aiApplied.historical || aiApplied.recent || aiApplied.weather,
    dataSource: {
      historical: aiApplied.historical ? historicalData?.reportCount : 0,
      recent: aiApplied.recent ? recentData?.reportCount : 0,
      weather: aiApplied.weather ? weatherData.condition : null
    },
    weather: weatherData.condition ? {
      condition: weatherData.condition,
      temp: weatherData.temp,
      impact: weatherData.multiplier < 1 ? 'reducing' : weatherData.multiplier > 1 ? 'increasing' : 'neutral'
    } : null
  };
};

// Synchronous version for backward compatibility (no AI enhancements)
export const calculateCrowdPredictionSync = (temple, targetDate = null) => {
  const date = targetDate ? new Date(targetDate) : new Date();
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  const dateString = date.toISOString().split('T')[0];

  const openHour = temple.openHour !== undefined ? temple.openHour : 5;
  const closeHour = temple.closeHour !== undefined ? temple.closeHour : 22;

  let isClosed = false;
  if (openHour < closeHour) {
    if (hour < openHour || hour >= closeHour) isClosed = true;
  }

  const patternType = temple.crowdPattern?.type || 'general';
  const pattern = hourlyPatterns[patternType];
  let crowdPercentage = pattern[hour];
  crowdPercentage *= dayMultipliers[dayOfWeek];

  const festival = festivals[dateString];
  if (festival) {
    crowdPercentage *= festival.multiplier;
  }

  Object.entries(festivals).forEach(([festDate, fest]) => {
    const festDateTime = new Date(festDate).getTime();
    const currentDateTime = date.getTime();
    const daysDiff = Math.abs(festDateTime - currentDateTime) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0 && daysDiff <= 3) {
      crowdPercentage *= (1 + (fest.multiplier - 1) * 0.3);
    }
  });

  if (temple.peakMonths && temple.peakMonths.includes(month)) {
    crowdPercentage *= 1.25;
  }

  if (temple.specialDays) {
    const specialDay = temple.specialDays.find(sd => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayNames[dayOfWeek].toLowerCase() === sd.day.toLowerCase();
    });
    if (specialDay) {
      crowdPercentage *= specialDay.multiplier;
    }
  }

  const randomness = 0.92 + Math.random() * 0.16;
  crowdPercentage *= randomness;

  if (isClosed) {
    crowdPercentage = 0;
  } else {
    crowdPercentage = Math.max(5, Math.min(100, Math.round(crowdPercentage)));
  }

  let crowdLevel;
  if (crowdPercentage === 0) crowdLevel = 'closed';
  else if (crowdPercentage <= 40) crowdLevel = 'low';
  else if (crowdPercentage <= 70) crowdLevel = 'medium';
  else crowdLevel = 'high';

  const baseWait = temple.baseWaitTime || 30;
  const estimatedMin = Math.round(baseWait * (crowdPercentage / 40));

  let waitTime;
  if (isClosed) {
    waitTime = 'Closed';
  } else if (estimatedMin < 15) {
    waitTime = '< 15 mins';
  } else if (estimatedMin < 60) {
    waitTime = `${estimatedMin} mins`;
  } else {
    const hours = Math.floor(estimatedMin / 60);
    const mins = estimatedMin % 60;
    waitTime = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hrs`;
  }

  let bestHour = -1;
  let lowestCrowd = Infinity;
  for (let h = 0; h < 24; h++) {
    if (h >= openHour && h < closeHour) {
      if (pattern[h] < lowestCrowd) {
        lowestCrowd = pattern[h];
        bestHour = h;
      }
    }
  }

  let bestTimeToday;
  if (bestHour === -1) {
    bestTimeToday = 'Check timings';
  } else {
    const period = bestHour >= 12 ? 'PM' : 'AM';
    const displayHour = bestHour > 12 ? bestHour - 12 : (bestHour === 0 ? 12 : bestHour);
    bestTimeToday = `${displayHour}:00 ${period}`;
  }

  const avgCrowd = pattern.reduce((a, b) => a + b, 0) / pattern.length;
  let trend;
  if (crowdPercentage < avgCrowd * 0.85) trend = 'below_average';
  else if (crowdPercentage > avgCrowd * 1.15) trend = 'above_average';
  else trend = 'average';

  return {
    crowdPercentage,
    crowdLevel,
    waitTime,
    bestTimeToday,
    trend,
    festival: festival?.name || null,
    lastUpdated: new Date().toISOString(),
    confidence: 50, // Default confidence for rule-based
    aiEnhanced: false
  };
};

// Get hourly forecast for a temple (uses sync version for performance)
const getHourlyForecast = (temple, targetDate = null) => {
  const date = targetDate ? new Date(targetDate) : new Date();
  const currentHour = date.getHours();
  const forecast = [];

  for (let h = 0; h < 24; h++) {
    const forecastDate = new Date(date);
    forecastDate.setHours(h, 0, 0, 0);

    // Use sync version for hourly forecast to avoid N async calls
    const prediction = calculateCrowdPredictionSync(temple, forecastDate);
    forecast.push({
      hour: h,
      displayHour: h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`,
      ...prediction,
      isPast: h < currentHour,
      isCurrent: h === currentHour
    });
  }

  return forecast;
};

// Get calendar forecast for multiple temples across date range
const getCalendarForecast = (temples, startDate, endDate) => {
  const result = {
    temples: [],
    comparison: {}
  };

  // Loop through each temple
  for (const temple of temples) {
    const predictions = {};

    // Loop through date range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];

      // Get crowd prediction for this date at noon (12 PM)
      const noonDate = new Date(date);
      noonDate.setHours(12, 0, 0, 0);
      const noonPrediction = calculateCrowdPredictionSync(temple, noonDate);

      // Get hourly predictions
      const hourly = getHourlyForecast(temple, new Date(date));

      predictions[dateStr] = {
        crowdPercentage: noonPrediction.crowdPercentage,
        crowdLevel: noonPrediction.crowdLevel,
        festival: noonPrediction.festival,
        hourly: hourly
      };
    }

    result.temples.push({
      templeId: temple._id,
      templeName: temple.name,
      predictions
    });
  }

  // Calculate comparison metrics if we have temples
  if (result.temples.length > 0) {
    const dateKeys = Object.keys(result.temples[0].predictions);
    for (const dateStr of dateKeys) {
      const crowdLevels = result.temples.map(t => t.predictions[dateStr].crowdLevel);
      const crowdPercentages = result.temples.map(t => t.predictions[dateStr].crowdPercentage);

      const maxLevel = crowdLevels.includes('high') ? 'high' :
        crowdLevels.includes('medium') ? 'medium' : 'low';
      const avgPercentage = Math.round(crowdPercentages.reduce((a, b) => a + b, 0) / crowdPercentages.length);

      result.comparison[dateStr] = {
        maxCrowdLevel: maxLevel,
        avgCrowdPercentage: avgPercentage,
        crowdedTemples: result.temples
          .filter(t => t.predictions[dateStr].crowdLevel === 'high')
          .map(t => t.templeName)
      };
    }
  }

  return result;
};

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    // Check if using MongoDB or In-Memory
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = user;
    } else {
      // In-memory fallback
      const user = inMemoryUsers.find(u => u._id === decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = user;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin Routes - Database Management (PROTECTED: Auth + Admin role required)
app.post('/api/admin/seed', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const count = await Temple.countDocuments();
    if (count > 0) {
      return res.json({ message: `Database already has ${count} temples. Use /api/admin/reset to clear and reseed.` });
    }
    const temples = await seedTemples();
    res.json({ message: `Seeded ${temples.length} temples successfully!`, count: temples.length });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

app.post('/api/admin/reset', authMiddleware, requireAdmin, async (req, res) => {
  try {
    await Temple.deleteMany({});
    const temples = await seedTemples();
    res.json({ message: `Database reset and seeded with ${temples.length} temples!`, count: temples.length });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

app.get('/api/admin/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const templeCount = await Temple.countDocuments();
    const userCount = await User.countDocuments();
    res.json({
      status: 'ok',
      database: {
        temples: templeCount,
        users: userCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Auth Routes (with rate limiting)
app.post('/api/auth/register',
  authLimiter,
  body('name').trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage('Name required (2-100 chars)'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 12);

      // Handle MongoDB vs In-Memory
      if (mongoose.connection.readyState === 1) {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: 'Email already registered' });
        }

        // Create user
        const user = new User({
          name,
          email,
          password: hashedPassword
        });
        await user.save();

        // Generate token
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'Registration successful',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        });
      } else {
        // In-Memory Fallback
        const existingUser = inMemoryUsers.find(u => u.email === email);
        if (existingUser) {
          return res.status(400).json({ error: 'Email already registered' });
        }

        const newUser = {
          _id: Date.now().toString(), // Simple string ID
          name,
          email,
          password: hashedPassword,
          savedPlans: [],
          favoriteTemples: [],
          createdAt: new Date()
        };
        inMemoryUsers.push(newUser);

        // Generate token
        const token = jwt.sign(
          { userId: newUser._id },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'Registration successful (In-Memory)',
          token,
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email
          }
        });
      }

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

app.post('/api/auth/login',
  authLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      let user;

      if (mongoose.connection.readyState === 1) {
        user = await User.findOne({ email });
      } else {
        user = inMemoryUsers.find(u => u.email === email);
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Temple Routes
app.get('/api/temples', async (req, res) => {
  try {
    let temples = [];
    if (mongoose.connection.readyState === 1) {
      temples = await Temple.find().lean();
    }

    // Fallback to in-memory data
    if (temples.length === 0) {
      console.log('Serving from in-memory data');
      temples = templesData;
    }

    // Add crowd predictions to each temple (with AI enhancements)
    const templesWithCrowd = await Promise.all(
      temples.map(async (temple) => ({
        ...temple,
        _id: temple._id || `temp_${temple.name.replace(/\s+/g, '_')}`, // Mock ID if missing
        crowd: await calculateCrowdPrediction(temple)
      }))
    );

    res.json(templesWithCrowd);
  } catch (error) {
    console.error('Error fetching temples:', error);
    // Ultimate fallback (use sync version)
    const fallbackData = templesData.map(temple => ({
      ...temple,
      _id: `temp_${temple.name.replace(/\s+/g, '_')}`,
      crowd: calculateCrowdPredictionSync(temple)
    }));
    res.json(fallbackData);
  }
});

// Crowd Calendar API - Get calendar forecast for multiple temples (MUST be before :id route)
app.get('/api/temples/calendar', async (req, res) => {
  try {
    const { templeIds, startDate, endDate } = req.query;

    // Validation
    if (!templeIds || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters: templeIds, startDate, endDate' });
    }

    const ids = templeIds.split(',').slice(0, 3); // Max 3 temples
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    if (start > end) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }

    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > 92) {
      return res.status(400).json({ error: 'Date range cannot exceed 3 months (92 days)' });
    }

    // Fetch temples
    let temples = [];
    if (mongoose.connection.readyState === 1) {
      temples = await Temple.find({ _id: { $in: ids } }).lean();
    } else {
      // In-memory fallback
      temples = templesData.filter(t => ids.includes(t._id || t.name));
    }

    if (temples.length === 0) {
      return res.status(404).json({ error: 'No temples found with provided IDs' });
    }

    // Generate predictions
    const result = getCalendarForecast(temples, start, end);

    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar forecast:', error);
    res.status(500).json({ error: 'Failed to generate calendar forecast' });
  }
});

app.get('/api/temples/:id', async (req, res) => {
  try {
    let temple;

    if (mongoose.connection.readyState === 1 && !req.params.id.startsWith('temp_')) {
      try {
        temple = await Temple.findById(req.params.id).lean();
      } catch (e) {
        // invalid object id or db error
      }
    }

    // Fallback to in-memory search
    if (!temple) {
      // Search by ID or lazy match by name if ID is temp_name
      const namePart = req.params.id.replace('temp_', '').replace(/_/g, ' ');
      temple = templesData.find(t => t.name === namePart || (t._id && t._id.toString() === req.params.id));

      // If still not found, try sloppy match for safety
      if (!temple && req.params.id.startsWith('temp_')) {
        temple = templesData.find(t =>
          t.name.toLowerCase().includes(namePart.toLowerCase())
        );
      }
    }

    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    res.json({
      ...temple,
      _id: temple._id || req.params.id,
      crowd: await calculateCrowdPrediction(temple),
      hourlyForecast: getHourlyForecast(temple)
    });
  } catch (error) {
    console.error('Error fetching temple:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/temples/:id/forecast', async (req, res) => {
  try {
    const temple = await Temple.findById(req.params.id).lean();
    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date) : null;

    res.json({
      temple: temple.name,
      forecast: getHourlyForecast(temple, targetDate)
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// CROWD REPORTING API ENDPOINTS
// ============================================

// Submit a crowd report
app.post('/api/crowd-reports', authMiddleware, [
  body('templeId').notEmpty().withMessage('Temple ID is required'),
  body('reportedLevel').isIn(['low', 'medium', 'high']).withMessage('Invalid crowd level'),
  body('estimatedWait').optional().isInt({ min: 0, max: 600 }).withMessage('Wait time must be 0-600 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable. Crowd reporting requires database connection.' });
    }

    const { templeId, reportedLevel, estimatedWait, crowdPercentage } = req.body;
    const now = new Date();

    // Calculate trust score based on user's reporting history
    const userReportCount = await CrowdReport.countDocuments({
      userId: req.user._id,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const trustScore = Math.min(1.0 + (userReportCount * 0.05), 2.0); // Max 2.0

    const report = new CrowdReport({
      templeId,
      userId: req.user._id,
      reportedLevel,
      estimatedWait: estimatedWait || null,
      crowdPercentage: crowdPercentage || (reportedLevel === 'low' ? 25 : reportedLevel === 'medium' ? 55 : 85),
      timestamp: now,
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      trustScore
    });

    await report.save();

    // Track prediction accuracy
    const temple = await Temple.findById(templeId);
    if (temple) {
      const prediction = calculateCrowdPredictionSync(temple);
      await PredictionAccuracy.findOneAndUpdate(
        { templeId, date: new Date(now.toDateString()), hour: now.getHours() },
        {
          $set: {
            predictedLevel: prediction.crowdLevel,
            predictedPercentage: prediction.crowdPercentage,
            predictedWait: parseInt(prediction.waitTime) || 0,
            actualLevel: reportedLevel,
            actualPercentage: report.crowdPercentage,
            actualWait: estimatedWait || null,
            dayOfWeek: now.getDay()
          },
          $inc: { reportCount: 1 }
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Crowd report submitted successfully',
      report: {
        id: report._id,
        templeId,
        reportedLevel,
        estimatedWait,
        timestamp: report.timestamp,
        trustScore
      }
    });
  } catch (error) {
    console.error('Error submitting crowd report:', error);
    res.status(500).json({ error: 'Failed to submit crowd report' });
  }
});

// Get recent crowd reports for a temple
app.get('/api/crowd-reports/:templeId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ reports: [], message: 'Database unavailable' });
    }

    const { templeId } = req.params;
    const { hours = 24 } = req.query;

    const cutoff = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const reports = await CrowdReport.find({
      templeId,
      timestamp: { $gte: cutoff }
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('userId', 'name')
      .lean();

    // Calculate aggregate stats
    const stats = {
      reportCount: reports.length,
      avgCrowdPercentage: reports.length > 0
        ? Math.round(reports.reduce((sum, r) => sum + r.crowdPercentage, 0) / reports.length)
        : null,
      dominantLevel: reports.length > 0
        ? getMostCommonLevel(reports.map(r => r.reportedLevel))
        : null,
      lastReportTime: reports.length > 0 ? reports[0].timestamp : null
    };

    res.json({
      templeId,
      reports: reports.map(r => ({
        id: r._id,
        reportedLevel: r.reportedLevel,
        crowdPercentage: r.crowdPercentage,
        estimatedWait: r.estimatedWait,
        timestamp: r.timestamp,
        reporter: r.userId?.name || 'Anonymous'
      })),
      stats
    });
  } catch (error) {
    console.error('Error fetching crowd reports:', error);
    res.status(500).json({ error: 'Failed to fetch crowd reports' });
  }
});

// Get prediction accuracy stats for a temple
app.get('/api/crowd-reports/:templeId/accuracy', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ accuracy: null, message: 'Database unavailable' });
    }

    const { templeId } = req.params;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const accuracyData = await PredictionAccuracy.find({
      templeId,
      createdAt: { $gte: thirtyDaysAgo }
    }).lean();

    if (accuracyData.length === 0) {
      return res.json({
        templeId,
        accuracy: null,
        message: 'Not enough data for accuracy calculation'
      });
    }

    // Calculate accuracy metrics
    let exactMatches = 0;
    let closeMatches = 0;
    let totalComparisons = 0;

    accuracyData.forEach(record => {
      if (record.predictedLevel && record.actualLevel) {
        totalComparisons++;
        if (record.predictedLevel === record.actualLevel) {
          exactMatches++;
          closeMatches++;
        } else {
          // Close match: predicted medium, actual was low or high (1 level off)
          const levels = ['low', 'medium', 'high'];
          const predIdx = levels.indexOf(record.predictedLevel);
          const actIdx = levels.indexOf(record.actualLevel);
          if (Math.abs(predIdx - actIdx) === 1) {
            closeMatches++;
          }
        }
      }
    });

    res.json({
      templeId,
      accuracy: {
        exactMatchRate: totalComparisons > 0 ? Math.round((exactMatches / totalComparisons) * 100) : null,
        closeMatchRate: totalComparisons > 0 ? Math.round((closeMatches / totalComparisons) * 100) : null,
        totalReports: accuracyData.length,
        period: '30 days'
      }
    });
  } catch (error) {
    console.error('Error fetching accuracy stats:', error);
    res.status(500).json({ error: 'Failed to fetch accuracy stats' });
  }
});

// Helper function to get most common level
function getMostCommonLevel(levels) {
  const counts = { low: 0, medium: 0, high: 0 };
  levels.forEach(l => counts[l]++);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ============================================
// END CROWD REPORTING API
// ============================================

// Temple Images API
app.get('/api/temples/:id/images', async (req, res) => {
  try {
    const templeId = req.params.id;

    // Extract temple key from ID (handles temp_Temple_Name format)
    let templeKey = templeId;
    if (templeId.startsWith('temp_')) {
      templeKey = templeId.replace('temp_', '').replace(/_Temple$/, '').replace(/ /g, '_');
    }

    // Also try to find by looking up the temple name
    let temple = null;
    if (mongoose.connection.readyState === 1 && !templeId.startsWith('temp_')) {
      try {
        temple = await Temple.findById(templeId).lean();
      } catch (e) {
        // Invalid ObjectId or DB error
      }
    }

    if (!temple) {
      // Search in templesData
      const namePart = templeId.replace('temp_', '').replace(/_/g, ' ');
      temple = templesData.find(t => t.name.toLowerCase().includes(namePart.toLowerCase()));
    }

    // Derive temple key from name if found
    if (temple) {
      templeKey = temple.name
        .replace(/ Temple$/, '')
        .replace(/ /g, '_');
    }

    const images = await getTempleImages(templeKey);

    res.json({
      templeId,
      templeKey,
      templeName: temple?.name || templeKey.replace(/_/g, ' '),
      imageCount: images.length,
      images
    });
  } catch (error) {
    console.error('Error fetching temple images:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const allImages = await getAllTempleImages();
    const templeCount = Object.keys(allImages).length;
    const totalImages = Object.values(allImages).reduce((sum, imgs) => sum + imgs.length, 0);

    res.json({
      templeCount,
      totalImages,
      temples: allImages
    });
  } catch (error) {
    console.error('Error fetching all images:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

import { generateResponse } from './aiService.js';

// Stricter rate limiter for AI chat to prevent abuse
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute per user
  message: { error: 'Too many chat requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chatbot Endpoint with validation and rate limiting (open to all users)
app.post('/api/chat', chatLimiter, [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message too long (max 1000 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, history } = req.body;

    // Try to get user ID from token if available
    let userId = null;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        userId = decoded.userId;
      } catch (e) {
        // Token invalid or expired, continue as guest
      }
    }

    const response = await generateResponse(message, userId, history || []);
    res.json({ response });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

import { getRecommendations } from './recommendationService.js';

app.get('/api/recommendations', authMiddleware, async (req, res) => {
  try {
    const recommendations = await getRecommendations(req.user._id);
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendation endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// User Plan Routes
app.post('/api/plans', authMiddleware, async (req, res) => {
  try {
    const { name, date, templeIds } = req.body;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      user.savedPlans.push({
        name,
        date: new Date(date),
        temples: templeIds
      });
      await user.save();
      res.status(201).json({ message: 'Plan saved', plans: user.savedPlans });
    } else {
      // In-memory
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      const newPlan = {
        _id: Date.now().toString(),
        name,
        date: new Date(date),
        temples: templeIds, // Store IDs directly in memory
        createdAt: new Date()
      };
      user.savedPlans.push(newPlan);
      res.status(201).json({ message: 'Plan saved (In-Memory)', plans: user.savedPlans });
    }
  } catch (error) {
    console.error('Error saving plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/plans', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id).populate('savedPlans.temples');
      res.json(user.savedPlans);
    } else {
      // In-memory: Manual population
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      // Manually populate temples
      const populatedPlans = user.savedPlans.map(plan => ({
        ...plan,
        temples: plan.temples.map(tid => {
          // Try to find in templesData
          const namePart = tid.replace('temp_', '').replace(/_/g, ' ');
          return templesData.find(t => t.name === namePart || (t._id && t._id.toString() === tid)) || { _id: tid, name: 'Unknown Temple' };
        })
      }));
      res.json(populatedPlans);
    }
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/plans/:planId', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      user.savedPlans = user.savedPlans.filter(p => p._id.toString() !== req.params.planId);
      await user.save();
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      user.savedPlans = user.savedPlans.filter(p => p._id.toString() !== req.params.planId);
    }
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Visits
app.post('/api/visits', authMiddleware, async (req, res) => {
  try {
    const { templeId, visitDate, rating, notes, crowdLevel } = req.body;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      user.visitHistory.push({
        temple: templeId,
        visitDate: visitDate || new Date(),
        rating,
        notes,
        crowdLevel
      });
      await user.save();
      res.json({ message: 'Visit logged', visit: user.visitHistory[user.visitHistory.length - 1] });
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      const visit = {
        temple: templeId,
        visitDate: visitDate || new Date(),
        rating,
        notes,
        crowdLevel,
        checkedInAt: new Date()
      };
      user.visitHistory.push(visit);
      res.json({ message: 'Visit logged', visit });
    }
  } catch (error) {
    console.error('Error logging visit:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/visits', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id).populate('visitHistory.temple');
      res.json(user.visitHistory || []);
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      res.json(user.visitHistory || []);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/visits/:visitId', authMiddleware, async (req, res) => {
  try {
    const { rating, notes, crowdLevel } = req.body;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      const visit = user.visitHistory.id(req.params.visitId);
      if (!visit) return res.status(404).json({ error: 'Visit not found' });

      if (rating) visit.rating = rating;
      if (notes) visit.notes = notes;
      if (crowdLevel) visit.crowdLevel = crowdLevel;

      await user.save();
      res.json({ message: 'Visit updated', visit });
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      const visit = user.visitHistory.find(v => v._id.toString() === req.params.visitId);
      if (!visit) return res.status(404).json({ error: 'Visit not found' });

      if (rating) visit.rating = rating;
      if (notes) visit.notes = notes;
      if (crowdLevel) visit.crowdLevel = crowdLevel;

      res.json({ message: 'Visit updated', visit });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/visits/:visitId', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      user.visitHistory = user.visitHistory.filter(v => v._id.toString() !== req.params.visitId);
      await user.save();
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      user.visitHistory = user.visitHistory.filter(v => v._id.toString() !== req.params.visitId);
    }
    res.json({ message: 'Visit deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      const notifications = user.notifications || [];
      // Sort by date, newest first, unread first
      const sorted = notifications.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      res.json(sorted);
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      const notifications = user.notifications || [];
      const sorted = notifications.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      res.json(sorted);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/notifications/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      const notification = user.notifications.id(req.params.notificationId);
      if (!notification) return res.status(404).json({ error: 'Notification not found' });

      notification.read = true;
      await user.save();
      res.json({ message: 'Notification marked as read', notification });
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      const notification = user.notifications.find(n => n._id.toString() === req.params.notificationId);
      if (!notification) return res.status(404).json({ error: 'Notification not found' });

      notification.read = true;
      res.json({ message: 'Notification marked as read', notification });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      user.notifications.forEach(n => n.read = true);
      await user.save();
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      user.notifications.forEach(n => n.read = true);
    }
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/notifications/:notificationId', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      user.notifications = user.notifications.filter(n => n._id.toString() !== req.params.notificationId);
      await user.save();
    } else {
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      user.notifications = user.notifications.filter(n => n._id.toString() !== req.params.notificationId);
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Favorites
app.get('/api/favorites', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id).populate('favoriteTemples');
      const favoritesWithCrowd = user.favoriteTemples.map(temple => ({
        ...temple._doc,
        crowd: calculateCrowdPrediction(temple)
      }));
      res.json(favoritesWithCrowd);
    } else {
      // In-memory
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      const favTemples = inMemoryTemples.filter(t =>
        user.favoriteTemples.includes(t._id)
      );
      const favoritesWithCrowd = favTemples.map(temple => ({
        ...temple,
        crowd: calculateCrowdPrediction(temple)
      }));
      res.json(favoritesWithCrowd);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/favorites/:templeId', authMiddleware, async (req, res) => {
  try {
    const templeId = req.params.templeId;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      if (!user.favoriteTemples.includes(templeId)) {
        user.favoriteTemples.push(templeId);
        await user.save();
      }
    } else {
      // In-memory
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      if (!user.favoriteTemples.includes(templeId)) {
        user.favoriteTemples.push(templeId);
      }
    }

    res.json({ message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/favorites/:templeId', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      user.favoriteTemples = user.favoriteTemples.filter(
        t => t.toString() !== req.params.templeId
      );
      await user.save();
    } else {
      // In-memory
      const user = inMemoryUsers.find(u => u._id === req.user._id);
      user.favoriteTemples = user.favoriteTemples.filter(
        t => t.toString() !== req.params.templeId
      );
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Festivals endpoint
app.get('/api/festivals', (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  const upcoming = festivals.map(fest => {
    let dateStr = fest.date;

    // Recalculate if it has a fixed date (ignoring year)
    if (fest.fixedDate) {
      // Try current year
      let potentialDate = new Date(`${currentYear}-${fest.fixedDate}`);
      // If passed, move to next year
      if (potentialDate < today) {
        potentialDate = new Date(`${currentYear + 1}-${fest.fixedDate}`);
      }
      dateStr = potentialDate.toISOString().split('T')[0];
    }

    return { ...fest, date: dateStr };
  })
    .filter(fest => new Date(fest.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  res.json(upcoming);
});

// Seed temples data


async function seedTemples() {
  try {
    await Temple.deleteMany({});
    const temples = await Temple.insertMany(templesData);
    console.log(`Seeded ${temples.length} temples`);
    return temples;
  } catch (error) {
    console.error('Error seeding temples:', error);
    throw error;
  }
}

// Initialize database with seed data
async function initializeDatabase() {
  try {
    const count = await Temple.countDocuments();
    if (count === 0) {
      console.log('No temples found, seeding database...');
      await seedTemples();
      console.log('Database seeded successfully!');
    } else {
      console.log(`Database already has ${count} temples`);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Start server
const PORT = process.env.PORT || 5050;

import { startNotificationScheduler } from './notificationService.js';

connectDB().then(async (isConnected) => {
  if (isConnected) {
    await initializeDatabase();
    // Start notification cron job
    startNotificationScheduler(calculateCrowdPrediction);
  } else {
    console.log('Skipping database initialization (In-Memory Mode)');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Temples API: http://localhost:${PORT}/api/temples`);
    // Start persistence in background (non-blocking)
    persistTempleImages().catch(err => console.warn('Image persistence failed:', err));
  });
});
