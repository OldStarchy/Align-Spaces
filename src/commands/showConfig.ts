import * as vscode from 'vscode';
import Config from '../Config';
import { ExtensionSlug } from '../const';
import { outputChannel } from '../outputChannel';

export const showConfigKey = `${ExtensionSlug}.showConfig`;

export function showConfig(editor: vscode.TextEditor) {
	const config = Config.getScoped(editor.document);
	// const config = vscode.workspace.getConfiguration(
	// 	'align-spaces',
	// 	editor.document,
	// );
	const content = JSON.stringify(config, null, '\t');

	outputChannel.clear();
	outputChannel.appendLine('Current Code Aligner Configuration:');
	outputChannel.appendLine(content);
	outputChannel.show(true);
}
