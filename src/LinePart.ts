import { operatorGroups } from './operatorGroups';

export default interface LinePart {
	text: string;
	width: number;
	length: number;
	operator: string;
	operatorWidth: number;
	operatorType: keyof typeof operatorGroups;
	decorationLocation: number;
	decoratorChar: string;
}
