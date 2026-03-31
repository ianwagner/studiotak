"use client";

import { motion } from "framer-motion";
import { animationPresets } from "@/components/sections/animationPresets";
import styles from "./founder.module.css";

const lift = animationPresets.lift;

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
  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial="hidden"
        animate="visible"
        variants={lift.container}
      >
        <motion.p className={styles.greeting} variants={lift.item}>
          Hey, thank you for finding this.
        </motion.p>

        <motion.p className={styles.body} variants={lift.item} custom={1}>
          <em>Tak</em> is Danish for <em>thank you</em>. I named the studio after it because gratitude is a good place to start.
        </motion.p>

        <motion.p className={styles.body} variants={lift.item} custom={2}>
          I&apos;m building <a href="/campfire" className={styles.inlineLink}>Campfire</a> because
          I love systems design and I think making great work should be more fun.
          Creative <em>should</em> be fun. I love putting together strong teams
          and making them successful with smart tools.
        </motion.p>

        <motion.p className={styles.body} variants={lift.item} custom={3}>
          If you&apos;re interested in what we&apos;re building, want to
          collaborate, or just want to chat about the future of creative
          technology, I&apos;d love to hear from you.
        </motion.p>

        <motion.div className={styles.signoff} variants={lift.item} custom={4}>
          <p className={styles.tak}>Tak,</p>
          <p className={styles.signName}>Ian</p>
        </motion.div>

        <motion.div className={styles.links} variants={lift.item} custom={5}>
          <a
            href="#"
            onClick={handleEmailClick}
            className={styles.textLink}
          >
            Email
          </a>
          <span className={styles.dot} />
          <a
            href="https://linkedin.com/in/ianwa"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.textLink}
          >
            LinkedIn
          </a>
          <span className={styles.dot} />
          <a
            href="https://ianwagner.co"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.textLink}
          >
            ianwagner.co
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
