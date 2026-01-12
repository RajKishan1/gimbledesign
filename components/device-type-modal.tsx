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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Design Type</DialogTitle>
          <DialogDescription>
            Choose the device type you want to design for
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            variant="outline"
            className="h-20 flex items-center justify-start gap-4 text-left hover:bg-accent"
            onClick={() => onSelect("web")}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">Web Design</span>
              <span className="text-sm text-muted-foreground">
                1440px width - Desktop interface
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex items-center justify-start gap-4 text-left hover:bg-accent"
            onClick={() => onSelect("mobile")}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">Mobile Design</span>
              <span className="text-sm text-muted-foreground">
                420px width - Mobile app interface
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
