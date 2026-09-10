"use client";

import { MotionConfig } from "framer-motion";
import type { PropsWithChildren } from "react";

/** Applies the user's OS motion preference to every Framer Motion descendant. */
export function MotionPreferences({ children }: PropsWithChildren) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
