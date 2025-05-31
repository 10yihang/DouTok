# Gorse 推荐系统集成

## 概述

本项目已集成 [Gorse](https://github.com/zhenghaoz/gorse) 推荐系统，用于提供个性化的短视频推荐。Gorse 是一个开源的推荐系统，支持协同过滤、基于内容的推荐和深度学习等多种推荐算法。

## 功能特性

### 1. 个性化推荐
- 基于用户历史行为（观看、点赞、发布等）进行个性化推荐
- 支持冷启动：新用户会获得热门内容推荐
- 自动学习用户偏好，推荐精度随使用时间提升

### 2. 多种反馈类型
- `read`：用户观看视频
- `like`：用户点赞视频  
- `publish`：用户发布视频
- `comment`：用户评论视频
- `collect`：用户收藏视频

### 3. 智能回退机制
- 当 Gorse 服务不可用时，自动回退到原有的时间排序推荐
- 推荐数量不足时，补充热门内容

## 技术实现

### 推荐流程

1. **用户请求推荐** (`/video/feed`)
   ```
   用户请求 → Gorse推荐 → 获取视频详情 → 记录观看行为 → 返回结果
   ```

2. **行为数据收集**
   - 观看：用户访问推荐接口时自动记录
   - 发布：用户上传视频时记录
   - 其他行为：可通过 `RecordUserBehavior` 方法记录

3. **内容管理**
   - 新视频发布时自动添加到 Gorse
   - 视频标题作为标签，用于内容推荐

### 核心组件

- **GorseAdapter**: Gorse 客户端适配器
- **Application.FeedShortVideo**: 集成 Gorse 的推荐接口
- **Application.RecordUserBehavior**: 用户行为记录接口

## 配置说明

### Gorse 服务配置

Gorse 服务通过 Docker Compose 启动，配置文件位于：
- `env/basic.yml`: Docker 服务配置
- `env/gorse/config.toml`: Gorse 详细配置

### 应用配置

当前 Gorse 连接配置硬编码在 `commonprovider/providers.go` 中：
```go
endpoint := "http://gorse:8088"  // Gorse HTTP API 地址
apiKey := ""                     // API 密钥（可选）
```

## 使用示例

### 获取推荐
```bash
curl -X POST http://localhost:8080/video/feed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"feed_num": 10}'
```

### 记录用户行为
在代码中记录用户行为：
```go
// 记录用户点赞行为
app.RecordUserBehavior(ctx, userId, videoId, "like")

// 记录用户评论行为  
app.RecordUserBehavior(ctx, userId, videoId, "comment")
```

## 性能优化

1. **异步处理**: 所有 Gorse 操作都在 goroutine 中异步执行，不影响接口响应时间
2. **缓存机制**: Gorse 内置 Redis 缓存，提升推荐性能
3. **批量操作**: 支持批量插入用户、物品和反馈数据

## 监控和调试

### Gorse 管理界面
访问 `http://localhost:8088` 查看 Gorse 管理界面，可以：
- 查看推荐效果统计
- 管理用户和物品数据
- 调整推荐参数

### 日志监控
应用日志中包含 Gorse 操作的详细信息：
- 推荐请求和响应
- 行为数据插入状态
- 错误和异常处理

## 未来改进

1. **配置化**: 将 Gorse 连接参数移至配置文件
2. **A/B 测试**: 支持对比 Gorse 推荐和传统推荐的效果
3. **更多反馈类型**: 增加分享、举报等行为类型
4. **实时特征**: 集成用户实时特征（地理位置、时间等）
5. **多样性控制**: 增加推荐结果的多样性控制

## 故障排除

### 常见问题

1. **Gorse 服务启动失败**
   - 检查 Docker 服务状态
   - 确认 MySQL 和 Redis 服务正常
   - 查看 Gorse 日志: `docker logs gorse`

2. **推荐结果为空**
   - 确认用户和视频数据已导入 Gorse
   - 检查 Gorse 模型训练状态
   - 使用回退推荐确保基本功能

3. **性能问题**
   - 调整 Gorse 配置中的缓存参数
   - 增加 Gorse 服务实例
   - 优化推荐请求频率
