package favoriteappprovider

import (
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/application/favoriteapp"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/conf"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/domain/service/favoriteservice"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/infrastructure/repositories/favoriterepo"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/server/commonprovider"
	"github.com/go-kratos/kratos/v2/log"
)

func InitFavoriteApp(config *conf.Config, logger log.Logger) *favoriteapp.Application {
	favoriteRepo := favoriterepo.New()
	gorseAdapter := commonprovider.InitGorseAdapter(config, logger)
	favoriteService := favoriteservice.New(favoriteRepo, gorseAdapter, logger)
	favoriteApp := favoriteapp.New(favoriteService)
	return favoriteApp
}
