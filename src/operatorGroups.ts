export const operatorGroups = {
	assignment: ['=', '+=', '-=', '*=', '/=', '??=', '^=', '|=', ':='],
	binary: ['+', '-', '*', '/', '??', '**', '..'],
	comparison: ['===', '!==', '==', '!=', '>=', '<='],
	comma: [','],
	index: ['.', '->', ':', '=>'],
};

export const operatorsGroup: {
	[operator: string]: keyof typeof operatorGroups;
} = {};
(Object.keys(
	operatorGroups
) as (keyof typeof operatorGroups)[]).forEach((groupName) =>
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
			.join('|')})`,
		'g'
	);
