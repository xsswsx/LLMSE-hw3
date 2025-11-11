# 多阶段构建 - 第一阶段：构建环境
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 第二阶段：生产环境
FROM nginx:alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制构建好的文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建日志目录并设置权限
RUN mkdir -p /var/log/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]