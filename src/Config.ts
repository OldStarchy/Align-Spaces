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

type ExtensionConfig = {
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
};

const Config = {
	load(scope?: vscode.ConfigurationScope): CodeAlignerConfig {
		const config = vscode.workspace.getConfiguration(
			ExtensionSlug,
			scope,
		) as ExtensionConfig;

		return {
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
		};
	},
};

export default Config;
