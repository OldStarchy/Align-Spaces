// If you can read this, you are too close

import { setTimeout } from 'timers';
import * as vscode from 'vscode';
import AlignmentGroup from './AlignmentGroup';
import DecorationSet from './DecorationSet';
import DecorationTypeStore from './DecorationTypeStore';
import LineData from './LineData';
import { getLineMatch } from './operatorGroups';

// Hi, If you're reading this, you're probably interested to know how this
// extension works.

/*
	When an editor is decorated, the document is parsed line by line.

	Each line is split in to parts, each part contains some text, followed by an
	"operator".

	For certain types of operators (eg. 'binary' operators), it may only be
	considered if it is immediately followed by a space. This is to ignore
	operators like '+' and '-' which can appear as both binary, and unary
	operators. This helps to handle negative numbers "-5" to be treated the same
	as positive numbers "5".

	```typescript
	foo = -foo + 1
	foobar = foobar + 2
	if (foo === bar)
		foo = bar
	bar = bar
	bar.foo = foo
	bar.foobar = baz
	```

	In this case, the lines are split as follows. Note that the '-' in '-foo' is
	not considered as it doesn't have a following space.

	['foo =', ' -foo +']
	['foobar =', ' foobar +']
	['if (foo ===']
	['foo =']
	['bar =']
	['bar.foo =']
	['bar.foobar =']

	Then lines are grouped by their signature, which consists of the

	-	indentation
	-	operator group
	-	prefix

	The indentation is just simply any whitespace characters before the first
	non-whitespace character.

	Operators are grouped in to the following types. These groups are mostly
	arbitrary, and just what I've found that work.

	-	assignment
	-	binary
	-	comparison
	-	comma

	The prefix is a little bit more complicated as its goal is to group similar
	object assignments. In most languages that I use, objects are indexed by the
	'.' or the '->' operators. The prefix of a line is set if the first part of
	the line

	-	is an assignment operator
	-	includes one of these indexing operators
	-	contains only word characters after the last indexing operator

	The prefix is taken as everything upto and including the last index
	operator.

	The line signatures from above then become

	{indent: '', prefix: '', operatorTypes: ['assignment', 'binary']}
	{indent: '', prefix: '', operatorTypes: ['assignment', 'binary']}
	{indent: '', prefix: '', operatorTypes: ['comparison']}
	{indent: '\t', prefix: '', operatorTypes: ['assignment']}
	{indent: '', prefix: '', operatorTypes: ['assignment']}
	{indent: '', prefix: 'bar.', operatorTypes: ['assignment']}
	{indent: '', prefix: 'bar.', operatorTypes: ['assignment']}

	Adjacent lines with equal signatures are then grouped.

	For each group, the maximum width of each nth part is calculated, then
	decorators are applied to the character just before the operator. The
	decorator applies the `letter-spacing' css property so that the part appears
	as wide as the maximum width. It is assumed that users have a fixed-width
	font.

	When calculating the width, it is also assumed that a tab is 4 characters
	wide.
*/

const EXTENSION_ID = 'align-spaces';

interface ExtensionConfig extends vscode.WorkspaceConfiguration {
	'allowed-language-ids': string[] | null;
	'disallowed-language-ids': string[] | null;
	delay: number | 'off';
	'default-enabled': boolean;
	// TODO:
	// [languageId: string]: {
	// 	'line-comment': string | null;
	// } | null;
}

const disposables: vscode.Disposable[] = [];

let active = true;
let activePerDocument = new WeakMap<vscode.TextDocument, boolean>();

export function activate(context: vscode.ExtensionContext) {
	console.log(`Extension "${EXTENSION_ID}" is now active!`);

	disposables.push(
		vscode.commands.registerCommand('align-spaces.toggle', () => {
			active = !active;
			if (active) {
				decorateCurrentEditor(false);
			} else {
				clearDecorations();
			}
		}),
		vscode.commands.registerCommand('align-spaces.toggle-editor', () => {
			const document = vscode.window.activeTextEditor?.document;

			if (document) {
				let enabled = activePerDocument.get(document);
				if (enabled === undefined) {
					enabled = config.current['default-enabled'];
				}
				activePerDocument.set(document, !enabled);
				if (activePerDocument.get(document)) {
					decorateCurrentEditor(false);
				} else {
					clearDecorations();
				}
			}
		}),
		vscode.commands.registerCommand('align-spaces.realign', () => {
			if (active) {
				decorateCurrentEditor(false);
			}
		})
	);

	const onChangeTextHandler = (
		event: vscode.TextDocumentChangeEvent | vscode.TextDocument
	) => {
		const doc = 'document' in event ? event.document : event;

		const openEditor = vscode.window.visibleTextEditors.find(
			(editor) => editor.document.uri === doc.uri
		);

		if (openEditor) {
			decorateDebounced(openEditor);
		}
	};

	function decorateCurrentEditor(debounce: boolean) {
		const currentEditor = vscode.window.activeTextEditor;
		if (!currentEditor) {
			return;
		}

		const languageId = currentEditor.document.languageId;

		if (shouldDecorateLanguage(languageId)) {
			if (debounce) {
				decorateDebounced(currentEditor);
			} else {
				decorate(currentEditor);
			}
		} else {
			clearDecorations();
		}
	}

	vscode.workspace.onDidChangeTextDocument(onChangeTextHandler);
	// vscode.workspace.onDidOpenTextDocument(onChangeTextHandler);

	vscode.window.onDidChangeActiveTextEditor(
		(editor: vscode.TextEditor | undefined) => {
			if (!editor) {
				return;
			}

			decorate(editor);
		}
	);

	vscode.workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration(EXTENSION_ID)) {
			loadConfig();

			decorateCurrentEditor(false);
		}
	});

	loadConfig();

	decorateCurrentEditor(false);
}

const config: {
	current: ExtensionConfig;
} = {
	current: vscode.workspace.getConfiguration(EXTENSION_ID) as ExtensionConfig,
};

function loadConfig() {
	config.current = vscode.workspace.getConfiguration(
		EXTENSION_ID
	) as ExtensionConfig;

	for (const setting of ['allowed-language-ids', 'disallowed-language-ids']) {
		if (config.current[setting] !== null) {
			if (
				!(config.current[setting] instanceof Array) ||
				config.current[setting].some((t: any) => typeof t !== 'string')
			) {
				(config.current as any)[setting] = null;
				console.warn(`Invalid "${setting}" setting`);
			}
		}
	}

	if (config.current.delay !== 'off') {
		if (typeof config.current.delay !== 'number') {
			config.current.delay = 'off';
		}
	}
}

export const decorationTypes = new DecorationTypeStore();
disposables.push(decorationTypes);

export function getPhysicalWidth(line: string) {
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

function obfuscateStrings(str: string) {
	return str.replace(
		/(?<!\\)('|"|`)(.*?)(?<!\\)\1/g,
		(_match, quote, content) => quote + content.replace(/./g, ' ') + quote
	);
}

function shouldDecorateLanguage(id: string) {
	if (
		config.current['allowed-language-ids'] === null &&
		config.current['disallowed-language-ids'] === null
	) {
		return true;
	}

	if (config.current['disallowed-language-ids'] !== null) {
		if (config.current['disallowed-language-ids'].includes(id)) {
			return false;
		}
	}
	if (config.current['allowed-language-ids'] !== null) {
		return config.current['allowed-language-ids'].includes(id);
	}
	return true;
}

function shouldDecorateEditor(editor: vscode.TextEditor) {
	const enabled = activePerDocument.get(editor.document);

	if (enabled === undefined) {
		return config.current['default-enabled'];
	}

	if (editor.document.lineCount > 1000) {
		return false;
	}

	return enabled;
}

function clearDecorations() {
	decorationTypes.reset();
}

let timeoutId: null | number = null;
function decorateDebounced(editor: vscode.TextEditor) {
	if (!shouldDecorateLanguage(editor.document.languageId)) {
		return;
	}

	const delay = config.current.delay;

	if (delay === 'off') {
		return;
	}

	if (delay <= 0) {
		decorate(editor);
		return;
	}

	// Getting nodejs typings for these timeout functions for some reason
	if (timeoutId) {
		(clearTimeout as unknown as (id: number) => void)(timeoutId);
		timeoutId = null;
	}

	timeoutId = (
		setTimeout as unknown as (callback: () => void, delay: number) => number
	)(() => {
		decorate(editor);
		timeoutId = null;
	}, delay);
}

function decorate(editor: vscode.TextEditor) {
	if (!active) {
		return;
	}

	if (!shouldDecorateLanguage(editor.document.languageId)) {
		return;
	}

	if (!shouldDecorateEditor(editor)) {
		return;
	}

	clearDecorations();

	let sourceCode = editor.document.getText();

	const sourceCodeArr = sourceCode.split('\n');

	const groupBuilder = new ThingBuilder<AlignmentGroup>();

	for (let line = 0; line < sourceCodeArr.length; line++) {
		const lineMatch = getLineMatch();

		const lineString = obfuscateStrings(sourceCodeArr[line]);

		if (!lineMatch.test(lineString)) {
			groupBuilder.push();
			continue;
		}

		const stuff = LineData.fromString(lineString);

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

export function deactivate() {
	disposables.forEach((d) => d.dispose());
	console.log('Extension "align-spaces" deactivated.');
}
