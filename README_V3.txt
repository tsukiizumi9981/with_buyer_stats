刀劍亂舞代購管理系統 v3（Firebase 雲端版）

部署：
1. 將本資料夾內全部檔案覆蓋上傳到 GitHub repository 根目錄。
2. 等待 GitHub Pages 重新部署。
3. 開啟網站後，以 Google 帳號登入。

Firebase 必要設定：
- Authentication > 登入方式 > Google：已啟用
- Authentication > 設定 > 授權網域：tsukiizumi9981.github.io
- Firestore 已建立
- Firestore 規則請貼上 firestore.rules 內容並發布

資料：
- 訂單存於 Firestore 的 orders collection。
- 新增、修改、刪除和統計會跨裝置同步。
- 表單草稿仍暫存在本機瀏覽器，以免輸入途中遺失。
- 匯出頁可下載 CSV / JSON，也可把舊 JSON 匯入 Firestore。

安全提醒：
目前規則允許任何「成功登入」的 Google 使用者讀寫。若網站只給你自己管理，建議之後把規則改成指定你的 Firebase UID。
