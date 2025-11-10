# 學校廁所評比系統 - 詳細設定指南

## 步驟 1: 建立 Firebase 專案

### 1.1 建立專案
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」
3. 輸入專案名稱：`school-toilet-rating`
4. 選擇是否啟用 Google Analytics（建議啟用）
5. 建立專案

### 1.2 註冊 Web 應用程式
1. 在專案首頁，點擊「Web」圖示 (</>)
2. 輸入應用程式暱稱：`學校廁所`
3. 勾選「同時設定 Firebase Hosting」（可選）
4. 點擊「註冊應用程式」
5. 複製 Firebase 配置程式碼

## 步驟 2: 設定 Firebase 服務

### 2.1 Authentication（使用者認證）
1. 在左側選單選擇「Authentication」
2. 點擊「Get started」
3. 選擇「登入方式」標籤
4. 啟用「電子郵件/密碼」
5. 儲存

### 2.2 Firestore Database（資料庫）
1. 在左側選單選擇「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇位置：`asia-east1`（台灣）
4. 選擇「以測試模式啟動」（稍後會設定安全規則）
5. 啟用資料庫

#### 設定 Firestore 安全規則
1. 點擊「規則」標籤
2. 貼上以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 使用者資料
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // 學校資料
    match /schools/{schoolId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 評價資料
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

3. 點擊「發布」

### 2.3 Storage（檔案儲存）
1. 在左側選單選擇「Storage」
2. 點擊「Get started」
3. 使用預設安全規則
4. 選擇位置：`asia-east1`（台灣）
5. 完成

#### 設定 Storage 安全規則
1. 點擊「規則」標籤
2. 貼上以下規則：

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

3. 點擊「發布」

## 步驟 3: 設定專案配置

### 3.1 更新 Firebase 配置
1. 開啟 `js/firebase-config.js`
2. 將 Firebase Console 提供的配置貼上：

```javascript
const firebaseConfig = {
    apiKey: "AIza...",                                    // 從 Firebase Console 複製
    authDomain: "school-toilet-rating.firebaseapp.com",   // 從 Firebase Console 複製
    projectId: "school-toilet-rating",                    // 從 Firebase Console 複製
    storageBucket: "school-toilet-rating.appspot.com",    // 從 Firebase Console 複製
    messagingSenderId: "123456789",                       // 從 Firebase Console 複製
    appId: "1:123456789:web:abcdef"                      // 從 Firebase Console 複製
};
```

3. 儲存檔案

## 步驟 4: 建立索引（重要！）

由於 Firestore 的查詢限制，您需要手動建立索引：

### 4.1 Schools Collection 索引
1. 前往 Firestore Database
2. 點擊「索引」標籤
3. 點擊「建立索引」
4. 建立以下索引：

**索引 1: 依類型和評分排序**
- Collection ID: `schools`
- 欄位：
  - `type` (Ascending)
  - `rating` (Descending)
- Query scope: Collection

**索引 2: 依城市和評分排序**
- Collection ID: `schools`
- 欄位：
  - `city` (Ascending)
  - `rating` (Descending)
- Query scope: Collection

**索引 3: 依評價數量和評分排序**
- Collection ID: `schools`
- 欄位：
  - `reviewCount` (Ascending)
  - `rating` (Descending)
- Query scope: Collection

### 4.2 Reviews Collection 索引
**索引 1: 依學校和有效性**
- Collection ID: `reviews`
- 欄位：
  - `schoolId` (Ascending)
  - `isValid` (Ascending)
- Query scope: Collection

**索引 2: 依使用者和學校**
- Collection ID: `reviews`
- 欄位：
  - `userId` (Ascending)
  - `schoolId` (Ascending)
- Query scope: Collection

## 步驟 5: 匯入學校資料

### 5.1 準備學校資料
建立一個 JSON 檔案 `schools_data.json`：

```json
[
  {
    "name": "國立台灣大學",
    "city": "台北市",
    "district": "大安區",
    "type": "大學",
    "rating": 0,
    "cleanliness": 0,
    "floor": 0,
    "toilet": 0,
    "sink": 0,
    "flush": 0,
    "smell": 0,
    "safety": 0,
    "quantity": 0,
    "reviewCount": 0,
    "studentRatio": 0
  },
  {
    "name": "台北市立建國高級中學",
    "city": "台北市",
    "district": "中正區",
    "type": "高中",
    "rating": 0,
    "cleanliness": 0,
    "floor": 0,
    "toilet": 0,
    "sink": 0,
    "flush": 0,
    "smell": 0,
    "safety": 0,
    "quantity": 0,
    "reviewCount": 0,
    "studentRatio": 0
  }
]
```

### 5.2 使用 Firebase Console 匯入
1. 前往 Firestore Database
2. 點擊「開始收集」
3. Collection ID: `schools`
4. 手動新增文件或使用 Firebase CLI 批次匯入

### 5.3 使用 Firebase CLI 批次匯入（建議）

安裝 Firebase CLI：
```bash
npm install -g firebase-tools
```

登入 Firebase：
```bash
firebase login
```

初始化專案：
```bash
firebase init firestore
```

使用匯入腳本（需要 Firebase Admin SDK）：
```javascript
// import-schools.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const schoolsData = require('./schools_data.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importSchools() {
  const batch = db.batch();
  
  schoolsData.forEach((school) => {
    const docRef = db.collection('schools').doc();
    batch.set(docRef, school);
  });
  
  await batch.commit();
  console.log('學校資料匯入完成！');
}

importSchools();
```

執行：
```bash
node import-schools.js
```

## 步驟 6: 本地測試

### 6.1 啟動本地伺服器
```bash
# 使用 Python
python -m http.server 8000

# 或使用 npx
npx http-server -p 8000
```

### 6.2 測試功能
1. 開啟瀏覽器：`http://localhost:8000`
2. 註冊新帳號
3. 檢查信箱驗證郵件
4. 驗證後登入
5. 測試所有功能

## 步驟 7: 部署到 Vercel

### 7.1 使用 Vercel CLI
```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入 Vercel
vercel login

# 部署
vercel
```

### 7.2 使用 Vercel Dashboard
1. 前往 [Vercel](https://vercel.com/)
2. 點擊「Import Project」
3. 選擇 GitHub repository
4. 設定專案：
   - Framework Preset: Other
   - Build Command: (留空)
   - Output Directory: (留空)
5. 點擊「Deploy」

### 7.3 設定自訂網域（可選）
1. 在 Vercel Dashboard 中選擇專案
2. 前往「Settings」>「Domains」
3. 新增自訂網域
4. 按照指示設定 DNS

## 步驟 8: 設定郵件驗證範本（可選）

### 8.1 自訂驗證郵件
1. 前往 Firebase Console
2. 選擇「Authentication」
3. 點擊「Templates」標籤
4. 編輯「Email address verification」
5. 自訂郵件內容和主旨
6. 儲存

## 常見問題

### Q1: 驗證郵件沒收到？
- 檢查垃圾郵件資料夾
- 確認 Firebase Authentication 已正確設定
- 檢查郵件地址是否正確

### Q2: 無法登入？
- 確認郵件已驗證
- 檢查密碼是否符合規範
- 檢查瀏覽器 Console 是否有錯誤訊息

### Q3: 圖片無法上傳？
- 檢查 Storage 規則是否正確設定
- 確認圖片大小小於 5MB
- 確認檔案類型為圖片

### Q4: 查詢速度很慢？
- 確認已建立所有必要的 Firestore 索引
- 檢查網路連線
- 考慮使用 Firestore 的離線持久化功能

### Q5: 部署後功能異常？
- 檢查 Firebase 配置是否正確
- 確認所有檔案都已上傳
- 檢查瀏覽器 Console 錯誤訊息
- 確認 Firebase 安全規則已正確設定

## 效能優化建議

1. **啟用 Firestore 離線持久化**
2. **使用 CDN 加速靜態資源**
3. **圖片壓縮和優化**
4. **延遲載入非關鍵資源**
5. **啟用瀏覽器快取**

## 安全性檢查清單

- [ ] Firebase 安全規則已正確設定
- [ ] 使用者只能修改自己的資料
- [ ] 檔案上傳有大小和類型限制
- [ ] 敏感資訊不會暴露在前端
- [ ] HTTPS 連線
- [ ] 定期檢查 Firebase 使用量

## 下一步

1. 測試所有功能
2. 收集使用者回饋
3. 優化使用者體驗
4. 新增更多學校資料
5. 考慮實作管理後台

如有任何問題，請參考 [Firebase 文件](https://firebase.google.com/docs) 或聯絡開發團隊。
