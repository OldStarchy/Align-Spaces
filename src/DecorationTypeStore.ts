import {
	DecorationRangeBehavior,
	Disposable,
	TextEditorDecorationType,
	window,
} from 'vscode';

export default class DecorationTypeStore implements Disposable {
	private store: TextEditorDecorationType[] = [];
	getForWidth(width: number) {
		return (this.store[width] ??= window.createTextEditorDecorationType({
			letterSpacing: `${width}ch`,
			rangeBehavior: DecorationRangeBehavior.ClosedClosed,
		}));
	}

	reset() {
		this.store.forEach((v) => v.dispose());
		this.store = [];
	}

	dispose() {
		this.reset();
	}
}
