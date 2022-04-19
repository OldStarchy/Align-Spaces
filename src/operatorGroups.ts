export const operatorGroups = {
	assignment: ['=', '+=', '-=', '*=', '/=', '??=', '^=', '|=', ':=', ':'],
	binary: ['+', '-', '*', '/', '??', '**', '..'],
	comparison: ['===', '!==', '==', '!=', '>=', '<='],
	comma: [','],
	index: ['.', '->', '=>'],
};

export type OperatorGroup =
	| keyof typeof operatorGroups
	| `attribute-${string}`
	| 'unknown';

export const operatorsGroup: {
	[operator: string]: OperatorGroup;
} = {};

(Object.keys(operatorGroups) as (keyof typeof operatorGroups)[]).forEach(
	(groupName) =>
		operatorGroups[groupName].forEach(
			(operator) => (operatorsGroup[operator] = groupName)
		)
);
const operatorsSorted = [
	...operatorGroups.assignment,
	...operatorGroups.binary,
	...operatorGroups.comparison,
	...operatorGroups.comma,
].sort((a, b) => b.length - a.length); //naive regex escape

export const getLineMatch = () =>
	new RegExp(
		`(.*?(.))(${operatorsSorted
			.map(
				(operator) =>
					operator.replace(/(.)/g, '\\$1') +
					(operatorsGroup[operator] === 'binary' ? '(?=\\s)' : '')
			)
			.join('|')}|(?<attribute>[a-zA-Z-]+)=)`,
		'g'
	);
