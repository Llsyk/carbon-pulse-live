import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";

type AccountForm = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};

type HealthForm = {
  city: string;
  conditions: string[];
  smoker: "no" | "former" | "yes" | "";
  pregnant: "no" | "yes" | "";
  aqiThreshold: number;
  notifyBy: "email" | "sms" | "push";
  outings: string[]; // times in "HH:MM"
};

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [account, setAccount] = useState<AccountForm>({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [health, setHealth] = useState<HealthForm>({
    city: "",
    conditions: [],
    smoker: "",
    pregnant: "",
    aqiThreshold: 100,
    notifyBy: "email",
    outings: [], // start empty; user can add times
  });

  const passwordScore = useMemo(() => {
    const p = account.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }, [account.password]);

  function toggleCondition(value: string) {
    setHealth((h) => {
      const exists = h.conditions.includes(value);
      return {
        ...h,
        conditions: exists ? h.conditions.filter((c) => c !== value) : [...h.conditions, value],
      };
    });
  }

  function addOutingTime() {
    // Add an empty entry so user must pick a time -> less chance to accidentally save a default
    setHealth((h) => ({ ...h, outings: [...h.outings, ""] }));
  }

  function updateOutingTime(index: number, value: string) {
    setHealth((h) => {
      const next = [...h.outings];
      next[index] = value;
      return { ...h, outings: next };
    });
  }

  function removeOutingTime(index: number) {
    setHealth((h) => {
      const next = h.outings.filter((_, i) => i !== index);
      return { ...h, outings: next };
    });
  }

  function validateStep1(): string[] {
    const errs: string[] = [];
    if (!account.name.trim()) errs.push("Full name is required.");
    if (!/^\S+@\S+\.\S+$/.test(account.email)) errs.push("Valid email is required.");
    if (account.password.length < 8) errs.push("Password must be at least 8 characters.");
    if (account.password !== account.confirm) errs.push("Passwords do not match.");
    return errs;
  }

  function validateStep2(): string[] {
    const errs: string[] = [];
    if (!health.city.trim()) errs.push("City is required.");
    if (!health.smoker) errs.push("Please select smoker status.");
    if (!health.pregnant) errs.push("Please indicate if pregnant.");
    if (health.aqiThreshold < 50 || health.aqiThreshold > 300)
      errs.push("AQI alert threshold should be between 50 and 300.");
    if (!health.notifyBy) errs.push("Please choose a notification method.");
    // ensure outing times are valid HH:MM OR empty (we'll later filter empties)
    const invalidTime = health.outings.some((t) => t !== "" && !/^\d{2}:\d{2}$/.test(t));
    if (invalidTime) errs.push("Please use valid time format (HH:MM) for outing times.");
    return errs;
  }

  async function handleNext() {
    const errs = validateStep1();
    setErrors(errs);
    if (errs.length === 0) setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = step === 1 ? validateStep1() : validateStep2();
    setErrors(errs);
    if (errs.length > 0) return;

    // sanitize outings: remove empty strings and ensure hh:mm (take first 5 chars)
    const sanitizedOutings = health.outings
      .map((t) => (typeof t === "string" ? t.trim().slice(0, 5) : ""))
      .filter((t) => /^\d{2}:\d{2}$/.test(t));

    const payloadHealth = { ...health, outings: sanitizedOutings };

    setBusy(true);
    try {
      // Create account in DB — ensure api helper sets Content-Type: application/json
      const res = await api<{ token: string; user: any }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ account, health: payloadHealth }),
      });

      // Auto-login using returned token
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/"); // go to Index after signup
    } catch (err: any) {
      setErrors([err?.message || "Something went wrong. Please try again."]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-sky-900">Create Account</h1>
          <p className="text-slate-500">Step {step} of 2 • Air Quality Personalization</p>
          <div className="mt-3 h-2 w-full bg-slate-100 rounded-full">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? "w-1/2" : "w-full"} bg-sky-500`}
            />
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((er, idx) => (
                <li key={idx}>{er}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 1: Account Info */}
        {step === 1 && (
          <section className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input
                className="border rounded-xl px-4 py-2 outline-none focus:ring-4 ring-sky-100"
                placeholder="e.g., Aung Aung"
                value={account.name}
                onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))}
                autoComplete="name"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="border rounded-xl px-4 py-2 outline-none focus:ring-4 ring-sky-100"
                placeholder="you@example.com"
                value={account.email}
                onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
                autoComplete="email"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                className="border rounded-xl px-4 py-2 outline-none focus:ring-4 ring-sky-100"
                placeholder="At least 8 characters"
                value={account.password}
                onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
                autoComplete="new-password"
              />
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1.5 w-full rounded-full ${passwordScore >= i ? "bg-sky-500" : "bg-slate-200"}`} />
                ))}
              </div>
              <p className="text-xs text-slate-500">Use upper/lowercase, numbers, and a symbol for a stronger password.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Confirm Password</label>
              <input
                type="password"
                className="border rounded-xl px-4 py-2 outline-none focus:ring-4 ring-sky-100"
                placeholder="Re-enter your password"
                value={account.confirm}
                onChange={(e) => setAccount((a) => ({ ...a, confirm: e.target.value }))}
                autoComplete="new-password"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Link to="/login" className="text-sm text-sky-700 underline">
                Already have an account? Login
              </Link>
              <button
                type="button"
                onClick={handleNext}
                className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-5 py-2 rounded-xl shadow-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Health & Alerts */}
        {step === 2 && (
          <section className="space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Primary City / Location</label>
              <input
                className="border rounded-xl px-4 py-2 outline-none focus:ring-4 ring-sky-100"
                placeholder="e.g., Yangon"
                value={health.city}
                onChange={(e) => setHealth((h) => ({ ...h, city: e.target.value }))}
                autoComplete="address-level2"
              />
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Health Conditions (select all that apply)</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["asthma", "Asthma"],
                  ["allergies", "Allergic Rhinitis"],
                  ["copd", "COPD"],
                  ["heart", "Heart Disease"],
                  ["kids", "Sensitive Child"],
                  ["elderly", "Elderly (65+)"],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 border rounded-xl px-3 py-2">
                    <input type="checkbox" checked={health.conditions.includes(val)} onChange={() => toggleCondition(val)} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Smoker Status</label>
                <select
                  className="border rounded-xl px-4 py-2 outline-none focus:ring-4 ring-sky-100"
                  value={health.smoker}
                  onChange={(e) => setHealth((h) => ({ ...h, smoker: e.target.value as any }))}
                >
                  <option value="">Select…</option>
                  <option value="no">Non-smoker</option>
                  <option value="former">Former smoker</option>
                  <option value="yes">Current smoker</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Pregnant</label>
                <select
                  className="border rounded-xl px-4 py-2 outline-none focus:ring-4 ring-sky-100"
                  value={health.pregnant}
                  onChange={(e) => setHealth((h) => ({ ...h, pregnant: e.target.value as any }))}
                >
                  <option value="">Select…</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">AQI Alert Threshold</label>
                <input
                  type="number"
                  min={50}
                  max={300}
                  step={10}
                  className="border rounded-xl px-4 py-2 outline-none focus:ring-4 ring-sky-100"
                  value={health.aqiThreshold}
                  onChange={(e) => setHealth((h) => ({ ...h, aqiThreshold: Number(e.target.value) }))}
                />
                <p className="text-xs text-slate-500">We’ll notify you when AQI ≥ this value (e.g., 100 = Unhealthy for Sensitive Groups).</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Notify Me By</label>
                <div className="flex gap-2">
                  {(["email", "sms", "push"] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setHealth((h) => ({ ...h, notifyBy: opt }))}
                      className={`flex-1 border rounded-xl px-4 py-2 ${health.notifyBy === opt ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                    >
                      {opt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Outing times section */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Typical Outing Times</label>
                <button
                  type="button"
                  onClick={addOutingTime}
                  className="text-sm bg-white text-sky-700 border border-sky-200 px-3 py-1 rounded-lg hover:bg-sky-50"
                >
                  + Add time
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Tell us the times you usually go outside (you can add multiple). We'll use this to correlate AQI with your routine.
              </p>

              <div className="space-y-2 mt-2">
                {health.outings.length === 0 && (
                  <p className="text-xs text-slate-400">No outing times yet. Click “+ Add time” to add one.</p>
                )}

                {health.outings.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => updateOutingTime(idx, e.target.value)}
                      className="border rounded-xl px-3 py-2"
                      aria-label={`Outing time ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOutingTime(idx)}
                      className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-lg hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-xl border text-slate-700 hover:bg-slate-50">
                Back
              </button>
              <button type="submit" disabled={busy} className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-5 py-2 rounded-xl shadow-sm disabled:opacity-50">
                {busy ? "Creating..." : "Create Account"}
              </button>
            </div>
          </section>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          By creating an account, you agree to receive health and AQI alerts based on your preferences.
        </p>
      </form>
    </div>
  );
}
