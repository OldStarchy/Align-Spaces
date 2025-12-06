import * as vscode from 'vscode';
import CodeAligner from '../CodeAligner';
import { showConfig, showConfigKey } from '../commands/showConfig';
import Config from '../Config';

const decoratorCache = new (class
	implements vscode.Disposable, Iterable<vscode.TextEditorDecorationType>
{
	[Symbol.iterator](): Iterator<vscode.TextEditorDecorationType, any, any> {
		return this.cache.values();
	}

	cache = new Map<string, vscode.TextEditorDecorationType>();
	get(width: number, side: 'before' | 'after') {
		if (!this.cache.has(`${width}-${side}`)) {
			this.cache.set(
				`${width}-${side}`,
				vscode.window.createTextEditorDecorationType({
					[side === 'after' ? 'before' : 'after']: {
						contentText: ' ',
						width: `${width}ch`,
					},
				}),
			);
		}

		return this.cache.get(`${width}-${side}`)!;
	}

	dispose() {
		for (const [, decorator] of this.cache) {
			decorator.dispose();
		}
	}
})();

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(decoratorCache);

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(showConfigKey, showConfig),
	);

	function decorateEditor(editor: vscode.TextEditor) {
		const aligner = new CodeAligner(Config.load(editor.document));
		const decorations = new Map<
			vscode.TextEditorDecorationType,
			vscode.Range[]
		>();
		const text = editor.document.getText();

		const alignments = aligner.computeAlignments(text);

		for (const alignment of alignments) {
			let decorationType: vscode.TextEditorDecorationType;
			let range: vscode.Range;

			if (alignment.attach === 'before') {
				decorationType = decoratorCache.get(alignment.width, 'after');
				range = new vscode.Range(
					alignment.line,
					alignment.insertBeforeCol,
					alignment.line,
					alignment.insertBeforeCol + 1,
				);
			} else {
				decorationType = decoratorCache.get(alignment.width, 'before');
				range = new vscode.Range(
					alignment.line,
					alignment.insertBeforeCol - 1,
					alignment.line,
					alignment.insertBeforeCol,
				);
			}

			if (!decorations.has(decorationType)) {
				decorations.set(decorationType, []);
			}

			decorations.get(decorationType)!.push(range);
		}

		for (const [key, ranges] of decorations) {
			editor.setDecorations(key, ranges);
		}

		for (const decorator of decoratorCache) {
			if (!decorations.has(decorator)) {
				editor.setDecorations(decorator, []);
			}
		}
	}
	const didChange = vscode.window.onDidChangeVisibleTextEditors((editors) => {
		for (const editor of editors) {
			decorateEditor(editor);
		}
	});

	const didEdit = vscode.workspace.onDidChangeTextDocument((e) => {
		const editor = vscode.window.visibleTextEditors.find(
			(ed) => ed.document.uri.toString() === e.document.uri.toString(),
		);
		if (editor) {
			decorateEditor(editor);
		}
	});

	context.subscriptions.push(didChange);
	context.subscriptions.push(didEdit);

	vscode.window.visibleTextEditors.forEach(decorateEditor);
}

// This method is called when your extension is deactivated
export function deactivate() {}
