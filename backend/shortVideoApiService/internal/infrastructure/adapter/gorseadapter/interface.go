package gorseadapter

import "context"

// IGorseAdapter Gorse推荐服务适配器接口
type IGorseAdapter interface {
	// GetRecommendations 获取用户推荐视频列表
	GetRecommendations(ctx context.Context, userId string, num int) ([]string, error)

	// InsertFeedback 插入用户反馈（观看、点赞等行为）
	InsertFeedback(ctx context.Context, userId, itemId, feedbackType string) error

	// InsertUser 插入用户信息
	InsertUser(ctx context.Context, userId string, labels []string) error

	// InsertItem 插入视频信息
	InsertItem(ctx context.Context, itemId string, categories []string, labels []string) error

	// GetPopularItems 获取热门视频（冷启动时使用）
	GetPopularItems(ctx context.Context, num int) ([]string, error)
}
