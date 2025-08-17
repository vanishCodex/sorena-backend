const path = require('path');
require('dotenv').config(); // فایل .env در همان فولدر server

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
  .then(() => console.log("✅ MongoDB connected "))
  .catch(err => {
    console.error("❌  MongoDB  Error :", err);
    process.exit(1); // سرور را متوقف می‌کند اگر اتصال برقرار نشد
  });
app.use(cors({ origin: 'https://www.sorena-darman.com' }));
app.set('trust proxy', 1);
app.use(cors());
app.use(bodyParser.json());

// روت ذخیره فرم
app.post('/submit', async (req, res) => {
  try {
    console.log("داده دریافتی:", req.body);

    const { name, phone, description } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.ip;
    // چک کردن rate limit بر اساس IP
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

// روت گرفتن لیست درخواست‌ها
app.get('/requests', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('❌ خطا در دریافت درخواست‌ها:', error);
    res.status(500).json({ error: 'خطا در دریافت درخواست‌ها' });
  }
});

// راه‌اندازی سرور
app.listen(PORT, () => {
  console.log(`✅ server Active Port${PORT}`);
  console.log(`🔗 address : http://localhost:${PORT}`);
});