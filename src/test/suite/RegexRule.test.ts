import * as assert from 'assert';
import { RegexRule } from '../../RegexRule';
import { Split } from '../../Split';

suite('RegexRule', () => {
	test('match none', () => {
		const input = 'wwwwwwwww';

		const rule = new RegexRule('test', 0, /^(abcd)/);

		const splits = rule.match(input);

		assert.equal(splits, null);
	});

	test('Match one', () => {
		const input = 'abcdefg';

		const rule = new RegexRule('test', 0, /^(abcd)/);

		const splits = rule.match(input);

		assert.deepEqual(splits, [{ column: 4, type: 'regex', width: 4 }] satisfies Split[]);
	});

	test("throw if regex groups don't cover the entire match", () => {
		const rule = new RegexRule('test', 0, /^ab(cd)ef/);

		assert.throws(() => {
			rule.match('abcdef');
		});
	});

	test('repeatable regex matches repeatedly', () => {
		const input = 'abcabcabc';

		const rule = new RegexRule('test', 0, { regex: /^(abc)/, repeatable: true, type: 'regex' });

		const splits = rule.match(input);

		assert.deepEqual(splits, [
			{ column: 3, width: 3, type: 'regex' },
			{ column: 6, width: 3, type: 'regex' },
			{ column: 9, width: 3, type: 'regex' },
		] satisfies Split[]);
	});

	test('compound matches', () => {
		const input = 'abcdefgdefgdefghij';

		const rule = new RegexRule('test', 0, [
			{ regex: /^(abc)/, repeatable: false, type: 'regex' },
			{ regex: /^(defg)/, repeatable: true, type: 'regex' },
			{ regex: /^(hij)/, repeatable: false, type: 'regex' },
		]);

		const splits = rule.match(input);

		assert.deepEqual(splits, [
			{ column: 3, width: 3, type: 'regex' },
			{ column: 7, width: 4, type: 'regex' },
			{ column: 11, width: 4, type: 'regex' },
			{ column: 15, width: 4, type: 'regex' },
			{ column: 18, width: 3, type: 'regex' },
		] satisfies Split[]);
	});
});
