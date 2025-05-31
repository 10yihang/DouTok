package commonprovider

import (
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/conf"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/infrastructure/adapter/gorseadapter"
	"github.com/go-kratos/kratos/v2/log"
)

func InitGorseAdapter(config *conf.Config, logger log.Logger) gorseadapter.IGorseAdapter {
	// 默认 Gorse 配置，可以从配置文件读取
	endpoint := "http://localhost:8088"
	apiKey := ""

	// 如果配置中有 Gorse 配置，使用配置中的值
	// 这里可以根据实际的配置结构进行调整
	// if config.Gorse != nil {
	//     endpoint = config.Gorse.Endpoint
	//     apiKey = config.Gorse.ApiKey
	// }

	return gorseadapter.New(endpoint, apiKey, logger)
}
