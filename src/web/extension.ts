import * as vscode from 'vscode';
import { clearDecorations } from '../clearDecorations';
import { showConfig, showConfigKey } from '../commands/showConfig';
import {
	toggleCurrentDocument,
	toggleCurrentDocumentKey,
} from '../commands/toggleCurrentDocument';
import Config from '../Config';
import { decorateEditor } from './decorateEditor';
import { decorateEditorDebounced } from './decorateEditorDebounced';
import { decoratorCache } from './decoratorCache';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(decoratorCache);

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(showConfigKey, showConfig),
	);
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			toggleCurrentDocumentKey,
			toggleCurrentDocument,
		),
	);

	const didChangeEditor = vscode.window.onDidChangeVisibleTextEditors(
		(editors) => {
			for (const editor of editors) {
				decorateEditor(editor);
			}
		},
	);

	const didEdit = vscode.workspace.onDidChangeTextDocument((e) => {
		const editor = vscode.window.visibleTextEditors.find(
			(ed) => ed.document.uri.toString() === e.document.uri.toString(),
		);
		if (editor) {
			if (!Config.getEnabledForEditor(editor)) {
				clearDecorations(editor);
				return;
			}

			decorateEditorDebounced(editor);
		}
	});

	const didChangeConfig = vscode.workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration('align-spaces')) {
			for (const editor of vscode.window.visibleTextEditors) {
				decorateEditor(editor);
			}
		}
	});

	context.subscriptions.push(didChangeEditor);
	context.subscriptions.push(didEdit);
	context.subscriptions.push(didChangeConfig);

	vscode.window.visibleTextEditors.forEach(decorateEditor);
}

// This method is called when your extension is deactivated
export function deactivate() {}
