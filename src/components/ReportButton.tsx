import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportModal from "./ReportModal";

export default function ReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 z-40 bg-secondary text-secondary-foreground rounded-full px-6 py-4 shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <AlertCircle className="h-5 w-5 mr-2" />
        Report
      </Button>

      {user && (
        <ReportModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          user={user}
        />
      )}
    </>
  );
}
