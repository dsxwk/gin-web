# Gin Admin
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.9-409EFF?logo=element)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern enterprise admin management system built with **Vue 3 + Vite + Element Plus**. Supports dynamic theming, multi-language i18n, backend-controlled routing, and multiple layout modes.

**Thank you for providing the front-end template by vue-next-admin**
- Project Address: https://gitee.com/lyt-top/vue-next-admin

**Backend Repo:**
- [gin-admin (GitHub)](https://github.com/dsxwk/gin-admin.git)
- [gin-admin (Gitee)](https://gitee.com/dsxwk/gin-admin.git)

## ✨ Features
- **Layout Modes** — Default, Classic, Transverse, Columns layouts switchable on the fly
- **Theme Customization** — Primary color, dark mode, gradient navbars, grayscale & color-blind modes
- **Multi-language i18n** — Chinese (Simplified), Chinese (Traditional), English
- **Backend-controlled Routes** — Dynamic route generation from server-side permissions
- **TagsView** — Tab-style page navigation with drag-and-drop, caching, and sharing
- **Rich Components** — Article management, user/role/menu/dict/config CRUD with dialogs
- **ECharts Integration** — Dashboard and data visualizations
- **Rich Text** — WangEditor-powered content editing
- **Auth System** — Account, mobile, and scan-code login modes
- **Lock Screen** — Auto-lock after inactivity timeout
- **Export & Print** — Table-to-Excel and Print.js support
- **Responsive** — Mobile-ready with vConsole debugging support

## 🛠️ Tech Stack
| Category       | Technology                          |
|----------------|-------------------------------------|
| Framework      | Vue 3 (Composition API + `<script setup>`) |
| Build Tool     | Vite 6                              |
| UI Library     | Element Plus 2.9                    |
| State Mgmt     | Pinia 3                             |
| Router         | Vue Router 4                        |
| i18n           | vue-i18n 11                         |
| Charts         | ECharts 5 + vue-echarts 7           |
| HTTP Client    | Axios                               |
| Rich Text      | WangEditor 5                        |
| CSS Preprocessor | Sass / Less                       |
| Icons          | Element Plus Icons                  |

## 📦 Project Structure
```
gin-web
├── api/                  # API service definitions
│   ├── article/
│   ├── configCategory/
│   ├── dict/
│   ├── login/
│   ├── menu/
│   ├── role/
│   ├── systemConfig/
│   └── user/
├── components/           # Shared components
│   ├── authButton/
│   ├── cropper/
│   ├── datePicker/
│   ├── editor/
│   ├── form/
│   ├── iconSelector/
│   ├── svgIcon/
│   ├── table/
│   └── wangEditor/
├── layouts/              # Layout components
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
├── router/               # Route configuration
│   ├── index.js          # Router setup & guards
│   ├── route.js          # Static routes
│   └── backEnd.js        # Backend-controlled routes
├── stores/               # Pinia stores
│   ├── themeConfig.js    # Theme & layout config
│   ├── userInfo.js       # User info
│   ├── routesList.js     # Dynamic routes
│   ├── tagsViewRoutes.js # TagsView cache
│   ├── keepAliveNames.js # Keep-alive cache
│   └── requestOldRoutes.js
├── static/               # Static assets
│   ├── assets/
│   ├── i18n/             # Internationalization files
│   └── menu/
├── theme/                # Theme stylesheets
├── utils/                # Utility functions
├── views/                # Page views
│   ├── home/
│   ├── login/
│   ├── article/
│   ├── system/
│   │   ├── user/
│   │   ├── role/
│   │   ├── menu/
│   │   ├── dic/
│   │   └── config/
│   └── error/            # 401, 404 pages
├── App.vue
├── main.js               # App entry
├── index.html
├── vite.config.js        # Vite configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= v18 (recommended v22+)
- **npm** >= 9

### Installation
```bash
# Clone the repository
git clone https://github.com/dsxwk/gin-web.git
cd gin-web
cp .env.development.example .env.development

# Install dependencies
npm install
```

### Development
```bash
# Start dev server (loads .env.development)
npm run dev
```

The app will be available at `http://localhost:3000` by default.

### Production Build
```bash
# Build for development environment
npm run build

# Build for production environment
npm run build-production

# Preview the build
npm run preview
```

## ⚙️ Environment Variables
Configured via `.env.development`:

| Variable             | Description                          | Default                  |
|----------------------|--------------------------------------|--------------------------|
| `VITE_API_URL`       | Backend API base URL                 | `http://127.0.0.1:8080/api/v1` |
| `VITE_PORT`          | Dev server port                      | `3000`                   |
| `VITE_ROUTER_MODE`   | `history` or `hash`                  | `history`                |
| `VITE_PUBLIC_PATH`   | Public path for production           | `/web/`                  |
| `VITE_OPEN_CDN`      | Enable CDN for production build      | `true`                   |
| `VITE_TOKEN_NAME`    | Token key name                       | `token`                  |
| `VITE_V_CONSOLE`     | Enable vConsole on mobile            | `true`                   |
| `VITE_OPEN`          | Auto-open browser on dev start       | `true`                   |

## 📋 Version History
> - Latest Version [v2.0.3](version_history.md#v203) 
> - [Historical Version Records](version_history.md)

## 🔗 Backend
The frontend communicates with a **Go/Gin** backend. For backend setup, refer to:

- [gin-admin (GitHub)](https://github.com/dsxwk/gin-admin.git)
- [gin-admin (Gitee)](https://gitee.com/dsxwk/gin-admin.git)

Default API base URL: `http://127.0.0.1:8080/api/v1`

## 📄 License
[MIT](LICENSE)





