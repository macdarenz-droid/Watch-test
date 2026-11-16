#!/bin/bash
# append an intraday note to the current week's funded journal, just above the forward tally. usage: ./note.sh FILE "text"
python - "$1" "$2" <<'PY'
import sys
p=sys.argv[1]; j=open(p).read(); i=j.rindex("## Forward tally"); open(p,'w').write(j[:i].rstrip("\n")+"\n"+sys.argv[2]+"\n\n"+j[i:])
PY
