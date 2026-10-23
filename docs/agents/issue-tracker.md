# Issue tracker: Forgejo

仓库：henri/dsh-radio
服务：http://192.168.100.237:8443
需求、规格、实现任务和讨论存放在该仓库的 Issues 中。

## 操作规则

使用 Forgejo REST API，仓库接口前缀为：
/api/v1/repos/henri/dsh-radio

本机没有 gh / glab，一律用 curl 调 API。

- 发布任务：POST /issues，每个任务一个 Issue。
- 获取任务：GET /issues/{index}。
- 更新任务：PATCH /issues/{index}。
- 关闭任务：PATCH /issues/{index}，正文 {"state":"closed"}。
- 列表查询：GET /issues?state=open&type=issues。
- 指派认领：PATCH /issues/{index}，正文 {"assignees":["henri"]}。
- 添加讨论：POST /issues/{index}/comments。
- 分类任务：使用 triage-labels.md 中的标签，仓库内标签名与角色同名。
  先 GET /labels 查标签 id，再 POST /issues/{index}/labels 正文 {"labels":[id]}；
  POST 为追加，PUT 为覆盖，DELETE 为清空。
- 规格可写在 Issue 正文中，关联任务引用 Issue 编号。

鉴权令牌从本机凭据文件读取：
/vol1/1000/docker/forgejo/ADMIN-CREDENTIALS.txt
令牌仅用于请求鉴权，不输出、不写入仓库。

## 请求范围

Issues 是需求入口；外部 PR 不纳入待分类请求。
