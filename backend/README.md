# 后端服务

抖声项目的后端服务。

## 服务

后端由以下微服务组成：

*   `baseService`: 提供基础服务，如用户认证、用户信息管理等。
*   `imService`: 处理即时通讯功能。
*   `manageApiService`: 提供管理后台的 API 接口。
*   `shortVideoApiService`: 提供短视频相关的 API 接口，如视频上传、列表、点赞、评论等。
*   `shortVideoCoreService`: 处理短视频的核心业务逻辑，如视频处理、推荐等。

`gopkgs` 目录包含一些共享的 Go 包。

## 技术栈

*   **语言:** Go
*   **框架/库:**
    *   Web 框架: Gin
    *   RPC 框架: Kitex (字节跳动)
    *   ORM: GORM
    *   服务注册与发现: Consul
    *   分布式追踪: Jaeger
    *   监控与告警: Prometheus, Grafana
    *   日志管理: Loki
    *   消息队列: RocketMQ
    *   缓存: Redis
    *   数据库: MySQL
    *   对象存储: MinIO
    *   推荐系统: Gorse
*   **构建与部署:** Docker, Docker Compose, Makefile

## 目录结构

每个服务通常遵循类似的目录结构：

```
serviceName/
├── Dockerfile        # Docker 镜像构建文件
├── entrypoint.sh     # Docker 容器入口脚本
├── gen.yml           # 代码生成配置文件 (例如 Kitex)
├── go.mod            # Go 模块文件
├── go.sum            # Go 模块校验和文件
├── golangci.yml      # Go linter 配置文件
├── Makefile          # 构建和任务管理脚本
├── openapi.yaml      # OpenAPI 规范文件 (如果适用)
├── promtail.yaml     # Promtail 配置文件 (用于 Loki)
├── README.md         # 服务特定的 README
├── api/              # API 定义 (例如 Protobuf, Thrift)
├── cmd/              # 服务入口 (main.go)
├── configs/          # 服务配置文件
├── internal/         # 服务内部逻辑 (业务代码、数据访问等)
├── logs/             # 日志文件目录
└── third_party/      # 第三方代码或依赖
```

## 环境配置与启动

1.  **配置:**
    *   主要的配置文件位于项目根目录下的 `env/` 目录中。
    *   `env/configs/` 目录下存放了各个服务的具体配置，这些配置会在容器启动时挂载到相应的服务中。
    *   确保根据你的环境修改 `env/basic.yml`, `env/backends.yml` 以及其他相关配置文件中的数据库连接信息、中间件地址等。

2.  **依赖:**
    *   确保已安装 Docker 和 Docker Compose。

3.  **启动服务:**
    *   进入 `env/` 目录。
    *   执行 `make up` 或 `docker-compose up -d` 来启动所有后端服务和依赖的中间件。
    *   各个服务也可以通过其各自的 `Makefile` 单独构建和运行 (主要用于开发)。

## API 文档

部分服务（如 `manageApiService`, `shortVideoApiService`, `shortVideoCoreService`）包含 `openapi.yaml` 文件，描述了其 HTTP API 接口。你可以使用 Swagger Editor 或其他 OpenAPI 工具来查看和交互这些 API。

## 代码生成

项目中使用 Kitex 等工具进行代码生成。通常，在 `Makefile` 中会有相关的命令（例如 `make gen` 或 `make api`）来执行代码生成任务。确保在修改 API 定义后重新生成代码。

## 日志与监控

*   **日志:** 服务日志通过 Promtail 收集并发送到 Loki。你可以在 Grafana 中配置 Loki 数据源来查看日志。
*   **监控:** 服务通过 Prometheus 进行监控，并在 Grafana 中展示监控指标。
*   **追踪:** 分布式追踪通过 Jaeger 实现。

## 注意事项

*   确保所有依赖的中间件（MySQL, Redis, RocketMQ, Consul, MinIO, Gorse 等）已正确配置并正在运行。
*   检查各个服务的 `promtail.yaml` 配置，确保日志能够正确发送到 Loki。
*   `gopkgs` 目录下的包是共享的，修改时需要注意对其他服务的影响。
