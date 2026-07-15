# Gin Admin
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.9-409EFF?logo=element)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

基于 **Vue 3 + Vite + Element Plus** 的现代化企业级后台管理系统。支持动态主题、多语言国际化、后端控制路由、多种布局模式。

**感谢 vue-next-admin 提供的前端模版**
- 项目地址: https://gitee.com/lyt-top/vue-next-admin

**前端仓库：**
- [gin-admin (GitHub)](https://github.com/dsxwk/gin-web.git)
- [gin-admin (Gitee)](https://gitee.com/dsxwk/gin-web.git)

**后端仓库：**
- [gin-admin (GitHub)](https://github.com/dsxwk/gin-admin.git)
- [gin-admin (Gitee)](https://gitee.com/dsxwk/gin-admin.git)

## ✨ 功能特性
- **多布局模式** — 默认、经典、横向、分栏四种布局一键切换
- **主题定制** — 主色切换、深色模式、导航栏渐变、灰色/色弱模式
- **多语言国际化** — 简体中文、繁体中文、英文
- **后端控制路由** — 根据服务端权限动态生成路由菜单
- **TagsView 标签页** — 支持拖拽排序、缓存、共享
- **丰富业务组件** — 文章管理、用户/角色/菜单/字典/系统配置 CRUD 弹窗
- **ECharts 集成** — 仪表盘与数据可视化
- **富文本编辑** — WangEditor 富文本编辑器
- **多方式登录** — 账号登录、手机登录、扫码登录
- **自动锁屏** — 超时自动锁定屏幕
- **导出与打印** — 表格导出 Excel、Print.js 打印
- **响应式适配** — 移动端支持，集成 vConsole 调试

## 🛠️ 技术栈
| 类别          | 技术                              |
|---------------|-----------------------------------|
| 框架          | Vue 3 (Composition API + `<script setup>`) |
| 构建工具      | Vite 6                            |
| UI 库         | Element Plus 2.9                  |
| 状态管理      | Pinia 3                           |
| 路由          | Vue Router 4                      |
| 国际化        | vue-i18n 11                       |
| 图表          | ECharts 5 + vue-echarts 7         |
| HTTP 客户端   | Axios                             |
| 富文本        | WangEditor 5                      |
| CSS 预处理器  | Sass / Less                       |
| 图标          | Element Plus Icons                |

## 📦 项目结构
```
gin-web
├── api/                  # API 接口定义
│   ├── article/
│   ├── configCategory/
│   ├── dict/
│   ├── login/
│   ├── menu/
│   ├── role/
│   ├── systemConfig/
│   └── user/
├── components/           # 公共组件
│   ├── authButton/
│   ├── cropper/
│   ├── datePicker/
│   ├── editor/
│   ├── form/
│   ├── iconSelector/
│   ├── svgIcon/
│   ├── table/
│   └── wangEditor/
├── layouts/              # 布局组件
│   ├── component/
│   ├── footer/
│   ├── lockScreen/
│   ├── logo/
│   ├── main/
│   ├── navBars/
│   ├── navMenu/
│   ├── routerView/
│   ├── sponsors/
│   └── upgrade/
├── router/               # 路由配置
│   ├── index.js          # 路由实例与守卫
│   ├── route.js          # 静态路由
│   └── backEnd.js        # 后端控制路由
├── stores/               # Pinia 状态库
│   ├── themeConfig.js    # 主题与布局配置
│   ├── userInfo.js       # 用户信息
│   ├── routesList.js     # 动态路由列表
│   ├── tagsViewRoutes.js # TagsView 缓存
│   ├── keepAliveNames.js # 页面缓存
│   └── requestOldRoutes.js
├── static/               # 静态资源
│   ├── assets/
│   ├── i18n/             # 国际化文件
│   └── menu/
├── theme/                # 主题样式
├── utils/                # 工具函数
├── views/                # 页面视图
│   ├── home/
│   ├── login/
│   ├── article/
│   ├── system/
│   │   ├── user/
│   │   ├── role/
│   │   ├── menu/
│   │   ├── dic/
│   │   └── config/
│   └── error/            # 401、404 页面
├── App.vue
├── main.js               # 应用入口
├── index.html
├── vite.config.js        # Vite 配置
└── package.json
```

## 🚀 快速开始

### 环境要求
- **Node.js** >= v18（推荐 v22+）
- **npm** >= 9

### 安装
```bash
# 克隆仓库 https://gitee.com/dsxwk/gin-web.git 
git clone https://github.com/dsxwk/gin-web.git 
cd gin-web
cp .env.development.example .env.development

# 安装依赖
npm install
```

### 开发
```bash
# 启动开发服务器（加载 .env.development）
npm run dev
```

默认访问地址：`http://localhost:3000`

### 生产构建
```bash
# 开发环境构建
npm run build

# 生产环境构建
npm run build-production

# 预览构建产物
npm run preview
```

## ⚙️ 环境变量
通过 `.env.development` 配置：

| 变量                | 说明                              | 默认值                       |
|---------------------|-----------------------------------|------------------------------|
| `VITE_API_URL`      | 后端 API 地址                     | `http://127.0.0.1:8080/api/v1` |
| `VITE_PORT`         | 开发服务器端口                     | `3000`                       |
| `VITE_ROUTER_MODE`  | 路由模式 `history` 或 `hash`      | `history`                    |
| `VITE_PUBLIC_PATH`  | 生产环境公共路径                   | `/web/`                      |
| `VITE_OPEN_CDN`     | 生产构建是否开启 CDN               | `true`                       |
| `VITE_TOKEN_NAME`   | Token 键名                        | `token`                      |
| `VITE_V_CONSOLE`    | 移动端是否启用 vConsole            | `true`                       |
| `VITE_OPEN`         | 开发启动时自动打开浏览器            | `true`                       |

## 📋 版本记录
> - 最新版本 [v2.0.0](version_history_zh.md#v200) 
> - [历史版本记录](version_history_zh.md)

## 🔗 后端
前端与 **Go/Gin** 后端通信。后端部署请参考：

- [gin-admin (GitHub)](https://github.com/dsxwk/gin-admin.git)
- [gin-admin (Gitee)](https://gitee.com/dsxwk/gin-admin.git)

默认 API 地址：`http://127.0.0.1:8080/api/v1`

## 📄 许可证
[MIT](LICENSE)





