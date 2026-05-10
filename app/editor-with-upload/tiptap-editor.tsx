"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useEffect } from "react";

type Props = {
  onFiles: (files: File[]) => void;
  initialContent?: string;
};

export function TiptapEditor({ onFiles, initialContent }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content:
      initialContent ??
      "<p>正文从这里开始……拖拽或粘贴图片到本编辑器，附件会出现在顶部。</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-content px-4 py-3 min-h-[140px] focus:outline-none text-[15px] leading-relaxed",
      },
      handleDrop(_view, event, _slice, moved) {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length === 0) return false;
        event.preventDefault();
        onFiles(files);
        return true;
      },
      handlePaste(_view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length === 0) return false;
        event.preventDefault();
        onFiles(files);
        return true;
      },
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return <EditorContent editor={editor} />;
}
