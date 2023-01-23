import * as assert from 'assert';
import * as vscode from 'vscode';
import { applyAlignments } from '../../applyAlignments';
import { calculateAlignments } from '../../calculateAlignments';
import { getRulesForLanguage } from '../../getRulesForLanguage';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Align assignments', async () => {
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

		const rules = await getRulesForLanguage('typescript');
		const alignments = calculateAlignments(input, rules);
		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
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

	test('Match multiple rules', async () => {
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

		const rules = await getRulesForLanguage('typescript');
		const alignments = calculateAlignments(input, rules);
		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
	});

	test('Interleaved groups', async () => {
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

		const rules = await getRulesForLanguage('typescript');
		const alignments = calculateAlignments(input, rules);
		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
	});

	// #26
	test('(hopefully) Make @dciborow happy', async () => {
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

		const rules = await getRulesForLanguage('bicep');
		const alignments = calculateAlignments(input, rules);
		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
	});
});
