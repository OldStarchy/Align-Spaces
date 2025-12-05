import * as assert from 'assert';
import CodeAligner, { Alignment } from './CodeAligner';

function performAlignment(input: string): string {
	const codeAligner = new CodeAligner();

	const alignments = codeAligner.computeAlignments(input);

	return CodeAligner.applyAlignmentsAsSpaces(input, alignments);
}

function debugPrint(input: string): string {
	const codeAligner = new CodeAligner();

	const alignments = codeAligner.computeAlignments(input);

	const out = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

	return CodeAligner.debugPrintAlignments(out, alignments);
}

suite('Alignment', () => {
	test('CodeAligner constructs without error', () => {
		new CodeAligner();
	});

	test('create correct alignment for postfix', () => {
		const input = `\
const foo = 1;
const foobar = 2;
`;

		const expected: Alignment[] = [
			{ line: 0, insertBeforeCol: 10, width: 3, attach: 'after' },
		];

		const aligner = new CodeAligner();
		const output = aligner.computeAlignments(input);

		assert.deepStrictEqual(output, expected);
	});

	test('create correct alignment for prefix', () => {
		const input = `\
const foo: 1;
const foobar: 2;
`;

		const expected: Alignment[] = [
			{ line: 0, insertBeforeCol: 10, width: 3, attach: 'before' },
		];

		const aligner = new CodeAligner();
		const output = aligner.computeAlignments(input);

		assert.deepStrictEqual(output, expected);
	});

	test('Align assignments', () => {
		const input = `\
const foo = 1;
const foobar = 2;
`;

		const expected = `\
const foo    = 1;
const foobar = 2;
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Align assignments to the left', () => {
		const input = `\
const foo = 1;
const foobar = 2;`;

		const expected = `\
const foo    = 1;
          <<<|
const foobar = 2;
`;

		const output = debugPrint(input);

		assert.strictEqual(output, expected);
	});

	test("Doesn't align when lines are separated by a line", () => {
		const input = `\
const foo = 1;

const foobar = 2;
`;

		const expected = `\
const foo = 1;

const foobar = 2;
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Align multiple groups of assignments', () => {
		const input = `\
const foo = 1;
const foobar = 2;

let a = 10;
let bcd = 20;
`;

		const expected = `\
const foo    = 1;
const foobar = 2;

let a   = 10;
let bcd = 20;
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Groups by indentation', () => {
		const input = `\
const foo = 1;
const foobar = 2;
	const foo = 1;
	const foobar = 2;
`;

		const expected = `\
const foo    = 1;
const foobar = 2;
	const foo    = 1;
	const foobar = 2;
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Reads object group prefixes properly', () => {
		const input = [
			'const foo = {};',
			'	const foo = {};',
			'foo.foo = 1;',
			'foo.foobar = 2;',
			'foo.bar.foo = 3;',
			'foo.bar.foobar = 4;',
			'	bar.foo = 10;',
			'	bar.foobar = 20;',
		];
		const expected = [
			'',
			'	',
			'foo.',
			'foo.',
			'foo.bar.',
			'foo.bar.',
			'	bar.',
			'	bar.',
		];

		input.forEach((line, index) => {
			const prefix = CodeAligner.getLinePrefix(line);

			assert.strictEqual(prefix, expected[index]);
		});
	});

	test('Groups by object group', () => {
		const input = `\
const foo = {};
foo.foo = 1;
foo.foobar = 2;
const bar = {};
bar.foo = 10;
bar.foobar = 20;
bar.foo.foo = 30;
bar.foo.foobar = 40;
	`;
		const expected = `\
const foo = {};
foo.foo    = 1;
foo.foobar = 2;
const bar = {};
bar.foo    = 10;
bar.foobar = 20;
bar.foo.foo    = 30;
bar.foo.foobar = 40;
	`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Aligns inline comments', () => {
		const input = `\
const foo; // first value
const foobar; // second value
`;

		const expected = `\
const foo;    // first value
const foobar; // second value
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Aligns assignments and inline comments separately', () => {
		const input = `\
const foo = 1; // first value
const foobar = 2; // second value
`;

		const expected = `\
const foo    = 1; // first value
const foobar = 2; // second value
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Aligns comments independently across multiple groups', () => {
		const input = `\
const foo = 1; // first value
const foobar = 2; // second value

let a = 10; // third value
let bcd = 20; // fourth value
`;

		const expected = `\
const foo    = 1; // first value
const foobar = 2; // second value

let a   = 10; // third value
let bcd = 20; // fourth value
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Aligns comments when object group changes', () => {
		const input = `\
const foo = {}; // comment
foo.foo = 1; // comment
foo.foobar = 20; // comment
const bar = {}; // comment
bar.foo = 1; // comment
bar.foobar = 20; // comment
bar.foo.foo = 300; // comment
bar.foo.foobar = 4000; // comment
	`;

		const expected = `\
const foo = {}; // comment
foo.foo    = 1;  // comment
foo.foobar = 20; // comment
const bar = {}; // comment
bar.foo    = 1;  // comment
bar.foobar = 20; // comment
bar.foo.foo    = 300;  // comment
bar.foo.foobar = 4000; // comment
	`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Aligns object constructors', () => {
		const input = `\
const obj = {
	a: 1,
	foobar: 2,
	longerKey: 3,
};
`;

		const expected = `\
const obj = {
	a:         1,
	foobar:    2,
	longerKey: 3,
};
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('debug print prints debug', () => {
		const expected = `\
01234   56789
    |>>>
01234  56789
     <<|`;

		const output = CodeAligner.debugPrintAlignments(
			'01234   56789\n01234  56789',
			[
				{ line: 0, insertBeforeCol: 5, width: 3, attach: 'before' },
				{ line: 1, insertBeforeCol: 5, width: 2, attach: 'after' },
			],
		);

		assert.strictEqual(output, expected);
	});

	test('String rendering works', () => {
		const input = `\
0123456789
0123456789
`;
		const expected = `\
01234     56789
01234     56789
`;

		const alignments: Alignment[] = [
			{ line: 0, insertBeforeCol: 5, width: 5, attach: 'after' },
			{ line: 1, insertBeforeCol: 5, width: 5, attach: 'before' },
		];
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);

		const debugOutput = CodeAligner.debugPrintAlignments(
			output,
			alignments,
		);
		const expectedDebug = `\
01234     56789
     <<<<<|
01234     56789
    |>>>>>

`;

		assert.strictEqual(debugOutput, expectedDebug);
	});

	test('Align assignments to the right', () => {
		const input = `\
const obj = {
    a: 1,
    foobar: 2,
    longerKey: 3,
};`;

		const expected = `\
const obj = {

    a:         1,
     |>>>>>>>>
    foobar:    2,
          |>>>
    longerKey: 3,

};
`;

		const output = debugPrint(input);

		assert.strictEqual(output, expected);
	});

	test('Aligns nested object constructors, ignoring opening braces', () => {
		const input = `\
const obj = {
	a: 1,
	foobar_baz: 2,
	nested: {
		x: 10,
		longerKey: 20,
		veryLongerKey: 30,
	},
};
`;

		const expected = `\
const obj = {
	a:          1,
	foobar_baz: 2,
	nested: {
		x:             10,
		longerKey:     20,
		veryLongerKey: 30,
	},
};
`;

		const codeAligner = new CodeAligner({
			dontAdjustLineRegex: /{\s*$/,
		});

		const alignments = codeAligner.computeAlignments(input);

		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Aligns object deconstructors', () => {
		const input = `\
const {
	a: my_a,
	foobar: thisIsFoobar,
	longerKey,
} = obj;
`;

		const expected = `\
const {
	a:      my_a,
	foobar: thisIsFoobar,
	longerKey,
} = obj;
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});

	test('Has configurable line comment markers', () => {
		const input = `\
const foo; # first value
const foobar; # second value
`;

		const expected = `\
const foo;    # first value
const foobar; # second value
`;

		const codeAligner = new CodeAligner({ lineCommentMarkers: ['#'] });
		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Supports multiple line comment markers', () => {
		const input = `\
const foo; # first value
const foobar; // second value
`;

		const expected = `\
const foo;    # first value
const foobar; // second value
`;

		const codeAligner = new CodeAligner({
			lineCommentMarkers: ['#', '//'],
		});
		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Has configurable assignment markers', () => {
		const input = `\
const foo := 1;
const foobar := 2;
`;

		const expected = `\
const foo    := 1;
const foobar := 2;
`;

		const codeAligner = new CodeAligner({
			assignmentMarkers: [
				{
					marker: ':=',
					mode: 'before',
				},
			],
		});
		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Can align "from" in imports', () => {
		const input = `\
import { A } from 'module-a';
import { LongNamedThing } from 'module-b';
`;

		const expected = `\
import { A }              from 'module-a';
import { LongNamedThing } from 'module-b';
`;

		const codeAligner = new CodeAligner({
			assignmentMarkers: [
				{
					marker: ' from ',
					mode: 'before',
				},
			],
		});
		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);
		assert.strictEqual(output, expected);
	});

	test('Can use both default and custom assignment markers', () => {
		const input = `\
import { A } from 'module-a';
import { LongNamedThing } from 'module-b';
const foo = 1;
const foobar = 2;
`;

		const expected = `\
import { A }              from 'module-a';
import { LongNamedThing } from 'module-b';
const foo    = 1;
const foobar = 2;
`;

		const codeAligner = new CodeAligner({
			assignmentMarkers: [
				{
					marker: 'from',
					mode: 'before',
					identifier: 'import',
				},
				...CodeAligner.defaultAssignmentMarkers,
			],
		});
		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);
		assert.strictEqual(output, expected);
	});

	test('Handles recursive groups', () => {
		const input = `\
const obj = {
	a: 1,
	foobar: 2,
	nested: {
		x: 10,
		longerKey: 20,
		veryLongerKey: 30,
	},
	b: 3,
};
`;

		const expected = `\
const obj = {
	a:      1,
	foobar: 2,
	nested: {
		x:             10,
		longerKey:     20,
		veryLongerKey: 30,
	},
	b:      3,
};
`;
		const codeAligner = new CodeAligner({
			recursiveGroupMarkers: [{ open: '{', close: '}' }],
		});

		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Handles recursive groups with ignored braces', () => {
		const input = `\
const obj = {
	a: 1,
	foobar_baz: 2,
	nested: {
		x: 10,
		longerKey: 20,
		veryLongerKey: 30,
	},
	b: 3,
};
`;

		const expected = `\
const obj = {
	a:          1,
	foobar_baz: 2,
	nested: {
		x:             10,
		longerKey:     20,
		veryLongerKey: 30,
	},
	b:          3,
};
`;

		const codeAligner = new CodeAligner({
			recursiveGroupMarkers: [{ open: '{', close: '}' }],
			dontAdjustLineRegex: /{\s*$/,
		});

		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Can align with custom regex assignment', () => {
		const input = `\
@description('VNET resource group name.')
param vnetResourceGroupName string
param vnetName string = 'HXVNET'
param p4SubnetName string = 'PublicSubnet0'
param p4NicName string = 'hxnic'
@description('Name of the public IP to assign for NIC')
param p4PublicIPName string = 'hxcorepip'
`;

		const expected = `\
@description('VNET resource group name.')
param vnetResourceGroupName string
param vnetName              string = 'HXVNET'
param p4SubnetName          string = 'PublicSubnet0'
param p4NicName             string = 'hxnic'
@description('Name of the public IP to assign for NIC')
param p4PublicIPName string = 'hxcorepip'
`;
		const codeAligner = new CodeAligner({
			assignmentMarkers: [
				{
					regex: /param\s+\S+\s+(string|int|bool)(\s*=)?/,
					group: 1,
					mode: 'before',
					identifier: 'param',
				},
			],
		});

		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Can ignore specific lines completely', () => {
		const input = `\
@description('VNET resource group name.')
param vnetResourceGroupName string
param vnetName string = 'HXVNET'
param p4SubnetName string = 'PublicSubnet0'
param p4NicName string = 'hxnic'
@description('Name of the public IP to assign for NIC')
param p4PublicIPName string = 'hxcorepip'
`;

		const expected = `\
@description('VNET resource group name.')
param vnetResourceGroupName string
param vnetName              string = 'HXVNET'
param p4SubnetName          string = 'PublicSubnet0'
param p4NicName             string = 'hxnic'
@description('Name of the public IP to assign for NIC')
param p4PublicIPName        string = 'hxcorepip'
`;
		const codeAligner = new CodeAligner({
			skipLinesRegex: /^\s*@/,
			assignmentMarkers: [
				{
					regex: /param\s+\S+\s+(string|int|bool)(?:\s*=)?/,
					group: 1,
					mode: 'before',
					identifier: 'param',
				},
			],
		});

		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Aligns different assignment markers of the same identifier', () => {
		const input = `\
let a = 10;
let bcd := 20;
`;

		const expected = `\
let a   = 10;
let bcd := 20;
`;

		const codeAligner = new CodeAligner({
			assignmentMarkers: [
				{ marker: '=', mode: 'before', identifier: 'let' },
				{ marker: ':=', mode: 'before', identifier: 'let' },
			],
		});
		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('Aligns before with after for matching identifiers', () => {
		const input = `\
__before__;
__after__;
____before__;
____after__;
`;

		const expected = `\
__       before__;
__after  __;
____     before__;
____after__;
`;

		const codeAligner = new CodeAligner({
			assignmentMarkers: [
				{ marker: 'before', mode: 'before', identifier: 'foo' },
				{ marker: 'after', mode: 'after', identifier: 'foo' },
			],
		});
		const alignments = codeAligner.computeAlignments(input);
		const output = CodeAligner.applyAlignmentsAsSpaces(input, alignments);

		assert.strictEqual(output, expected);
	});

	test('this specific case i noticed', () => {
		const input = `\
let foobar = 10; //foobar
let foo = 2000; //bazbar
`;

		const expected = `\
let foobar = 10;   //foobar
let foo    = 2000; //bazbar
`;

		const output = performAlignment(input);

		assert.strictEqual(output, expected);
	});
});
