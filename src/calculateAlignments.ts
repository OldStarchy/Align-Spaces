import { Alignment } from './Alignment';
import { LazyIterator } from './LazyIterator';
import { RuleSet } from './RuleSet';
import { Split } from './Split';

export function calculateAlignments(input: string, rules: RuleSet): Alignment[] {
	const rows = input.split('\n');

	const nullMatcher = {
		match: () => [],
		allowedSkips: 0,
	};

	const rowSplits = rows.map(
		(row) =>
			new LazyIterator([...rules.rules, nullMatcher])
				.map((rule) => {
					const splits = rule.match(row);

					if (splits) {
						return { row, splits, allowedSkips: rule.allowedSkips };
					}

					return null;
				})
				.find((splits) => splits !== null)!
	);

	const groups = rowSplits
		.reduce((groups, rowData, lineNumber) => {
			const { splits, row, allowedSkips } = rowData;

			if (groups.length > 0) {
				for (let i = 0; i <= allowedSkips && i < groups.length; i++) {
					const previousGroup = groups[groups.length - 1 - i];

					if (previousGroup[previousGroup.length - 1].lineNumber < lineNumber - allowedSkips - 1) {
						break;
					}

					if (previousGroup[0].splits.length === splits.length) {
						if (previousGroup[0].splits.every((split, i) => split.type === splits[i].type)) {
							previousGroup.push({ splits, lineNumber, row });

							return groups;
						}
					}
				}
			}

			groups.push([{ splits, lineNumber, row }]);

			return groups;
		}, [] as { lineNumber: number; row: string; splits: Split[] }[][])
		.filter((group) => group.length > 1);

	const alignments = groups.flatMap((group) => {
		const columnWidths = group[0].splits.map((_, i) =>
			group.map(({ splits }) => splits[i].width).reduce((max, width) => Math.max(max, width), 0)
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
	});

	return alignments;
}
