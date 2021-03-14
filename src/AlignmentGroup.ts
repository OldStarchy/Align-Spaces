import * as vscode from 'vscode';
import DecorationSet from './DecorationSet';
import LineData from './LineData';

export default class AlignmentGroup {
	constructor(public lineStart: number, public lines: LineData[]) {}

	isLineStuffCompatible(other: LineData) {
		const incompatible = this.lines.some((line) => !line.compare(other));

		return !incompatible;
	}

	resolveAlignment(): DecorationSet {
		const colWidths: number[] = [];

		const decorations = new DecorationSet();

		this.lines.forEach((line) => {
			line.parts.forEach((part, i) => {
				if (i > colWidths.length - 1) {
					colWidths.push(part.width);
				} else if (colWidths[i] < part.width) {
					colWidths[i] = part.width;
				}
			});
		});

		this.lines.forEach((line, index) => {
			const currentLine = this.lineStart + index;
			let characterOffset = 0;

			line.parts.forEach((part, i) => {
				const offset = colWidths[i] - part.width;

				// TODO: Get tab width
				const tabWidth = 4;

				const offsetWidth =
					part.decoratorChar === '\t'
						? Math.floor(offset / tabWidth)
						: offset;

				const textWidth = part.text.length - 1;

				if (characterOffset + textWidth < 0)
					//Can't apply letter spacing if there's no character before the operator
					return;
				if (offsetWidth > 0) {
					(decorations.decorations[offsetWidth] ??= []).push(
						new vscode.Range(
							currentLine,
							characterOffset + textWidth,
							currentLine,
							characterOffset + textWidth + 1
						)
					);
				}

				characterOffset += part.length;
			});
		});

		return decorations;
	}
}
