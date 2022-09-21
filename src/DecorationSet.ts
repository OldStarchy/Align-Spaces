import * as vscode from 'vscode';
import {decorationTypes} from './extension';

export default class DecorationSet {
	decorations: vscode.Range[][] = [];

	combine(other: DecorationSet) {
		other.decorations.forEach((ranges, index) =>
			(this.decorations[index] ??= []).push(...ranges)
		);
		return this;
	}

	apply(editor: vscode.TextEditor) {
		this.decorations.forEach((ranges, i) => {
			editor.setDecorations(decorationTypes.getForWidth(i), ranges);
		});
	}

	applyAsSpaces(text: string): string {
		const lines = text.split('\n');
		const decorationsPerLine: Record<number, [position: number, width: number][]> = {};

		this.decorations.forEach((ranges, i) => {
			ranges.forEach((range) => {
				decorationsPerLine[range.end.line] ??= [];
				decorationsPerLine[range.end.line].push([
					range.end.character,
					i
				]);
			});
		});

		for (const lineNumber in decorationsPerLine) {
			const line = lines[lineNumber];
			const decorations = decorationsPerLine[lineNumber];

			//Sort by position right to left
			decorations.sort((a, b) => b[0] - a[0]);

			for (const [position, width] of decorations) {
				lines[lineNumber] =
					line.slice(0, position) +
					' '.repeat(width) +
					line.slice(position);
			}
		}

		return lines.join('\n');
	}
}
