package collectionappprovider

import (
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/application/collectionapp"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/conf"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/domain/service/collectionservice"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/infrastructure/repositories/collectionrepo"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/server/commonprovider"
	"github.com/go-kratos/kratos/v2/log"
)

func InitCollectionApplication(config *conf.Config, logger log.Logger) *collectionapp.Application {
	collectionRepo := collectionrepo.New()
	gorseAdapter := commonprovider.InitGorseAdapter(config, logger)
	collectionService := collectionservice.New(collectionRepo, gorseAdapter, logger)
	collectionApp := collectionapp.New(collectionService)
	return collectionApp
}
