// HT4-A3 C17 bad fixture (round-3 review fix, low 2): the SVG namespace URL sits inside a longer attribute name
// (`data-xmlns=`), not the whole `xmlns=` attribute - the allowance must not blank this out.
export const markup = '<div data-xmlns="http://www.w3.org/2000/svg"></div>';
