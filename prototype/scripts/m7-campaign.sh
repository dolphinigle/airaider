#!/usr/bin/env bash
# M7.2 multi-day campaign demo.
#
# Runs a 5-day campaign that exercises every M6 + M7 system:
#   - season transition thaw → high (days 28-32)
#   - daily events (thaw market days, then high-summer bandit scouts)
#   - veterancy promotions (marek + veska cross to veteran)
#   - co-deployment bonds (marek ↔ veska form a bond)
#   - mid-campaign fort upgrades (palisade after day 1, smithy after day 3)
#
# All days use the deterministic MockScenarioLLM — no API key needed.
# Mock golden transcripts are committed at fixtures/m7-day-N.day-mock.json
# and the final roster at fixtures/m7-campaign-roster.final.json.

set -euo pipefail

cd "$(dirname "$0")/.."

ROSTER=$(mktemp /tmp/m7-roster.XXXXXX.json)
cp fixtures/m7-campaign-roster.json "$ROSTER"

for D in 1 2 3 4 5; do
  echo "===== DAY $D ====="
  npm run --silent day -- "fixtures/m7-day-$D.json" --roster="$ROSTER" --out "fixtures/m7-day-$D.day-mock.json"
  if [ "$D" = "1" ]; then
    npm run --silent fort -- "$ROSTER" upgrade reinforced-palisade
  fi
  if [ "$D" = "3" ]; then
    # Smithy may be unaffordable depending on which daily events fired;
    # the demo is still useful if the purchase is rejected, so don't
    # abort the script if it does.
    npm run --silent fort -- "$ROSTER" upgrade smithy || echo "(smithy purchase skipped this run)"
  fi
done

cp "$ROSTER" fixtures/m7-campaign-roster.final.json
rm "$ROSTER"
echo "Done. See fixtures/m7-day-{1..5}.day-mock.json and fixtures/m7-campaign-roster.final.json"
