import { Split } from './Split';

export interface Rule {
	note?: string;
	allowedSkips: number;

	match(line: string): Split[] | null;
}
