import React, { useState } from 'react'
import { DeviceType } from '../prompt-input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Monitor, Smartphone } from 'lucide-react';

export const ScreenModeToggle = () => {
    const [deviceType, setDeviceType] = useState<DeviceType>("mobile");
    const [wireframeKind, setWireframeKind] = useState<"web" | "mobile">("web");
    const [inspirationKind, setInspirationKind] = useState<"web" | "mobile">("web");

    return (
        <div>  {(deviceType === "wireframe" || deviceType === "inspirations") ? (
            <div className="w-full max-w-156 mx-auto mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card/80 px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                        {deviceType === "wireframe" ? "Wireframe" : "Reimagine"}
                    </span>
                    <div className="flex rounded-lg bg-muted p-0.5">
                        <button
                            type="button"
                            onClick={() =>
                                deviceType === "wireframe"
                                    ? setWireframeKind("web")
                                    : setInspirationKind("web")
                            }
                            className={cn(
                                "px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                                (deviceType === "wireframe"
                                    ? wireframeKind
                                    : inspirationKind) === "web"
                                    ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Web
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                deviceType === "wireframe"
                                    ? setWireframeKind("mobile")
                                    : setInspirationKind("mobile")
                            }
                            className={cn(
                                "px-2.5 py-1.5 text-xs font-light rounded-md transition-colors",
                                (deviceType === "wireframe"
                                    ? wireframeKind
                                    : inspirationKind) === "mobile"
                                    ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Mobile
                        </button>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    onClick={(e) => {
                        setDeviceType("mobile");
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to main
                </Link>
            </div>
        ) : (
            <div className="flex justify-center">
                <div className="flex rounded-full bg-muted p-0.5">
                    <button
                        type="button"
                        onClick={() => setDeviceType("mobile")}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-colors  flex gap-1.5 items-center justify-center",
                            deviceType === "mobile"
                                ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Smartphone className="size-4" /> App
                    </button>
                    <button
                        type="button"
                        onClick={() => setDeviceType("web")}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-colors flex gap-1.5 items-center justify-center",
                            deviceType === "web"
                                ? "bg-foreground text-white dark:bg-primary dark:text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Monitor className="size-4" />  Web
                    </button>
                </div>
            </div>
        )}</div>
    )
};       