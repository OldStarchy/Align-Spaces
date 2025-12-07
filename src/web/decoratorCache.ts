import * as vscode from 'vscode';

export const decoratorCache = new (class
	implements vscode.Disposable, Iterable<vscode.TextEditorDecorationType>
{
	[Symbol.iterator](): Iterator<vscode.TextEditorDecorationType, any, any> {
		return this.cache.values();
	}

	cache = new Map<string, vscode.TextEditorDecorationType>();
	get(width: number, side: 'before' | 'after') {
		if (!this.cache.has(`${width}-${side}`)) {
			this.cache.set(
				`${width}-${side}`,
				vscode.window.createTextEditorDecorationType({
					[side === 'after' ? 'before' : 'after']: {
						contentText: ' ',
						width: `${width}ch`,
					},
				}),
			);
		}

		return this.cache.get(`${width}-${side}`)!;
	}

	dispose() {
		for (const [, decorator] of this.cache) {
			decorator.dispose();
		}
		this.cache.clear();
	}
})();
