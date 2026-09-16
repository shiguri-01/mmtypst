import styles from "./Header.module.css";

export function Header() {
  return (
    <header class={styles.header}>
      <h1 class={styles.wordmark}>mmtypst</h1>
      <a class={styles.github} href="https://github.com/shiguri-01/mmtypst">
        GitHub
      </a>
    </header>
  );
}
