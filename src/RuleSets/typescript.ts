import { RegexRule } from '../RegexRule';
import { RuleSet } from '../RuleSet';

const ruleSet: RuleSet = {
	rules: [
		new RegexRule('Align assignments', 1, [
			{ regex: /^((?:(?:const|let|var) +)?[^=]+(?=\=))/, repeatable: false, type: 'assignment' },
			{ regex: /^([^?*.+\-\/]+(?=\?\?|\*\*|\.\.|\+|\-|\*|\/))/, repeatable: true, type: 'operator' },
		]),
		new RegexRule('Align properties', 1, [
			{
				regex: /^([^:]+(?=\:))/,
				repeatable: false,
				type: 'property',
			},
		]),
	],
};

export default ruleSet;
