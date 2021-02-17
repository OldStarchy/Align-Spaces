# Align Spaces

> This extension is in alpha, it is not intended for heavy use.

Aligns certain characters without inserting any characters to align them.

## Features

```text
foo = bar + baz;
longerfoo = b - baz;

this = this
anotherExample = anotherExample
thing = thing
example = example

a = x + sin(x) + 0.2 * 12000
b = sin(y) + y * 6
```

Will appear visually as

```text
foo       = bar + baz;
longerfoo = b   - baz;

this           = this
anotherExample = anotherExample
thing          = thing
example        = example

a = x      + sin(x) + 0.2 * 12000
b = sin(y) + y      * 6
```

This works by adjusting the width of the character.

## Known Issues

-   Rectangular selections are borked
-   Its probably very slow on any decently sized files

## Release Notes

See [CHANGELOG.md](./CHANGELOG.md)
