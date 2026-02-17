"use client";

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
        <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors w-full text-left">
          <HelpCircle className="h-4 w-4" />
          Help
        </button>
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
