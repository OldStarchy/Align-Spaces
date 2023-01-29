import { RuleSet } from './RuleSet';
import bicepRuleSet from './RuleSets/bicep';
import typescriptRuleSet from './RuleSets/typescript';

const sets: Record<string, RuleSet> = {
	typescript: typescriptRuleSet,
	bicep: bicepRuleSet,
};

export async function getRulesForLanguage(languageId: string): Promise<RuleSet> {
	//TODO: replace this dynamic import voodoo with user settings/config

	const set = sets[languageId];
	if (set) {
		return set;
	}

	throw new Error(`no language matchers for ${languageId}`);
}
