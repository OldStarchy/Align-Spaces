import * as vscode from 'vscode';
import { ExtensionConfig, EXTENSION_ID } from './extension';

export const config: {
	current: ExtensionConfig;
} = {
	current: vscode.workspace.getConfiguration(EXTENSION_ID) as ExtensionConfig,
};

export function loadConfig() {
	config.current = vscode.workspace.getConfiguration(
		EXTENSION_ID
	) as ExtensionConfig;

	for (const setting of ['allowed-language-ids', 'disallowed-language-ids']) {
		if (config.current[setting] !== null) {
			if (
				!(config.current[setting] instanceof Array) ||
				config.current[setting].some((t: any) => typeof t !== 'string')
			) {
				(config.current as any)[setting] = null;
				console.warn(`Invalid "${setting}" setting`);
			}
		}
	}

	if (config.current.delay !== 'off') {
		if (typeof config.current.delay !== 'number') {
			config.current.delay = 'off';
		}
	}
}
