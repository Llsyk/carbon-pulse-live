import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CityExplorer from "@/pages/CityExplorer";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Navbar from "@/components/Navbar";

const queryClient = new QueryClient();

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
          <Route path="/" element={<Index />} />
          <Route path="/explorer" element={<CityExplorer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
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
