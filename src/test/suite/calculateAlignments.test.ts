import * as assert from 'assert';
import { calculateAlignments } from '../../calculateAlignments';
import { RegexRule } from '../../RegexRule';
import { RuleSet } from '../../RuleSet';

suite('calculateAlignments', () => {
	const rules: RuleSet = {
		rules: [
			new RegexRule('assignment', 1, { regex: /^(.*(?==))/, type: 'assignment', repeatable: false }),
			new RegexRule('property', 1, { regex: /^(.*(?=:))/, type: 'column', repeatable: false }),
		],
	};

	test('Calculate alignments', () => {
		const input = `\
const short = 1;
const long = 1;
const shortest = 1;
`;

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

	test('Allow skipping lines', () => {
		const input = `\
const short = 1;
const long = 1;

const shortest = 1;
`;

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

	test("don't skip too many lines", () => {
		const input = `\
const short = 1;
const long = 1;


const shortest = 1;
`;

		const alignments = calculateAlignments(input, rules);

		assert.deepStrictEqual(alignments, [
			{
				lineNumber: 1,
				adjustments: [{ column: 11, width: 1 }],
			},
		]);
	});

	test('Align groups separately', () => {
		const input = `\
const short = 1
const long = 1;
const foo: 1;
const fo: 1;
`;

		const alignments = calculateAlignments(input, rules);

		assert.deepStrictEqual(alignments, [
			{
				lineNumber: 1,
				adjustments: [{ column: 11, width: 1 }],
			},
			{
				lineNumber: 3,
				adjustments: [{ column: 8, width: 1 }],
			},
		]);
	});

	test('Align interleaved groups separately', () => {
		const input = `\
const short = 1
const foo: 1;
const long = 1;
const fo: 1;
`;

		const alignments = calculateAlignments(input, rules);

		assert.deepStrictEqual(alignments, [
			{
				lineNumber: 2,
				adjustments: [{ column: 11, width: 1 }],
			},
			{
				lineNumber: 3,
				adjustments: [{ column: 8, width: 1 }],
			},
		]);
	});
});
