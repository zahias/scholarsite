import { forwardRef, useImperativeHandle, useReducer, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useToast } from "@/hooks/use-toast";
import type { TiptapDoc } from "@/lib/renderSectionContent";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";

export interface SectionEditorHandle {
  getJSON: () => TiptapDoc;
  setContent: (doc: TiptapDoc) => void;
}

interface SectionEditorProps {
  initialContent: TiptapDoc;
}

const toolbarButtonStyle = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: 6,
  border: "1px solid rgba(11,31,58,.14)",
  background: active ? "#FFC72E" : "#fff",
  color: active ? "#0B1F3A" : "#4B4D53",
  cursor: "pointer",
});

// A deliberately small WYSIWYG editor for profile-section content: bold,
// italic, two heading levels, lists, links, and images. No tables, no font/
// color controls — keeps every researcher's page visually consistent with
// the site's design rather than becoming a free-form layout tool.
const SectionEditor = forwardRef<SectionEditorHandle, SectionEditorProps>(
  ({ initialContent }, ref) => {
    const { toast } = useToast();
    const imageInputRef = useRef<HTMLInputElement>(null);
    // Manual re-render trigger for toolbar active-state (editor.isActive(...)),
    // instead of Tiptap's built-in shouldRerenderOnTransaction — that option's
    // internal update can fire synchronously off a native blur/selection event
    // (e.g. clicking a button elsewhere while the editor is focused), which
    // triggered a "Cannot update a component while rendering a different
    // component" warning here. Subscribing via useEffect and updating through
    // a plain reducer keeps the re-render tied to a normal effect callback.
    const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

    const editor = useEditor({
      // Defers the editor's first render into an effect rather than doing it
      // synchronously during mount, avoiding a similar render-phase clash.
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          strike: false,
          code: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
          underline: false,
          link: {
            openOnClick: false,
            protocols: ["http", "https", "mailto"],
            HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
          },
        }),
        Image.configure({ inline: false, allowBase64: false }),
      ],
      content: initialContent,
      editorProps: {
        attributes: {
          class: "prose prose-sm max-w-none focus:outline-none",
          style: "min-height: 120px; padding: 10px 12px;",
        },
      },
    });

    useImperativeHandle(ref, () => ({
      getJSON: () => (editor?.getJSON() as TiptapDoc) ?? { type: "doc", content: [] },
      setContent: (doc: TiptapDoc) => editor?.commands.setContent(doc),
    }));

    useEffect(() => {
      if (!editor) return;
      editor.on("transaction", forceUpdate);
      return () => {
        editor.off("transaction", forceUpdate);
      };
    }, [editor]);

    const handleImageButtonClick = () => imageInputRef.current?.click();

    const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !editor) return;

      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image too large", description: "Please choose an image under 5MB.", variant: "destructive" });
        return;
      }

      try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await fetch("/api/researcher/sections/upload-image", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to upload image");
        }
        const { url } = await response.json();
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    };

    const handleLinkButtonClick = () => {
      if (!editor) return;
      if (editor.isActive("link")) {
        editor.chain().focus().unsetLink().run();
        return;
      }
      const url = window.prompt("Link URL (https://…)");
      if (!url) return;
      editor.chain().focus().setLink({ href: url }).run();
    };

    if (!editor) return null;

    return (
      <div style={{ border: "1px solid rgba(11,31,58,.14)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 6, borderBottom: "1px solid rgba(11,31,58,.1)", background: "#F8F9FA" }}>
          <button type="button" aria-label="Bold" aria-pressed={editor.isActive("bold")} style={toolbarButtonStyle(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
            <BoldIcon size={15} />
          </button>
          <button type="button" aria-label="Italic" aria-pressed={editor.isActive("italic")} style={toolbarButtonStyle(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <ItalicIcon size={15} />
          </button>
          <button type="button" aria-label="Heading 2" aria-pressed={editor.isActive("heading", { level: 2 })} style={toolbarButtonStyle(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={15} />
          </button>
          <button type="button" aria-label="Heading 3" aria-pressed={editor.isActive("heading", { level: 3 })} style={toolbarButtonStyle(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={15} />
          </button>
          <button type="button" aria-label="Bullet list" aria-pressed={editor.isActive("bulletList")} style={toolbarButtonStyle(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={15} />
          </button>
          <button type="button" aria-label="Numbered list" aria-pressed={editor.isActive("orderedList")} style={toolbarButtonStyle(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={15} />
          </button>
          <button type="button" aria-label="Link" aria-pressed={editor.isActive("link")} style={toolbarButtonStyle(editor.isActive("link"))} onClick={handleLinkButtonClick}>
            <LinkIcon size={15} />
          </button>
          <button type="button" aria-label="Insert image" style={toolbarButtonStyle(false)} onClick={handleImageButtonClick}>
            <ImageIcon size={15} />
          </button>
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelected} className="hidden" style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  },
);

SectionEditor.displayName = "SectionEditor";

export default SectionEditor;
