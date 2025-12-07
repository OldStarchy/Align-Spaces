import * as vscode from 'vscode';
import CodeAligner from '../CodeAligner';
import Config from '../Config';
import { decoratorCache } from './decoratorCache';

export function decorateEditor(editor: vscode.TextEditor) {
	const config = Config.getScoped(editor.document);

	const aligner = new CodeAligner(config.alignerConfig);
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
