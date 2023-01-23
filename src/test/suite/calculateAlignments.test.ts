import * as assert from 'assert';
import { calculateAlignments } from '../../calculateAlignments';
import { getRulesForLanguage } from '../../getRulesForLanguage';

suite('calculateAlignments', () => {
	test('Calculate alignments', async () => {
		const input = `\
const short = 1;
const long = 1;
const shortest = 1;
`;

		const rules = await getRulesForLanguage('typescript');

		const alignments = calculateAlignments(input, rules);

		assert.deepStrictEqual(alignments, [
			{
				lineNumber: 0,
				adjustments: [{ column: 12, width: 3 }],
			},
			{
				lineNumber: 1,
				adjustments: [{ column: 11, width: 4 }],
			},
		]);
	});

	test('Allow skipping lines', async () => {
		const input = `\
const short = 1;
const long = 1;

const shortest = 1;
`;

		const rules = await getRulesForLanguage('typescript');

		const alignments = calculateAlignments(input, rules);

		assert.deepStrictEqual(alignments, [
			{
				lineNumber: 0,
				adjustments: [{ column: 12, width: 3 }],
			},
			{
				lineNumber: 1,
				adjustments: [{ column: 11, width: 4 }],
			},
		]);
	});
});
