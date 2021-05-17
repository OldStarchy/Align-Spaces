# Align Spaces

Aligns certain operators by visually stretching the leading characters, this way you can have groups of aligned code, without having to deal with meaningless whitespace changes in your commits.

> Got a suggestion or issue? [Raise an issue on GitHub](https://github.com/aNickzz/Align-Spaces/issues/new)

## Features

```javascript
// Aligns operators:
foo = bar;
foobar = baz;

foo = foo + bar;
foobar = foobar - baz;

// Ignores content in strings
foo = {
	foo: 'foobar foobar',
	foo: 'foo, bar',
	foo: '\'foo\', "", bar',
};

// Knows the difference between assignment, 'binary', and comparison:
foo = bar;
foobar = baz;
if (foobar === bar) {
	bar = fizzbuzz;
}

// Groups object assignments:
foo = new Foo();
foo.foo = bar;
foo.foobar = baz;

bar = new Bar();
bar.foobar = 'foobar';
bar.baz = foo;

foo.bar = bar;

// Ignores 'unary' operators (those that don't have a space after):
const dx = x * cos(theta) + -y * sin(theta);
const dy = x * sin(theta) + y * cos(theta);

// Does alright with commas:
// prettier-ignore
const matrix = [
	100, 50, 0,
	0, 1, 0,
	2000, 300, 64,
];
```

Will appear visually as

<!-- prettier-ignore -->
```javascript
// Aligns operators:
foo    = bar;
foobar = baz;

foo    = foo    + bar;
foobar = foobar - baz;

// Ignores content in strings
foo = {
	foo: 'foobar foobar foobar',
	foo: 'foo, bar',
	foo: '\'foo\', "", bar',
}

// Knows the difference between assignment, 'binary', and comparison:
foo    = bar;
foobar = baz;
if (foobar === bar) {
	bar = fizzbuzz;
}

// Groups object assignments:
foo = new Foo();
foo.foo    = bar;
foo.foobar = baz;

bar = new Bar();
bar.foobar = 'foobar';
bar.baz    = foo;

foo.bar = bar;

// Ignores 'unary' operators (those that don't have a space after):
const dx = x * cos(theta) + -y * sin(theta);
const dy = x * sin(theta) + y  * cos(theta);

// Does alright with commas:
// prettier-ignore
const matrix = [
	100 , 50 , 0,
	0   , 1  , 0,
	2000, 300, 64,
];
```

This works by adjusting the width of the character.

## Known Issues

-   Rectangular selections are borked
-   Its probably very slow on any decently sized files

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md)
