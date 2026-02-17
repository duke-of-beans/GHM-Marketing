"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, BookOpen, PlayCircle } from "lucide-react";

export function HelpMenu() {
  const restartTutorial = () => {
    if (typeof window !== "undefined" && (window as any).restartTutorial) {
      (window as any).restartTutorial();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden md:inline">Help</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={restartTutorial}>
          <PlayCircle className="h-4 w-4 mr-2" />
          Restart Tutorial
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="https://docs.google.com/document/d/your-help-doc"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Documentation
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
