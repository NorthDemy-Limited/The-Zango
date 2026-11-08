"use client";

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Video,
  Table as TableIcon,
  Code,
  Sparkles,
  Maximize2,
  Minimize2,
  UploadCloud
} from "lucide-react";
import { TwitterIcon } from "@/components/social-icons";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "Write your longform story dispatch here. Use formatting, headings, images, and embeds...",
  height = 420,
}: RichEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#C61D1F] underline font-semibold",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: "rounded-2xl max-w-full my-6 shadow-xs border border-gray-200",
        },
      }),
      Youtube.configure({
        width: 800,
        height: 450,
        HTMLAttributes: {
          class: "rounded-2xl overflow-hidden shadow-md my-6 w-full aspect-video border border-gray-200",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "w-full border-collapse my-6 border border-gray-200 text-sm",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "bg-gray-100 font-bold p-3 border border-gray-200 text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "p-3 border border-gray-200",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-hidden min-h-[300px] p-5 text-[#222222] font-normal leading-relaxed text-base sm:text-lg " +
          "[&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-black [&_h1]:mt-8 [&_h1]:mb-4 " +
          "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:pb-2 " +
          "[&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-black [&_h3]:mt-6 [&_h3]:mb-2 " +
          "[&_p]:mb-4 [&_p]:leading-relaxed sm:[&_p]:leading-loose " +
          "[&_blockquote]:border-l-4 [&_blockquote]:border-[#C61D1F] [&_blockquote]:bg-[#FDF2F2]/60 [&_blockquote]:pl-5 [&_blockquote]:py-3.5 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:rounded-r-xl " +
          "[&_ul]:list-disc [&_ul]:list-inside [&_ul]:my-4 [&_ul]:space-y-1 " +
          "[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:my-4 [&_ol]:space-y-1 " +
          "[&_hr]:my-8 [&_hr]:border-gray-300",
      },
    },
    immediatelyRender: false,
  });

  const editorFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingInline, setIsUploadingInline] = useState(false);

  // Sync internal content if parent value changes externally (e.g. opening an edit modal)
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      if (!editor.isFocused) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="rounded-2xl border border-[#DFDFDF] bg-[#FAFAFA] p-10 text-center text-sm text-[#707070] animate-pulse">
        Initializing Editorial WYSIWYG Composer...
      </div>
    );
  }

  // Helper actions
  const insertLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = prompt("Enter URL:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size exceeds 10MB limit.");
      return;
    }

    setIsUploadingInline(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        editor?.chain().focus().setImage({ src: data.url }).run();
      } else {
        alert(data.message || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Inline image upload failed:", err);
      alert("Error uploading image.");
    } finally {
      setIsUploadingInline(false);
      if (e.target) e.target.value = "";
    }
  };

  const insertImagePrompt = () => {
    const url = prompt(
      "Paste Image URL (or upload to Cloudinary above and copy link):",
      "https://res.cloudinary.com/..."
    );
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertYouTubePrompt = () => {
    const url = prompt(
      "Enter YouTube Video URL:",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const insertTweetEmbed = () => {
    const url = prompt(
      "Enter X (Twitter) Post URL:",
      "https://x.com/thezango_media/status/1785234567890"
    );
    if (url) {
      editor
        .chain()
        .focus()
        .insertContent(`<p><br></p><p>${url.trim()}</p><p><br></p>`)
        .run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  // Word count computation
  const textContent = editor.getText().trim();
  const wordCount = textContent ? textContent.split(/\s+/).length : 0;
  const charCount = textContent.length;

  return (
    <div
      className={`rounded-2xl border border-[#DFDFDF] bg-white shadow-2xs overflow-hidden transition-all ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl flex flex-col" : ""
      }`}
    >
      {/* 1. Classic Desktop Menu Bar (Edit, Insert, View, Format, Table, Tools) */}
      <div className="bg-[#F8F9FA] border-b border-[#E5E6E8] px-3 py-1.5 flex items-center justify-between text-xs text-[#535252]">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {["File", "Edit", "Insert", "View", "Format", "Table", "Tools"].map((menu) => (
            <button
              key={menu}
              type="button"
              onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
              className={`px-2 py-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer font-medium ${
                activeMenu === menu ? "bg-gray-200 text-black" : ""
              }`}
            >
              {menu}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {/* Tweet Embed Button */}
          <button
            type="button"
            onClick={insertTweetEmbed}
            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md text-[11px] font-bold flex items-center space-x-1 border border-sky-200 transition-colors cursor-pointer"
            title="Embed X (Twitter) Post"
          >
            <TwitterIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Embed Post</span>
          </button>

          {/* YouTube Embed Button */}
          <button
            type="button"
            onClick={insertYouTubePrompt}
            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-[11px] font-bold flex items-center space-x-1 border border-red-200 transition-colors cursor-pointer"
            title="Embed YouTube Video"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Embed Video</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors cursor-pointer text-gray-600"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Main Icon Toolbar (Exact visual matches to Image 2) */}
      <div className="bg-white border-b border-[#E5E6E8] p-2 flex flex-wrap items-center gap-1">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 cursor-pointer text-[#444]"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 cursor-pointer text-[#444]"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Heading / Paragraph Selector */}
        <select
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
              ? "h3"
              : "p"
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "p") editor.chain().focus().setParagraph().run();
            else if (val === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (val === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (val === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#DFDFDF] bg-white hover:bg-gray-50 focus:outline-hidden cursor-pointer"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Bold, Italic, Underline, Strikethrough */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("bold") ? "bg-[#C61D1F] text-white" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("italic") ? "bg-[#C61D1F] text-white" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("underline") ? "bg-[#C61D1F] text-white" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("strike") ? "bg-[#C61D1F] text-white" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Alignment Controls */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive({ textAlign: "left" }) ? "bg-gray-200 text-black" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive({ textAlign: "center" }) ? "bg-gray-200 text-black" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive({ textAlign: "right" }) ? "bg-gray-200 text-black" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive({ textAlign: "justify" }) ? "bg-gray-200 text-black" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Lists & Indents */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("bulletList") ? "bg-[#C61D1F] text-white" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("orderedList") ? "bg-[#C61D1F] text-white" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Blockquote, Divider, Table */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("blockquote") ? "bg-[#C61D1F] text-white" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-[#444] cursor-pointer"
          title="Horizontal Line"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={insertTable}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-[#444] cursor-pointer"
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Links & Images */}
        <button
          type="button"
          onClick={insertLink}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editor.isActive("link") ? "bg-[#C61D1F] text-white" : "hover:bg-gray-100 text-[#444]"
          }`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-red-600 cursor-pointer"
            title="Remove Link"
          >
            <Unlink className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => editorFileInputRef.current?.click()}
          disabled={isUploadingInline}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-[#444] cursor-pointer"
          title="Upload & Insert Inline Image"
        >
          {isUploadingInline ? (
            <div className="w-4 h-4 border-2 border-[#C61D1F] border-t-transparent rounded-full animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4 text-blue-600" />
          )}
        </button>
        <input
          type="file"
          ref={editorFileInputRef}
          onChange={handleInlineImageUpload}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={insertImagePrompt}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-[#444] cursor-pointer"
          title="Insert Image by URL"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 3. The Live Editable Canvas */}
      <div
        className={`bg-white overflow-y-auto ${
          isFullscreen ? "flex-1" : ""
        }`}
        style={!isFullscreen ? { minHeight: `${height}px`, maxHeight: "650px" } : {}}
      >
        <EditorContent editor={editor} />
      </div>

      {/* 4. Bottom Status & Word Count Bar (Identical to Image 2) */}
      <div className="bg-[#F8F9FA] border-t border-[#E5E6E8] px-4 py-2 flex items-center justify-between text-xs text-[#707070]">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
            {editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
              ? "h3"
              : editor.isActive("blockquote")
              ? "blockquote"
              : editor.isActive("bulletList")
              ? "ul"
              : editor.isActive("orderedList")
              ? "ol"
              : "p"}
          </span>
          <span className="text-[11px] hidden sm:inline text-gray-400">
            • Editorial Rich Text Canvas
          </span>
        </div>

        <div className="flex items-center space-x-3 font-medium">
          <span>{wordCount} words</span>
          <span className="text-gray-300">|</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
}
