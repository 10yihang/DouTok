FROM golang:1.22-alpine AS builder

WORKDIR /build/backend/shortVideoApiService

ARG proxy=https://goproxy.cn,direct
ENV proxy=$proxy
RUN echo "proxy: $proxy"

ENV GOPROXY=${proxy}

# 复制 go.mod 和 go.sum
COPY backend/shortVideoApiService/go.mod backend/shortVideoApiService/go.sum ./

# 复制依赖模块的 go.mod 和 go.sum 到正确的相对路径位置
COPY backend/shortVideoCoreService/go.mod backend/shortVideoCoreService/go.sum ../shortVideoCoreService/
COPY backend/gopkgs/go.mod backend/gopkgs/go.sum ../gopkgs/
COPY backend/baseService/go.mod backend/baseService/go.sum ../baseService/

RUN go mod download

# 复制所有源代码
COPY backend/shortVideoApiService .
COPY backend/shortVideoCoreService ../shortVideoCoreService
COPY backend/gopkgs ../gopkgs
COPY backend/baseService ../baseService

RUN CGO_ENABLED=0 GOARCH=amd64 GOOS=linux go build -ldflags "-X google.golang.org/protobuf/reflect/protoregistry.conflictPolicy=warn" -a -o serve ./cmd/

FROM alpine:3.16 AS runner

WORKDIR /app

RUN mkdir tmp
RUN mkdir logs
RUN mkdir configs

# 安装必要的工具
RUN apk add --no-cache curl wget

COPY --from=builder /build/backend/shortVideoApiService/serve /app/serve
COPY backend/shortVideoApiService/configs /app/configs
COPY env/entrypoint.sh /app/entrypoint.sh
COPY backend/shortVideoApiService/promtail.yaml /app/promtail.yaml

# 下载预构建的 promtail 二进制文件
RUN curl -L https://github.com/grafana/loki/releases/download/v3.1.1/promtail-linux-amd64.zip -o promtail.zip \
    && unzip promtail.zip \
    && mv promtail-linux-amd64 /app/promtail \
    && chmod +x /app/promtail \
    && rm promtail.zip

# 下载 MinIO 客户端
RUN curl -L https://dl.min.io/client/mc/release/linux-amd64/mc -o /app/mc \
    && chmod +x /app/mc

ENTRYPOINT ["./entrypoint.sh"]
