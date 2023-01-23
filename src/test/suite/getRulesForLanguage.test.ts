import * as assert from 'assert';
import { getRulesForLanguage } from '../../getRulesForLanguage';

suite('getRulesForLanguage', () => {
	test('Get rules for LanguageId', async () => {
		const rules = await getRulesForLanguage('typescript');

		const typescriptRules = await import('../../RuleSets/typescript');

		assert.strictEqual(rules, typescriptRules.default);
	});
});
