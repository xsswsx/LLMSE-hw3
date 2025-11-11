#!/bin/bash

# 设置变量
IMAGE_NAME="ai-travel-planner"
TAG="latest"
PORT="3000"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装。请先安装 Docker。"
    exit 1
fi

# 构建镜像
echo "开始构建 Docker 镜像..."
docker build -t $IMAGE_NAME:$TAG .

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功"
    
    # 显示镜像信息
    echo ""
    echo "镜像信息:"
    docker images | grep $IMAGE_NAME
    
    # 运行说明
    echo ""
    echo "运行方式:"
    echo "1. 使用 Docker 运行: docker run -d -p $PORT:80 --name $IMAGE_NAME $IMAGE_NAME:$TAG"
    echo "2. 使用 Docker Compose: docker-compose up -d"
    echo "3. 访问应用: http://localhost:$PORT"
    
    # 保存镜像到文件
    echo ""
    read -p "是否将镜像保存为文件？(y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在保存镜像到文件..."
        docker save -o $IMAGE_NAME-$TAG.tar $IMAGE_NAME:$TAG
        echo "✅ 镜像已保存为: $IMAGE_NAME-$TAG.tar"
        echo "加载镜像命令: docker load -i $IMAGE_NAME-$TAG.tar"
    fi
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi