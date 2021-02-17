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

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		'align-spaces.helloWorld',
		() => {
			// The code you place here will be executed every time your command is executed

			// Display a message box to the user
			vscode.window.showInformationMessage(
				'Hello World from Align Spaces!'
			);
		}
	);

	const eventHandler = (event: vscode.TextDocumentChangeEvent) => {
		const openEditor = vscode.window.visibleTextEditors.filter(
			(editor) => editor.document.uri === event.document.uri
		)[0];

		try {
			decorate(openEditor);
		} catch (e: unknown) {
			console.error(e);
		}
	};
	vscode.workspace.onDidChangeTextDocument(eventHandler);

	context.subscriptions.push(disposable);
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
}

const lineMatch = /.+?([-+*/=]={0,2})/g;
function decorate(editor: vscode.TextEditor) {
	decorationType.forEach((decorator) => editor.setDecorations(decorator, []));

	let sourceCode = editor.document.getText();

	const sourceCodeArr = sourceCode.split('\n');

	let groups: AlignedGroup[] = [];
	let currentGroup: AlignedGroup | null = null;

	for (let line = 0; line < sourceCodeArr.length; line++) {
		let match = sourceCodeArr[line].match(lineMatch);

		if (match !== null) {
			currentGroup ??= { lineStart: line, lines: [] };

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
			const parts = line.match(lineMatch);
			if (parts === null) return;

			for (let i = 0; i < parts.length; i++) {
				const width = parts[i].length;

				if (i > colWidths.length - 1) colWidths.push(width);
				else if (colWidths[i] < width) colWidths[i] = width;
			}
		});

		group.lines.forEach((line, index) => {
			let characterOffset = 0;
			const parts = line.match(lineMatch);
			if (parts === null) return;

			for (let i = 0; i < parts.length; i++) {
				const width = parts[i].length;
				const offset = colWidths[i] - width;

				characterOffset += width;
				if (offset > 0) {
					decorationsArray[offset] ??= [];
					decorationsArray[offset].push(
						new vscode.Range(
							group.lineStart + index,
							characterOffset - 2,
							group.lineStart + index,
							characterOffset - 1
						)
					);
				}
			}
		});
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
