import { Split } from './Split';

export interface Rule {
	allowedSkips: number;
	match(line: string): Split[] | null;
}
