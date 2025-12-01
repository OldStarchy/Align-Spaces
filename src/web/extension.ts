// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CodeAligner from '../CodeAligner';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(
		'Congratulations, your extension "align-spaces" is now active in the web extension host!',
	);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand(
		'align-spaces.helloWorld',
		() => {
			// The code you place here will be executed every time your command is executed

			// Display a message box to the user
			vscode.window.showInformationMessage(
				'Hello World from Align-Spaces in a web extension host!',
			);
		},
	);

	const aligner = new CodeAligner();

	const decoratorCache = new Map<number, vscode.TextEditorDecorationType>();
	const getDecoratorForWidth = (width: number) => {
		if (!decoratorCache.has(width)) {
			decoratorCache.set(
				width,
				vscode.window.createTextEditorDecorationType({
					after: {
						contentText: ' ',
						width: `${width}ch`,
					},
				}),
			);
		}

		return decoratorCache.get(width)!;
	};

	function decorateEditor(editor: vscode.TextEditor) {
		const decorations = new Map<number, vscode.Range[]>();
		const text = editor.document.getText();

		const alignments = aligner.computeAlignments(text);

		for (const alignment of alignments) {
			if (!decorations.has(alignment.width)) {
				decorations.set(alignment.width, []);
			}

			decorations
				.get(alignment.width)!
				.push(
					new vscode.Range(
						alignment.line,
						alignment.col - 1,
						alignment.line,
						alignment.col,
					),
				);
		}

		for (const [width, ranges] of decorations) {
			editor.setDecorations(getDecoratorForWidth(width), ranges);
		}

		for (const [width, decorator] of decoratorCache) {
			if (!decorations.has(width)) {
				editor.setDecorations(decorator, []);
			}
		}
	}
	const didChange = vscode.window.onDidChangeVisibleTextEditors((editors) => {
		for (const editor of editors) {
			decorateEditor(editor);
		}
	});

	vscode.window.visibleTextEditors.forEach(decorateEditor);

	const didEdit = vscode.workspace.onDidChangeTextDocument((e) => {
		const editor = vscode.window.visibleTextEditors.find(
			(ed) => ed.document.uri.toString() === e.document.uri.toString(),
		);
		if (editor) {
			decorateEditor(editor);
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(didChange);
	context.subscriptions.push(didEdit);
}

// This method is called when your extension is deactivated
export function deactivate() {}
