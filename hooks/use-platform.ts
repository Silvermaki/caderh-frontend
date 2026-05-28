"use client";

import { useEffect, useState } from "react";

export type Platform = "mac" | "windows" | "linux" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const uaData = (navigator as any).userAgentData;
  const raw = uaData?.platform ?? navigator.platform ?? navigator.userAgent ?? "";
  const p = String(raw).toLowerCase();
  if (p.includes("mac")) return "mac";
  if (p.includes("win")) return "windows";
  if (p.includes("linux") || p.includes("x11")) return "linux";
  return "other";
}

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("other");
  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);
  return platform;
}

export function useIsMac(): boolean {
  return usePlatform() === "mac";
}
