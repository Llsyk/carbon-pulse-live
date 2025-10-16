import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { pathname } = useLocation();
  const active = (p: string) => (pathname === p ? "ring-2 ring-white/60" : "");

  return (
    <nav className="sticky top-0 z-50 bg-blue-600 text-white shadow-md" aria-label="Primary">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/60 rounded-lg">
          <img src={logo} alt="Carbon Dashboard Logo" width={36} height={36} className="rounded-md object-cover" />
          <span className="font-semibold">EcoBreath</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="secondary" className={`bg-white text-blue-700 hover:bg-blue-50 ${active("/")}`}>
              Home
            </Button>
          </Link>
          <Link to="/explorer">
            <Button variant="secondary" className={`bg-white text-blue-700 hover:bg-blue-50 ${active("/explorer")}`}>
              Map
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" className={`bg-white text-blue-700 hover:bg-blue-50 ${active("/login")}`}>
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="secondary" className={`bg-white text-blue-700 hover:bg-blue-50 ${active("/signup")}`}>
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
