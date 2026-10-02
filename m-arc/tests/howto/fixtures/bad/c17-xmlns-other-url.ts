// HT4-A3 C17 bad fixture (D-HT4-C17): the allowed SVG xmlns attribute sits next to a different, real URL - the
// namespace attribute itself must not fail, but the other URL still must.
export const svg = '<svg xmlns="http://www.w3.org/2000/svg"><!-- see https://example.com/not-a-citation --></svg>';
