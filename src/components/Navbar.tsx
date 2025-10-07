import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-green-600 text-white shadow-md" aria-label="Primary">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/60 rounded-lg">
          <img
            src={logo}
            alt="Carbon Dashboard Logo"
            width={36}
            height={36}
            className="rounded-md object-cover"
          />
          <span className="font-semibold">Sustainability KPI Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/">
            <Button
              variant="secondary"
              className={`bg-white text-green-700 hover:bg-green-50 ${pathname === "/" ? "ring-2 ring-white/60" : ""}`}
            >
              Home
            </Button>
          </Link>
          <Link to="/explorer">
            <Button
              variant="secondary"
              className={`bg-white text-green-700 hover:bg-green-50 ${pathname === "/explorer" ? "ring-2 ring-white/60" : ""}`}
              aria-label="Open City Explorer map"
            >
              Map
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
