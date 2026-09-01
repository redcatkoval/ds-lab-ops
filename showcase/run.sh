#!/usr/bin/env bash
# Витрина ActionMenu. Запуск из ds-ops/: ./showcase/run.sh
#
# Запускаемся из каталога дашборда, потому что часть его оснастки
# резолвится от текущего каталога. Конфиг, истории и кэш при этом
# лежат здесь — medusa-src/ не изменяется.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO="$(cd "$HERE/../../medusa-src" && pwd)"
DASHBOARD="$MONOREPO/packages/admin/dashboard"

cd "$DASHBOARD"
exec "$MONOREPO/node_modules/.bin/storybook" dev \
  -p 6006 --no-open \
  -c "$HERE/.storybook" \
  "$@"
