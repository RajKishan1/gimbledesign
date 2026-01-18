"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone } from "lucide-react";

interface DeviceTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (deviceType: "web" | "mobile") => void;
}

export function DeviceTypeModal({
  open,
  onOpenChange,
  onSelect,
}: DeviceTypeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900/50">
        <DialogHeader className="fex flex-col gap-1.5">
          <DialogTitle className="font-medium dark:text-white text-neutral-800">
            Select Design Type
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Choose the device type you want to design for
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            variant="outline"
            className="h-20 flex items-center  bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800/50 justify-start gap-4 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900"
            onClick={() => onSelect("web")}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-neutral-800 dark:text-white">
                Web Design
              </span>
              <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                1440px width - Desktop interface
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex items-center  bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800/50 justify-start gap-4 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900"
            onClick={() => onSelect("mobile")}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-neutral-800 dark:text-white">
                Mobile Design
              </span>
              <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                420px width - Mobile app interface
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
