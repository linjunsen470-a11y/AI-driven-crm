# Prisma Migrations

当前仓库里的 `schema.prisma` 已经扩展到可覆盖：

- CRM 主链路
- 知识库
- AI Chat
- 提醒与推荐
- 忽略号码表
- 批量通话录音导入

由于当前 Codex 终端环境里 `node` 不在 PATH，本次没有直接运行 Prisma CLI 生成 migration。

请你在本机正常终端里执行：

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name phase2-core-schema
```

说明：

- 现在项目已经切换到 Prisma 7 配置方式
- `prisma.config.ts` 会负责 datasource URL
- 运行时 Prisma Client 会从 `generated/prisma` 目录生成

如果你数据库里还没有任何旧表，这是最推荐的第一条 migration 名称。

生成完成后，建议继续执行：

```bash
pnpm prisma studio
```

重点检查这些新表是否都已生成：

- `files`
- `ai_jobs`
- `customer_profile_snapshots`
- `tasks`
- `knowledge_documents`
- `knowledge_chunks`
- `chat_sessions`
- `chat_messages`
- `reminder_rules`
- `followup_recommendations`
- `ignored_phones`
- `call_import_batches`
- `call_import_items`
