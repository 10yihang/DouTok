# DouTok 前端 Makefile

.PHONY: help dev build start install lint clean docker-build docker-run docker-stop api

# 默认目标
help:
	@echo "DouTok 前端开发命令:"
	@echo "  dev          - 启动开发服务器"
	@echo "  build        - 构建生产版本"
	@echo "  start        - 启动生产服务器"
	@echo "  install      - 安装依赖"
	@echo "  lint         - 代码检查"
	@echo "  clean        - 清理构建文件"
	@echo "  api          - 生成 API 代码"
	@echo "  docker-build - 构建 Docker 镜像"
	@echo "  docker-run   - 运行 Docker 容器"
	@echo "  docker-stop  - 停止 Docker 容器"

# 开发
dev:
	@echo "🚀 启动开发服务器..."
	@pnpm dev

# 构建
build:
	@echo "🔨 构建生产版本..."
	@pnpm build

# 启动生产服务器
start:
	@echo "▶️  启动生产服务器..."
	@pnpm start

# 安装依赖
install:
	@echo "📦 安装依赖..."
	@pnpm install

# 代码检查
lint:
	@echo "🔍 代码检查..."
	@pnpm lint

# 清理
clean:
	@echo "🧹 清理构建文件..."
	@rm -rf .next
	@rm -rf node_modules
	@rm -rf dist

# 生成API代码
api:
	@echo "🔄 生成 API 代码..."
	@pnpm gen-svapi

# Docker 相关命令
docker-build:
	@echo "🐳 构建 Docker 镜像..."
	@docker build -t doutok-frontend .

docker-run:
	@echo "🚀 运行 Docker 容器..."
	@docker run -d --name doutok-frontend -p 23000:23000 doutok-frontend

docker-stop:
	@echo "🛑 停止 Docker 容器..."
	@docker stop doutok-frontend || true
	@docker rm doutok-frontend || true

# 开发环境完整启动
dev-full: install api dev

# 生产环境部署
deploy: clean install api build docker-build