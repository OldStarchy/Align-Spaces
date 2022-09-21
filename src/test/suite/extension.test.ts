import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import {getDecorationsFor} from '../../extension';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	const tests = {
		'aligns operators': {
			input: `
const foo = 1;
const foobar = 3;

foo = foo + bar;
foobar = foobar - baz;
`,
			expected: `
const foo    = 1;
const foobar = 3;

foo    = foo    + bar;
foobar = foobar - baz;
`,
		},
		'ignores content in strings': {
			input: `
foo = {
	foo: 'foobar foobar foobar',
	foo: 'foo, bar',
	foo: '\'foo\', "", bar',
};
`,
			expected: `
foo = {
	foo: 'foobar foobar foobar',
	foo: 'foo, bar',
	foo: '\'foo\', "", bar',
};
`,
		},
		'groups different types of operators': {
			input: `
foo = bar;
foobar = baz;
if (foobar === bar) {
	bar = fizzbuzz;
}
`,
			expected: `
foo    = bar;
foobar = baz;
if (foobar === bar) {
	bar = fizzbuzz;
}
`,
		},
		'groups object assignments': {
			input: `
foo = new Foo();
foo.foo = bar;
foo.foobar = baz;

bar = new Bar();
bar.foobar = 'foobar';
bar.baz = foo;

foo.bar = bar;
`,
			expected: `
foo = new Foo();
foo.foo    = bar;
foo.foobar = baz;

bar = new Bar();
bar.foobar = 'foobar';
bar.baz    = foo;

foo.bar = bar;
`,
		},
		'ignores unary operators': {
			input: `
const dx = x * cos(theta) + -y * sin(theta);
const dy = x * sin(theta) + y * cos(theta);
`,
			expected: `
const dx = x * cos(theta) + -y * sin(theta);
const dy = x * sin(theta) + y  * cos(theta);
`
		},
		'commas are aligned': {
			input: `
const matrix = [
	100, 50, 0,
	0, 1, 0,
	2000, 300, 64,
];
`,
			expected: `
const matrix = [
	100 , 50 , 0,
	0   , 1  , 0,
	2000, 300, 64,
];
`,
		}
	};

	for (const name in tests) {
		const {input, expected} = tests[name as keyof typeof tests];

		test(name, () => {
			const decorations = getDecorationsFor(input);

			const actual = decorations.applyAsSpaces(input);

			assert.strictEqual(actual, expected);
		});
	}
});
