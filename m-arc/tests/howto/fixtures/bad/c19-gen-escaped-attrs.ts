// HT4b-A5 C19 bad fixture (LR23-DOCS review, D-LR23-7): escaped attribute values, as a generated .ts string literal
// holds them. class=\"srcs\" and a non-# xlink:href=\"…\" must both fail (the URL is also a C17 hit).
export const json = '{"html":"<details class=\"srcs\"><use xlink:href=\"https://example.com/x\"></use></details>"}';
