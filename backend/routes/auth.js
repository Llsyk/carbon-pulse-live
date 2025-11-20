import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// ASEAN_DATA for lat/lng mapping
const ASEAN_DATA = {
  MMyanmar: [
    { city: "Yangon", lat: 16.8409, lng: 96.1735 },
    { city: "Mandalay", lat: 21.9588, lng: 96.0891 },
    { city: "Naypyidaw", lat: 19.7633, lng: 96.0785 },
    { city: "Taunggyi", lat: 20.7905, lng: 97.038 },
    { city: "Mawlamyine", lat: 16.474, lng: 97.628 },
  ],
  Thailand: [
    { city: "Bangkok", lat: 13.7563, lng: 100.5018 },
    { city: "Chiang Mai", lat: 18.7883, lng: 98.9853 },
    { city: "Phuket", lat: 7.8804, lng: 98.3923 },
    { city: "Pattaya", lat: 12.9236, lng: 100.8825 },
  ],
  Vietnam: [
    { city: "Hanoi", lat: 21.0278, lng: 105.8342 },
    { city: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297 },
    { city: "Da Nang", lat: 16.0544, lng: 108.2022 },
    { city: "Hue", lat: 16.4637, lng: 107.5909 },
  ],
  Laos: [
    { city: "Vientiane", lat: 17.9757, lng: 102.6331 },
    { city: "Luang Prabang", lat: 19.8836, lng: 102.1343 },
    { city: "Pakse", lat: 15.1177, lng: 105.8183 },
  ],
  Cambodia: [
    { city: "Phnom Penh", lat: 11.5564, lng: 104.9282 },
    { city: "Siem Reap", lat: 13.355, lng: 103.8552 },
    { city: "Battambang", lat: 13.0957, lng: 103.2022 },
  ],
  Malaysia: [
    { city: "Kuala Lumpur", lat: 3.139, lng: 101.6869 },
    { city: "Penang", lat: 5.4164, lng: 100.3327 },
    { city: "Johor Bahru", lat: 1.4927, lng: 103.7414 },
    { city: "Kota Kinabalu", lat: 5.9804, lng: 116.0735 },
  ],
  Singapore: [{ city: "Singapore", lat: 1.3521, lng: 103.8198 }],
  Indonesia: [
    { city: "Jakarta", lat: -6.2088, lng: 106.8456 },
    { city: "Surabaya", lat: -7.2575, lng: 112.7521 },
    { city: "Bali (Denpasar)", lat: -8.65, lng: 115.2167 },
    { city: "Bandung", lat: -6.9175, lng: 107.6191 },
  ],
  Philippines: [
    { city: "Manila", lat: 14.5995, lng: 120.9842 },
    { city: "Cebu City", lat: 10.3157, lng: 123.8854 },
    { city: "Davao City", lat: 7.1907, lng: 125.4553 },
  ],
  Brunei: [
    { city: "Bandar Seri Begawan", lat: 4.9031, lng: 114.9398 },
    { city: "Kuala Belait", lat: 4.5833, lng: 114.2 },
  ],
};

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { account, health } = req.body;

    if (await User.findOne({ email: account.email })) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);

    const cityData = ASEAN_DATA[health.country]?.find((c) => c.city === health.city);
    if (!cityData) return res.status(400).json({ message: "Invalid country/city" });

    const user = new User({
      name: account.name,
      email: account.email,
      passwordHash: hashedPassword,
      health: {
        ...health,
        lat: cityData.lat,
        lng: cityData.lng,
      },
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, health: user.health },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
