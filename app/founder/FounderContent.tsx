"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { animationPresets } from "@/components/sections/animationPresets";
import styles from "./founder.module.css";

const lift = animationPresets.lift;
const fade = animationPresets.fade;

const sectionViewport = { once: true, amount: 0.2 } as const;

/* ------------------------------------------------------------------ */
/*  Photo loader: pulls from Firestore media where type==="ian-photo"  */
/* ------------------------------------------------------------------ */
function useFounderPhoto() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    let canceled = false;
    (async () => {
      try {
        const { getFirestore } = await import("firebase/firestore");
        const { collection, query, where, limit, getDocs } = await import("firebase/firestore");
        const { getFirebaseApp } = await import("@/lib/firebaseClient");

        const db = getFirestore(getFirebaseApp());
        const q = query(
          collection(db, "media"),
          where("type", "==", "ian-photo"),
          where("status", "==", "published"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!canceled && !snap.empty) {
          const data = snap.docs[0].data();
          setPhotoUrl(data.url ?? null);
        }
      } catch {
        // Silently fall back to placeholder
      }
    })();

    return () => { canceled = true; };
  }, []);

  return photoUrl;
}

/* ------------------------------------------------------------------ */
/*  Obfuscated email: constructed client-side to prevent bot scraping   */
/* ------------------------------------------------------------------ */
const handleEmailClick = (e: React.MouseEvent) => {
  e.preventDefault();
  const parts = [105, 97, 110, 64, 115, 116, 117, 100, 105, 111, 116, 97, 107, 46, 99, 111];
  const addr = parts.map((c) => String.fromCharCode(c)).join("");
  window.location.href = `mailto:${addr}`;
};

/* ------------------------------------------------------------------ */
/*  Main content                                                       */
/* ------------------------------------------------------------------ */
export default function FounderContent() {
  const photoUrl = useFounderPhoto();

  return (
    <div className={styles.page}>
      {/* ---- Opening ---- */}
      <motion.section
        className={styles.opening}
        data-has-photo={photoUrl ? "true" : "false"}
        initial="hidden"
        animate="visible"
        variants={lift.container}
      >
        <motion.div className={styles.openingText} variants={lift.item}>
          <h1 className={styles.name}>Ian Wagner</h1>
          <p className={styles.positioning}>
            I design, build, and operate creative and media systems.
          </p>
        </motion.div>
        {photoUrl && (
          <motion.div className={styles.photo} variants={lift.item} custom={1}>
            <img src={photoUrl} alt="Ian Wagner" loading="eager" />
          </motion.div>
        )}
      </motion.section>

      {/* ---- Philosophy ---- */}
      <motion.section
        className={styles.prose}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
        variants={lift.container}
      >
        <motion.p className={styles.pullQuote} variants={lift.item}>
          I think of design as infrastructure. Not the surface of things, but the system underneath. The part that decides whether something actually works at scale.
        </motion.p>
        <motion.p className={styles.body} variants={lift.item} custom={1}>
          Most of my work lives at the intersection of creative production and marketing technology. I build systems that help teams produce better advertising, faster, combining AI tooling with human creative judgment so neither side is doing the job alone.
        </motion.p>
        <motion.p className={styles.body} variants={lift.item} custom={2}>
          I care about the feedback loop: what was made, how it performed, and what that means for the next round. The tools I build try to close that gap. Creative decisions connected to performance outcomes in ways that actually change how the next brief gets written.
        </motion.p>
      </motion.section>

      <hr className={styles.divider} />

      {/* ---- Current Work ---- */}
      <motion.section
        className={styles.workSection}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
        variants={lift.container}
      >
        <div className={styles.workGrid}>
          <motion.div className={styles.workItem} variants={lift.item} custom={0}>
            <h3 className={styles.workTitle}>
              <a href="/campfire">Campfire</a>
            </h3>
            <p className={styles.workDescription}>
              An ad production platform that combines asset libraries, structured creative workflows, and performance feedback loops. Currently managing creative for 25+ brands.
            </p>
          </motion.div>
          <motion.div className={styles.workItem} variants={lift.item} custom={1}>
            <h3 className={styles.workTitle}>
              <a href="https://futurepoetic.com" target="_blank" rel="noopener noreferrer">Future Poetic</a>
            </h3>
            <p className={styles.workDescription}>
              An experimental creative studio and publishing space.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* ---- Writing ---- */}
      <motion.section
        className={styles.writingSection}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
        variants={fade.container}
      >
        <motion.p className={styles.body} variants={fade.item}>
          I write about the things I&apos;m building and the ideas behind them. Creative operations, product thinking, and the places where technology meets taste.
        </motion.p>
        <motion.p variants={fade.item} custom={1}>
          <a
            href="https://ianwagner.co"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.textLink}
          >
            ianwagner.co
          </a>
        </motion.p>
      </motion.section>

      {/* ---- Connect ---- */}
      <motion.section
        className={styles.connect}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
        variants={fade.container}
      >
        <motion.div className={styles.connectLinks} variants={fade.item}>
          <a
            href="https://linkedin.com/in/ianwa"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.textLink}
          >
            LinkedIn
          </a>
          <span className={styles.connectDot} />
          <a
            href="#"
            onClick={handleEmailClick}
            className={styles.textLink}
          >
            Email
          </a>
        </motion.div>
      </motion.section>
    </div>
  );
}
