"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Code, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Figma logo icon component (four interconnected dots)
function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 300"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 300C77.6142 300 100 277.614 100 250V200H50C22.3858 200 0 222.386 0 250C0 277.614 22.3858 300 50 300Z"
        fill="#0ACF83"
      />
      <path
        d="M0 150C0 122.386 22.3858 100 50 100H100V200H50C22.3858 200 0 177.614 0 150Z"
        fill="#A259FF"
      />
      <path
        d="M0 50C0 22.3858 22.3858 0 50 0H100V100H50C22.3858 100 0 77.6142 0 50Z"
        fill="#F24E1E"
      />
      <path
        d="M100 0H150C177.614 0 200 22.3858 200 50C200 77.6142 177.614 100 150 100H100V0Z"
        fill="#FF7262"
      />
      <path
        d="M200 150C200 177.614 177.614 200 150 200C122.386 200 100 177.614 100 150C100 122.386 122.386 100 150 100C177.614 100 200 122.386 200 150Z"
        fill="#1ABCFE"
      />
    </svg>
  );
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [prompt, setPrompt] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        {/* BUILD WITH AI Section */}
        <div className="p-6 pb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
            BUILD WITH AI
          </h3>
          <div className="rounded-xl border border-border bg-card/50 p-5 mb-3 min-h-[80px] flex items-center">
            <Input
              type="text"
              placeholder="Anything"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="border-0 bg-transparent text-3xl font-normal italic placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto w-full"
            />
          </div>
          <Button
            className="w-full bg-neutral-800 dark:bg-neutral-700 text-white hover:bg-neutral-700 dark:hover:bg-neutral-600 h-10"
            onClick={() => {
              // TODO: Implement AI build functionality
              console.log("Build with AI:", prompt);
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Build
          </Button>
        </div>

        {/* MANUAL EXPORT Section */}
        <div className="p-6 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
            MANUAL EXPORT
          </h3>
          <div className="flex flex-col gap-3">
            {/* Export Code Option */}
            <button
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
              onClick={() => {
                // TODO: Implement export code functionality
                console.log("Export Code");
              }}
            >
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Export Code
                </span>
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Copy to Figma Option */}
            <button
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
              onClick={() => {
                // TODO: Implement copy to Figma functionality
                console.log("Copy to Figma");
              }}
            >
              <div className="flex items-center gap-3">
                <FigmaIcon className="w-5 h-5" />
                <span className="text-sm font-medium text-foreground">
                  Copy to Figma
                </span>
              </div>
              <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
