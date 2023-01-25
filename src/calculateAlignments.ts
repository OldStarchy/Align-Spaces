import { Alignment } from './Alignment';
import { LazyIterator } from './LazyIterator';
import { Rule } from './Rule';
import { RuleSet } from './RuleSet';
import { Split } from './Split';

const nullMatcher = {
	match: () => [],
	allowedSkips: 0,
};

export function calculateAlignments(input: string, rules: RuleSet): Alignment[] {
	const lines = input.split('\n');

	const rulesIterator = new LazyIterator([...rules.rules, nullMatcher]);

	const lineSplits = lines.map((line) => findColumnsForLine(line, rulesIterator));

	const groups = combineColumnsIntoGroups(lineSplits);

	const alignments = groups.flatMap(calculateAlignmentsForGroup);

	return alignments;
}

type LineData = {
	splits: Split[];
	allowedSkips: number;
};

type Group = {
	lineNumber: number;
	splits: Split[];
}[];

function findColumnsForLine(line: string, rules: LazyIterator<Rule>): LineData {
	return rules
		.map((rule) => {
			const splits = rule.match(line);

			if (splits) {
				return { line, splits, allowedSkips: rule.allowedSkips };
			}

			return null;
		})
		.find((splits) => splits !== null)!;
}

function combineColumnsIntoGroups(lines: LineData[]): Group[] {
	const groups: Group[] = [];

	for (const [lineNumber, lineData] of lines.entries()) {
		const { splits } = lineData;

		const compatiblePreviousGroup = findCompatibleGroup(groups, lineNumber, lineData);
		if (compatiblePreviousGroup) {
			compatiblePreviousGroup.push({ splits, lineNumber });
		} else {
			groups.push([{ splits, lineNumber }]);
		}
	}

	return groups.filter((group) => group.length > 1);
}

function findCompatibleGroup(groups: Group[], lineNumber: number, { allowedSkips, splits }: LineData): Group | null {
	if (groups.length === 0) {
		return null;
	}

	for (let i = groups.length - 1; i >= 0; i--) {
		const previousGroup = groups[i];

		const distanceToPreviousGroup = lineNumber - previousGroup[previousGroup.length - 1].lineNumber - 1;

		if (distanceToPreviousGroup > allowedSkips) {
			break;
		}

		if (areSplitsCompatible(previousGroup[0].splits, splits)) {
			return previousGroup;
		}
	}

	return null;
}

function areSplitsCompatible(a: Split[], b: Split[]): boolean {
	if (a.length !== b.length) {
		return false;
	}

	return a.every((split, i) => split.type === b[i].type);
}

function calculateAlignmentsForGroup(group: Group) {
	const columnWidths = group[0].splits.map((_, columnIndex) =>
		group.map(({ splits }) => splits[columnIndex].width).reduce((max, width) => Math.max(max, width), 0)
	);

	return group
		.map(
			({ lineNumber, splits }): Alignment => ({
				adjustments: splits
					.map((split, i) => ({
						column: split.column,
						width: columnWidths[i] - split.width,
					}))
					.filter((adjustment) => adjustment.width > 0),
				lineNumber,
			})
		)
		.filter((alignment) => alignment.adjustments.length > 0);
}
