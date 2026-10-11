import styles from "./AnimatedTapHint.module.css";

/** Decorative CTA guidance; never intercepts the link's pointer or keyboard input. */
export function AnimatedTapHint() {
  return (
    <span aria-hidden="true" data-animated-tap-hint className={styles.hand}>
      <span className={styles.icon}>👆</span>
    </span>
  );
}
