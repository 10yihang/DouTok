# 前端应用 (doutok)

这是抖声项目的前端应用程序，使用 Next.js 和 React 构建。

## 技术栈

*   **框架:** Next.js
*   **UI 库:** React
*   **语言:** TypeScript
*   **样式:** Tailwind CSS
*   **状态管理:** (根据实际使用的库填写，例如 Redux, Zustand, Context API)
*   **HTTP 请求:** (根据实际使用的库填写，例如 Axios, fetch API)
*   **打包工具:** Webpack (Next.js 内置)
*   **代码规范:** ESLint, Prettier (通常与 Next.js 项目集成)

## 目录结构

```
doutok/
├── components/         # 可复用的 UI 组件
├── pages/              # Next.js 页面组件 (路由)
│   ├── api/            # Next.js API 路由
│   └── _app.tsx        # 全局应用组件
├── public/             # 静态资源 (图片、字体等)
├── styles/             # 全局样式和 Tailwind CSS 配置
├── utils/              # 工具函数和辅助模块
├── interfaces/         # TypeScript 类型定义 (可选)
├── services/           # API 服务调用 (可选)
├── store/              # 状态管理 (可选)
├── next.config.js      # Next.js 配置文件
├── package.json        # 项目依赖和脚本
├── tsconfig.json       # TypeScript 配置文件
└── README.md           # 前端 README
```

## 快速开始

1.  **环境要求:**
    *   Node.js (建议使用最新 LTS 版本)
    *   npm 或 yarn

2.  **安装依赖:**
    ```bash
    cd frontend/doutok
    npm install
    # 或者
    # yarn install
    ```

3.  **配置环境变量:**
    *   创建一个 `.env.local` 文件在 `frontend/doutok` 目录下。
    *   根据后端 API 的地址配置必要的环境变量，例如：
        ```
        NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 # 替换为你的后端 API 地址
        ```
    *   确保前端应用可以访问到后端服务。

4.  **运行开发服务器:**
    ```bash
    npm run dev
    # 或者
    # yarn dev
    ```
    应用默认会在 `http://localhost:3000` 启动。

5.  **构建生产版本:**
    ```bash
    npm run build
    # 或者
    # yarn build
    ```

6.  **启动生产服务器:**
    ```bash
    npm run start
    # 或者
    # yarn start
    ```

## 主要功能模块

*   **视频播放:** 核心的短视频浏览和播放功能。
*   **用户认证:** 用户登录、注册。
*   **用户中心:** 用户信息展示、作品列表等。
*   **视频上传:** 用户上传新的短视频。
*   **互动功能:** 点赞、评论、分享等。
*   **消息通知:** (如果实现)

## 代码风格和规范

项目遵循标准的 React 和 Next.js 开发实践。建议使用 ESLint 和 Prettier 来保持代码风格的一致性。

## API 交互

前端通过 HTTP 请求与后端 API 服务进行交互。API 服务的具体地址和端点应在环境变量或配置文件中定义。

## 注意事项

*   确保后端服务已成功启动并可以从前端访问。
*   根据实际情况调整 `NEXT_PUBLIC_API_BASE_URL` 等环境变量。
*   在进行较大的 UI 或逻辑更改时，建议创建新的分支进行开发。
