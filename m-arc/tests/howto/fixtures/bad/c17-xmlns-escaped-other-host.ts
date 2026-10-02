// HT4-A3 C17 bad fixture (D-HT4-C17 escaped-quote follow-up): xmlns pointing at another host, in the escaped-quote
// form src/howto/generated/*.ts actually holds it in (a JSON string literal, one backslash before each quote).
export const json = '{"svg":"<svg xmlns=\"http://example.com/not-the-real-namespace\"></svg>"}';
