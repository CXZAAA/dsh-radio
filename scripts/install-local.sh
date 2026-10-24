#!/usr/bin/env bash
#
# 把仓库本地链接安装到 dsh web profile，并幂等追加 Loader 行。
# 不重启服务、不请求 sudo；最后打印需要人工执行的命令。
set -euo pipefail

PROFILE="web"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE_DIR="${DSH_PROFILE_DIR:-$HOME/.dsh/profiles/$PROFILE}"
PATCH_FILE="$PROFILE_DIR/cordis.patch.yml"

if ! command -v dsh >/dev/null 2>&1; then
  echo "未找到 dsh 命令，请先确认 dsh 已安装并在 PATH 中。" >&2
  exit 1
fi

if [ ! -f "$REPO_DIR/lib/client.js" ] || [ ! -f "$REPO_DIR/lib/index.js" ]; then
  echo "缺少 lib/client.js 或 lib/index.js。请先在仓库里运行：" >&2
  echo "  cd \"$REPO_DIR\"" >&2
  echo "  npm_config_cache=\"\$PWD/.cache/npm\" pnpm install --store-dir .pnpm-store" >&2
  echo "  pnpm build" >&2
  exit 1
fi

echo "仓库：$REPO_DIR"
echo "Profile：$PROFILE_DIR"
echo

echo "1/2 安装本地链接包…"
if dsh plugin --profile "$PROFILE" add "link:$REPO_DIR"; then
  echo "已通过 dsh plugin 安装。"
else
  echo "dsh plugin 安装失败，回退到 pnpm add …" >&2
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "回退需要 pnpm，但 PATH 中没有 pnpm。" >&2
    exit 1
  fi
  mkdir -p "$PROFILE_DIR"
  (cd "$PROFILE_DIR" && pnpm add "link:$REPO_DIR")
fi

echo
echo "2/2 写入 Loader 行…"
mkdir -p "$PROFILE_DIR"
if [ ! -f "$PATCH_FILE" ]; then
  : > "$PATCH_FILE"
fi

if grep -Eq '^[[:space:]]*-[[:space:]]*id:[[:space:]]*["'"'"']?radio["'"'"']?[[:space:]]*$' "$PATCH_FILE"; then
  echo "已存在 id: radio，跳过（保持幂等）。"
else
  # 确保追加内容从新的一行开始。
  if [ -s "$PATCH_FILE" ] && [ "$(tail -c 1 "$PATCH_FILE" | wc -l)" -eq 0 ]; then
    printf '\n' >> "$PATCH_FILE"
  fi
  cat >> "$PATCH_FILE" <<'YAML'
# dsh-radio (managed by install-local.sh)
- insert:
    - id: radio
      name: dsh-plugin-radio
YAML
  echo "已追加到 $PATCH_FILE"
fi

cat <<'TEXT'

需要重启 dsh-web 才能加载新的插件行（脚本不会自动重启，也不会请求 sudo）：
  sudo systemctl restart dsh-web

重启后刷新 http://127.0.0.1:3080 即可看到状态行里的电台胶囊。
TEXT
