import * as assert from 'assert';
import { applyAlignments } from '../../applyAlignments';

suite('applyAlignments', () => {
	test('Apply alignments', async () => {
		const input = `\
const short = 1;
const long = 1;
`;

		const expected = `\
const short = 1;
const long  = 1;
`;

		const alignments = [
			{
				lineNumber: 1,
				adjustments: [{ column: 11, width: 1 }],
			},
		];

		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
	});
});
