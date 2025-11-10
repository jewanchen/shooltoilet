#!/bin/bash

# 修正所有 HTML 檔案的路徑

echo "開始修正檔案路徑..."

# 修正 CSS 路徑
for file in *.html; do
    if [ -f "$file" ]; then
        # 修正 CSS 路徑
        sed -i 's|href="css/|href="./css/|g' "$file"
        sed -i 's|href="/css/|href="./css/|g' "$file"
        
        # 修正 JS 路徑
        sed -i 's|src="js/|src="./js/|g' "$file"
        sed -i 's|src="/js/|src="./js/|g' "$file"
        
        echo "✓ 已修正 $file"
    fi
done

echo ""
echo "✅ 所有檔案路徑已修正完成！"
echo ""
echo "請執行以下指令上傳到 GitHub："
echo "  git add ."
echo "  git commit -m \"修復檔案路徑問題\""
echo "  git push"
