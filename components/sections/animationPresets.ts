import type { Variants } from "framer-motion";

type AnimationPreset = {
  container: Variants;
  item: Variants;
};

const defaultEase: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export type AnimationPresetName = "lift" | "fade" | "fan";

export const animationPresets: Record<AnimationPresetName, AnimationPreset> = {
  lift: {
    container: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.08
        }
      }
    },
    item: {
      hidden: { opacity: 0, y: 18 },
      visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          delay: i * 0.08,
          ease: defaultEase
        }
      })
    }
  },
  fan: {
    container: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.1
        }
      }
    },
    item: {
      hidden: { opacity: 0, rotate: -8, scale: 0.9 },
      visible: (i: number = 0) => ({
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: {
          duration: 0.6,
          delay: i * 0.1,
          ease: defaultEase
        }
      })
    }
  },
  fade: {
    container: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.06
        }
      }
    },
    item: {
      hidden: { opacity: 0 },
      visible: (i: number = 0) => ({
        opacity: 1,
        transition: {
          duration: 0.35,
          delay: i * 0.06,
          ease: defaultEase
        }
      })
    }
  }
};

export const defaultAnimationPreset: AnimationPresetName = "lift";
