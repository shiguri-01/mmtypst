import styles from "./Code.module.css";

export function Code(props: { children: string }) {
  return (
    <pre class={styles.codeBlock}>
      <code class={styles.code}>{props.children}</code>
    </pre>
  );
}
