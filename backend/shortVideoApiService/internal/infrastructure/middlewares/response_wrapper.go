package middlewares

import (
	"encoding/json"
	"net/http"

	"github.com/cloudzenith/DouTok/backend/gopkgs/errorx"
	"github.com/go-kratos/kratos/v2/errors"
	kratoshttp "github.com/go-kratos/kratos/v2/transport/http"
)

type ApiResponseWrapper struct {
	Code int32       `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data,omitempty"`
}

// ResponseEncoderWrapper 创建一个响应编码器包装器
func ResponseEncoderWrapper() kratoshttp.ServerOption {
	return kratoshttp.ResponseEncoder(func(w http.ResponseWriter, r *http.Request, v interface{}) error {
		// 如果 v 是 error 类型，处理错误
		if err, ok := v.(error); ok {
			wrapper := &ApiResponseWrapper{}
			if se := errors.FromError(err); se != nil {
				wrapper.Code = se.Code
				wrapper.Msg = se.Message
			} else {
				wrapper.Code = errorx.UnknownErrorCode
				wrapper.Msg = err.Error()
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK) // 总是返回 200，错误信息在 body 中
			return json.NewEncoder(w).Encode(wrapper)
		}

		// 处理成功响应
		wrapper := &ApiResponseWrapper{
			Code: errorx.SuccessCode,
			Msg:  errorx.SuccessMsg,
			Data: v,
		}

		w.Header().Set("Content-Type", "application/json")
		return json.NewEncoder(w).Encode(wrapper)
	})
}
