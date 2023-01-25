export interface Alignment {
	lineNumber: number;

	/**
	 * Insert `width` spaces at column `column`.
	 */
	adjustments: { column: number; width: number }[];
}
