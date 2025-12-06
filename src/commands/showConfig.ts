import * as vscode from 'vscode';
import Config from '../Config';
import { ExtensionSlug } from '../const';

export const showConfigKey = `${ExtensionSlug}.showConfig`;

export function showConfig(editor: vscode.TextEditor) {
	const configs = Config.load(editor.document);
	const config = vscode.workspace.getConfiguration(
		'alignSpaces',
		editor.document,
	);
	const content = JSON.stringify(config, null, '\t');

	const outputChannel = vscode.window.createOutputChannel(
		'Code Aligner Config',
	);
	outputChannel.clear();
	outputChannel.appendLine('Current Code Aligner Configuration:');
	outputChannel.appendLine(content);
	outputChannel.show(true);
}
