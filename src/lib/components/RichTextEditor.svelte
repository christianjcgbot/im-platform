<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';

	let { name, value = '' }: { name: string; value?: string } = $props();

	let editorEl: HTMLDivElement;
	let editor: Editor | null = null;
	let html = $state(value);
	let isBold = $state(false);
	let isItalic = $state(false);
	let isBullet = $state(false);
	let isOrdered = $state(false);
	let isH2 = $state(false);
	let isH3 = $state(false);

	function syncStates(ed: Editor) {
		isBold = ed.isActive('bold');
		isItalic = ed.isActive('italic');
		isBullet = ed.isActive('bulletList');
		isOrdered = ed.isActive('orderedList');
		isH2 = ed.isActive('heading', { level: 2 });
		isH3 = ed.isActive('heading', { level: 3 });
	}

	onMount(() => {
		editor = new Editor({
			element: editorEl,
			extensions: [StarterKit],
			content: value,
			onUpdate: ({ editor: ed }) => { html = ed.getHTML(); syncStates(ed); },
			onSelectionUpdate: ({ editor: ed }) => { syncStates(ed); }
		});
		return () => editor?.destroy();
	});
</script>

<div class="rte">
	<div class="rte-toolbar">
		<button type="button" class:active={isBold} onclick={() => editor?.chain().focus().toggleBold().run()} title="Negrita"><b>B</b></button>
		<button type="button" class:active={isItalic} onclick={() => editor?.chain().focus().toggleItalic().run()} title="Cursiva"><i>I</i></button>
		<span class="rte-sep"></span>
		<button type="button" class:active={isH2} onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">H2</button>
		<button type="button" class:active={isH3} onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">H3</button>
		<span class="rte-sep"></span>
		<button type="button" class:active={isBullet} onclick={() => editor?.chain().focus().toggleBulletList().run()} title="Lista con viñetas">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
		</button>
		<button type="button" class:active={isOrdered} onclick={() => editor?.chain().focus().toggleOrderedList().run()} title="Lista numerada">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
		</button>
	</div>
	<div bind:this={editorEl} class="rte-content"></div>
	<input type="hidden" {name} value={html} />
</div>

<style>
.rte { border:1px solid var(--border); border-radius:6px; overflow:hidden; }
.rte-toolbar { display:flex; align-items:center; gap:2px; padding:6px 8px; border-bottom:1px solid var(--border); background:var(--bg); flex-wrap:wrap; }
.rte-toolbar button { background:none; border:none; cursor:pointer; padding:4px 8px; border-radius:4px; font-size:13px; color:var(--text); line-height:1; display:flex; align-items:center; justify-content:center; }
.rte-toolbar button:hover { background:var(--border); }
.rte-toolbar button.active { background:var(--navy); color:#fff; }
.rte-sep { width:1px; height:16px; background:var(--border); margin:0 4px; flex-shrink:0; }
.rte-content { padding:12px; min-height:140px; outline:none; font-size:14px; line-height:1.6; }
.rte-content :global(.ProseMirror) { outline:none; min-height:120px; }
.rte-content :global(.ProseMirror p) { margin:0 0 8px; }
.rte-content :global(.ProseMirror p:last-child) { margin-bottom:0; }
.rte-content :global(.ProseMirror h2) { font-size:16px; font-weight:600; margin:12px 0 6px; }
.rte-content :global(.ProseMirror h3) { font-size:14px; font-weight:600; margin:10px 0 4px; }
.rte-content :global(.ProseMirror ul), .rte-content :global(.ProseMirror ol) { padding-left:20px; margin:6px 0; }
.rte-content :global(.ProseMirror li) { margin-bottom:4px; }
.rte-content :global(.ProseMirror p.is-editor-empty:first-child::before) { content:attr(data-placeholder); color:var(--muted); pointer-events:none; float:left; height:0; }
</style>
