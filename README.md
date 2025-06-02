# 抖声 (DouTok)

抖声是一个仿抖音的短视频社交应用程序。它包含一个后端服务和一个前端应用程序。

## 项目结构

```
DouTok/
├── backend/         # 后端服务
├── frontend/        # 前端应用程序
├── env/             # 开发和部署所需的环境配置文件和脚本
├── sql/             # 数据库初始化和迁移脚本
├── imgs/            # 项目相关的图片资源
├── grafana.ini      # Grafana 配置文件
├── LICENSE          # 项目许可证
└── README.md        # 项目主 README
```

## 主要技术栈

*   **后端:** Go, Gin, gRPC, Kitex, GORM, Consul, Jaeger, Prometheus, Grafana, Loki, RocketMQ, Redis, MySQL, MinIO, Gorse (推荐系统)
*   **前端:** TypeScript, Next.js, React, Tailwind CSS
*   **部署运维:** Docker, Docker Compose, Makefile

## 快速开始

有关如何设置和运行后端及前端应用程序的详细说明，请参阅各自目录中的 README 文件：

*   [后端 README](./backend/README.md)
*   [前端 README](./frontend/README.md)

## 贡献

欢迎为此项目做出贡献！请随时提交 Pull Request 或创建 Issue。

## 许可证

该项目根据 [LICENSE](./LICENSE) 文件中的条款获得许可。
