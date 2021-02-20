# Change Log

All notable changes to the "align-spaces" extension will be documented in this file.

## PATCH

-   Better handling for multi-character tokens
-   Don't align lines with different indentation
-   Don't align lines with different types of operators (eg. assignment `a = 1;` with comparison `if (a == 1)`)
-   Group sets of object property assignments
-   Ignore 'unary' operators
-   Add basic support for commas

## 0.0.1

-   Initial release
