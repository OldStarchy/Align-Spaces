import * as assert from 'assert';
import TabPoint, { TabPointCollection } from './TabPoint';

class Position {
	constructor(
		public line: number,
		public character: number,
	) {}
}

suite('TabPoint', () => {
	test('TabPoint creation', () => {
		new TabPoint();
	});

	test('can add a position', () => {
		const a = new TabPoint();

		a.add(new Position(1, 2));
	});

	test('rejects two positions on the same line', () => {
		const a = new TabPoint();

		a.add(new Position(1, 2));

		assert.throws(() => {
			a.add(new Position(1, 4));
		});
	});

	test('isEmpty returns true if no positions exist', () => {
		const a = new TabPoint();

		assert.strictEqual(a.isEmpty(), true);

		a.add(new Position(0, 0));

		assert.strictEqual(a.isEmpty(), false);
	});

	test('A single set tab point aligns correctly', () => {
		const a = new TabPoint();

		a.add(new Position(0, 4));
		a.add(new Position(1, 2));

		const col = new TabPointCollection();
		col.add(a);
		const alignments = col.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<number, { col: number; width: number }[]>([
				[1, [{ col: 2, width: 2 }]],
			]),
		);
	});

	test('A single point on a tab has no alignment needed', () => {
		const a = new TabPoint();

		a.add(new Position(3, 5));

		const col = new TabPointCollection();
		col.add(a);
		const alignments = col.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<number, { col: number; width: number }[]>(),
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

		a.add(new Position(0, 4));
		a.add(new Position(1, 5));

		const b = new TabPoint();

		b.add(new Position(1, 13));
		b.add(new Position(2, 10));

		const points = new TabPointCollection();
		points.add(a);
		points.add(b);

		const alignments = points.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<number, { col: number; width: number }[]>([
				[0, [{ col: 4, width: 1 }]],
				[2, [{ col: 10, width: 3 }]],
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

		a.add(new Position(0, 5));
		a.add(new Position(1, 4));

		const b = new TabPoint();

		b.add(new Position(1, 12));
		b.add(new Position(2, 10));

		const points = new TabPointCollection();
		points.add(a);
		points.add(b);

		const alignments = points.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<number, { col: number; width: number }[]>([
				[1, [{ col: 4, width: 1 }]],
				[2, [{ col: 10, width: 3 }]],
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
		a.add(new Position(0, 5));
		a.add(new Position(1, 3));

		// |
		const b = new TabPoint();
		b.add(new Position(1, 9));
		b.add(new Position(2, 4));

		// :
		const c = new TabPoint();
		c.add(new Position(0, 11));
		c.add(new Position(1, 15));
		c.add(new Position(2, 12));

		const points = new TabPointCollection();
		points.add(a);
		points.add(b);
		points.add(c);

		const alignments = points.resolve();

		assert.deepStrictEqual(
			alignments,
			new Map<number, { col: number; width: number }[]>([
				[0, [{ col: 11, width: 8 }]],
				[
					1,
					[
						{ col: 3, width: 2 },
						{ col: 15, width: 2 },
					],
				],
				[2, [{ col: 4, width: 7 }]],
			]),
		);
	});

	test('Throws on recursively dependent tab points', function () {
		const a = new TabPoint();

		a.add(new Position(0, 0));
		a.add(new Position(1, 4));

		const b = new TabPoint();

		b.add(new Position(0, 4));
		b.add(new Position(1, 0));

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
