import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReportModal from "./ReportModal";

export default function ReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 z-40 bg-secondary text-secondary-foreground rounded-full px-6 py-4 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Report an incident"
      >
        <AlertCircle className="h-5 w-5 mr-2" />
        Report
      </Button>
      <ReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
