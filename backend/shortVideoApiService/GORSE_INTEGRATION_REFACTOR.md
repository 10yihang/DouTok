# Gorse 推荐系统集成说明

## 架构重构说明

⚠️ **重要**: 原先在 shortVideoApiService 中的 Gorse 集成是错误的架构设计。根据微服务架构原则，推荐逻辑应该在核心业务服务中实现。

### 正确的架构分层

- **shortVideoCoreService**: 负责核心业务逻辑，包括推荐算法和用户行为记录
- **shortVideoApiService**: 只负责 HTTP 接口层，处理请求/响应的转换

## 当前状态 

### ✅ 已完成 (shortVideoCoreService)
1. 添加了 Gorse 客户端依赖 (`github.com/zhenghaoz/gorse/client`)
2. 创建了 Gorse 适配器接口和实现
3. 修改了 VideoUseCase 以支持 Gorse 推荐
4. 实现了智能推荐策略：
   - 首选：Gorse 个性化推荐
   - 补充：热门内容推荐
   - 降级：原有时间排序
5. 在视频发布时异步记录到 Gorse
6. 在视频推送时异步记录用户观看行为
7. 配置了依赖注入

### 🔄 需要清理 (shortVideoApiService)
1. 移除错误添加的 Gorse 适配器代码
2. 恢复 API 服务的纯接口层职责

## 核心功能

### 推荐策略 (在 shortVideoCoreService 中)
```go
func (uc *VideoUseCase) FeedShortVideo(ctx context.Context, request *service_dto.FeedShortVideoRequest) (*service_dto.FeedShortVideoResponse, error) {
    userIdStr := strconv.FormatInt(request.UserId, 10)
    
    // 1. 尝试获取个性化推荐
    recommendedVideoIds, err := uc.gorse.GetRecommendations(ctx, userIdStr, int(request.FeedNum))
    if err != nil {
        // 降级到原有逻辑
        return uc.fallbackFeed(ctx, request)
    }
    
    // 2. 如果推荐不足，补充热门内容
    if len(recommendedVideoIds) < int(request.FeedNum) {
        popularIds, _ := uc.gorse.GetPopularItems(ctx, int(request.FeedNum)-len(recommendedVideoIds))
        recommendedVideoIds = append(recommendedVideoIds, popularIds...)
    }
    
    // 3. 如果仍然没有推荐，使用原有逻辑
    if len(recommendedVideoIds) == 0 {
        return uc.fallbackFeed(ctx, request)
    }
    
    // 4. 异步记录用户观看行为
    go func() {
        for _, video := range videoList {
            _ = uc.gorse.InsertFeedback(context.Background(), userIdStr, strconv.FormatInt(video.ID, 10), "read")
        }
    }()
    
    return &service_dto.FeedShortVideoResponse{Videos: videoList}, nil
}
```

### 行为记录 (在 shortVideoCoreService 中)
```go
func (uc *VideoUseCase) PublishVideo(ctx context.Context, in *service_dto.PublishVideoRequest) (int64, error) {
    // 保存视频到数据库
    err := uc.videoRepo.Save(ctx, query.Q, &video)
    if err != nil {
        return 0, err
    }
    
    // 异步添加到 Gorse
    go func() {
        videoIdStr := strconv.FormatInt(video.ID, 10)
        userIdStr := strconv.FormatInt(video.UserID, 10)
        
        // 插入视频项目
        _ = uc.gorse.InsertItem(context.Background(), videoIdStr, []string{"video"}, []string{video.Title, video.Description})
        
        // 记录发布行为
        _ = uc.gorse.InsertFeedback(context.Background(), userIdStr, videoIdStr, "publish")
    }()
    
    return video.ID, nil
}
```

## 依赖注入配置

### shortVideoCoreService
```go
// internal/server/commonprovider/provider.go
func InitGorseAdapter(config *conf.Config, logger log.Logger) gorseadapter.IGorseAdapter {
    endpoint := "http://localhost:8087"  // 可以从配置文件读取
    apiKey := ""
    return gorseadapter.New(endpoint, apiKey, logger)
}

// internal/server/videoappprovider/provider.go
func InitVideoApplication(config *conf.Config, logger log.Logger) *videoapp.VideoApplication {
    videoRepo := videodata.NewVideoRepo()
    userRepo := userdata.NewUserRepo()
    gorseAdapter := commonprovider.InitGorseAdapter(config, logger)
    videoUsecase := videodomain.NewVideoUseCase(config, userRepo, videoRepo, gorseAdapter)
    return videoapp.NewVideoApplication(videoUsecase)
}
```

## 下一步工作

### 1. 清理 shortVideoApiService
- [ ] 移除 `internal/infrastructure/adapter/gorseadapter/` 目录
- [ ] 恢复 `internal/applications/videoapp/application.go` 到原来的简单状态
- [ ] 移除 Wire 配置中的 Gorse 相关代码
- [ ] 移除 `go.mod` 中的 Gorse 依赖

### 2. 完善 shortVideoCoreService
- [ ] 在点赞服务中添加 Gorse 行为记录
- [ ] 在评论服务中添加 Gorse 行为记录
- [ ] 在收藏服务中添加 Gorse 行为记录
- [ ] 添加配置文件支持 Gorse 连接参数

### 3. 配置和部署
- [ ] 更新 Docker Compose 配置
- [ ] 添加 Gorse 服务到部署脚本
- [ ] 创建 Gorse 配置文件

## 支持的行为类型

- `read`: 用户观看视频 (在 FeedShortVideo 中自动记录)
- `publish`: 用户发布视频 (在 PublishVideo 中自动记录)
- `like`: 用户点赞视频 (需要在点赞服务中添加)
- `comment`: 用户评论视频 (需要在评论服务中添加)
- `collect`: 用户收藏视频 (需要在收藏服务中添加)

## 性能和可靠性

- ✅ 所有 Gorse 操作都是异步的，不影响主业务响应时间
- ✅ 推荐失败时有完整的降级机制
- ✅ 支持热门内容补充，确保推荐数量充足
- ✅ 错误处理完善，有详细的日志记录

## 注意事项

1. **架构分层**: 严格遵循微服务架构，业务逻辑在 Core 服务，接口在 API 服务
2. **异步处理**: 所有推荐系统操作都是异步的，保证性能
3. **错误恢复**: 推荐系统故障不会影响基本业务功能
4. **数据一致性**: 视频发布和推荐数据更新保持最终一致性
