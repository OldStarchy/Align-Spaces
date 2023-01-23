import { RegexRule } from '../RegexRule';
import { RuleSet } from '../RuleSet';

const ruleSet: RuleSet = {
	rules: [
		new RegexRule(/^((?:const|let) +[^=]+)(?=\=)/, 1, 'Align assignments'),
		new RegexRule(/^([^:]+)(?=\:)/, 1, 'Align colons'),
	],
};

export default ruleSet;
