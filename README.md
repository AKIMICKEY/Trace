# 智能日记本

一个基于 AI 的智能日记应用，支持日记记录、AI 评价和用户画像功能。

## 项目结构

```
日记本/
├── backend/          # 后端服务 (FastAPI)
│   ├── app/
│   │   ├── main.py       # 应用入口
│   │   ├── config.py     # 配置
│   │   ├── database.py   # 数据库
│   │   ├── models.py     # 数据模型
│   │   ├── schemas.py    # Pydantic 模型
│   │   ├── routes.py     # API 路由
│   │   └── ai_service.py # AI 服务
│   ├── requirements.txt
│   └── .env.example
└── frontend/         # 前端应用 (React + Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── api.js
    │   ├── index.css
    │   └── pages/
    │       ├── Home.jsx
    │       ├── DiaryDetail.jsx
    │       └── Profile.jsx
    ├── package.json
    └── vite.config.js
```

## 快速开始

### 1. 配置后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 复制环境配置
copy .env.example .env

# 编辑 .env 文件，填入你的 DeepSeek API Key
# DEEPSEEK_API_KEY=your_api_key_here
```

### 2. 启动后端

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 安装前端依赖

```bash
cd frontend
npm install
```

### 4. 启动前端

```bash
cd frontend
npm run dev
```

### 5. 访问应用

打开浏览器访问 http://localhost:3000

## 功能特性

- **日记管理**: 创建、编辑、删除日记
- **日历视图**: 按月查看日记记录
- **AI 评价**: 点击"AI说"获取多角度评价
- **用户画像**: 基于日记内容生成个性化画像

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/diaries | 获取日记列表或指定日期日记 |
| POST | /api/v1/diaries | 创建或更新日记 |
| DELETE | /api/v1/diaries/{id} | 删除日记 |
| POST | /api/v1/diaries/{id}/ai-evaluate | 生成 AI 评价 |
| GET | /api/v1/calendar | 获取月度日历数据 |
| GET | /api/v1/portraits/latest | 获取最新用户画像 |
| POST | /api/v1/portraits/generate | 生成用户画像 |
