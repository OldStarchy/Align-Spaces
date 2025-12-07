import * as vscode from 'vscode';
import { clearDecorations } from '../clearDecorations';
import Config from '../Config';
import { ExtensionSlug } from '../const';
import { decorateEditor } from '../web/decorateEditor';

export const toggleCurrentDocumentKey = `${ExtensionSlug}.toggleCurrentDocument`;

export function toggleCurrentDocument(editor: vscode.TextEditor) {
	const enabled = !Config.getEnabledForEditor(editor);

	Config.sessionConfigStore.set(editor, { enabled });

	if (enabled) {
		decorateEditor(editor);
	} else {
		clearDecorations(editor);
	}
}
