# DouTok 项目一键启动 Makefile
# 确保所有服务以正确的顺序启动

.PHONY: all dev start stop clean install-deps help frontend backend env status logs build-images build-base build-core build-api

# 默认目标：启动所有服务
all: start

# 开发环境启动（推荐）
dev: check-deps build-images env backend frontend

# 生产环境启动
start: check-deps build-images env backend frontend

# 构建Docker镜像
build-images:
	@echo "🔨 构建Docker镜像..."
	@echo "构建 base-service..."
	@cd backend/baseService && docker build -t base-service . || echo "⚠️  base-service 构建失败，跳过..."
	@echo "构建 sv-core-service..."
	@cd backend/shortVideoCoreService && docker build -t sv-core-service . || echo "⚠️  sv-core-service 构建失败，跳过..."
	@echo "构建 sv-api-service..."
	@cd backend/shortVideoApiService && docker build -t sv-api-service . || echo "⚠️  sv-api-service 构建失败，跳过..."
	@echo "✅ Docker镜像构建完成"

# 使用 docker-compose 构建（会自动使用代理配置）
build-compose:
	@echo "🔨 使用 docker-compose 构建镜像..."
	@export GOPROXY=https://goproxy.cn,direct && cd env && docker-compose -f backends.yml build
	@echo "✅ Docker镜像构建完成"

# 构建单个镜像（用于开发）
build-base:
	@echo "🔨 构建 base-service..."
	@cd backend/baseService && docker build -t base-service .

build-core:
	@echo "🔨 构建 sv-core-service..."
	@cd backend/shortVideoCoreService && docker build -t sv-core-service .

build-api:
	@echo "🔨 构建 sv-api-service..."
	@cd backend/shortVideoApiService && docker build -t sv-api-service .

# 停止所有服务
stop:
	@echo "🛑 停止所有服务..."
	@cd env && docker-compose -f backends.yml down || true
	@cd env && docker-compose -f trace.yml down || true
	@cd env && docker-compose -f rocketmq.yml down || true
	@cd env && docker-compose -f basic.yml down || true
	@echo "✅ 所有服务已停止"

# 清理环境
clean: stop
	@echo "🧹 清理Docker资源..."
	@docker system prune -f || true
	@echo "✅ 清理完成"

# 检查依赖
check-deps:
	@echo "🔍 检查依赖..."
	@command -v docker >/dev/null 2>&1 || { echo "❌ 请先安装 Docker"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "❌ 请先安装 Docker Compose"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "❌ 请先安装 Node.js"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "❌ 请先安装 npm"; exit 1; }
	@command -v go >/dev/null 2>&1 || { echo "❌ 请先安装 Go"; exit 1; }
	@echo "✅ 依赖检查通过"

# 启动基础环境（数据库、缓存、消息队列等）
env:
	@echo "🚀 启动基础环境..."
	@cd env && make basic
	@echo "⏱️  等待基础服务启动..."
	@sleep 10
	@cd env && make mq
	@echo "⏱️  等待消息队列启动..."
	@sleep 5
	@cd env && make trace
	@echo "⏱️  等待链路追踪服务启动..."
	@sleep 5
	@echo "✅ 基础环境启动完成"

# 启动后端服务
backend:
	@echo "🔧 启动后端服务..."
	@cd env && docker-compose -f backends.yml up -d || echo "⚠️  部分后端服务启动失败，请检查日志"
	@echo "⏱️  等待后端服务启动..."
	@sleep 15
	@echo "✅ 后端服务启动完成"

# 启动前端服务
frontend:
	@echo "🎨 启动前端服务..."
	@echo "📦 检查前端依赖..."
	@cd frontend/doutok && pnpm install
	@echo "🚀 启动前端开发服务器..."
	@cd frontend/doutok && pnpm dev &
	@echo "✅ 前端服务启动完成，访问地址：http://localhost:23000"

# 查看服务状态
status:
	@echo "📊 服务状态检查..."
	@echo "\n🐳 Docker 容器状态："
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 查看日志
logs:
	@echo "📋 最近的服务日志..."
	@echo "后端服务日志："
	@cd env && docker-compose -f backends.yml logs --tail=50 || true

# 重启所有服务
restart: stop dev

# 快速启动（跳过依赖检查）
quick:
	@echo "⚡ 快速启动..."
	@make env
	@make backend
	@make frontend

# 帮助信息
help:
	@echo "📖 DouTok 项目 Makefile 使用说明"
	@echo ""
	@echo "🎯 主要命令："
	@echo "  make dev          - 启动开发环境（推荐）"
	@echo "  make start        - 启动生产环境"
	@echo "  make stop         - 停止所有服务"
	@echo "  make stop-backends - 停止后端服务"
	@echo "  make restart      - 重启所有服务"
	@echo ""
	@echo "🔨 构建命令："
	@echo "  make build-images - 构建所有Docker镜像"
	@echo "  make build-compose - 使用 docker-compose 构建（推荐）"
	@echo "  make build-base   - 构建 base-service 镜像"
	@echo "  make build-core   - 构建 sv-core-service 镜像"
	@echo "  make build-api    - 构建 sv-api-service 镜像"
	@echo ""
	@echo "🔧 其他命令："
	@echo "  make env          - 仅启动基础环境"
	@echo "  make backend      - 仅启动后端服务"
	@echo "  make frontend     - 仅启动前端服务"
	@echo "  make status       - 查看服务状态"
	@echo "  make logs         - 查看服务日志"
	@echo "  make clean        - 清理环境"
	@echo "  make quick        - 快速启动（跳过检查）"
	@echo ""
	@echo "🌐 服务地址："
	@echo "  前端开发环境: http://localhost:23000"
	@echo "  后端API:     http://localhost:22000"
