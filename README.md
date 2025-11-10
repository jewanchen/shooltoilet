# 學校廁所評比系統

這是一個完整的學校廁所評比 Web 應用程式，使用 HTML、CSS、JavaScript 和 Firebase 後端服務。

## 功能特色

### 使用者功能
- ✅ 電子郵件註冊與驗證
- ✅ 密碼強度驗證（8字以上，含大小寫英文及數字）
- ✅ 學校搜尋（地區搜尋 + 關鍵字搜尋）
- ✅ 學校詳情查看
- ✅ 8項星級評分系統
- ✅ 文字評論與建議
- ✅ 按讚/倒讚功能
- ✅ 關注學校功能
- ✅ 個人設定（頭像、姓名、教育背景）
- ✅ 全國排行榜
- ✅ 自訂排行榜搜尋
- ✅ 響應式設計（手機優化）

### 評價系統
- 評價有效性判斷
- 時間權重計算（1個月內100%、3個月內100%、6個月內60%、6個月以前30%）
- 評價時間衰減（每6個月衰減）
- 3個月內不能重複評價同一學校
- 1小時內可編輯評論

### 排行榜
- 全國各學制 Top 5 顯示
- 可查看各學制 Top 50
- 自訂縣市和學制搜尋 Top 20
- 最多顯示 Top 50

## 技術架構

- **前端**: HTML5、CSS3、JavaScript (ES6+)
- **後端**: Firebase
  - Authentication（使用者認證）
  - Firestore（資料庫）
  - Storage（檔案儲存）
- **部署**: Vercel（建議）

## 安裝步驟

### 1. Firebase 設定

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 建立新專案
3. 啟用以下服務：
   - **Authentication**: 啟用 Email/Password 登入方式
   - **Firestore Database**: 建立資料庫（測試模式或生產模式）
   - **Storage**: 啟用儲存服務

4. 取得 Firebase 配置：
   - 在 Firebase Console 中，進入「專案設定」
   - 找到「您的應用程式」區塊
   - 複製 Firebase SDK snippet 中的 config 物件

5. 更新 `js/firebase-config.js`：
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Firestore 資料結構

#### Collections

**users** (使用者資料)
```javascript
{
    email: string,
    displayName: string,
    photoURL: string,
    education: {
        elementary: { school: string, startYear: number, endYear: number },
        middle: { school: string, startYear: number, endYear: number },
        high: { school: string, startYear: number, endYear: number },
        university: { school: string, startYear: number, endYear: number }
    },
    currentSchool: string,
    currentGrade: string,
    followedSchools: [schoolId],
    createdAt: timestamp,
    updatedAt: timestamp
}
```

**schools** (學校資料)
```javascript
{
    name: string,
    city: string,
    district: string,
    type: string, // 大學、高中、國中、國小
    rating: number,
    cleanliness: number,
    floor: number,
    toilet: number,
    sink: number,
    flush: number,
    smell: number,
    safety: number,
    quantity: number,
    reviewCount: number,
    studentRatio: number,
    updatedAt: timestamp
}
```

**reviews** (評價資料)
```javascript
{
    userId: string,
    schoolId: string,
    hasAttended: boolean,
    hasUsed: boolean,
    lastVisit: string,
    cleanliness: number,
    floor: number,
    toilet: number,
    sink: number,
    flush: number,
    smell: number,
    safety: number,
    quantity: number,
    rating: number,
    weight: number,
    isValid: boolean,
    comment: string,
    suggestion: string,
    likes: number,
    dislikes: number,
    likedBy: [userId],
    dislikedBy: [userId],
    createdAt: timestamp,
    updatedAt: timestamp
}
```

### 3. Firestore 安全規則

在 Firebase Console 的 Firestore 規則中設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Schools collection
    match /schools/{schoolId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.resource.data.diff(resource.data).affectedKeys()
           .hasOnly(['likes', 'dislikes', 'likedBy', 'dislikedBy']));
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Storage 安全規則

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 5. 匯入學校資料

您需要準備學校資料並匯入 Firestore。可以使用 Firebase Admin SDK 或手動匯入 CSV/JSON 資料。

範例學校資料格式：
```json
{
    "name": "台北市立建國高級中學",
    "city": "台北市",
    "district": "中正區",
    "type": "高中",
    "rating": 0,
    "reviewCount": 0,
    "studentRatio": 0
}
```

### 6. 部署到 Vercel

1. 安裝 Vercel CLI：
```bash
npm install -g vercel
```

2. 在專案目錄執行：
```bash
vercel
```

3. 按照提示完成部署

或者直接使用 Vercel 網頁介面：
1. 前往 [Vercel](https://vercel.com/)
2. 匯入 GitHub 專案
3. 自動部署

### 7. 本地測試

使用任何 HTTP 伺服器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js http-server
npx http-server

# 使用 Live Server (VS Code 擴充功能)
```

然後在瀏覽器開啟 `http://localhost:8000`

## 檔案結構

```
school-toilet-rating/
├── index.html              # 登入頁面
├── home.html              # 首頁（我的學校清單）
├── search.html            # 搜尋學校
├── school-detail.html     # 學校詳情
├── add-review.html        # 新增評價
├── ranking.html           # 排行榜
├── settings.html          # 個人設定
├── css/
│   └── style.css          # 主要樣式文件
├── js/
│   ├── firebase-config.js # Firebase 配置
│   ├── auth.js           # 認證功能
│   ├── home.js           # 首頁功能
│   ├── search.js         # 搜尋功能
│   ├── school-detail.js  # 學校詳情功能
│   ├── add-review.js     # 新增評價功能
│   ├── ranking.js        # 排行榜功能
│   └── settings.js       # 設定功能
└── README.md             # 說明文件
```

## 待實作功能（Optional）

以下功能在規格書中標註為 optional，可以後續新增：

1. **髒話檢測**: 使用第三方 API 或機器學習模型檢測不當內容
2. **檢舉系統**: 完整的檢舉處理流程
3. **管理後台**: 管理者可以管理所有內容

## 注意事項

1. **Email 驗證**: 使用者註冊後必須驗證電子郵件才能登入
2. **評價限制**: 同一學校 3 個月內只能評價一次
3. **評價編輯**: 評價提交後 1 小時內可編輯
4. **圖片上傳**: 頭像限制 5MB
5. **安全性**: 請務必設定 Firebase 安全規則

## 支援的瀏覽器

- Chrome (建議)
- Firefox
- Safari
- Edge
- 行動版瀏覽器

## 授權

此專案為教育用途，請根據需求自行調整授權條款。

## 聯絡方式

如有任何問題，請聯繫開發團隊。
