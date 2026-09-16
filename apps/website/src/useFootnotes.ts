import {
  Accessor,
  createComponent,
  createContext,
  createSignal,
  JSX,
  onCleanup,
  ParentComponent,
  useContext,
} from "solid-js";

type FootnoteEntry = {
  key: string;
  content: Accessor<JSX.Element>;
  number: Accessor<number>;
  noteElId: string;
  referenceElId: string;
};

export function createFootnotes() {
  const [notes, setNotes] = createSignal<FootnoteEntry[]>([]);

  const register = (key: string, content: Accessor<JSX.Element>) => {
    if (notes().some((note) => note.key === key)) {
      throw new Error(`Duplicate footnote key: ${key}`);
    }

    const note: FootnoteEntry = {
      key,
      content,
      number: () => notes().indexOf(note) + 1,
      noteElId: `footnote-${key}`,
      referenceElId: `footnote-ref-${key}`,
    };
    setNotes((current) => [...current, note]);
    return note;
  };

  const unregister = (key: string) => {
    setNotes((current) => current.filter((note) => note.key !== key));
  };

  return { notes, register, unregister };
}

const FootnoteContext = createContext<ReturnType<typeof createFootnotes>>();

export const FootnoteProvider: ParentComponent = (props) => {
  const footnotes = createFootnotes();

  return createComponent(FootnoteContext.Provider, {
    value: footnotes,
    get children() {
      return props.children;
    },
  });
};

export const useFootnotes = () => {
  const context = useContext(FootnoteContext);
  if (!context) {
    throw new Error("useFootnotes must be used within a FootnoteProvider");
  }
  return context;
};

export function useFootnote(key: string, content: Accessor<JSX.Element>) {
  const footnotes = useFootnotes();
  const note = footnotes.register(key, content);
  onCleanup(() => footnotes.unregister(key));
  return note;
}
