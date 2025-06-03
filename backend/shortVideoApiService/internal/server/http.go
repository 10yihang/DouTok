package server

import (
	"context"

	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/api/svapi"
	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/internal/infrastructure/middlewares"
	"github.com/cloudzenith/DouTok/backend/shortVideoApiService/internal/infrastructure/utils/claims"
	"github.com/go-kratos/kratos/v2/middleware/auth/jwt"
	"github.com/go-kratos/kratos/v2/middleware/selector"
	"github.com/go-kratos/kratos/v2/middleware/tracing"
	"github.com/go-kratos/kratos/v2/transport/http"
	jwt5 "github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/handlers"
)

func TokenParseWhiteList() selector.MatchFunc {
	whileList := make(map[string]struct{})
	whileList["/svapi.UserService/GetVerificationCode"] = struct{}{}
	whileList["/svapi.UserService/Register"] = struct{}{}
	whileList["/svapi.UserService/Login"] = struct{}{}
	whileList["/svapi.SearchService/Search"] = struct{}{}
	whileList["/svapi.ShortVideoCoreVideoService/FeedShortVideo"] = struct{}{}
	whileList["/svapi.ShortVideoCoreVideoService/GetShortVideo"] = struct{}{}
	whileList["/svapi.ShortVideoCoreVideoService/GetShortVideoList"] = struct{}{}
	return func(ctx context.Context, operation string) bool {
		if _, ok := whileList[operation]; ok {
			return false
		}

		return true
	}
}

func NewHttpServer() *http.Server {
	var opts = []http.ServerOption{
		middlewares.ResponseEncoderWrapper(), // 使用自定义响应编码器
		http.Filter(
			//跨域处理
			handlers.CORS(
				handlers.AllowedHeaders([]string{"Content-Type", "x-token", "Authorization"}),
				handlers.AllowedMethods([]string{"GET", "POST", "PUT", "HEAD", "OPTIONS", "DELETE"}),
				handlers.AllowedOrigins([]string{"*"}),
			),
		),
		http.Middleware(
			middlewares.RequestMonitor(),
			tracing.Server(),
			selector.Server(
				jwt.Server(
					func(token *jwt5.Token) (interface{}, error) {
						return []byte("token"), nil
					},
					jwt.WithClaims(func() jwt5.Claims {
						return &claims.Claims{}
					}),
				),
			).Match(TokenParseWhiteList()).Build(),
			// httprespwrapper.HttpResponseWrapper(), // 注释掉避免类型转换错误
		),
		http.Address("0.0.0.0:22000"),
	}

	srv := http.NewServer(opts...)

	svapi.RegisterUserServiceHTTPServer(srv, initUserApp())
	svapi.RegisterShortVideoCoreVideoServiceHTTPServer(srv, initVideoApp())
	svapi.RegisterFileServiceHTTPServer(srv, initFileApp())
	svapi.RegisterCollectionServiceHTTPServer(srv, initCollectionApp())
	svapi.RegisterCommentServiceHTTPServer(srv, initCommentApp())
	svapi.RegisterFavoriteServiceHTTPServer(srv, initFavoriteApp())
	svapi.RegisterFollowServiceHTTPServer(srv, initFollowApp())
	svapi.RegisterSearchServiceHTTPServer(srv, initSearchApp())
	return srv
}
