#!/usr/bin/env sh
# Idempotent patch for rainlink's WebSocket frame reassembly (see patch readme).
# Re-applied automatically by `npm install` via the `postinstall` hook.
set -eu

FILE="node_modules/rainlink/dist/index.mjs"

OLD='      if (info.payloadLength > bodyLength) {
        const bytesLeft = info.payloadLength - bodyLength;
        const nextData = yield new Promise((resolve) => {
          var _a2;
          (_a2 = this.socket) == null ? void 0 : _a2.once("data", (data2) => {
            var _a3;
            if (data2.length > bytesLeft) {
              (_a3 = this.socket) == null ? void 0 : _a3.unshift(data2.subarray(bytesLeft));
              data2 = data2.subarray(0, bytesLeft);
            }
            resolve(data2);
          });
        });
        data = Buffer.concat([data, nextData]);
      }'

NEW='      while (Buffer.byteLength(data) - info.startIndex < info.payloadLength) {
        const bytesLeft = info.payloadLength - (Buffer.byteLength(data) - info.startIndex);
        const nextData = yield new Promise((resolve) => {
          var _a2;
          (_a2 = this.socket) == null ? void 0 : _a2.once("data", (data2) => {
            var _a3;
            if (data2.length > bytesLeft) {
              (_a3 = this.socket) == null ? void 0 : _a3.unshift(data2.subarray(bytesLeft));
              data2 = data2.subarray(0, bytesLeft);
            }
            resolve(data2);
          });
        });
        data = Buffer.concat([data, nextData]);
      }'

if [ ! -f "$FILE" ]; then
  echo "patch: $FILE missing, skipping"
  exit 0
fi

if grep -qF "while (Buffer.byteLength(data) - info.startIndex < info.payloadLength)" "$FILE"; then
  echo "patch: already applied"
  exit 0
fi

if ! grep -qF "$OLD" "$FILE"; then
  echo "patch: block not found -- rainlink version changed?"
  exit 1
fi

python3 - "$FILE" "$OLD" "$NEW" <<'PYEOF'
import sys
(file, old, new) = sys.argv[1:4]
s = open(file).read()
open(file, "w").write(s.replace(old, new, 1))
PYEOF
echo "patch: applied"