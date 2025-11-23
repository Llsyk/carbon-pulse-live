import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CityExplorer from "@/pages/CityExplorer";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Community from "@/pages/Community";
import Navbar from "@/components/Navbar";
import ChatWidget from "@/components/ChatWidget";
import ReportButton from "@/components/ReportButton";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppContent(){
   const location = useLocation();
   const hideNavbar =
      location.pathname === "/login" || location.pathname === "/signup";
  
  return ( 
      <>
        {/* ✅ Use your Navbar once, globally */}
        {!hideNavbar && <Navbar />}

        {/* ✅ Your pages */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/explorer" element={<ProtectedRoute><CityExplorer /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Global Widgets */}
        {!hideNavbar && (
          <>
            <ChatWidget />
            <ReportButton />
          </>
        )}
      </>
  );
}


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
