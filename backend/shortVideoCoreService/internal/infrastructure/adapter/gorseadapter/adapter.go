package gorseadapter

import (
	"context"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/zhenghaoz/gorse/client"
)

type Adapter struct {
	client *client.GorseClient
	logger *log.Helper
}

// New 创建Gorse适配器
func New(endpoint, apiKey string, logger log.Logger) *Adapter {
	gorseClient := client.NewGorseClient(endpoint, apiKey)
	return &Adapter{
		client: gorseClient,
		logger: log.NewHelper(logger),
	}
}

// GetRecommendations 获取用户推荐视频列表
func (a *Adapter) GetRecommendations(ctx context.Context, userId string, num int) ([]string, error) {
	recommendations, err := a.client.GetRecommend(ctx, userId, "", num)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("failed to get recommendations for user %s: %v", userId, err)
		return nil, err
	}

	a.logger.WithContext(ctx).Infof("get %d recommendations for user %s", len(recommendations), userId)
	return recommendations, nil
}

// InsertFeedback 插入用户反馈
func (a *Adapter) InsertFeedback(ctx context.Context, userId, itemId, feedbackType string) error {
	feedback := client.Feedback{
		FeedbackType: feedbackType,
		UserId:       userId,
		ItemId:       itemId,
		Timestamp:    time.Now().Format(time.RFC3339),
	}

	_, err := a.client.InsertFeedback(ctx, []client.Feedback{feedback})
	if err != nil {
		a.logger.WithContext(ctx).Errorf("failed to insert feedback: %v", err)
		return err
	}

	a.logger.WithContext(ctx).Infof("inserted feedback: user=%s, item=%s, type=%s", userId, itemId, feedbackType)
	return nil
}

// InsertUser 插入用户信息
func (a *Adapter) InsertUser(ctx context.Context, userId string, labels []string) error {
	user := client.User{
		UserId: userId,
		Labels: labels,
	}

	_, err := a.client.InsertUser(ctx, user)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("failed to insert user %s: %v", userId, err)
		return err
	}

	a.logger.WithContext(ctx).Infof("inserted user: %s with labels: %v", userId, labels)
	return nil
}

// InsertItem 插入视频信息
func (a *Adapter) InsertItem(ctx context.Context, itemId string, categories []string, labels []string) error {
	item := client.Item{
		ItemId:     itemId,
		Categories: categories,
		Labels:     labels,
		Timestamp:  time.Now().Format(time.RFC3339),
	}

	_, err := a.client.InsertItem(ctx, item)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("failed to insert item %s: %v", itemId, err)
		return err
	}

	a.logger.WithContext(ctx).Infof("inserted item: %s with categories: %v, labels: %v", itemId, categories, labels)
	return nil
}

// GetPopularItems 获取热门视频（使用会话推荐模拟）
func (a *Adapter) GetPopularItems(ctx context.Context, num int) ([]string, error) {
	// 对于冷启动，使用空的反馈列表进行会话推荐
	scores, err := a.client.SessionRecommend(ctx, []client.Feedback{}, num)
	if err != nil {
		a.logger.WithContext(ctx).Errorf("failed to get popular items: %v", err)
		return nil, err
	}

	var items []string
	for _, score := range scores {
		items = append(items, score.Id)
	}

	a.logger.WithContext(ctx).Infof("get %d popular items", len(items))
	return items, nil
}

var _ IGorseAdapter = (*Adapter)(nil)
