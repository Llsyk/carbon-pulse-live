import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";

const ASEAN_COUNTRIES = [
  "Myanmar",
  "Thailand",
  "Vietnam",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Cambodia",
  "Laos",
  "Brunei",
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Myanmar: ["Yangon", "Mandalay", "Naypyidaw", "Taunggyi", "Mawlamyine"],
  Thailand: ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"],
  Vietnam: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hue"],
  Singapore: ["Singapore"],
  Malaysia: ["Kuala Lumpur", "Penang", "Johor Bahru", "Kota Kinabalu"],
  Indonesia: ["Jakarta", "Surabaya", "Bali (Denpasar)", "Bandung"],
  Philippines: ["Manila", "Cebu City", "Davao City"],
  Cambodia: ["Phnom Penh", "Siem Reap", "Battambang"],
  Laos: ["Vientiane", "Luang Prabang", "Pakse"],
  Brunei: ["Bandar Seri Begawan", "Kuala Belait"],
};

export default function Signup() {
  const navigate = useNavigate();  const [step, setStep] = useState(1);  const [formData, setFormData] = useState({
    account: { name: "", email: "", password: "", confirm: "", phone: "" },
    health: {
      country: "",
      city: "",
      conditions: [] as string[],
      smoker: "",
      pregnant: "",
      aqiThreshold: 100,
      outings: [] as string[],
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [outingTimesRaw, setOutingTimesRaw] = useState("");
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const checkPasswordRules = (password: string) => {
    setPasswordRules({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === 1) {
      // Validate account
      if (!formData.account.name || !formData.account.email || !formData.account.password || !formData.account.confirm) {
        setError("Please fill all required fields.");
        return;
      }
      if (formData.account.password !== formData.account.confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (!passwordRules.length || !passwordRules.uppercase || !passwordRules.lowercase || !passwordRules.number || !passwordRules.special) {
        setError("Password does not meet all requirements.");
        return;
      }
      setStep(2);
    } else {
      // Submit
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");

        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const updateAccount = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, account: { ...prev.account, [field]: value } }));    if (field === "password") {
      checkPasswordRules(value);
    }  };

  const updateHealth = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, health: { ...prev.health, [field]: value } }));
  };

  const toggleCondition = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      health: {
        ...prev.health,
        conditions: prev.health.conditions.includes(condition)
          ? prev.health.conditions.filter((c) => c !== condition)
          : [...prev.health.conditions, condition],
      },
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-blue-700 mb-6 text-center">
          Signup
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <label className="block mb-2">Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={formData.account.name}
              onChange={(e) => updateAccount("name", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              required
            />

            <label className="block mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.account.email}
              onChange={(e) => updateAccount("email", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              required
            />

            <label className="block mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.account.password}
              onChange={(e) => updateAccount("password", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-2"
              required
            />
            <div className="mb-4 text-sm">
              <div className={`flex items-center ${passwordRules.length ? 'text-green-600' : 'text-red-600'}`}>
                {passwordRules.length ? '✓' : '✗'} At least 8 characters
              </div>
              <div className={`flex items-center ${passwordRules.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                {passwordRules.uppercase ? '✓' : '✗'} One uppercase letter
              </div>
              <div className={`flex items-center ${passwordRules.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                {passwordRules.lowercase ? '✓' : '✗'} One lowercase letter
              </div>
              <div className={`flex items-center ${passwordRules.number ? 'text-green-600' : 'text-red-600'}`}>
                {passwordRules.number ? '✓' : '✗'} One number
              </div>
              <div className={`flex items-center ${passwordRules.special ? 'text-green-600' : 'text-red-600'}`}>
                {passwordRules.special ? '✓' : '✗'} One special character
              </div>
            </div>

            <label className="block mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={formData.account.confirm}
              onChange={(e) => updateAccount("confirm", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
            >
              Next
            </button>
          </>
        ) : (
          <>
            <label className="block mb-2">Country</label>
            <select
              value={formData.health.country}
              onChange={(e) => updateHealth("country", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            >
              <option value="">Select country</option>
              {ASEAN_COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
            </select>

            <label className="block mb-2">City</label>
            <select
              value={formData.health.city}
              onChange={(e) => updateHealth("city", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              disabled={!formData.health.country}
            >
              <option value="">Select city</option>
              {formData.health.country && CITIES_BY_COUNTRY[formData.health.country]?.map(city => <option key={city} value={city}>{city}</option>)}
            </select>

            <label className="block mb-2">Health Conditions</label>
            <div className="mb-4 grid grid-cols-2 gap-4">
              {["Asthma", "COPD", "Heart Disease", "Diabetes"].map(condition => (
                <label key={condition} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.health.conditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                    className="mr-2"
                  />
                  {condition}
                </label>
              ))}
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-2">Smoker?</label>
                <select
                  value={formData.health.smoker}
                  onChange={(e) => updateHealth("smoker", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-2">Pregnant?</label>
                <select
                  value={formData.health.pregnant}
                  onChange={(e) => updateHealth("pregnant", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block mb-2">AQI Threshold</label>
                <input
                  type="number"
                  value={formData.health.aqiThreshold}
                  onChange={(e) => updateHealth("aqiThreshold", Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-2">Outing Times</label>
                <input
                  type="text"
                  placeholder="e.g., 08:00, 12:00, 18:00"
                  value={outingTimesRaw}
                  onChange={(e) => {
                    setOutingTimesRaw(e.target.value);
                    const times = e.target.value.split(",").map(t => t.trim()).filter(t => /^\d{2}:\d{2}$/.test(t));
                    updateHealth("outings", times);
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg disabled:opacity-60"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </div>
          </>
        )}

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
