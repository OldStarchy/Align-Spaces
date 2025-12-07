import * as vscode from 'vscode';
import { decoratorCache } from './web/decoratorCache';

export function clearDecorations(editor: vscode.TextEditor) {
	for (const decorator of decoratorCache) {
		editor.setDecorations(decorator, []);
	}
}
