import { OperatorGroup } from './operatorGroups';

export default interface LinePart {
	text: string;
	width: number;
	length: number;
	operator: string;
	operatorWidth: number;
	operatorType: OperatorGroup;
	decorationLocation: number;
	decoratorChar: string;
}
