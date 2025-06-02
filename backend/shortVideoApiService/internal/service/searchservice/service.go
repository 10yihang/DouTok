package searchservice

import (
	"context"
	"strings"

	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/api/svapi"
	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/internal/applications/userapp"
	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/internal/applications/videoapp"
)

type Service struct {
	userApp  *userapp.Application
	videoApp *videoapp.Application
}

func New(userApp *userapp.Application, videoApp *videoapp.Application) *Service {
	return &Service{userApp: userApp, videoApp: videoApp}
}

func (s *Service) Search(ctx context.Context, req *svapi.ContentSearchRequest) (*svapi.ContentSearchResponse, error) {
	query := strings.TrimSpace(req.Query)
	resp := &svapi.ContentSearchResponse{}

	switch req.Type {
	case svapi.SearchType_SEARCH_TYPE_USER:
		userList, _ := s.userApp.SearchUser(ctx, query, req.Pagination)
		resp.Users = userList
	case svapi.SearchType_SEARCH_TYPE_VIDEO:
		videoList, _ := s.videoApp.SearchVideo(ctx, query, req.Pagination)
		resp.Videos = videoList
	case svapi.SearchType_SEARCH_TYPE_ALL:
		userList, _ := s.userApp.SearchUser(ctx, query, req.Pagination)
		resp.Users = userList
		videoList, _ := s.videoApp.SearchVideo(ctx, query, req.Pagination)
		resp.Videos = videoList
	}
	// TODO: 分页信息
	return resp, nil
}
