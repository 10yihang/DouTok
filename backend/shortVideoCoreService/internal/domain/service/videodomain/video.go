package videodomain

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/conf"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/data/userdata"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/data/videodata"
	service_dto "github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/domain/dto"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/domain/entity"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/infrastructure/adapter/gorseadapter"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/infrastructure/persistence/model"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/infrastructure/persistence/query"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/infrastructure/utils"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/infrastructure/utils/tagging"
	"github.com/go-kratos/kratos/v2/log"
	"gorm.io/gorm"
)

type VideoUseCase struct {
	config      *conf.Config
	videoRepo   videodata.IVideoRepo
	userRepo    userdata.IUserRepo
	gorse       gorseadapter.IGorseAdapter
	videoTagger *tagging.VideoTagger
}

func NewVideoUseCase(
	config *conf.Config,
	userRepo userdata.IUserRepo,
	videoRepo videodata.IVideoRepo,
	gorse gorseadapter.IGorseAdapter,
) *VideoUseCase {
	return &VideoUseCase{
		config:      config,
		videoRepo:   videoRepo,
		userRepo:    userRepo,
		gorse:       gorse,
		videoTagger: tagging.NewVideoTagger(),
	}
}

func (uc *VideoUseCase) FeedShortVideo(ctx context.Context, request *service_dto.FeedShortVideoRequest) (*service_dto.FeedShortVideoResponse, error) {
	userIdStr := strconv.FormatInt(request.UserId, 10)

	// 首先尝试从Gorse获取个性化推荐
	recommendedVideoIds, err := uc.gorse.GetRecommendations(ctx, userIdStr, int(request.FeedNum))
	if err != nil {
		log.Context(ctx).Warnf("failed to get recommendations from gorse, falling back to default: %v", err)
		// 如果Gorse推荐失败，回退到原来的推荐逻辑
		return uc.fallbackFeed(ctx, request)
	}

	// 如果推荐数量不足，补充热门视频
	if len(recommendedVideoIds) < int(request.FeedNum) {
		popularIds, err := uc.gorse.GetPopularItems(ctx, int(request.FeedNum)-len(recommendedVideoIds))
		if err != nil {
			log.Context(ctx).Warnf("failed to get popular items: %v", err)
		} else {
			recommendedVideoIds = append(recommendedVideoIds, popularIds...)
		}
	}

	// 如果仍然没有推荐结果，使用原来的推荐逻辑
	if len(recommendedVideoIds) == 0 {
		log.Context(ctx).Warn("no recommendations from gorse, using fallback feed")
		return uc.fallbackFeed(ctx, request)
	}

	// 转换视频ID为int64
	var videoIds []int64
	for _, idStr := range recommendedVideoIds {
		if id, err := strconv.ParseInt(idStr, 10, 64); err == nil {
			videoIds = append(videoIds, id)
		}
	}

	// 从数据库获取视频详情
	videos, err := uc.videoRepo.FindByIdList(ctx, videoIds)
	if err != nil {
		log.Context(ctx).Errorf("failed to get videos by ids: %v", err)
		return nil, err
	}

	// 去重并查询用户
	uniqueUserIds := make(map[int64]struct{})
	for _, video := range videos {
		uniqueUserIds[video.UserID] = struct{}{}
	}
	userIds := make([]int64, 0, len(uniqueUserIds))
	for id := range uniqueUserIds {
		userIds = append(userIds, id)
	}
	users, err := uc.userRepo.FindByIds(ctx, query.Q, userIds)
	if err != nil {
		return nil, err
	}

	// 构建用户映射
	userMap := make(map[int64]*model.User, len(users))
	for _, user := range users {
		userMap[user.ID] = user
	}

	// 构建视频列表
	videoList := make([]*entity.Video, 0, len(videos))
	for _, videoModel := range videos {
		videoEntity := entity.FromVideoModel(videoModel)
		authorModel, ok := userMap[videoModel.UserID]
		if !ok {
			log.Warnf("user not found: %d", videoModel.UserID)
		}
		videoEntity.Author = entity.ToAuthorEntity(authorModel)
		videoList = append(videoList, videoEntity)
	}

	// 异步记录用户观看行为
	go func() {
		for _, video := range videoList {
			_ = uc.gorse.InsertFeedback(context.Background(), userIdStr, strconv.FormatInt(video.ID, 10), "read")
		}
	}()

	return &service_dto.FeedShortVideoResponse{
		Videos: videoList,
	}, nil
}

// fallbackFeed 原来的推荐逻辑，作为备选方案
func (uc *VideoUseCase) fallbackFeed(ctx context.Context, request *service_dto.FeedShortVideoRequest) (*service_dto.FeedShortVideoResponse, error) {
	latestTime := time.Now().UTC().Unix()
	if request.LatestTime > 0 {
		latestTime = request.LatestTime
	}

	videos, err := uc.videoRepo.GetVideoFeed(ctx, query.Q, request.UserId, latestTime, request.FeedNum)
	if err != nil {
		return nil, err
	}

	// 去重并查询用户
	uniqueUserIds := make(map[int64]struct{})
	for _, video := range videos {
		uniqueUserIds[video.UserID] = struct{}{}
	}
	userIds := make([]int64, 0, len(uniqueUserIds))
	for id := range uniqueUserIds {
		userIds = append(userIds, id)
	}
	users, err := uc.userRepo.FindByIds(ctx, query.Q, userIds)
	if err != nil {
		return nil, err
	}

	// 构建用户映射
	userMap := make(map[int64]*model.User, len(users))
	for _, user := range users {
		userMap[user.ID] = user
	}

	// 构建视频列表
	videoList := make([]*entity.Video, 0, len(videos))
	for _, videoModel := range videos {
		videoEntity := entity.FromVideoModel(videoModel)
		authorModel, ok := userMap[videoModel.UserID]
		if !ok {
			log.Warnf("user not found: %d", videoModel.UserID)
		}
		videoEntity.Author = entity.ToAuthorEntity(authorModel)
		videoList = append(videoList, videoEntity)
	}

	return &service_dto.FeedShortVideoResponse{
		Videos: videoList,
	}, nil
}

func (uc *VideoUseCase) PublishVideo(ctx context.Context, in *service_dto.PublishVideoRequest) (int64, error) {
	video := model.Video{
		ID:          utils.GetSnowflakeId(),
		UserID:      in.UserId,
		Title:       in.Title,
		Description: in.Description,
		VideoURL:    in.VideoURL,
		CoverURL:    in.CoverURL,
	}
	err := uc.videoRepo.Save(ctx, query.Q, &video)
	if err != nil {
		return 0, err
	}

	// 异步将视频信息添加到Gorse推荐系统
	go func() {
		videoIdStr := strconv.FormatInt(video.ID, 10)
		userIdStr := strconv.FormatInt(video.UserID, 10)

		// 提取视频标签
		tags := uc.videoTagger.ExtractTags(video.Title, video.Description)
		log.Context(context.Background()).Infof("extracted tags for video %d: %v", video.ID, tags)

		// 插入视频项目，包含分类和标签
		categories := []string{"video"}
		if err := uc.gorse.InsertItem(context.Background(), videoIdStr, categories, tags); err != nil {
			log.Context(context.Background()).Warnf("failed to insert video item to gorse: %v", err)
		}

		// 记录用户发布行为（表示用户对该类型内容的偏好）
		if err := uc.gorse.InsertFeedback(context.Background(), userIdStr, videoIdStr, "publish"); err != nil {
			log.Context(context.Background()).Warnf("failed to record publish feedback to gorse: %v", err)
		}
	}()

	return video.ID, nil
}

func (uc *VideoUseCase) GetVideoById(ctx context.Context, videoId int64) (*entity.Video, error) {
	video, err := uc.videoRepo.FindByID(ctx, query.Q, videoId)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("video not found: %d", videoId)
	}
	if err != nil {
		return nil, err
	}
	authorModel, err := uc.userRepo.FindByID(ctx, query.Q, video.UserID)
	if err != nil {
		return nil, err
	}
	videoEntity := entity.FromVideoModel(video)
	videoEntity.Author = entity.ToAuthorEntity(authorModel)
	return videoEntity, nil
}

func (uc *VideoUseCase) GetVideoByIdList(ctx context.Context, videoIdList []int64) ([]*entity.Video, error) {
	data, err := uc.videoRepo.FindByIdList(ctx, videoIdList)
	if err != nil {
		log.Context(ctx).Errorf("GetVideoByIdList error: %v", err)
		return nil, err
	}

	var result []*entity.Video
	for _, item := range data {
		result = append(result, entity.FromVideoModel(item))
	}

	return result, nil
}

func (uc *VideoUseCase) ListPublishedVideo(ctx context.Context, request *service_dto.ListPublishedVideoRequest) (*service_dto.ListPublishedVideoResponse, error) {
	latestTime := time.Now().UTC().Unix()
	if request.LatestTime > 0 {
		latestTime = request.LatestTime
	}

	user, err := uc.userRepo.FindByID(ctx, query.Q, request.UserId)
	if err != nil {
		return nil, err
	}

	videos, pageResp, err := uc.videoRepo.GetVideoList(ctx, query.Q, request.UserId, latestTime, request.Pagination)
	if err != nil {
		return nil, err
	}

	videoEntityList := entity.FromVideoModelList(videos)
	author := entity.ToAuthorEntity(user)
	for _, video := range videoEntityList {
		video.Author = author
	}

	return &service_dto.ListPublishedVideoResponse{
		Videos:     videoEntityList,
		Pagination: pageResp,
	}, nil
}

func (uc *VideoUseCase) SearchVideo(ctx context.Context, queryStr string, limit int) ([]*entity.Video, error) {
	videos, err := uc.videoRepo.SearchVideo(ctx, query.Q, queryStr, limit)
	if err != nil {
		log.Context(ctx).Errorf("failed to search video: %v", err)
		return nil, err
	}

	// 获取视频作者信息
	userIds := make([]int64, 0, len(videos))
	userIdSet := make(map[int64]bool)
	for _, video := range videos {
		if !userIdSet[video.UserID] {
			userIds = append(userIds, video.UserID)
			userIdSet[video.UserID] = true
		}
	}

	users, err := uc.userRepo.FindByIds(ctx, query.Q, userIds)
	if err != nil {
		log.Context(ctx).Errorf("failed to get video authors: %v", err)
		return nil, err
	}

	// 构建用户ID到用户模型的映射
	userMap := make(map[int64]*model.User)
	for _, user := range users {
		userMap[user.ID] = user
	}

	// 组装视频实体和作者信息
	videoEntityList := entity.FromVideoModelList(videos)
	for _, video := range videoEntityList {
		if user, exists := userMap[video.Author.ID]; exists {
			video.Author = entity.ToAuthorEntity(user)
		}
	}

	return videoEntityList, nil
}
