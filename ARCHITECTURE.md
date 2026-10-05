# 系統架構與工程規範 (ARCHITECTURE.md)

## 1. 核心技術棧

採用前後端分離架構：前端負責畫面，後端只提供 JSON API，兩者透過 HTTP 溝通。

### 前端 (`frontend/`)
- **框架：** Next.js 15（App Router）+ React
- **語言：** TypeScript（`strict` 模式，避免使用 `any`）
- **樣式與元件：** Tailwind CSS + shadcn/ui
- **表單驗證：** React Hook Form + Zod
- **登入：** Supabase Auth（`@supabase/ssr`）
- **測試：** Vitest + React Testing Library（單元）、Playwright（端對端 E2E）
- **程式品質：** ESLint、Prettier、`tsc --noEmit`

### 後端 (`backend/`)
- **框架：** FastAPI（Python 3.12，全面使用型別標註，`mypy --strict`，避免使用 `Any`）
- **資料驗證：** Pydantic v2
- **測試：** pytest（單元/整合）
- **程式品質：** Ruff（lint + format）、mypy

### 資料庫與雲端服務
- **Supabase：** PostgreSQL、Auth、Storage

### 部署
- **前端：** Vercel
- **後端：** Render 或 Fly.io
- **資料庫：** Supabase 雲端專案

---

## 2. 目錄結構與職責分工

```
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js 路由 (App Router)
│   │   │   ├── layout.tsx             # 全域版型
│   │   │   ├── (auth)/                # 登入、註冊頁面
│   │   │   └── [feature_name]/        # 各功能頁面
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui 元件 (由 CLI 產生)
│   │   │   └── [feature_name]/        # 各功能專用元件
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts          # 呼叫後端 API 的唯一入口 (自動附上 JWT)
│   │   │   │   └── types.ts           # 由後端 OpenAPI 自動產生，禁止手動修改
│   │   │   └── supabase/              # Supabase Auth client (瀏覽器端 / 伺服器端)
│   │   └── hooks/                     # 共用 React hooks
│   ├── e2e/                           # Playwright 端對端測試
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI 進入點，掛載路由、CORS
│   │   ├── config.py                  # 讀取環境變數 (pydantic-settings)
│   │   ├── auth.py                    # 驗證 Supabase JWT，取得目前使用者
│   │   ├── routers/                   # 路由層：只處理 request / response
│   │   │   └── [feature_name].py
│   │   ├── services/                  # 商業邏輯層
│   │   │   └── [feature_name].py
│   │   ├── repositories/              # 資料存取層：唯一可以查詢 Supabase 的地方
│   │   │   └── [feature_name].py
│   │   ├── schemas/                   # Pydantic 模型 (請求、回應、資料表對應)
│   │   │   └── [feature_name].py
│   │   └── db/
│   │       └── supabase.py            # Supabase client 初始化
│   ├── tests/
│   │   ├── unit/                      # services、schemas 單元測試
│   │   └── integration/               # API、repositories + 本機 Supabase、RLS 測試
│   ├── .env.example
│   ├── pyproject.toml                 # Ruff、mypy、pytest 設定
│   └── requirements.txt
└── supabase/
    ├── migrations/                    # 資料表結構與 RLS 政策 (SQL)
    └── seed.sql                       # 測試用假資料
```

### 架構核心原則
1. **前後端職責分離：** 前端只負責畫面與互動；所有商業邏輯與資料存取都在後端。
2. **前端資料一律走後端 API：** 前端只用 Supabase 處理登入，**不可直接查詢資料表**；所有資料讀寫都透過 `src/lib/api/client.ts` 呼叫 FastAPI。
3. **後端分層呼叫：** `routers → services → repositories`，只能由上往下呼叫，不可跳層。路由層不得直接查詢資料庫。
4. **強型別傳遞：** 後端層與層之間傳遞 Pydantic 模型，不直接傳原始 `dict`；前端使用由 OpenAPI 產生的型別，前後端型別保持一致。
5. **Server Components 優先：** 前端預設使用 Server Components，只有需要互動（狀態、事件）時才加 `"use client"`。

---

## 3. API 規範

- **格式：** RESTful JSON API，路徑統一以 `/api/v1/` 開頭（例如 `GET /api/v1/projects`）。
- **認證：** 前端在 `Authorization: Bearer <JWT>` 標頭附上 Supabase 登入後取得的 JWT，後端在 `auth.py` 驗證。
- **錯誤回應：** 統一格式 `{"detail": "<錯誤訊息>"}`，搭配正確的 HTTP 狀態碼（400、401、403、404、422、500）。
- **型別同步：** 後端修改 API 後，前端執行 `npm run gen:api`，由 FastAPI 的 OpenAPI 規格重新產生 `src/lib/api/types.ts`。
- **CORS：** 後端只允許前端的網域，不可設定為 `*`。

---

## 4. Supabase 架構與金鑰隔離

- **anon key：**
  - 前端用於登入；後端處理一般請求時，搭配使用者的 JWT 建立 client，讓 RLS 政策生效。
- **service_role key：**
  - 會繞過 RLS，只能用於後端管理任務（例如排程、資料匯入）。
  - **安全紅線：** 只能存在於後端環境變數；嚴禁出現在 `frontend/`、任何 `NEXT_PUBLIC_` 開頭的變數、API 回應內容中；嚴禁提交到 Git。
- **資料表與 RLS：**
  - 所有資料表必須啟用 Row Level Security。
  - 寫入政策嚴禁使用 `using (true)` / `with check (true)`。
- **Schema 變更：**
  - 一律透過 `supabase migration new <name>` 建立 migration，不可直接在 Dashboard 手動修改。

---

## 5. UI 與設計系統規範
- **元件：** 優先使用 shadcn/ui 元件（`npx shadcn@latest add <component>`），沒有合適的才自己寫。
- **樣式：** 使用 Tailwind CSS；顏色、間距、圓角統一使用設計 token（CSS 變數），不可在元件中寫死色碼。
- **共用元件：** 重複出現的 UI 抽成 `src/components/` 下的元件。
- **版型：** 全域版型寫在 `app/layout.tsx`，各區塊的共用版型使用巢狀 `layout.tsx`。
- **狀態處理：** 每個資料載入的畫面都要處理「載入中」、「錯誤」、「沒有資料」三種狀態。

---

## 6. 測試與驗收標準
所有 Pull Request 在合併前必須通過：

1. **後端 (`backend/`)：**
   - `ruff check . && ruff format --check .`
   - `mypy app`
   - `pytest`（整合測試需先執行 `supabase start` 啟動本機 Supabase）
2. **前端 (`frontend/`)：**
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
3. **RLS 安全驗證：**
   - 於 `backend/tests/integration/` 驗證：未登入或非擁有者無法讀寫他人資料。
4. **端對端測試 (Playwright)：**
   - `npx playwright test`（於 `frontend/` 執行）
   - 範圍：核心使用者路徑（登入、重要表單、主要業務流程）。

---

## 7. 在地化與繁體中文（台灣）用語規範
所有使用者可見文字（按鈕、提示、表單驗證、彈窗訊息、通知、後端回傳給使用者看的錯誤訊息）一律使用**繁體中文（台灣慣用詞）**，嚴禁簡體中文或中國大陸用語。程式碼、註解、commit 訊息使用英文。

| 台灣習慣用語 (必須使用) | 禁止使用之用語 (避免出現) |
| :--- | :--- |
| **使用者 / 會員** | 用戶 |
| **登入 / 登出** | 登錄 / 退出 |
| **設定** | 設置 |
| **專案** | 項目 |
| **預設** | 默認 |
| **支援** | 支持 |
| **資訊** | 信息 |
| **上傳** | 上載 |
| **連結** | 鏈接 |
| **建立** | 創建 |
| **確認 / 送出** | 提交 / 確定 |
| **螢幕** | 屏幕 |
| **程式 / 軟體** | 程序 / 軟件 |
| **硬碟 / 記憶體** | 硬盤 / 內存 |

---

## 8. Git 規範
- **Commit 訊息：** 遵循 Conventional Commits（`feat:`、`fix:`、`refactor:`、`test:`、`docs:`）。
- **分支命名：** `feat/<功能>`、`fix/<問題>`。
- **禁止提交：** `.env*`（`.env.example` 除外）、任何金鑰、`node_modules/`。
