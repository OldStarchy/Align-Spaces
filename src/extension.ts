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

const decorationType = new Array(30).fill(0).map((_, i) =>
	vscode.window.createTextEditorDecorationType({
		letterSpacing: `${i}ch`,
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
	})
);

interface AlignedGroup {
	lineStart: number;
	lines: string[];
	indent: string;
}

const lineMatch = /.+?(!==|===|!=|==|\+=|-=|\*=|\/=|\?\?=|^=|=(?!>)|\+|-(?!>)|[^/]\*|\/|,)/g;

function decorate(editor: vscode.TextEditor) {
	decorationType.forEach((decorator) => editor.setDecorations(decorator, []));

	let sourceCode = editor.document.getText();

	const sourceCodeArr = sourceCode.split('\n');

	let groups: AlignedGroup[] = [];
	let currentGroup: AlignedGroup | null = null;

	for (let line = 0; line < sourceCodeArr.length; line++) {
		let match = sourceCodeArr[line].match(lineMatch);

		if (match !== null) {
			const indent = /^\s*/.exec(sourceCodeArr[line])![0];
			if (currentGroup) {
				if (currentGroup.indent !== indent) {
					groups.push(currentGroup);
					currentGroup = null;
				}
			}
			currentGroup ??= { lineStart: line, lines: [], indent };

			currentGroup.lines.push(sourceCodeArr[line]);
		} else {
			if (currentGroup) groups.push(currentGroup);
			currentGroup = null;
		}
	}
	if (currentGroup) groups.push(currentGroup);

	let decorationsArray: Record<string, vscode.Range[]> = {};
	groups.forEach((group) => alignGroup(group));

	for (const dwidth of Object.keys(decorationsArray)) {
		const intDwidth = parseInt(dwidth);

		editor.setDecorations(
			decorationType[intDwidth],
			decorationsArray[intDwidth]
		);
	}
	function alignGroup(group: AlignedGroup) {
		const colWidths: number[] = [];

		group.lines.forEach((line) => {
			let match: null | RegExpExecArray = null;

			for (let i = 0; (match = lineMatch.exec(line)); i++) {
				const width = match[0].length;

				if (i > colWidths.length - 1) colWidths.push(width);
				else if (colWidths[i] < width) colWidths[i] = width;
			}
		});

		group.lines.forEach((line, index) => {
			let characterOffset = 0;
			let match: null | RegExpExecArray = null;

			for (let i = 0; (match = lineMatch.exec(line)); i++) {
				const width = match[0].length;
				const offset = colWidths[i] - width;

				const tokenWidth = match[1].length;

				characterOffset += width;
				if (offset > 0) {
					decorationsArray[offset] ??= [];
					decorationsArray[offset].push(
						new vscode.Range(
							group.lineStart + index,
							characterOffset - tokenWidth - 1,
							group.lineStart + index,
							characterOffset - tokenWidth
						)
					);
				}
			}
		});
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
