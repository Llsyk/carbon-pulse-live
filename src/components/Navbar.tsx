import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { CircleUserRound, TreePine, FileText } from "lucide-react";
import { usePostCount } from "@/hooks/usePostCount";
import UserStatsModal from "@/components/UserStatsModal";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) 
      setUser(JSON.parse(storedUser));
  }, []);

  const { postCount, treesPlanted } = usePostCount(user?.id || null);
  const active = (p: string) => (pathname === p ? "bg-white text-blue-700 shadow-md" : "");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  }

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg backdrop-blur-sm bg-opacity-95" aria-label="Primary">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/60 rounded-lg transition-transform hover:scale-105">
          <img src={logo} alt="EcoBreath Logo" width={40} height={40} className="rounded-lg object-cover shadow-sm" />
          <span className="font-bold text-xl tracking-tight">EcoBreath</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="secondary" className={`bg-white/10 text-white hover:bg-white/20 border border-white transition-all duration-200 ${active("/")}`}>
              Home
            </Button>
          </Link>
          <Link to="/explorer">
            <Button variant="secondary" className={`bg-white/10 text-white hover:bg-white/20 border border-white transition-all duration-200 ${active("/explorer")}`}>
              Map
            </Button>
          </Link>
          <Link to="/community">
            <Button variant="secondary" className={`bg-white/10 text-white hover:bg-white/20 border border-white transition-all duration-200 ${active("/community")}`}>
              Community
            </Button>
          </Link>

          {!user && (
          <>
          <Link to="/login">
            <Button variant="secondary" className={`bg-white/10 text-white hover:bg-white/20 border border-white transition-all duration-200 ${active("/login")}`}>
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="secondary" className={`bg-white/10 text-white hover:bg-white/20 border border-white transition-all duration-200 ${active("/signup")}`}>
              Sign Up
            </Button>
          </Link>
          </>
          )}
          {user && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowStatsModal(true)}
                className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all duration-200 border border-white backdrop-blur-sm"
                title="View your stats"
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-semibold">{postCount}</span>
                </div>
                <div className="w-px h-4 bg-white/30" />
                <div className="flex items-center gap-1.5">
                  <TreePine className="w-4 h-4" />
                  <span className="text-sm font-semibold">{treesPlanted}</span>
                </div>
              </button>

              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full border border-white">
                <CircleUserRound className="w-5 h-5"/>
                <span className="text-sm font-medium">{user.name || user.email}</span>
              </div>
      
              <Button onClick={logout} variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border border-white transition-all duration-200">
                Logout
              </Button>
            </div>      
          )}
          
          {user && (
            <UserStatsModal
              isOpen={showStatsModal}
              onClose={() => setShowStatsModal(false)}
              userName={user.name || user.email}
              postCount={postCount}
              treesPlanted={treesPlanted}
            />
          )}
        </div>
      </div>
    </nav>
  );
}
