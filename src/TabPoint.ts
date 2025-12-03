interface Position {
	line: number;
	character: number;

	/**
	 * Decorations can insert space before or after a character.
	 *
	 * here, 'before' means the decoration is attached to the character to the left
	 * of this index and that character should grow to the right.
	 * 'after' means the decoration is attached to the character to the right
	 * of this index and that character should grow to the left.
	 */
	attach: 'before' | 'after';
}

class TabPoint {
	private positions: Map<
		number,
		{ character: number; attach: 'before' | 'after' }
	> = new Map();

	add(position: Position) {
		if (this.positions.has(position.line)) {
			throw new Error(
				`A position on line ${position.line} already exists in this TabPoint`,
			);
		}

		this.positions.set(position.line, {
			character: position.character,
			attach: position.attach,
		});
	}

	isEmpty(): boolean {
		return this.positions.size === 0;
	}

	resolve(): Map<
		number,
		{ col: number; width: number; attach: 'before' | 'after' }
	> {
		if (this.positions.size <= 1) {
			return new Map();
		}
		const max = Math.max(
			...this.positions.values().map((p) => p.character),
		);
		const alignments = new Map<
			number,
			{ col: number; width: number; attach: 'before' | 'after' }
		>();

		for (const [line, { character, attach }] of this.positions) {
			if (character === max) {
				continue;
			}
			alignments.set(line, {
				col: character,
				width: max - character,
				attach,
			});
		}

		return alignments;
	}

	getPositions(): IterableIterator<
		[number, { character: number; attach: 'before' | 'after' }]
	> {
		return this.positions.entries();
	}
}

interface Mark {
	markGroup: MarkGroup;
	line: number;
	col: number;
	attach: 'before' | 'after';
	visualCol?: number;
	parents?: Mark[] | null;
}
type MarkGroup = Mark[];

export class TabPointCollection {
	private points = new Set<TabPoint>();

	add(point: TabPoint) {
		this.points.add(point);
	}

	resolve(): Map<
		number,
		{ col: number; width: number; attach: 'before' | 'after' }[]
	> {
		const marksByLine = new Map<number, Mark[]>();
		const marksByCol: MarkGroup[] = [];

		for (const point of this.points) {
			const markGroup: MarkGroup = [];
			marksByCol.push(markGroup);

			for (const [
				line,
				{ character: col, attach },
			] of point.getPositions()) {
				const mark = { markGroup, line, col, attach };

				if (!marksByLine.has(line)) {
					marksByLine.set(line, []);
				}

				marksByLine.get(line)!.push(mark);
				markGroup.push(mark);
			}
		}

		for (const marks of marksByLine.values()) {
			marks.sort((a, b) => a.col - b.col);
			marks[0].parents = null;

			for (let i = 1; i < marks.length; i++) {
				marks[i].parents = marks.slice(0, i);
			}
		}

		function resolveGroup(
			group: MarkGroup,
			pending: Set<MarkGroup> = new Set(),
		) {
			if (pending.has(group)) {
				throw new Error('Recursive tab point dependency detected');
			}
			pending.add(group);

			const unresolvedParents = group
				.flatMap((mark) => mark.parents ?? [])
				.map((m) => m.markGroup)
				.filter((m) => m.some((pm) => pm.visualCol === undefined));

			unresolvedParents.forEach((g) => resolveGroup(g, pending));

			let maxVisualCol = 0;
			for (const mark of group) {
				const insertedWidth = (mark.parents ?? []).reduce(
					(sum, parent) => sum + (parent.visualCol! - parent.col),
					0,
				);

				const vc = mark.col + insertedWidth;
				if (vc > maxVisualCol) {
					maxVisualCol = vc;
				}
			}

			for (const mark of group) {
				mark.visualCol = maxVisualCol;
			}

			pending.delete(group);
		}

		for (const group of marksByCol) {
			resolveGroup(group);
		}

		const results = new Map<
			number,
			{ col: number; width: number; attach: 'before' | 'after' }[]
		>();

		for (const [line, marks] of marksByLine) {
			let inserted = 0;

			for (const mark of marks) {
				const width = mark.visualCol! - mark.col - inserted;

				if (width > 0) {
					if (!results.has(line)) {
						results.set(line, []);
					}
					results
						.get(line)!
						.push({ col: mark.col, width, attach: mark.attach });
					inserted += width;
				}
			}
		}

		return results;
	}
}

export default TabPoint;
