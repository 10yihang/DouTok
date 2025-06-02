package searchappprovider

import (
	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/internal/applications/userapp"
	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/internal/applications/videoapp"
	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/internal/server/commonprovider"
	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/internal/service/searchservice"
	"github.com/google/wire"
)

var SearchAppProvider = wire.NewSet(
	searchservice.New,
	userapp.New,
	videoapp.New,
	commonprovider.BaseAdapterProvider,
	commonprovider.CoreAdapterProvider,
	commonprovider.VideoServiceProvider,
)
