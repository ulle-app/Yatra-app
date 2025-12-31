import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { persistTempleImages, getTempleImages, getAllTempleImages } from './persist_images.js';

import { templesData } from './templeData.js';
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://temple-yatra.vercel.app', 'http://localhost:3000']
}));
app.use(express.json());

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
  savedPlans: [{
    name: String,
    date: Date,
    temples: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Temple' }],
    createdAt: { type: Date, default: Date.now }
  }],
  favoriteTemples: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Temple' }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

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

// Festival Calendar (2024-2025)
const festivals = {
  '2025-01-14': { name: 'Makar Sankranti', multiplier: 1.8 },
  '2025-01-26': { name: 'Republic Day', multiplier: 1.3 },
  '2025-02-26': { name: 'Maha Shivaratri', multiplier: 2.0 },
  '2025-03-14': { name: 'Holi', multiplier: 1.6 },
  '2025-03-30': { name: 'Ram Navami', multiplier: 1.8 },
  '2025-04-06': { name: 'Mahavir Jayanti', multiplier: 1.3 },
  '2025-04-10': { name: 'Good Friday', multiplier: 1.2 },
  '2025-04-13': { name: 'Baisakhi', multiplier: 1.5 },
  '2025-04-14': { name: 'Tamil New Year', multiplier: 1.4 },
  '2025-05-12': { name: 'Buddha Purnima', multiplier: 1.3 },
  '2025-06-27': { name: 'Rath Yatra', multiplier: 2.0 },
  '2025-07-10': { name: 'Guru Purnima', multiplier: 1.4 },
  '2025-08-09': { name: 'Raksha Bandhan', multiplier: 1.3 },
  '2025-08-16': { name: 'Janmashtami', multiplier: 1.9 },
  '2025-08-27': { name: 'Ganesh Chaturthi', multiplier: 1.8 },
  '2025-09-29': { name: 'Navratri Start', multiplier: 1.6 },
  '2025-10-02': { name: 'Dussehra', multiplier: 1.7 },
  '2025-10-20': { name: 'Diwali', multiplier: 1.9 },
  '2025-10-21': { name: 'Govardhan Puja', multiplier: 1.5 },
  '2025-11-05': { name: 'Chhath Puja', multiplier: 1.6 },
  '2025-11-15': { name: 'Guru Nanak Jayanti', multiplier: 1.5 },
  '2025-12-25': { name: 'Christmas', multiplier: 1.3 },
};

// Hourly crowd patterns (0-23 hours)
const hourlyPatterns = {
  general: [10, 8, 5, 15, 35, 60, 80, 90, 85, 70, 60, 55, 50, 45, 50, 55, 65, 75, 85, 80, 65, 45, 30, 15],
  high_traffic: [45, 35, 25, 35, 55, 80, 95, 100, 95, 85, 80, 75, 70, 65, 70, 75, 85, 95, 100, 95, 85, 70, 55, 50],
  pilgrimage: [30, 20, 15, 40, 70, 90, 95, 100, 90, 80, 70, 65, 60, 55, 60, 70, 80, 90, 85, 75, 60, 45, 35, 30],
  tourist: [5, 5, 5, 5, 10, 30, 50, 70, 80, 85, 90, 85, 80, 75, 80, 85, 90, 85, 75, 60, 45, 30, 15, 8]
};

// Day of week multipliers (0=Sunday, 6=Saturday)
const dayMultipliers = [1.4, 0.85, 0.8, 0.8, 0.85, 0.95, 1.5];

// Calculate crowd prediction
// Calculate crowd prediction
const calculateCrowdPrediction = (temple, targetDate = null) => {
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

  // Add slight randomness for realism (±8%)
  const randomness = 0.92 + Math.random() * 0.16;
  crowdPercentage *= randomness;

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

  return {
    crowdPercentage,
    crowdLevel,
    waitTime,
    bestTimeToday,
    trend,
    festival: festival?.name || null,
    lastUpdated: new Date().toISOString()
  };
};

// Get hourly forecast for a temple
const getHourlyForecast = (temple, targetDate = null) => {
  const date = targetDate ? new Date(targetDate) : new Date();
  const currentHour = date.getHours();
  const forecast = [];

  for (let h = 0; h < 24; h++) {
    const forecastDate = new Date(date);
    forecastDate.setHours(h, 0, 0, 0);

    const prediction = calculateCrowdPrediction(temple, forecastDate);
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

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin Routes - Database Management
app.post('/api/admin/seed', async (req, res) => {
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

app.post('/api/admin/reset', async (req, res) => {
  try {
    await Temple.deleteMany({});
    const temples = await seedTemples();
    res.json({ message: `Database reset and seeded with ${temples.length} temples!`, count: temples.length });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

app.get('/api/admin/status', async (req, res) => {
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

// Auth Routes
app.post('/api/auth/register',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

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
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

app.post('/api/auth/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
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

    // Add crowd predictions to each temple
    const templesWithCrowd = temples.map(temple => ({
      ...temple,
      _id: temple._id || `temp_${temple.name.replace(/\s+/g, '_')}`, // Mock ID if missing
      crowd: calculateCrowdPrediction(temple)
    }));

    res.json(templesWithCrowd);
  } catch (error) {
    console.error('Error fetching temples:', error);
    // Ultimate fallback
    const fallbackData = templesData.map(temple => ({
      ...temple,
      _id: `temp_${temple.name.replace(/\s+/g, '_')}`,
      crowd: calculateCrowdPrediction(temple)
    }));
    res.json(fallbackData);
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
      crowd: calculateCrowdPrediction(temple),
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

// User Plan Routes
app.post('/api/plans', authMiddleware, async (req, res) => {
  try {
    const { name, date, templeIds } = req.body;

    const user = await User.findById(req.user._id);
    user.savedPlans.push({
      name,
      date: new Date(date),
      temples: templeIds
    });
    await user.save();

    res.status(201).json({ message: 'Plan saved', plans: user.savedPlans });
  } catch (error) {
    console.error('Error saving plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/plans', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedPlans.temples');
    res.json(user.savedPlans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/plans/:planId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedPlans = user.savedPlans.filter(p => p._id.toString() !== req.params.planId);
    await user.save();

    res.json({ message: 'Plan deleted' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Favorites
app.post('/api/favorites/:templeId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const templeId = req.params.templeId;

    if (!user.favoriteTemples.includes(templeId)) {
      user.favoriteTemples.push(templeId);
      await user.save();
    }

    res.json({ message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/favorites/:templeId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.favoriteTemples = user.favoriteTemples.filter(
      t => t.toString() !== req.params.templeId
    );
    await user.save();

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Festivals endpoint
app.get('/api/festivals', (req, res) => {
  const upcoming = Object.entries(festivals)
    .filter(([date]) => new Date(date) >= new Date())
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .slice(0, 10)
    .map(([date, info]) => ({ date, ...info }));

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
const PORT = process.env.PORT || 5000;

connectDB().then(async (isConnected) => {
  if (isConnected) {
    await initializeDatabase();
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
