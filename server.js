const path = require('path');
const jwt = require('jsonwebtoken');
const verifyAdmin = require('./verifyAdmin');
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// مدل Request
const Request = require('./models/Request');

const app = express();
const PORT = process.env.PORT || 443;

// لاگ مقدار MONGO_URI برای دیباگ
console.log("🔗 MONGO_URI =", process.env.MONGO_URI);

// اتصال به MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

/** ✅ تنظیمات CORS */
const allowedOrigins = ['https://www.sorena-darman.com', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.set('trust proxy', 1);
app.use(bodyParser.json());

/** 🔐 مسیر لاگین ادمین */
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'نام کاربری یا رمز اشتباه است' });
  }
});

/** 🛡️ مسیر محافظت‌شده داشبورد */
app.get('/admin/dashboard', verifyAdmin, (req, res) => {
  res.json({ success: true, message: 'خوش آمدید ادمین عزیز!' });
});

/** 📥 ذخیره فرم */
app.post('/submit', async (req, res) => {
  try {
    console.log("📨 داده دریافتی:", req.body);

    const { name, phone, description } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.ip;

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentRequest = await Request.findOne({ ip, createdAt: { $gte: fifteenMinutesAgo } });

    if (recentRequest) {
      return res.status(429).json({ error: 'لطفاً ۱۵ دقیقه دیگر تلاش کنید' });
    }

    if (!name || !phone) {
      return res.status(400).json({ error: 'نام و شماره تماس اجباری هستند' });
    }

    const newEntry = new Request({ name, phone, description, ip });
    await newEntry.save();

    res.status(201).json({ success: true, message: 'درخواست با موفقیت ثبت شد' });
  } catch (error) {
    console.error('❌ خطای سرور هنگام ذخیره:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/** 📋 دریافت لیست درخواست‌ها */
app.get('/requests', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('❌ خطا در دریافت درخواست‌ها:', error);
    res.status(500).json({ error: 'خطا در دریافت درخواست‌ها' });
  }
});

/** 🧪 مسیر تست سلامت سرور */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'سرور فعال است' });
});

/** 🚀 راه‌اندازی سرور */
app.listen(PORT, () => {
  console.log(`✅ Server Active on Port ${PORT}`);
  console.log(`🔗 Address: http://localhost:${PORT}`);
});
