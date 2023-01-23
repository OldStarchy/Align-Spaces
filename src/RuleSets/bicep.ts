import { RegexRule } from '../RegexRule';
import { RuleSet } from '../RuleSet';

const ruleSet: RuleSet = {
	rules: [new RegexRule(/^(param \w+ +)(\w+)/, 1, 'Align params')],
};

export default ruleSet;
