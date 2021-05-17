import { getPhysicalWidth } from './extension';
import LinePart from './LinePart';
import { getLineMatch, operatorsGroup } from './operatorGroups';

export default class LineData {
	constructor(
		public indentation: string,
		public prefix: string,
		public parts: LinePart[]
	) {}

	static fromString(line: string) {
		const lineMatch = getLineMatch();

		//TODO: including comments as "indentation" is hardcoded here. It should be configurable per language
		const indentation = /^\s*(?:(?:\/\/|\*)\s*)?/.exec(line)![0];
		const parts: LinePart[] = [];

		for (
			let match: RegExpExecArray | null = null;
			(match = lineMatch.exec(line));

		) {
			const [part, text, decoratorChar, operator] = match;

			const width = getPhysicalWidth(part);
			const operatorWidth = getPhysicalWidth(operator);
			const decorationLocation = text.length;
			const operatorType = operatorsGroup[operator];
			const length = part.length;

			parts.push({
				text,
				length,
				width,
				operator,
				operatorWidth,
				operatorType,
				decorationLocation,
				decoratorChar,
			});
		}

		let prefix = '';

		if (parts[0].operatorType === 'assignment') {
			const prefixMatch = /^\s*(.*(?:\.|->))\w+/.exec(parts[0].text);
			if (prefixMatch) {
				prefix = prefixMatch[1];
			}
		}

		return new LineData(indentation, prefix, parts);
	}

	compare(other: LineData) {
		if (this.indentation !== other.indentation) {
			return false;
		}
		if (this.prefix !== other.prefix) {
			return false;
		}

		const lim = Math.min(this.parts.length, other.parts.length);

		for (let i = 0; i < lim; i++) {
			if (this.parts[i].operatorType !== other.parts[i].operatorType) {
				return false;
			}
		}

		return true;
	}
}
