import { For, JSX, Show } from "solid-js";

import { useFootnote, useFootnotes } from "../useFootnotes";

import styles from "./Footnote.module.css";

// Solid's role union does not yet include DPUB-ARIA roles.
declare module "solid-js" {
  namespace JSX {
    interface ExplicitAttributes {
      role: "doc-noteref" | "doc-endnotes" | "doc-backlink";
    }
  }
}

const cssAnchorName = (id: string) => `--${CSS.escape(id)}`;

export function Footnote(props: { key: string; children: JSX.Element }) {
  const note = useFootnote(props.key, () => props.children);

  return (
    <sup class={styles.marker}>
      <a
        class={styles.reference}
        href={`#${note.noteElId}`}
        id={note.referenceElId}
        attr:role="doc-noteref"
        aria-label={`Note ${note.number()}`}
        style={{ "anchor-name": cssAnchorName(note.referenceElId) }}
      >
        [{note.number()}]
      </a>
    </sup>
  );
}

export function FootnoteList() {
  const footnotes = useFootnotes();
  return (
    <Show when={footnotes.notes().length}>
      <section class={styles.notes} attr:role="doc-endnotes">
        <h2 class={styles.heading}>Notes</h2>
        <ol class={styles.list}>
          <For each={footnotes.notes()}>
            {(note, index) => (
              <li
                class={styles.note}
                id={note.noteElId}
                value={note.number()}
                tabindex="-1"
                style={{
                  "anchor-name": cssAnchorName(note.noteElId),
                  "--reference-anchor-name": cssAnchorName(note.referenceElId),
                  "--previous-note-anchor-name":
                    index() > 0
                      ? cssAnchorName(footnotes.notes()[index() - 1].noteElId)
                      : undefined,
                }}
              >
                {note.content()}{" "}
                <a
                  class={styles.backlink}
                  href={`#${note.referenceElId}`}
                  attr:role="doc-backlink"
                  aria-label={`Back to reference ${note.number()}`}
                />
              </li>
            )}
          </For>
        </ol>
      </section>
    </Show>
  );
}
