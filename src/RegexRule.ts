import { Rule } from './Rule';
import { Split } from './Split';

type CompoundRegexPart = {
	regex: RegExp;
	repeatable: boolean;
	type: string;
};

type AssignableRegexPart = CompoundRegexPart | RegExp;

type MaybeArray<T> = T | T[];

export class RegexRule implements Rule {
	private regex: CompoundRegexPart[];

	constructor(public type: string, public allowedSkips: number, regex: MaybeArray<AssignableRegexPart>) {
		this.regex = RegexRule.normalizeMaybeArray(regex).map(RegexRule.normalizePart);
	}

	match(line: string): Split[] | null {
		let head = 0;
		let splits: Split[] = [];

		for (let i = 0; i < this.regex.length; i++) {
			let part = this.regex[i];
			let match = this.matchFromOffset(line, head, part);

			if (match) {
				splits = splits.concat(match);
				head = splits[splits.length - 1].column;

				if (part.repeatable) {
					i--;
				}
			}
		}

		if (splits.length === 0) {
			return null;
		}

		return splits;
	}

	private matchFromOffset(line: string, offset: number, { regex, type }: CompoundRegexPart) {
		line = line.substring(offset);

		const match = regex.exec(line);

		if (match) {
			if (match[0].length > match.slice(1).reduce((sum, group) => sum + group.length, 0)) {
				throw new Error(`Rule ${this.type ?? this.regex} matched but did not consume all characters`);
			}

			let head = offset;

			const splits: Split[] = [];

			if (match.length <= 1) {
				return null;
			}

			for (const group of match.slice(1)) {
				head += group.length;

				splits.push({
					width: group.length,
					column: head,
					type,
				});
			}

			return splits;
		}

		return null;
	}

	private static normalizeMaybeArray<T>(values: MaybeArray<T>): T[] {
		//assuming T is also not an array
		if (values instanceof Array) {
			return values;
		}
		return [values];
	}

	private static normalizePart(part: AssignableRegexPart): CompoundRegexPart {
		if (part instanceof RegExp) {
			return {
				regex: part,
				repeatable: false,
				type: 'regex',
			};
		}

		return part;
	}
}
