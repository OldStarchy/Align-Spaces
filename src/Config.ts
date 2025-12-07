import * as vscode from 'vscode';
import { CodeAlignerConfig } from './CodeAligner';
import { ExtensionSlug } from './const';

type RegExConfig = string | { pattern: string; flags?: string };
const RegExConfig = {
	into(config: RegExConfig): RegExp {
		if (typeof config === 'string') {
			return new RegExp(config);
		} else {
			return new RegExp(config.pattern, config.flags);
		}
	},
};

type ScopedConfig = {
	lineCommentMarkers?: string[];
	assignmentMarkers?: (
		| {
				marker: string;
				mode: 'before' | 'after';
				identifier?: string;
		  }
		| {
				regex: RegExConfig;
				group?: number;
				mode: 'before' | 'after';
				identifier?: string;
		  }
	)[];
	dontAdjustLineRegex?: RegExConfig | null;
	skipLinesRegex?: RegExConfig | null;
	recursiveGroupMarkers?: { open: string; close: string }[];

	enabled?: boolean;
};

type UnscopedConfig = {
	realignDelayMs?: number;
};

type PerEditorSessionConfig = {
	enabled: boolean;
};

const READ = Symbol('Config.delete');
class Config {
	static sessionConfigStore = new WeakMap<
		vscode.TextEditor,
		Partial<PerEditorSessionConfig>
	>();

	static getEnabledForEditor(editor: vscode.TextEditor) {
		if (!Config.sessionConfigStore.has(editor)) {
			return Config.getScoped(editor.document).enabled;
		} else {
			return Config.sessionConfigStore.get(editor)?.enabled ?? false;
		}
	}
	static getUnscoped(): UnscopedConfig {
		const config = vscode.workspace.getConfiguration(ExtensionSlug);

		return {
			realignDelayMs: config.realignDelayMs ?? 500,
		};
	}

	static getScoped(scope?: vscode.ConfigurationScope): {
		enabled: boolean;
		alignerConfig: CodeAlignerConfig;
	} {
		const config = vscode.workspace.getConfiguration(
			ExtensionSlug,
			scope,
		) as ScopedConfig;

		return {
			enabled: config.enabled ?? true,
			alignerConfig: {
				lineCommentMarkers: config.lineCommentMarkers || [],
				assignmentMarkers: (config.assignmentMarkers || []).map(
					(marker) => {
						if ('marker' in marker) {
							return {
								marker: marker.marker,
								mode: marker.mode,
								identifier: marker.identifier,
							};
						} else {
							return {
								regex: RegExConfig.into(marker.regex),
								group: marker.group,
								mode: marker.mode,
								identifier: marker.identifier,
							};
						}
					},
				),
				dontAdjustLineRegex: config.dontAdjustLineRegex
					? RegExConfig.into(config.dontAdjustLineRegex)
					: null,
				skipLinesRegex: config.skipLinesRegex
					? RegExConfig.into(config.skipLinesRegex)
					: null,
				recursiveGroupMarkers: config.recursiveGroupMarkers || [],
			},
		};
	}
}

export default Config;
