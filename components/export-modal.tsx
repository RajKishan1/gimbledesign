"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Code, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
