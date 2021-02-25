// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(
		'Congratulations, your extension "align-spaces" is now active!'
	);

	const eventHandler = (
		event: vscode.TextDocumentChangeEvent | vscode.TextDocument
	) => {
		const doc = 'document' in event ? event.document : event;

		const openEditor = vscode.window.visibleTextEditors.filter(
			(editor) => editor.document.uri === doc.uri
		)[0];

		try {
			if (openEditor) decorate(openEditor);
		} catch (e: unknown) {
			console.error(e);
		}
	};
	vscode.workspace.onDidChangeTextDocument(eventHandler);
	vscode.workspace.onDidOpenTextDocument(eventHandler);

	vscode.window.visibleTextEditors.forEach((editor) => {
		try {
			decorate(editor);
		} catch (e: unknown) {
			console.error(e);
		}
	});
}

class DecorationTypeStore {
	private store: vscode.TextEditorDecorationType[] = [];
	getForWidth(width: number) {
		return (this.store[
			width
		] ??= vscode.window.createTextEditorDecorationType({
			letterSpacing: `${width}ch`,
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
		}));
	}

	reset() {
		this.store.forEach((v) => v.dispose());
		this.store = [];
	}
}

const decorationTypes = new DecorationTypeStore();

const operatorGroups = {
	assignment: ['=', '+=', '-=', '*=', '/=', '??=', '^=', '|=', ':='],
	binary: ['+', '-', '*', '/', '??', '**', '..'],
	comparison: ['===', '!==', '==', '!=', '>=', '<='],
	comma: [','],
	index: ['.', '->', ':', '=>'],
};

const operatorsGroup: { [operator: string]: keyof typeof operatorGroups } = {};
(Object.keys(
	operatorGroups
) as (keyof typeof operatorGroups)[]).forEach((groupName) =>
	operatorGroups[groupName].forEach(
		(operator) => (operatorsGroup[operator] = groupName)
	)
);

const operatorsSorted = [
	...operatorGroups.assignment,
	...operatorGroups.binary,
	...operatorGroups.comparison,
	...operatorGroups.comma,
].sort((a, b) => b.length - a.length); //naive regex escape

const getLineMatch = () =>
	new RegExp(
		`(.*?(.))(${operatorsSorted
			.map(
				(operator) =>
					operator.replace(/(.)/g, '\\$1') +
					(operatorsGroup[operator] === 'binary' ? '(?=\\s)' : '')
			)
			.join('|')})`,
		'g'
	);

interface LinePart {
	text: string;
	width: number;
	length: number;
	operator: string;
	operatorWidth: number;
	operatorType: keyof typeof operatorGroups;
	decorationLocation: number;
	decoratorChar: string;
}
class LineStuff {
	constructor(
		public indentation: string,
		public prefix: string,
		public parts: LinePart[]
	) {}

	static fromString(line: string) {
		const lineMatch = getLineMatch();

		const indentation = /^\s*/.exec(line)![0];
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
			const prefixMatch = /^\s*(\w+(?:\.|->))+\w+/.exec(parts[0].text);
			if (prefixMatch) {
				prefix = prefixMatch[1];
			}
		}

		return new LineStuff(indentation, prefix, parts);
	}

	compare(other: LineStuff) {
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

class AlignmentGroup {
	constructor(public lineStart: number, public lines: LineStuff[]) {}

	isLineStuffCompatible(other: LineStuff) {
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

function getPhysicalWidth(line: string) {
	return line
		.split('')
		.map((ch, i) => (ch === '\t' ? 4 - ((i + 1) % 4) + 3 : 1))
		.reduce((a, b) => a + b, 0);
}

class ThingBuilder<T> {
	public current: T | null = null;

	private _all: T[] = [];

	get all() {
		return this._all;
	}

	push(next?: T) {
		if (this.current !== null) {
			this._all.push(this.current);
		}

		this.current = next === undefined ? null : next;
	}
}

class DecorationSet {
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
}

function decorate(editor: vscode.TextEditor) {
	decorationTypes.reset();

	let sourceCode = editor.document.getText();

	const sourceCodeArr = sourceCode.split('\n');

	const groupBuilder = new ThingBuilder<AlignmentGroup>();

	for (let line = 0; line < sourceCodeArr.length; line++) {
		const lineMatch = getLineMatch();

		if (!lineMatch.test(sourceCodeArr[line])) {
			groupBuilder.push();
			continue;
		}

		const stuff = LineStuff.fromString(sourceCodeArr[line]);

		if (
			groupBuilder.current &&
			!groupBuilder.current.isLineStuffCompatible(stuff)
		) {
			groupBuilder.push();
		}

		if (groupBuilder.current === null) {
			groupBuilder.current = new AlignmentGroup(line, [stuff]);
			continue;
		}

		groupBuilder.current.lines.push(stuff);
	}
	groupBuilder.push();

	const groups = groupBuilder.all;

	const decorators = groups
		.map((group) => group.resolveAlignment())
		.reduce((all, curr) => all.combine(curr), new DecorationSet());

	decorators.apply(editor);
}

// this method is called when your extension is deactivated
export function deactivate() {}
