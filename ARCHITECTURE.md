# 系統架構與工程規範 (ARCHITECTURE.md)

## 1. 核心技術棧
- **語言：** Python 3.12（全面使用型別標註，`mypy --strict`，避免使用 `Any`）
- **後端框架：** FastAPI
- **前端渲染：** Jinja2 模板 + Tailwind CSS
- **資料庫與後端服務：** Supabase（PostgreSQL、Auth、Storage）
- **資料驗證：** Pydantic v2
- **測試框架：** pytest（單元/整合測試）、Playwright for Python（端對端 E2E 測試）
- **程式品質：** Ruff（lint + format）、mypy

---

## 2. 目錄結構與職責分工

```
├── app/
│   ├── main.py                    # FastAPI 進入點，掛載路由與中介層
│   ├── config.py                  # 讀取環境變數 (pydantic-settings)
│   ├── routers/                   # 路由層：只處理 request / response
│   │   └── [feature_name].py
│   ├── services/                  # 商業邏輯層
│   │   └── [feature_name].py
│   ├── repositories/              # 資料存取層：唯一可以查詢 Supabase 的地方
│   │   └── [feature_name].py
│   ├── schemas/                   # Pydantic 模型 (請求、回應、資料表對應)
│   │   └── [feature_name].py
│   ├── db/
│   │   └── supabase.py            # Supabase client 初始化
│   ├── templates/                 # Jinja2 模板
│   │   ├── base.html              # 全域版型
│   │   ├── components/            # 共用 UI 片段 (Header、Footer、Sidebar)
│   │   └── [feature_name]/        # 各功能頁面
│   └── static/                    # CSS、JS、圖片
├── supabase/
│   ├── migrations/                # 資料表結構與 RLS 政策 (SQL)
│   └── seed.sql                   # 測試用假資料
├── tests/
│   ├── unit/                      # services、schemas 單元測試
│   ├── integration/               # repositories + 本機 Supabase、RLS 測試
│   └── e2e/                       # Playwright 瀏覽器端對端測試
├── .env.example                   # 環境變數範本 (不含真實金鑰)
├── pyproject.toml                 # Ruff、mypy、pytest 設定
└── requirements.txt
```

### 架構核心原則
1. **分層呼叫：** `routers → services → repositories`，只能由上往下呼叫，不可跳層。路由層不得直接查詢資料庫。
2. **模板展示純粹化：** Jinja2 模板只負責渲染，不寫商業邏輯；需要的資料由路由準備好再傳入。
3. **強型別傳遞：** 層與層之間傳遞 Pydantic 模型，不直接傳原始 `dict`。

---

## 3. Supabase 架構與金鑰隔離

- **anon key：**
  - 一般請求使用，搭配使用者登入後的 JWT，讓 RLS 政策生效。
- **service_role key：**
  - 會繞過 RLS，只能用於後端管理任務（例如排程、資料匯入）。
  - **安全紅線：** 嚴禁出現在模板、`static/`、前端 JavaScript 或任何回應內容中；嚴禁提交到 Git。
- **資料表與 RLS：**
  - 所有資料表必須啟用 Row Level Security。
  - 寫入政策嚴禁使用 `using (true)` / `with check (true)`。
- **Schema 變更：**
  - 一律透過 `supabase migration new <name>` 建立 migration，不可直接在 Dashboard 手動修改。

---

## 4. UI 與設計系統規範
- **樣式：** 使用 Tailwind CSS；顏色、間距、圓角統一定義在 Tailwind 設定檔，不可在模板中寫死色碼。
- **共用元件：** 重複出現的 UI 寫成 `templates/components/` 的 Jinja2 macro 或 `{% include %}` 片段。
- **版型：** 所有頁面繼承 `base.html`。

---

## 5. 測試與驗收標準
所有 Pull Request 在合併前必須通過：

1. **程式品質：**
   - `ruff check . && ruff format --check .`
   - `mypy app`
2. **單元與整合測試 (pytest)：**
   - `pytest tests/unit tests/integration`
   - 整合測試需先執行 `supabase start` 啟動本機 Supabase。
3. **RLS 安全驗證：**
   - 於 `tests/integration/` 驗證：未登入或非擁有者無法讀寫他人資料。
4. **端對端測試 (Playwright)：**
   - `pytest tests/e2e`
   - 範圍：核心使用者路徑（登入、重要表單、主要業務流程）。

---

## 6. 在地化與繁體中文（台灣）用語規範
所有使用者可見文字（按鈕、提示、表單驗證、彈窗訊息、通知）一律使用**繁體中文（台灣慣用詞）**，嚴禁簡體中文或中國大陸用語。

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

## 7. Git 規範
- **Commit 訊息：** 遵循 Conventional Commits（`feat:`、`fix:`、`refactor:`、`test:`、`docs:`）。
- **分支命名：** `feat/<功能>`、`fix/<問題>`。
- **禁止提交：** `.env*`（`.env.example` 除外）、任何金鑰。
