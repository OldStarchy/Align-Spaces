import { Rule } from './Rule';
import { Split } from './Split';

export class RegexRule implements Rule {
	constructor(public regex: RegExp, public allowedSkips: number, public note?: string) {}

	match(line: string): Split[] | null {
		const match = this.regex.exec(line);

		if (match) {
			if (match[0].length > match.slice(1).reduce((sum, group) => sum + group.length, 0)) {
				throw new Error(`Rule ${this.note ?? this.regex} matched but did not consume all characters`);
			}

			let head = 0;

			const splits: Split[] = [];
			for (const group of match.slice(1)) {
				head += group.length;

				splits.push({
					width: group.length,
					column: head,
					type: this.note ?? 'regex',
				});
			}

			return splits;
		}

		return null;
	}
}
