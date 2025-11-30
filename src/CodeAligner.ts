export type Alignment = {
	line: number;
	col: number;
	width: number;
};

type AssignmentGroup = {
	maxAssignmentStartPos: number;
	alignments: {
		line: number;
		col: number;
	}[];
	prefix: string;
	identifier: string | undefined;
	groupEndMarker?: string;
	parent: AssignmentGroup | null;
};

type AssignmentMarkerDefinition =
	| {
			marker: string;
			mode: 'before' | 'after';
			identifier?: string;
	  }
	| {
			regex: RegExp;
			group: number;
			mode: 'before' | 'after';
			identifier?: string;
	  };

class CodeAligner {
	private lineCommentMarkers: string[];
	private assignmentMarkers: AssignmentMarkerDefinition[];
	private dontAdjustLineRegex: RegExp | null = null;
	private skipLinesRegex: RegExp | null = null;
	private recursiveGroupMarkers: { open: string; close: string }[] = [];

	public static readonly defaultLineCommentMarkers = ['//'];
	public static readonly defaultAssignmentMarkers = [
		{ marker: '=', mode: 'before' as const, identifier: '=' },
		{ marker: ':', mode: 'after' as const, identifier: ':' },
	];
	public static readonly defaultRecursiveGroupMarkers = [];

	constructor({
		lineCommentMarkers = CodeAligner.defaultLineCommentMarkers,
		assignmentMarkers = CodeAligner.defaultAssignmentMarkers,
		dontAdjustLineRegex = null,
		skipLinesRegex = null,
		recursiveGroupMarkers = CodeAligner.defaultRecursiveGroupMarkers,
	}: {
		/**
		 * Strings that indicate the start of a line comment
		 */
		lineCommentMarkers?: string[];
		/**
		 * Definitions for assignment markers, e.g. "=", ":"
		 */
		assignmentMarkers?: AssignmentMarkerDefinition[];
		/**
		 * Lines matching this regex will be analyzed like normal, but no adjustments will be made to it
		 */
		dontAdjustLineRegex?: RegExp | null;
		/**
		 * Lines matching this regex will be completely skipped from analysis
		 */
		skipLinesRegex?: RegExp | null;
		/**
		 * Pairs of strings that indicate the start and end of recursive groups
		 */
		recursiveGroupMarkers?: { open: string; close: string }[];
	} = {}) {
		this.lineCommentMarkers = lineCommentMarkers;
		this.assignmentMarkers = assignmentMarkers;
		this.dontAdjustLineRegex = dontAdjustLineRegex;
		this.skipLinesRegex = skipLinesRegex;
		this.recursiveGroupMarkers = recursiveGroupMarkers;
	}

	static getLinePrefix(line: string): string {
		const regex = /^(?<indent>\s*)(?:(?<firstWord>([^\s.]+\.)*)[^\s.]+)?/i;
		const match = line.match(regex);
		if (!match) {
			return '';
		}

		if (match.groups!['firstWord']) {
			return `${match.groups!['indent']}${match.groups!['firstWord']}`;
		}

		return match.groups!['indent'];
	}

	getAssignmentIndex(
		line: string,
	): { index: number; identifier: string | undefined } | null {
		let min = Number.POSITIVE_INFINITY;
		let identifier: string | undefined = undefined;

		this.assignmentMarkers.forEach((def) => {
			let index = 0;
			let ident: string | undefined = undefined;

			if ('marker' in def) {
				const { marker, mode, identifier: id } = def;
				index = line.indexOf(marker);
				if (index === -1) {
					return;
				}

				if (mode === 'after') {
					index += marker.length;
				}

				ident = id;
			} else {
				const { regex, group, mode, identifier: id } = def;
				const match = line.match(regex);
				if (!match || !match[group]) {
					return;
				}

				if (regex.flags.includes('d')) {
					index = match.indices![group][0];
				} else {
					index = line.indexOf(match[group]);
				}

				if (mode === 'after') {
					index += match[group].length;
				}

				ident = id;
			}

			if (index < min) {
				min = index;
				identifier = ident;
			}
		});

		if (min === Number.POSITIVE_INFINITY) {
			return null;
		}

		return { index: min, identifier: identifier };
	}

	getInlineCommentIndex(line: string): number | null {
		//TODO: Doesn't handle comments in strings
		const indices = this.lineCommentMarkers
			.map((marker) => line.indexOf(marker))
			.filter((index) => index !== -1);

		if (indices.length === 0) {
			return null;
		}

		return Math.min(...indices);
	}

	computeAlignments(input: string): Alignment[] {
		const lines = input.split('\n');

		let assignmentGroup: AssignmentGroup = {
			maxAssignmentStartPos: 0,
			alignments: [],
			prefix: '',
			identifier: undefined,
			parent: null,
		};
		const assignmentGroups: (typeof assignmentGroup)[] = [];

		let commentGroup = {
			maxCommentStartPos: 0,
			alignments: [] as { line: number; col: number }[],
		};
		const commentGroups: (typeof commentGroup)[] = [];

		function commitAssignment() {
			if (assignmentGroup.alignments.length > 0) {
				const parent = assignmentGroup.parent;
				const groupEndMarker = assignmentGroup.groupEndMarker;

				assignmentGroups.push(assignmentGroup);
				assignmentGroup = {
					maxAssignmentStartPos: 0,
					alignments: [],
					prefix: '',
					identifier: undefined,
					parent,
					groupEndMarker,
				};
			}
		}

		function commitComment() {
			if (commentGroup.alignments.length > 0) {
				commentGroups.push(commentGroup);
				commentGroup = {
					maxCommentStartPos: 0,
					alignments: [],
				};
			}
		}

		lines.forEach((line, lineNo) => {
			if (this.skipLinesRegex && this.skipLinesRegex.test(line)) {
				return;
			}

			if (line.trim() === '') {
				commitAssignment();
				commitComment();
				return;
			}

			if (
				!(
					this.dontAdjustLineRegex &&
					this.dontAdjustLineRegex.test(line)
				)
			) {
				const indent = CodeAligner.getLinePrefix(line);

				if (indent !== assignmentGroup.prefix) {
					commitAssignment();
					commitComment();
					assignmentGroup.prefix = indent;
				}

				const assignmentIndex = this.getAssignmentIndex(line);
				const inlineCommentIndex = this.getInlineCommentIndex(line);

				if (assignmentIndex === null) {
					commitAssignment();
				} else {
					if (
						assignmentGroup.identifier !==
						assignmentIndex.identifier
					) {
						commitAssignment();
						assignmentGroup.identifier = assignmentIndex.identifier;
					}
					if (
						assignmentIndex.index >
						assignmentGroup.maxAssignmentStartPos
					) {
						assignmentGroup.maxAssignmentStartPos =
							assignmentIndex.index;
					}

					assignmentGroup.alignments.push({
						line: lineNo,
						col: assignmentIndex.index,
					});
				}

				if (inlineCommentIndex === null) {
					commitComment();
				} else {
					if (inlineCommentIndex > commentGroup.maxCommentStartPos) {
						commentGroup.maxCommentStartPos = inlineCommentIndex;
					}

					commentGroup.alignments.push({
						line: lineNo,
						col: inlineCommentIndex,
					});
				}
			}

			this.recursiveGroupMarkers.forEach(({ open, close }) => {
				if (assignmentGroup.groupEndMarker) {
					if (line.includes(assignmentGroup.groupEndMarker)) {
						commitAssignment();
						assignmentGroup = assignmentGroup.parent!;
					}
				}
				if (line.includes(open)) {
					assignmentGroup = {
						maxAssignmentStartPos: 0,
						alignments: [],
						prefix: assignmentGroup.prefix,
						identifier: assignmentGroup.identifier,
						parent: assignmentGroup,
						groupEndMarker: close,
					};
				}
			});
		});

		commitAssignment();
		commitComment();

		const decorations: Alignment[] = [];

		assignmentGroups.forEach((group) => {
			group.alignments.forEach(({ line, col }) => {
				const spacesToAdd = group.maxAssignmentStartPos - col;

				if (spacesToAdd < 0) {
					throw new Error(
						'Negative spaces to add, this should not happen',
					);
				}

				if (spacesToAdd === 0) {
					return;
				}

				decorations.push({ line, col, width: spacesToAdd });
			});
		});

		commentGroups.forEach((group) => {
			group.alignments.forEach(({ line, col }) => {
				const spacesToAdd = group.maxCommentStartPos - col;

				if (spacesToAdd < 0) {
					throw new Error(
						'Negative spaces to add, this should not happen',
					);
				}

				if (spacesToAdd === 0) {
					return;
				}

				decorations.push({ line, col, width: spacesToAdd });
			});
		});

		return decorations;
	}

	applyAlignmentsAsSpaces(input: string, alignments: Alignment[]): string {
		const lines = input.split('\n');

		const newLines = lines.map((line, index) => {
			const lineDecorations = alignments.filter(
				(dec) => dec.line === index,
			);

			if (lineDecorations.length === 0) {
				return line;
			}

			//sort left to right
			lineDecorations.sort((a, b) => a.col - b.col);

			let totalOffset = 0;
			lineDecorations.forEach((decoration) => {
				// remove offset caused by prior decorations
				decoration.width -= totalOffset;

				// account for this decoration's width in future decorations
				totalOffset += decoration.width;
			});

			lineDecorations.reverse();

			let end = line.length;
			let parts: string[] = [];
			for (const decoration of lineDecorations) {
				if (decoration.col > end) {
					throw new Error(
						'Decoration column is after end of line, this should not happen',
					);
				}

				if (decoration.col === end) {
					continue;
				}

				const segment = line.substring(decoration.col, end);
				parts.unshift(segment);

				const spaces = ' '.repeat(decoration.width);
				parts.unshift(spaces);

				end = decoration.col;
			}
			const firstSegment = line.substring(0, end);
			parts.unshift(firstSegment);

			return parts.join('');
		});

		return newLines.join('\n');
	}
}

export default CodeAligner;
