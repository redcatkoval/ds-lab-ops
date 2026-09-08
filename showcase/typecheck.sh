#!/usr/bin/env bash
# Проверка типов историй витрины. Запуск из ds-ops/:
#
#   ./showcase/typecheck.sh
#
# Ставить ничего не нужно: tsgo лежит в medusa-src/node_modules,
# как и всё, чем пользуется витрина (см. README, «Ставить ничего не нужно»).
#
# Область — stories/ и .storybook/. Файлы medusa-src/ попадают в проверку
# как зависимости импортов; medusa-src при этом не изменяется.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TSGO="$HERE/../../medusa-src/node_modules/.bin/tsgo"

if [ ! -x "$TSGO" ]; then
  echo "Не найден $TSGO — витрина берёт оснастку из medusa-src/node_modules" >&2
  exit 2
fi

exec "$TSGO" --noEmit -p "$HERE/tsconfig.json"
