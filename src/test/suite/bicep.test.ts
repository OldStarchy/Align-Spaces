import * as assert from 'assert';
import { applyAlignments } from '../../applyAlignments';
import { calculateAlignments } from '../../calculateAlignments';
import { getRulesForLanguage } from '../../getRulesForLanguage';

suite('bicep RuleSet', async () => {
	const rules = await getRulesForLanguage('bicep');

	// #26
	test('(hopefully) Make @dciborow happy', () => {
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

		const alignments = calculateAlignments(input, rules);
		const actual = applyAlignments(input, alignments);

		assert.strictEqual(actual, expected);
	});
});
