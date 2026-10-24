#!/usr/bin/env bash
#
# scripts/publish-github.sh
#
# 首次把本仓库发布到 https://github.com/CXZAAA/dsh-radio：
#   1. 检查 git/curl，确认在仓库根目录、main 分支存在；
#   2. 交互读取 GitHub PAT（不回显、不落盘、不写 shell history）；
#   3. 用 API 查询仓库是否存在，不存在则创建（public，开放 Issues）；
#   4. 配置 remote origin 并推送 main；
#   5. 通过 API 设置 topics 与英文描述。
#
# 不会提交代码、不会改写历史。DRY_RUN=1 只打印将执行的命令。
#
# 安全说明：
#   - PAT 只存在于当前进程的内存里，脚本退出即丢弃；不写文件、不进命令历史；
#   - 所有 curl 都用 -H "Authorization: Bearer $TOKEN"，从不 echo token；
#     （PAT 会随 curl 参数短暂出现在同用户的进程列表里，进程退出后即消失）
#   - 失败时只打印 HTTP 状态和响应体前三行，不打印请求头；
#   - 如果通过 `bash -x` 运行，脚本会先关掉 xtrace，避免 token 被打印。
set -euo pipefail

case $- in
  *x*) set +x
       echo "检测到 xtrace，已关闭，避免 PAT 被打印。" >&2 ;;
esac

OWNER="${GITHUB_OWNER:-CXZAAA}"
REPO="${GITHUB_REPO:-dsh-radio}"
BRANCH="${BRANCH:-main}"
API="https://api.github.com"
API_VERSION="2022-11-28"
REMOTE_URL="${REMOTE_URL:-https://github.com/$OWNER/$REPO.git}"
DESCRIPTION="${DESCRIPTION:-Ambient internet radio for the DeepSeek-Harness Web GUI}"
TOPICS=(dsh dsh-plugin radio internet-radio nightride radio-paradise)
DRY_RUN="${DRY_RUN:-0}"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BODY_FILE="$(mktemp)"
chmod 600 "$BODY_FILE"
TOKEN=""

cleanup() {
  rm -f "$BODY_FILE"
  TOKEN=""
}
trap cleanup EXIT

say() { printf '%s\n' "$*"; }
warn() { printf '%s\n' "$*" >&2; }

# 打印命令；DRY_RUN 时只打印不执行。
run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf '[dry-run]'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

# api METHOD PATH [JSON]
# 成功时把 HTTP 状态码打到 stdout，响应体写入 $BODY_FILE。
api() {
  local method="$1" path="$2" data="${3:-}"
  local -a args=(
    -sS
    -X "$method"
    -o "$BODY_FILE"
    -w '%{http_code}'
    -H "Authorization: Bearer $TOKEN"
    -H "Accept: application/vnd.github+json"
    -H "X-GitHub-Api-Version: $API_VERSION"
    "$API$path"
  )
  if [ -n "$data" ]; then
    args+=(-H "Content-Type: application/json" --data-binary "$data")
  fi

  if [ "$DRY_RUN" = 1 ]; then
    say "[dry-run] $method $API$path"
    if [ -n "$data" ]; then
      say "[dry-run]   body: $data"
    fi
    return 0
  fi

  if ! curl "${args[@]}"; then
    warn "curl 请求失败：$method $path"
    return 1
  fi
}

# 失败时打印状态码与响应体前三行（响应体不含 token）。
fail_http() {
  local status="$1" action="$2"
  warn "✖ $action 失败（HTTP ${status:-000}）"
  if [ -s "$BODY_FILE" ]; then
    sed -n '1,3p' "$BODY_FILE" >&2
  fi
  exit 1
}

# ---------- 前置检查 ----------

for cmd in git curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    warn "缺少依赖：$cmd，请先安装后重试。"
    exit 1
  fi
done

if ! git -C "$REPO_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  warn "$REPO_DIR 不是 git 仓库。"
  exit 1
fi

if ! git -C "$REPO_DIR" rev-parse --verify --quiet "refs/heads/$BRANCH" >/dev/null; then
  warn "本地分支 $BRANCH 不存在，先提交并确认分支名（可用 BRANCH=... 覆盖）。"
  exit 1
fi

if [ -n "$(git -C "$REPO_DIR" status --porcelain)" ]; then
  warn "⚠ 工作区有未提交的改动；git push 只推送已提交的内容，请确认已 commit。"
fi

# ---------- PAT ----------

if [ "$DRY_RUN" = 1 ]; then
  warn "DRY_RUN=1：不读取 PAT，也不发起任何网络请求。"
else
  warn "需要一个有 repo 权限的 fine-grained PAT：https://github.com/settings/tokens"
  printf 'GitHub PAT（输入不回显，仅本次使用）：' >&2
  if ! read -rsp '' TOKEN; then
    warn ""
    warn "读取 PAT 失败。"
    exit 1
  fi
  printf '\n' >&2
  if [ -z "$TOKEN" ]; then
    warn "PAT 为空，退出。"
    exit 1
  fi
fi

# ---------- 仓库是否存在 ----------

say "→ 检查仓库 $OWNER/$REPO …"
if [ "$DRY_RUN" = 1 ]; then
  say "[dry-run] GET $API/repos/$OWNER/$REPO（假定不存在，继续演示创建流程）"
  status=404
else
  status="$(api GET "/repos/$OWNER/$REPO")" || exit 1
fi

case "$status" in
  200)
    say "仓库已存在，跳过创建。"
    ;;
  404)
    say "→ 创建仓库 $OWNER/$REPO（public）…"
    payload="$(printf '{"name":"%s","description":"%s","private":false,"has_issues":true,"has_wiki":false,"auto_init":false}' \
      "$REPO" "$DESCRIPTION")"
    if [ "$DRY_RUN" = 1 ]; then
      api POST "/user/repos" "$payload"
    else
      status="$(api POST "/user/repos" "$payload")" || exit 1
      case "$status" in
        201|200) say "已创建 https://github.com/$OWNER/$REPO" ;;
        *) fail_http "$status" "创建仓库" ;;
      esac
    fi
    ;;
  401|403)
    fail_http "$status" "仓库查询（PAT 无效或权限不足）"
    ;;
  *)
    fail_http "$status" "检查仓库"
    ;;
esac

# ---------- remote ----------

current_remote=""
if current_remote="$(git -C "$REPO_DIR" remote get-url origin 2>/dev/null)"; then
  if [ "$current_remote" = "$REMOTE_URL" ]; then
    say "→ remote origin 已指向 $REMOTE_URL"
  else
    warn "⚠ origin 当前指向：$current_remote"
    warn "  将改为：$REMOTE_URL"
    warn "  想保留旧地址可先手工执行：git remote add forgejo $current_remote"
    if [ "$DRY_RUN" != 1 ]; then
      printf '覆盖 origin 吗？[y/N] ' >&2
      read -r answer
      case "$answer" in
        [yY]|[yY][eE][sS]) ;;
        *) warn "已取消（remote 未改动）。"; exit 1 ;;
      esac
    fi
    run git -C "$REPO_DIR" remote set-url origin "$REMOTE_URL"
  fi
else
  run git -C "$REPO_DIR" remote add origin "$REMOTE_URL"
fi

# ---------- push ----------

say "→ 推送 $BRANCH 到 origin …"
run git -C "$REPO_DIR" push -u origin "$BRANCH"

# ---------- topics 与 description ----------
# 注：topics 接口对 fine-grained PAT 要求仓库 Administration 写权限；
# 若这里返回 403，可去网页 Settings → Topics 手动设置，其余步骤不受影响。

names="$(printf '"%s",' "${TOPICS[@]}")"
names="[${names%,}]"

say "→ 设置 topics：${TOPICS[*]}"
if [ "$DRY_RUN" = 1 ]; then
  api PUT "/repos/$OWNER/$REPO/topics" "{\"names\":$names}"
else
  status="$(api PUT "/repos/$OWNER/$REPO/topics" "{\"names\":$names}")" || exit 1
  [ "$status" = 200 ] || fail_http "$status" "设置 topics"
fi

say "→ 设置描述：$DESCRIPTION"
if [ "$DRY_RUN" = 1 ]; then
  api PATCH "/repos/$OWNER/$REPO" "{\"description\":\"$DESCRIPTION\"}"
else
  status="$(api PATCH "/repos/$OWNER/$REPO" "{\"description\":\"$DESCRIPTION\"}")" || exit 1
  [ "$status" = 200 ] || fail_http "$status" "设置描述"
fi

say ""
if [ "$DRY_RUN" = 1 ]; then
  say "DRY_RUN 完成：以上命令未执行。"
else
  say "完成：https://github.com/$OWNER/$REPO"
fi
