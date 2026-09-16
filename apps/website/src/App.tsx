import { Code } from "./components/Code";
import { Footnote, FootnoteList } from "./components/Footnote";
import { Header } from "./components/Header";
import { Link } from "./components/Link";
import { Playground } from "./components/Playground";
import { FootnoteProvider } from "./useFootnotes";

import styles from "./App.module.css";

export function App() {
  return (
    <FootnoteProvider>
      <div class={styles.page}>
        <Header />

        <main>
          <p class={styles.lead}>
            A JavaScript library for rendering math on the web using Typst syntax.
          </p>

          <div class={styles.playground}>
            <Playground />
          </div>

          <div class={styles.details}>
            <section class={styles.section}>
              <div class={styles.sectionHeader}>
                <h2 class={styles.heading}>How it renders</h2>
              </div>
              <div class={styles.body}>
                <p>
                  mmtypst converts <Link href="https://typst.app">Typst</Link> math expressions to{" "}
                  <Link href="https://developer.mozilla.org/en-US/docs/Web/MathML">MathML</Link> for
                  the browser to render. It works in the browser, at build time, or on the server.
                  Pre-rendered expressions need no client-side JavaScript. Rendering and appearance
                  are handled by the browser and the available math fonts.
                </p>
              </div>
            </section>
            <section class={styles.section}>
              <div class={styles.sectionHeader}>
                <h2 class={styles.heading}>Why Typst</h2>
              </div>
              <div class={styles.body}>
                <p>
                  Typst math syntax is simply delightful, and I wanted that experience on the web.
                </p>
                <p>And I just like Typst 🥰</p>
              </div>
            </section>
            <section class={styles.section}>
              <div class={styles.sectionHeader}>
                <h2 class={styles.heading}>Why not Typst</h2>
              </div>
              <div class={styles.body}>
                <p>
                  Typst can already run in the browser through WebAssembly (WASM)
                  <Footnote key="wasm">
                    The official <Link href="https://typst.app/">typst.app</Link> uses WASM on the
                    client side, and community libraries like{" "}
                    <Link href="https://github.com/myriad-dreamin/typst.ts">
                      Myriad-Dreamin/typst.ts
                    </Link>{" "}
                    are also available.
                  </Footnote>{" "}
                  and export HTML with MathML
                  <Footnote key="export-html">
                    HTML export is currently an experimental feature.
                  </Footnote>
                  .
                </p>
                <p>
                  But sometimes you don't need a full document compiler. You just want to render an
                  equation. mmtypst handles that smaller job with a smaller footprint.
                </p>
              </div>
            </section>

            <section class={styles.section}>
              <div class={styles.sectionHeader}>
                <h2 class={styles.heading}>Usage</h2>
                <Link href="https://github.com/shiguri-01/mmtypst">View on GitHub</Link>
              </div>
              <div class={styles.body}>
                <Code>npm install mmtypst</Code>
                <Code>{`import { typstToMathML } from "mmtypst";

document.querySelector(".equation").innerHTML =
  typstToMathML("x^2 + y^2 = z^2");`}</Code>
              </div>
            </section>
          </div>
          <FootnoteList />
        </main>
      </div>
    </FootnoteProvider>
  );
}
