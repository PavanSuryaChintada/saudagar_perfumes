import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Link2, List, ListOrdered, Heading2, Undo2, Redo2 } from 'lucide-react';
import { useEffect } from 'react';

/** Small rich-text editor (bold, italic, headings, lists, links). Output is sanitised again when rendered. */
export function RichText({ value, onChange, placeholder, minHeight = 120 }: { value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false, autolink: true } })],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose-admin outline-none px-3 py-2 text-[13px] text-tk-ink leading-relaxed',
        style: `min-height:${minHeight}px`,
        'aria-label': placeholder ?? 'Rich text',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // Keep the editor in sync when the form loads a different product.
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(value === '' && editor.isEmpty)) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;
  const btn = (active: boolean) => `p-1.5 ${active ? 'bg-tk-ink text-white' : 'text-[#555555] hover:bg-[#F4F3EE]'}`;
  return (
    <div className="border border-[#D5D3CC] bg-white focus-within:border-tk-ink">
      <div className="flex flex-wrap gap-0.5 border-b border-[#EAEAEA] px-1 py-1">
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold"><Bold size={13} /></button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic"><Italic size={13} /></button>
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading"><Heading2 size={13} /></button>
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list"><List size={13} /></button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Numbered list"><ListOrdered size={13} /></button>
        <button
          type="button"
          className={btn(editor.isActive('link'))}
          aria-label="Link"
          onClick={() => {
            // Select a pasted URL in the text and press this to make it a link; press again to remove it.
            const prev = editor.getAttributes('link').href as string | undefined;
            if (prev) editor.chain().focus().unsetLink().run();
            else {
              const { from, to } = editor.state.selection;
              const text = editor.state.doc.textBetween(from, to);
              if (/^(https?:\/\/|\/)/.test(text)) editor.chain().focus().setLink({ href: text }).run();
            }
          }}
          title="Select a URL in the text to turn it into a link, or click again to remove a link"
        >
          <Link2 size={13} />
        </button>
        <span className="flex-1" />
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().undo().run()} aria-label="Undo"><Undo2 size={13} /></button>
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().redo().run()} aria-label="Redo"><Redo2 size={13} /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
