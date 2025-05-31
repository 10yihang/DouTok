package videoappprovider

import (
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/application/videoapp"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/conf"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/data/userdata"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/data/videodata"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/domain/service/videodomain"
	"github.com/cloudzenith/DouTok/backend/shortVideoCoreService/internal/server/commonprovider"
	"github.com/go-kratos/kratos/v2/log"
)

func InitVideoApplication(config *conf.Config, logger log.Logger) *videoapp.VideoApplication {
	videoRepo := videodata.NewVideoRepo()
	userRepo := userdata.NewUserRepo()
	gorseAdapter := commonprovider.InitGorseAdapter(config, logger)
	videoUsecase := videodomain.NewVideoUseCase(config, userRepo, videoRepo, gorseAdapter)
	videoApp := videoapp.NewVideoApplication(videoUsecase)
	return videoApp
}
