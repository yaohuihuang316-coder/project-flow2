import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Code,
  Strikethrough
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = '请输入内容...',
  minHeight = '200px',
  maxHeight = '400px'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
    title
  }: {
    onClick: () => void;
    isActive: boolean;
    icon: React.ElementType;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-600'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-100 bg-gray-50/50">
        {/* 撤销/重做 */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            isActive={false}
            icon={Undo}
            title="撤销"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            isActive={false}
            icon={Redo}
            title="重做"
          />
        </div>

        {/* 标题 */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            icon={Heading1}
            title="标题 1"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            icon={Heading2}
            title="标题 2"
          />
        </div>

        {/* 文字样式 */}
        <div className="flex items-center gap-1 px-2 border-r border-gray-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={Bold}
            title="粗体"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={Italic}
            title="斜体"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            icon={UnderlineIcon}
            title="下划线"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            icon={Strikethrough}
            title="删除线"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            icon={Code}
            title="行内代码"
          />
        </div>

        {/* 列表 */}
        <div className="flex items-center gap-1 px-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={List}
            title="无序列表"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={ListOrdered}
            title="有序列表"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            icon={Quote}
            title="引用"
          />
        </div>
      </div>

      {/* 编辑器内容 */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 focus:outline-none"
        style={{
          minHeight,
          maxHeight,
          overflowY: 'auto',
        }}
      />

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
        <span>
          {editor.storage.characterCount?.characters?.() || editor.getText().length} 字符
        </span>
        <span className="text-gray-300">
          支持 Markdown 快捷键
        </span>
      </div>

      <style>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: 700;
          margin: 0.5em 0;
        }
        .ProseMirror h2 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.5em 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1em;
          margin: 0.5em 0;
          color: #6b7280;
        }
        .ProseMirror code {
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: monospace;
        }
        .ProseMirror pre {
          background: #f3f4f6;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
