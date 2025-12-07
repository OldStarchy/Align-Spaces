import * as vscode from 'vscode';
import Config from '../Config';
import { decorateEditor } from './decorateEditor';

let timeouts = new Map<vscode.TextEditor, number | null>();
export function decorateEditorDebounced(editor: vscode.TextEditor) {
	if (timeouts.has(editor) && timeouts.get(editor) !== null) {
		clearTimeout(timeouts.get(editor)!);
	}
	const config = Config.getUnscoped();
	if (config.realignDelayMs === 0) {
		decorateEditor(editor);
		return;
	}

	timeouts.set(
		editor,
		setTimeout(() => {
			timeouts.delete(editor);

			if (!vscode.window.visibleTextEditors.includes(editor)) {
				return;
			}

			decorateEditor(editor);
		}, config.realignDelayMs),
	);
}
