import { RuleSet } from './RuleSet';

export async function getRulesForLanguage(languageId: string): Promise<RuleSet> {
	//TODO: replace this dynamic import voodoo with user settings/config
	const file = `./RuleSets/${languageId}`;

	const defaultExport = await import(file);

	return defaultExport.default as RuleSet;
}
