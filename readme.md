# Gin Admin
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2-409EFF?logo=element)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern enterprise admin management system built with **Vue 3 + Vite + Element Plus**. Supports dynamic theming, multi-language i18n, backend-controlled routing, and multiple layout modes.

**Thank you for providing the front-end template by vue-next-admin**
- Project Address: https://gitee.com/lyt-top/vue-next-admin

**Backend Repo:**
- [gin-admin (GitHub)](https://github.com/dsxwk/gin-admin.git)
- [gin-admin (Gitee)](https://gitee.com/dsxwk/gin-admin.git)

**View Screenshots**
![image](public/images/Login.png)
![image](public/images/Home.png)
![image](public/images/Ai_Assitant.png)
![image](public/images/User.png)
![image](public/images/User_Import.png)
![image](public/images/Department.png)
![image](public/images/Role.png)
![image](public/images/Dic.png)
![image](public/images/Notify.png)
![image](public/images/Menu.png)
![image](public/images/System_Config.png)
![image](public/images/Search_Filter.png)
![image](public/images/Article.png)
![image](public/images/Operator_Log.png)

## ✨ Features
- **Layout Modes** — Default, Classic, Transverse and Columns layouts, switchable on the fly
- **Theme Customization** — Primary color, dark mode, gradient navbar, grayscale / color-weak modes and background watermark
- **Multi-language i18n** — Simplified Chinese, Traditional Chinese, English
- **AI Assistant** — Session-based chat UI with streaming (SSE) and standard modes; MCP tool calling to query departments, dictionaries, system config, users and operation-log statistics, grant role permissions, and run CLI commands such as generating controllers/models/services/docs, syncing permissions and listing routes; supports creating, browsing and deleting sessions
- **Realtime Notifications** — WebSocket-based in-app notifications with unread badge, realtime push and revoke, mark-as-read and sending; automatically refreshes the access token and reconnects once it expires
- **Backend-controlled Routes** — Routes generated dynamically from server-side menus and permissions
- **Button-level Permissions** — Button permissions derived from menu actions and enforced by a shared AuthButton component
- **User Management** — CRUD, batch delete, password reset, Excel import with import records, main and secondary departments
- **Department Management** — Department tree maintenance
- **Role Management** — Menu permission assignment and user binding
- **Dictionary Management** — Dictionaries and dictionary items
- **System Management** — Menus (with button actions), system config and config categories
- **Operation Logs** — Query and delete operation log entries
- **Article Management** — Rich-text article CRUD powered by WangEditor
- **Dashboard** — Resource and site info, stat cards, today's overview, ECharts visualizations (hourly requests, status codes, request methods, latency distribution) and latest operation logs
- **TagsView** — Tab-style page navigation with drag-and-drop, caching and sharing
- **Auth System** — Account login (with captcha) and mobile login
- **Lock Screen** — Auto-lock after inactivity timeout
- **Export & Print** — Table-to-Excel export, Print.js printing and Excel user import
- **Responsive** — Mobile-ready with vConsole debugging support

## 🛠️ Tech Stack
| Category       | Technology                          |
|----------------|-------------------------------------|
| Framework      | Vue 3.5 (Composition API + `<script setup>`) |
| Build Tool     | Vite 6                              |
| UI Library     | Element Plus 2                      |
| State Mgmt     | Pinia 3                             |
| Router         | Vue Router 4                        |
| i18n           | vue-i18n 11                         |
| Charts         | ECharts 6 + vue-echarts 7           |
| HTTP Client    | Native Fetch API                    |
| Realtime       | Native WebSocket                    |
| Rich Text      | WangEditor 5                        |
| Markdown       | markdown-it 15                      |
| Export / Print / Import | js-table2excel, print-js, read-excel-file |
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
│   ├── agent/
│   ├── article/
│   ├── department/
│   ├── dic/
│   ├── home/
│   ├── login/
│   ├── operator_log/
│   ├── role/
│   ├── user/
│   ├── system/
│   │   ├── config/
│   │   ├── menu/
│   │   └── notification/
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
> - Latest Version [v2.1.5](version_history.md#v215) 
> - [Historical Version Records](version_history.md)

## 🔗 Backend
The frontend communicates with a **Go/Gin** backend. For backend setup, refer to:

- [gin-admin (GitHub)](https://github.com/dsxwk/gin-admin.git)
- [gin-admin (Gitee)](https://gitee.com/dsxwk/gin-admin.git)

Default API base URL: `http://127.0.0.1:8080/api/v1`

## 📄 License
[MIT](LICENSE)





