import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    account: { name: "", email: "", password: "", confirm: "", phone: "" },
    health: {
      country: "",
      city: "",
      conditions: [] as string[],
      smoker: "",
      pregnant: "",
      aqiThreshold: 100,
      notifyBy: "email",
      outings: [] as string[],
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.account.password !== formData.account.confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

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
  };

  const updateAccount = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, account: { ...prev.account, [field]: value } }));
  };

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

  const addOuting = (time: string) => {
    if (!formData.health.outings.includes(time)) {
      updateHealth("outings", [...formData.health.outings, time]);
    }
  };

  const removeOuting = (time: string) => {
    updateHealth("outings", formData.health.outings.filter((t) => t !== time));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Section */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.account.name}
              onChange={(e) => updateAccount("name", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.account.email}
              onChange={(e) => updateAccount("email", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              value={formData.account.phone}
              onChange={(e) => updateAccount("phone", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.account.password}
              onChange={(e) => updateAccount("password", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              value={formData.account.confirm}
              onChange={(e) => updateAccount("confirm", e.target.value)}
              required
            />
          </div>

          {/* Health Section */}
          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={formData.health.country} onValueChange={(value) => updateHealth("country", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {ASEAN_COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Select
              value={formData.health.city}
              onValueChange={(value) => updateHealth("city", value)}
              disabled={!formData.health.country}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {formData.health.country &&
                  CITIES_BY_COUNTRY[formData.health.country]?.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Health Conditions</Label>
            <div className="space-y-2">
              {["Asthma", "COPD", "Heart Disease", "Diabetes"].map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={formData.health.conditions.includes(condition)}
                    onCheckedChange={() => toggleCondition(condition)}
                  />
                  <Label htmlFor={condition}>{condition}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="smoker">Smoker?</Label>
            <Select value={formData.health.smoker} onValueChange={(value) => updateHealth("smoker", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pregnant">Pregnant?</Label>
            <Select value={formData.health.pregnant} onValueChange={(value) => updateHealth("pregnant", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="aqiThreshold">AQI Threshold</Label>
            <Input
              id="aqiThreshold"
              type="number"
              value={formData.health.aqiThreshold}
              onChange={(e) => updateHealth("aqiThreshold", Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="notifyBy">Notify By</Label>
            <Select value={formData.health.notifyBy} onValueChange={(value) => updateHealth("notifyBy", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Outing Times (HH:MM)</Label>
            <div className="space-y-2">
              {["08:00", "12:00", "18:00", "20:00"].map((time) => (
                <div key={time} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.health.outings.includes(time)}
                    onCheckedChange={(checked) => (checked ? addOuting(time) : removeOuting(time))}
                  />
                  <Label>{time}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
