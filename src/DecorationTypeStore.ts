import * as vscode from 'vscode';

export default class DecorationTypeStore {
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
