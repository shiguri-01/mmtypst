import { typstToMathML } from "mmtypst";
import { createMemo, createSignal, For, Show } from "solid-js";

import styles from "./Playground.module.css";

const examples = [
  { name: "Quadratic", source: "x = (-b plus.minus sqrt(b^2 - 4 a c)) / (2 a)" },
  { name: "Integral", source: "integral_0^infinity e^(-x) dif x = 1" },
  { name: "Matrix", source: "A = mat(1, 2; 3, 4)" },
];

export function Playground() {
  const [source, setSource] = createSignal(examples[0].source);

  const result = createMemo(() => {
    const input = source().trim();

    if (!input) return { mathml: "", error: "" };

    try {
      const body = typstToMathML(input, { display: "block", throwOnError: true });
      return {
        mathml: body,
        error: "",
      };
    } catch (error) {
      return {
        mathml: "",
        error: error instanceof Error ? error.message : "Could not render this expression.",
      };
    }
  });

  return (
    <div class={styles.playground}>
      <div class={styles.editor}>
        <textarea
          value={source()}
          onInput={(e) => setSource(e.currentTarget.value)}
          aria-label="Typst expression"
          spellcheck={false}
          autocapitalize="off"
          autocorrect="off"
          class={styles.textarea}
        >
          {examples[0].source}
        </textarea>
        <div class={styles.examples}>
          <For each={examples}>
            {(example) => {
              const isActive = () => source() === example.source;

              return (
                <button
                  type="button"
                  class={styles.exampleButton}
                  aria-pressed={isActive()}
                  onClick={() => setSource(example.source)}
                >
                  {example.name}
                </button>
              );
            }}
          </For>
        </div>
      </div>
      <div class={styles.preview}>
        <Show when={!result().error} fallback={<div class={styles.error}>{result().error}</div>}>
          <div class={styles.math} innerHTML={result().mathml} />
        </Show>
      </div>
    </div>
  );
}
