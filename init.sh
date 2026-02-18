#!/bin/bash

# =============================================================================
# init.sh - 项目初始化脚本
# 支持: React + Node.js 全栈项目
# =============================================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  项目初始化脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查环境
echo -e "${YELLOW}🔍 检查环境...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js: $(node -v)${NC}"
echo -e "${GREEN}✓ npm: $(npm -v)${NC}"
echo ""

# 函数：安装依赖
install_deps() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}📦 安装 $name 依赖...${NC}"
        cd "$dir"
        
        if [ ! -d "node_modules" ]; then
            npm install
        else
            echo -e "${GREEN}✓ $name 依赖已安装${NC}"
        fi
        
        cd ..
    fi
}

# 安装前端依赖
if [ -d "frontend" ] || [ -d "client" ]; then
    DIR="frontend"
    [ -d "client" ] && DIR="client"
    install_deps "$DIR" "前端"
fi

# 安装后端依赖
if [ -d "backend" ] || [ -d "server" ] || [ -d "api" ]; then
    DIR="backend"
    [ -d "server" ] && DIR="server"
    [ -d "api" ] && DIR="api"
    install_deps "$DIR" "后端"
fi

# 根目录依赖
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 检查根目录依赖...${NC}"
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✓ 根目录依赖已安装${NC}"
    fi
fi

echo ""

# 类型检查
echo -e "${YELLOW}🔍 运行类型检查...${NC}"

if [ -f "tsconfig.json" ]; then
    if npx tsc --noEmit 2>/dev/null; then
        echo -e "${GREEN}✓ 类型检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️ 类型检查发现问题（非阻塞）${NC}"
    fi
fi

echo ""

# 启动开发服务器
echo -e "${YELLOW}🚀 启动开发服务器...${NC}"

# 查找可用的启动脚本
if grep -q '"dev"' package.json 2>/dev/null; then
    echo -e "${GREEN}✓ 发现 dev 脚本${NC}"
    
    # 检测端口
    PORT=5173
    if netstat -ano | grep -q ":$PORT"; then
        PORT=3000
    fi
    
    echo -e "${YELLOW}📝 启动命令: npm run dev${NC}"
    echo -e "${YELLOW}📝 将使用端口: $PORT${NC}"
    echo ""
    
    npm run dev &
    SERVER_PID=$!
    
    # 等待服务器启动
    echo "等待服务器启动..."
    sleep 3
    
    echo -e "${GREEN}✓ 开发服务器已启动 (PID: $SERVER_PID)${NC}"
    
elif grep -q '"start"' package.json 2>/dev/null; then
    echo -e "${GREEN}✓ 发现 start 脚本${NC}"
    npm start &
    SERVER_PID=$!
    sleep 3
    echo -e "${GREEN}✓ 服务器已启动${NC}"
else
    echo -e "${YELLOW}⚠️ 未找到 dev/start 脚本，请手动启动${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 初始化完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "可用命令:"
echo -e "  ${BLUE}npm run dev${NC}     - 启动开发服务器"
echo -e "  ${BLUE}npm run build${NC}   - 生产构建"
echo -e "  ${BLUE}npm run lint${NC}    - 代码检查"
echo -e "  ${BLUE}npx tsc --noEmit${NC} - 类型检查"
echo ""

# 保持脚本运行
if [ ! -z "$SERVER_PID" ]; then
    wait $SERVER_PID
fi
