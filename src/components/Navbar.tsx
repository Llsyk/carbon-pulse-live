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
  const active = (p: string) => (pathname === p ? "ring-2 ring-white/60" : "");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  }

  return (
    <nav className="sticky top-0 z-50 bg-blue-600 text-white shadow-md" aria-label="Primary">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/60 rounded-lg">
          <img src={logo} alt="EcoBreath Logo" width={36} height={36} className="rounded-md object-cover" />
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
          <Link to="/community">
            <Button variant="secondary" className={`bg-white text-blue-700 hover:bg-blue-50 ${active("/community")}`}>
              Community
            </Button>
          </Link>

          {!user && (
          <>
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
          </>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStatsModal(true)}
                className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 px-4 py-2 rounded-full hover:from-green-500/30 hover:to-blue-500/30 transition-all border border-white/20"
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

              <div className="flex items-center gap-2 bg-blue-700/40 px-3 py-1 rounded-full">
                <CircleUserRound className="w-5 h-5"/>
                
              </div>
      
              <Button onClick={logout} variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
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
