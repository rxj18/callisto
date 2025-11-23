import { useEffect, useRef, useState } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// Dynamic imports for language extensions to reduce initial bundle size
const loadLanguageExtensions = async (lang: string) => {
  switch (lang) {
    case "json": {
      const { json, jsonParseLinter } = await import("@codemirror/lang-json");
      const { linter } = await import("@codemirror/lint");
      return [json(), linter(jsonParseLinter())];
    }
    case "html": {
      const { html } = await import("@codemirror/lang-html");
      return [html()];
    }
    case "xml": {
      const { xml } = await import("@codemirror/lang-xml");
      return [xml()];
    }
    case "javascript": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return [javascript()];
    }
    default:
      return [];
  }
};

// Dynamic import for vim mode
const loadVimMode = async () => {
  const { vim, Vim } = await import("@replit/codemirror-vim");
  return { vim, Vim };
};

// Dynamic import for search
const loadSearch = async () => {
  const { search } = await import("@codemirror/search");
  return search;
};

export type Language = "json" | "html" | "xml" | "javascript" | "text";

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  language?: Language;
  readOnly?: boolean;
  vimMode?: boolean;
}

export function CodeEditor({
  value = "",
  onChange,
  language = "json",
  readOnly = false,
  vimMode = true, // Default to vim mode enabled
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const vimCompartment = useRef(new Compartment());
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!editorRef.current) return;

    let mounted = true;

    const initializeEditor = async () => {
      try {
        // Custom syntax highlighting theme
        const customHighlightStyle = HighlightStyle.define([
          { tag: tags.keyword, color: "#C792EA" },
          { tag: tags.controlKeyword, color: "#C792EA" },
          { tag: tags.operatorKeyword, color: "#89DDFF" },
          { tag: tags.variableName, color: "#EEFFFF" },
          { tag: tags.function(tags.variableName), color: "#82AAFF" },
          { tag: tags.propertyName, color: "#F07178" },
          { tag: tags.attributeName, color: "#C792EA" },
          { tag: tags.string, color: "#C3E88D" },
          { tag: tags.number, color: "#F78C6C" },
          { tag: tags.bool, color: "#F78C6C" },
          { tag: tags.null, color: "#F78C6C" },
          { tag: tags.operator, color: "#89DDFF" },
          { tag: tags.punctuation, color: "#89DDFF" },
          { tag: tags.bracket, color: "#EEFFFF" },
          { tag: tags.comment, color: "#546E7A", fontStyle: "italic" },
          { tag: tags.typeName, color: "#FFCB6B" },
          { tag: tags.className, color: "#FFCB6B" },
          { tag: tags.tagName, color: "#F07178" },
          { tag: tags.angleBracket, color: "#89DDFF" },
        ]);

        // Load language extensions dynamically
        const langExtensions = await loadLanguageExtensions(language);
        
        // Load search extension dynamically
        const searchExtension = await loadSearch();
        
        // Load vim mode if needed
        let vimExtension: any = [];
        if (vimMode) {
          const { vim: vimMode, Vim } = await loadVimMode();
          vimExtension = vimMode();
          
          // Configure Vim clipboard
          Vim.defineEx("set", "", function (_cm: any, params: any) {
            if (params.args && params.args[0] === "clipboard=unnamedplus") {
              // Enable system clipboard integration
              console.log("Vim clipboard set to unnamedplus");
            }
          });
        }

        if (!mounted) return;

        const startState = EditorState.create({
          doc: value,
          extensions: [
            basicSetup,
            searchExtension({ top: true }),
            syntaxHighlighting(customHighlightStyle),
            ...langExtensions,
            vimCompartment.current.of(vimExtension),
            EditorView.updateListener.of((update) => {
              if (update.docChanged && onChange) {
                onChange(update.state.doc.toString());
              }
            }),
            EditorState.readOnly.of(readOnly),
            EditorView.theme(
              {
                "&": {
                  height: "100%",
                  fontSize: "14px",
                  backgroundColor: "transparent",
                  color: "var(--foreground)",
                },
                "&.cm-editor": {
                  backgroundColor: "transparent",
                },
                ".cm-scroller": {
                  overflow: "auto",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  backgroundColor: "transparent",
                },
                ".cm-content": {
                  minHeight: "100%",
                  backgroundColor: "transparent",
                  caretColor: "var(--primary)",
                },
                ".cm-gutters": {
                  borderRight: "1px solid var(--border)",
                  backgroundColor: "transparent",
                  color: "var(--muted-foreground)",
                },
                ".cm-activeLineGutter": {
                  backgroundColor: "transparent",
                },
                ".cm-gutter": {
                  backgroundColor: "transparent",
                },
                ".cm-line": {
                  backgroundColor: "transparent",
                },
                ".cm-activeLine": {
                  backgroundColor: "oklch(from var(--primary) l c h / 5%)",
                },
                ".cm-selectionBackground, ::selection": {
                  backgroundColor: "oklch(from var(--primary) l c h / 20%)",
                },
                "&.cm-focused .cm-selectionBackground, &.cm-focused ::selection": {
                  backgroundColor: "oklch(from var(--primary) l c h / 25%)",
                },
                ".cm-cursor, .cm-dropCursor": {
                  borderLeft: "2px solid var(--primary)",
                  borderRight: "none",
                  width: "0",
                  animation: "none",
                },
                ".cm-cursor-primary": {
                  animation: "none",
                },
                ".cm-fat-cursor": {
                  backgroundColor: "var(--primary)",
                  opacity: "0.5",
                  animation: "none",
                  outline: "none",
                },
                ".cm-vim-panel": {
                  backgroundColor: "var(--muted)",
                  color: "var(--foreground)",
                  fontFamily: "monospace",
                },
                ".cm-panels": {
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                },
              },
              { dark: true }
            ),
            EditorView.lineWrapping,
          ],
        });

        if (!mounted || !editorRef.current) return;

        const view = new EditorView({
          state: startState,
          parent: editorRef.current,
        });

        viewRef.current = view;
        setIsReady(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize editor:", error);
        setIsLoading(false);
      }
    };

    initializeEditor();

    return () => {
      mounted = false;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [language, vimMode, readOnly]);

  // Update editor content when value changes externally
  useEffect(() => {
    if (!viewRef.current || !isReady) return;

    const currentValue = viewRef.current.state.doc.toString();
    if (value !== currentValue) {
      viewRef.current.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value, isReady]);

  // Update vim mode dynamically
  useEffect(() => {
    if (!viewRef.current || !isReady) return;

    const updateVimMode = async () => {
      if (vimMode) {
        const { vim: vimMode } = await loadVimMode();
        viewRef.current?.dispatch({
          effects: vimCompartment.current.reconfigure(vimMode()),
        });
      } else {
        viewRef.current?.dispatch({
          effects: vimCompartment.current.reconfigure([]),
        });
      }
    };

    updateVimMode();
  }, [vimMode, isReady]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return <div ref={editorRef} className="h-full w-full" />;
};

