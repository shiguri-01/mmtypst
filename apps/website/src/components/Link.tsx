import styles from "./Link.module.css";

interface LinkProps {
  href: string;
  target?: string;
  children: string;
}

export function Link(props: LinkProps) {
  const isExternal = () => props.href.startsWith("https://");

  return (
    <a
      class={`${styles.link} ${isExternal() ? styles.external : ""}`}
      href={props.href}
      target={props.target}
      rel={props.target === "_blank" ? "noopener noreferrer" : undefined}
    >
      {props.children}
    </a>
  );
}
