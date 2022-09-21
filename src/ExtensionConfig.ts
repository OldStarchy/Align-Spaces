import * as vscode from 'vscode';

export interface ExtensionConfig extends vscode.WorkspaceConfiguration {
	'allowed-language-ids': string[] | null;
	'disallowed-language-ids': string[] | null;
	delay: number | 'off';
	'default-enabled': boolean;
}
