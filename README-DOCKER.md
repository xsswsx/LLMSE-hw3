# AI Travel Planner - Docker 部署指南

## 概述

本项目提供了完整的 Docker 部署方案，支持单机部署和容器化运行。

## 快速开始

### 前提条件

- Docker 20.10+ 版本
- Docker Compose 1.29+ 版本（可选）

### 方法一：使用构建脚本（推荐）

```bash
# 给脚本执行权限
chmod +x build-docker.sh

# 运行构建脚本
./build-docker.sh
```

### 方法二：手动构建

```bash
# 构建镜像
docker build -t ai-travel-planner:latest .

# 运行容器
docker run -d -p 3000:80 --name ai-travel-planner ai-travel-planner:latest
```

### 方法三：使用 Docker Compose

```bash
# 构建并启动
docker-compose up -d

# 停止服务
docker-compose down
```

## 访问应用

构建完成后，访问：http://localhost:3000

## 镜像管理

### 保存镜像到文件

```bash
# 保存镜像
docker save -o ai-travel-planner-latest.tar ai-travel-planner:latest

# 加载镜像
docker load -i ai-travel-planner-latest.tar
```

### 常用命令

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs ai-travel-planner

# 停止容器
docker stop ai-travel-planner

# 删除容器
docker rm ai-travel-planner

# 删除镜像
docker rmi ai-travel-planner:latest
```

## 环境配置

应用的环境变量已在构建时嵌入，包括：

- Supabase 配置
- 火山方舟 API 配置
- 讯飞语音 API 配置

如果需要修改配置，请修改 `.env` 文件后重新构建镜像。

## 健康检查

容器内置健康检查，可以通过以下方式验证：

```bash
# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' ai-travel-planner

# 直接访问健康检查端点
curl http://localhost:3000/health
```

## 性能优化

镜像已配置：

- 多阶段构建，减少镜像大小
- Nginx 静态资源缓存
- Gzip 压缩
- 安全头设置
- 非 root 用户运行

## 故障排除

### 端口冲突

如果 3000 端口被占用，可以修改端口：

```bash
docker run -d -p 8080:80 --name ai-travel-planner ai-travel-planner:latest
```

### 构建失败

1. 确保网络连接正常
2. 检查 Docker 服务状态
3. 清理缓存后重试：`docker system prune -f`

### 容器无法启动

查看详细日志：

```bash
docker logs ai-travel-planner
```

## 生产部署

对于生产环境，建议：

1. 使用专用镜像仓库
2. 配置 HTTPS 证书
3. 设置资源限制
4. 配置监控和告警

## 技术支持

如有问题，请检查：

1. Docker 版本是否符合要求
2. 系统资源是否充足
3. 网络连接是否正常