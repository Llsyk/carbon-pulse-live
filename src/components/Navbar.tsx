import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { CircleUserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const active = (p: string) => (pathname === p ? "ring-2 ring-white/60" : "");

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      navigate("/login");
    }
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

          {session && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-700/40 px-3 py-1 rounded-full">
                <CircleUserRound className="w-5 h-5"/>
                <span className ="text-sm">{session.user.email}</span>
              </div>
              <Button onClick={logout} variant="secondary" className ="bg-white text-blue-700 hover:bg-blue-50">
                Logout
              </Button>
            </div>      
          )}
        </div>
      </div>
    </nav>
  );
}
