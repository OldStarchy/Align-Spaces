import { Alignment } from './Alignment';

export function applyAlignments(input: string, alignments: Alignment[]): string {
	const rows = input.split('\n');

	const rowsWithAlignments = rows.map((row, i) => {
		const alignment = alignments.find((alignment) => alignment.lineNumber === i);

		if (!alignment) {
			return row;
		}

		return applyAlignmentsToLine(row, alignment.adjustments);
	});

	return rowsWithAlignments.join('\n');
}

function applyAlignmentsToLine(line: string, adjustments: Alignment['adjustments']): string {
	return adjustments.reduce((row, adjustment) => {
		const { column, width } = adjustment;

		const left = row.slice(0, column);
		const right = row.slice(column);

		return left + ' '.repeat(width) + right;
	}, line);
}
