# Change Log

All notable changes to the "align-spaces" extension will be documented in this file.

## Patch

-   Fix "Cannot read properties of undefined (reading 'document')" (probably)

## 0.4.0

-   Add `"align-spaces.skip-after-first-assignment"` configuration. Fixes [#18](https://github.com/OldStarchy/Align-Spaces/issues/18)

## 0.3.1

-   Fix alignment would fail if `allowed-language-ids` was set

## 0.3.0

-   Add debounce to realignment when typing, configurable with "align-spaces.delay"
-   Add command to manually realign for when "align-spaces.delay" is set to "off

## 0.2.1

-   Make `:` align as assignment operators like they were supposed to initially

## 0.2.0

-   Add default keybinding for toggling Align Spaces on/off `ctrl+shift+=`.
-   Support workspace trust. Fixes [#15](https://github.com/aNickzz/Align-Spaces/issues/15).

## 0.1.2

-   Include comment markers `//` and `*` (for multiline) as part of the indentation. This allows aligning commented out code, but ignores normal text (as mentioned in [#12](https://github.com/aNickzz/Align-Spaces/issues/12))
-   Ignore commas if they're the last thing on a line. Fixes [#13](https://github.com/aNickzz/Align-Spaces/issues/13).

## 0.1.1

-   Don't decorate things when inactive via the "Toggle" command

## 0.1.0

-   Add allowed and disallowed languages config. Fixes [#10](https://github.com/aNickzz/Align-Spaces/issues/10).
-   Add enable / disable toggle command. Fixes [#9](https://github.com/aNickzz/Align-Spaces/issues/9).

## 0.0.7

-   Disable decorations when deactivating (should prevent needing to reload after updates / removing the extension)
-   Try to avoid aligning characters inside strings

## 0.0.6

-   Improve prefix detection
-   Remove ugly border from icon

## 0.0.5

-   Add icon & description
-   Tweak readme

## 0.0.4

-   Fix decorators can only be up to 30 characters wide

## 0.0.3

-   Only ignore operators without a trailing space if they're 'binary'

## 0.0.2

-   Add basic support for commas
-   Better handling for multi-character tokens
-   Don't align lines with different indentation
-   Don't align lines with different types of operators (eg. assignment `a = 1;` with comparison `if (a == 1)`)
-   Group sets of object property assignments
-   Ignore 'unary' operators

## 0.0.1

-   Initial release
