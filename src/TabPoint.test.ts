import * as assert from 'assert';
import TabPoint, { TabPointCollection } from './TabPoint';

class Position {
	constructor(
		public line: number,
		public character: number,
		public attach: 'before' | 'after',
	) {}
}

suite('TabPoint', () => {
	test('TabPoint creation', () => {
		new TabPoint();
	});

	test('can add a position', () => {
		const a = new TabPoint();

		a.add(new Position(1, 2, 'before'));
	});

	test('rejects two positions on the same line', () => {
		const a = new TabPoint();

		a.add(new Position(1, 2, 'before'));

		assert.throws(() => {
			a.add(new Position(1, 4, 'before'));
		});
	});

	test('isEmpty returns true if no positions exist', () => {
		const a = new TabPoint();

		assert.strictEqual(a.isEmpty(), true);

		a.add(new Position(0, 0, 'before'));

		assert.strictEqual(a.isEmpty(), false);
	});

	test('A single set tab point aligns correctly', () => {
		const a = new TabPoint();

		a.add(new Position(0, 4, 'before'));
		a.add(new Position(1, 2, 'before'));

		const col = new TabPointCollection();
		col.add(a);
		const alignments = col.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<
				number,
				{ col: number; width: number; attach: 'before' | 'after' }[]
			>([[1, [{ col: 2, width: 2, attach: 'before' }]]]),
		);
	});

	test('A single point on a tab has no alignment needed', () => {
		const a = new TabPoint();

		a.add(new Position(3, 5, 'before'));

		const col = new TabPointCollection();
		col.add(a);
		const alignments = col.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<
				number,
				{ col: number; width: number; attach: 'before' | 'after' }[]
			>(),
		);
	});

	test("Multiple tab points align together (when they don't interact)", () => {
		const a = new TabPoint();

		/**
		 * foo = bar;
		 *     | 4
		 * fizz = buzz; // foo
		 *      | 5     : 13
		 * something // foo
		 *           : 10
		 */

		a.add(new Position(0, 4, 'before'));
		a.add(new Position(1, 5, 'before'));

		const b = new TabPoint();

		b.add(new Position(1, 13, 'before'));
		b.add(new Position(2, 10, 'before'));

		const points = new TabPointCollection();
		points.add(a);
		points.add(b);

		const alignments = points.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<
				number,
				{ col: number; width: number; attach: 'before' | 'after' }[]
			>([
				[0, [{ col: 4, width: 1, attach: 'before' }]],
				[2, [{ col: 10, width: 3, attach: 'before' }]],
			]),
		);
	});

	test('Multiple tab points align together (when they do interact)', () => {
		const a = new TabPoint();

		/**
		 * fizz = bar;
		 *      | 5
		 * foo = buzz; // foo
		 *     | 4     : 12
		 * something // foo
		 *           : 10
		 */

		a.add(new Position(0, 5, 'before'));
		a.add(new Position(1, 4, 'before'));

		const b = new TabPoint();

		b.add(new Position(1, 12, 'before'));
		b.add(new Position(2, 10, 'before'));

		const points = new TabPointCollection();
		points.add(a);
		points.add(b);

		const alignments = points.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<
				number,
				{ col: number; width: number; attach: 'before' | 'after' }[]
			>([
				[1, [{ col: 4, width: 1, attach: 'before' }]],
				[2, [{ col: 10, width: 3, attach: 'before' }]],
			]),
		);
	});

	test('Multiple tab points align together (when they do interact more)', () => {
		/**
		 * 1234 = 123 : 1
		 * 12 = 123 | 123 : 12
		 * 123 | 12345 : 1
		 */

		/**
		 * 1234 = 123 : 1
		 *      = 5   : 11
		 * 12 = 123 | 123 : 12
		 *    = 3   | 9   : 15
		 * 123 | 12345 : 1
		 *     | 4     : 12
		 */

		/**
		 * 1234 = 123         : 1
		 * 12   = 123 | 123   : 12
		 * 123        | 12345 : 1
		 */

		// =
		const a = new TabPoint();
		a.add(new Position(0, 5, 'before'));
		a.add(new Position(1, 3, 'before'));

		// |
		const b = new TabPoint();
		b.add(new Position(1, 9, 'before'));
		b.add(new Position(2, 4, 'before'));

		// :
		const c = new TabPoint();
		c.add(new Position(0, 11, 'before'));
		c.add(new Position(1, 15, 'before'));
		c.add(new Position(2, 12, 'before'));

		const points = new TabPointCollection();
		points.add(a);
		points.add(b);
		points.add(c);

		const alignments = points.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<
				number,
				{ col: number; width: number; attach: 'before' | 'after' }[]
			>([
				[0, [{ col: 11, width: 8, attach: 'before' }]],
				[
					1,
					[
						{ col: 3, width: 2, attach: 'before' },
						{ col: 15, width: 2, attach: 'before' },
					],
				],
				[2, [{ col: 4, width: 7, attach: 'before' }]],
			]),
		);
	});

	test('Throws on recursively dependent tab points', function () {
		const a = new TabPoint();

		a.add(new Position(0, 0, 'before'));
		a.add(new Position(1, 4, 'before'));

		const b = new TabPoint();

		b.add(new Position(0, 4, 'before'));
		b.add(new Position(1, 0, 'before'));

		const points = new TabPointCollection();
		points.add(a);
		points.add(b);

		assert.throws(
			() => {
				points.resolve();
			},
			{
				message: 'Recursive tab point dependency detected',
			},
		);
	});
});
