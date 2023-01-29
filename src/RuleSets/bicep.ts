import { RegexRule } from '../RegexRule';
import { RuleSet } from '../RuleSet';

const ruleSet: RuleSet = {
	rules: [
		new RegexRule('Align params', 1, [
			{
				regex: /^(param \w+ +)(\w+)/,
				repeatable: false,
				type: 'param',
			},
		]),
	],
};

export default ruleSet;
