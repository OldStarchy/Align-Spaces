import * as assert from 'assert';
import { applyAlignments } from '../../applyAlignments';
import { calculateAlignments } from '../../calculateAlignments';
import { getRulesForLanguage } from '../../getRulesForLanguage';

suite('Typescript RuleSet', async () => {
	const rules = await getRulesForLanguage('typescript');

	test('Align assignments', () => {
		const input = `\
const short = 1;
const long = 1;

const shortest = 1;


const long = 1;
const short = 1;
const medium = 1;
`;

		const expected = `\
const short    = 1;
const long     = 1;

const shortest = 1;


const long   = 1;
const short  = 1;
const medium = 1;
`;

		const alignments = calculateAlignments(input, rules);
		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
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

	test('Match multiple rules', () => {
		const input = `\
const short = 1;
const long = 1;
const shortest = 1;


const bar = {
	foo: 1,
	foobar: 1,
};
`;

		const expected = `\
const short    = 1;
const long     = 1;
const shortest = 1;


const bar = {
	foo   : 1,
	foobar: 1,
};
`;

		const alignments = calculateAlignments(input, rules);
		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
	});

	test('Interleaved groups', () => {
		const input = `\
const short = 1;
a: 1;
const long = 1;
aaaa: 1;
const shortest = 1;
aaa: 1;
`;

		const expected = `\
const short    = 1;
a   : 1;
const long     = 1;
aaaa: 1;
const shortest = 1;
aaa : 1;
`;

		const alignments = calculateAlignments(input, rules);
		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
	});

	const readmeContent: Record<string, [string, string]> = {
		'Align operators': [
			`\
foo = bar;
foobar = baz;


foo = foo + bar;
foobar = foobar - baz;
`,
			`\
foo    = bar;
foobar = baz;


foo    = foo    + bar;
foobar = foobar - baz;
`,
		],

		'Ignores content in strings': [
			`\
foo = {
	foo: 'foobar foobar',
	foo: 'foo, bar',
	foo: '\'foo\', "", bar',
};
`,
			`\
foo = {
	foo: 'foobar foobar',
	foo: 'foo, bar',
	foo: '\'foo\', "", bar',
}
`,
		],
		"Knows the difference between assignment, 'binary', and comparison": [
			`\
foo = bar;
foobar = baz;
if (foobar === bar) {
	bar = fizzbuzz;
}
`,
			`\
foo    = bar;
foobar = baz;
if (foobar === bar) {
	bar = fizzbuzz;
}
`,
		],
		'Groups object assignments': [
			`\
foo = new Foo();
foo.foo = bar;
foo.foobar = baz;

bar = new Bar();
bar.foobar = 'foobar';
bar.baz = foo;

foo.bar = bar;
`,
			`\
foo = new Foo();
foo.foo    = bar;
foo.foobar = baz;

bar = new Bar();
bar.foobar = 'foobar';
bar.baz    = foo;

foo.bar = bar;
`,
		],
		"Ignores 'unary' operators (those that don't have a space after)": [
			`\
const dx = x * cos(theta) + -y * sin(theta);
const dy = x * sin(theta) + y * cos(theta);
`,
			`\
const dx = x * cos(theta) + -y * sin(theta);
const dy = x * sin(theta) + y  * cos(theta);
`,
		],
		'Does alright with commas': [
			`\
const matrix = [
	100, 50, 0,
	0, 1, 0,
	2000, 300, 64,
];
`,
			`\
const matrix = [
	100 , 50 , 0,
	0   , 1  , 0,
	2000, 300, 64,
];
`,
		],
	};

	for (const [label, [input, expected]] of Object.entries(readmeContent)) {
		test(label, () => {
			const alignments = calculateAlignments(input, rules);
			const output = applyAlignments(input, alignments);

			assert.equal(output, expected);
		});
	}
});
