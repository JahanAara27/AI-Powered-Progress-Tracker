const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'progressiq_jwt_secret_dev_key_2026';
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @desc Register user
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login user
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current user
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Seed realistic demo data for the logged-in user
// @route POST /api/auth/seed
const seedDemoData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Clear previous check-ins, habits, goals for clean slate demo
    await CheckIn.deleteMany({ userId });
    await Habit.deleteMany({ userId });
    await Goal.deleteMany({ userId });

    // 1. Create realistic core habits
    const habitsData = [
      { title: 'Morning Deep Work', description: '90 minutes of focused technical design & coding', frequency: 'daily' },
      { title: 'Machine Learning Study', description: 'Review Scikit-learn, PyTorch & statistical algorithms', frequency: 'daily' },
      { title: 'Aerobic Exercise', description: '30-minute cardio or resistance training', frequency: 'daily' },
      { title: 'Technical Journaling', description: 'Reflect on architectural decisions and blockers', frequency: 'daily' },
    ];

    const habits = [];
    for (const h of habitsData) {
      const created = await Habit.create({ userId, ...h });
      habits.push(created);
    }

    // 2. Generate 14 days of realistic check-in records
    const today = new Date();
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const d = new Date(today);
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // Simulate a dedicated user with 80% completion rate and a few missed days
      for (let i = 0; i < habits.length; i++) {
        const isMissed = (dayOffset === 4 && i >= 2) || (dayOffset === 9 && i === 1);
        const status = isMissed ? 'missed' : 'completed';
        const practiceMinutes = isMissed ? 0 : (i === 0 ? 90 : i === 1 ? 45 : i === 2 ? 30 : 20);

        await CheckIn.create({
          userId,
          habitId: habits[i]._id,
          date: dateStr,
          status,
          practiceMinutes,
        });
      }
    }

    // 3. Create active goals with milestones
    const targetDate1 = new Date(today);
    targetDate1.setDate(targetDate1.getDate() + 21);

    const targetDate2 = new Date(today);
    targetDate2.setDate(targetDate2.getDate() + 45);

    await Goal.create({
      userId,
      title: 'Deploy Full-Stack ML Microservices Architecture',
      description: 'Complete production deployment of ProgressIQ with automated CI/CD and metrics',
      targetDate: targetDate1.toISOString().split('T')[0],
      status: 'in_progress',
      milestones: [
        { title: 'Design FastAPI schemas and model pipeline', completed: true, completedAt: new Date(Date.now() - 6 * 86400000) },
        { title: 'Train Random Forest consistency and goal classifiers', completed: true, completedAt: new Date(Date.now() - 3 * 86400000) },
        { title: 'Integrate Express middleware & Mongoose aggregation', completed: true, completedAt: new Date(Date.now() - 1 * 86400000) },
        { title: 'Build React Vite Tailwind dashboard with Recharts', completed: true, completedAt: new Date() },
        { title: 'Deploy containerized services to production cloud', completed: false, completedAt: null },
      ],
    });

    await Goal.create({
      userId,
      title: 'Publish Open-Source ML Progress Tracker Toolkit',
      description: 'Package Python feature extractors and documentation for developer community',
      targetDate: targetDate2.toISOString().split('T')[0],
      status: 'in_progress',
      milestones: [
        { title: 'Synthesize benchmark datasets with personas', completed: true, completedAt: new Date() },
        { title: 'Draft API documentation and schema contracts', completed: false, completedAt: null },
        { title: 'Record walkthrough demo and architecture showcase', completed: false, completedAt: null },
      ],
    });

    res.json({
      success: true,
      message: 'Demo dataset generated successfully! 4 habits, 14 days of historical check-ins, and 2 active goals created.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  seedDemoData,
};
