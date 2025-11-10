// 搜尋學校功能
import { db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// 台灣縣市資料
const taiwanCities = {
    '台北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
    '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
    '桃園市': ['桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區', '大溪區', '龍潭區', '龜山區', '大園區', '觀音區', '新屋區', '復興區'],
    '台中市': ['中區', '東區', '南區', '西區', '北區', '西屯區', '南屯區', '北屯區', '豐原區', '東勢區', '大甲區', '清水區', '沙鹿區', '梧棲區', '后里區', '神岡區', '潭子區', '大雅區', '新社區', '石岡區', '外埔區', '大安區', '烏日區', '大肚區', '龍井區', '霧峰區', '太平區', '大里區', '和平區'],
    '台南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區', '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區', '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區', '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'],
    '高雄市': ['楠梓區', '左營區', '鼓山區', '三民區', '鹽埕區', '前金區', '新興區', '苓雅區', '前鎮區', '旗津區', '小港區', '鳳山區', '大寮區', '鳥松區', '林園區', '仁武區', '大樹區', '大社區', '岡山區', '路竹區', '橋頭區', '梓官區', '彌陀區', '永安區', '燕巢區', '田寮區', '阿蓮區', '茄萣區', '湖內區', '旗山區', '美濃區', '內門區', '杉林區', '甲仙區', '六龜區', '茂林區', '桃源區', '那瑪夏區'],
    '基隆市': ['中正區', '七堵區', '暖暖區', '仁愛區', '中山區', '安樂區', '信義區'],
    '新竹市': ['東區', '北區', '香山區'],
    '嘉義市': ['東區', '西區'],
    '新竹縣': ['竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉', '新豐鄉', '峨眉鄉', '寶山鄉', '北埔鄉', '橫山鄉', '芎林鄉', '尖石鄉', '五峰鄉'],
    '苗栗縣': ['苗栗市', '頭份市', '竹南鎮', '後龍鎮', '通霄鎮', '苑裡鎮', '卓蘭鎮', '造橋鄉', '西湖鄉', '頭屋鄉', '公館鄉', '銅鑼鄉', '三義鄉', '大湖鄉', '獅潭鄉', '三灣鄉', '南庄鄉', '泰安鄉'],
    '彰化縣': ['彰化市', '員林市', '鹿港鎮', '和美鎮', '北斗鎮', '溪湖鎮', '田中鎮', '二林鎮', '線西鄉', '伸港鄉', '福興鄉', '秀水鄉', '花壇鄉', '芬園鄉', '大村鄉', '埔鹽鄉', '埔心鄉', '永靖鄉', '社頭鄉', '二水鄉', '田尾鄉', '埤頭鄉', '芳苑鄉', '大城鄉', '竹塘鄉', '溪州鄉'],
    '南投縣': ['南投市', '埔里鎮', '草屯鎮', '竹山鎮', '集集鎮', '名間鄉', '鹿谷鄉', '中寮鄉', '魚池鄉', '國姓鄉', '水里鄉', '信義鄉', '仁愛鄉'],
    '雲林縣': ['斗六市', '斗南鎮', '虎尾鎮', '西螺鎮', '土庫鎮', '北港鎮', '莿桐鄉', '林內鄉', '古坑鄉', '大埤鄉', '崙背鄉', '二崙鄉', '麥寮鄉', '台西鄉', '東勢鄉', '褒忠鄉', '四湖鄉', '口湖鄉', '水林鄉', '元長鄉'],
    '嘉義縣': ['太保市', '朴子市', '布袋鎮', '大林鎮', '民雄鄉', '溪口鄉', '新港鄉', '六腳鄉', '東石鄉', '義竹鄉', '鹿草鄉', '水上鄉', '中埔鄉', '竹崎鄉', '梅山鄉', '番路鄉', '大埔鄉', '阿里山鄉'],
    '屏東縣': ['屏東市', '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉', '麟洛鄉', '九如鄉', '里港鄉', '鹽埔鄉', '高樹鄉', '萬巒鄉', '內埔鄉', '竹田鄉', '新埤鄉', '枋寮鄉', '新園鄉', '崁頂鄉', '林邊鄉', '南州鄉', '佳冬鄉', '琉球鄉', '車城鄉', '滿州鄉', '枋山鄉', '霧台鄉', '瑪家鄉', '泰武鄉', '來義鄉', '春日鄉', '獅子鄉', '牡丹鄉', '三地門鄉'],
    '宜蘭縣': ['宜蘭市', '羅東鎮', '蘇澳鎮', '頭城鎮', '礁溪鄉', '壯圍鄉', '員山鄉', '冬山鄉', '五結鄉', '三星鄉', '大同鄉', '南澳鄉'],
    '花蓮縣': ['花蓮市', '鳳林鎮', '玉里鎮', '新城鄉', '吉安鄉', '壽豐鄉', '光復鄉', '豐濱鄉', '瑞穗鄉', '富里鄉', '秀林鄉', '萬榮鄉', '卓溪鄉'],
    '台東縣': ['台東市', '成功鎮', '關山鎮', '卑南鄉', '鹿野鄉', '池上鄉', '東河鄉', '長濱鄉', '太麻里鄉', '大武鄉', '綠島鄉', '海端鄉', '延平鄉', '金峰鄉', '達仁鄉', '蘭嶼鄉'],
    '澎湖縣': ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉'],
    '金門縣': ['金城鎮', '金湖鎮', '金沙鎮', '金寧鄉', '烈嶼鄉', '烏坵鄉'],
    '連江縣': ['南竿鄉', '北竿鄉', '莒光鄉', '東引鄉']
};

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function generateStars(rating) {
    if (!rating || rating === 0) {
        return '<i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>';
    }
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// 初始化縣市選單
function initCitySelect() {
    const citySelect = document.getElementById('citySelect');
    Object.keys(taiwanCities).forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// 更新地區選單
document.getElementById('citySelect')?.addEventListener('change', (e) => {
    const city = e.target.value;
    const districtSelect = document.getElementById('districtSelect');
    districtSelect.innerHTML = '<option value="">請選擇地區</option>';
    
    if (city && taiwanCities[city]) {
        districtSelect.disabled = false;
        taiwanCities[city].forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
    } else {
        districtSelect.disabled = true;
    }
});

// 標籤切換
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // 更新按鈕狀態
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 更新面板顯示
        document.querySelectorAll('.search-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tab + 'Search').classList.add('active');
    });
});

// 顯示搜尋結果
function displayResults(schools) {
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    
    resultsCount.textContent = `共 ${schools.length} 筆結果`;
    
    if (schools.length === 0) {
        resultsList.innerHTML = '<p class="empty-message">找不到符合條件的學校</p>';
        return;
    }
    
    const html = schools.map(school => `
        <a href="school-detail.html?id=${school.id}" class="school-card">
            <div class="school-card-header">
                <div>
                    <div class="school-name">${school.name}</div>
                    <div class="school-location">${school.city} ${school.district || ''} · ${school.type}</div>
                </div>
                <div class="school-rating">
                    <div class="rating-score">${(school.rating || 0).toFixed(1)}</div>
                    <div class="rating-stars">${generateStars(school.rating)}</div>
                    <div class="rating-count">${school.reviewCount || 0} 則評價</div>
                </div>
            </div>
        </a>
    `).join('');
    
    resultsList.innerHTML = html;
}

// 地區搜尋
document.getElementById('searchByRegion')?.addEventListener('click', async () => {
    const city = document.getElementById('citySelect').value;
    const district = document.getElementById('districtSelect').value;
    const schoolType = document.getElementById('schoolTypeSelect').value;
    
    if (!city) {
        showToast('請選擇縣市', 'error');
        return;
    }
    
    try {
        let q = query(collection(db, 'schools'), where('city', '==', city));
        
        if (district) {
            q = query(q, where('district', '==', district));
        }
        
        if (schoolType) {
            q = query(q, where('type', '==', schoolType));
        }
        
        const snapshot = await getDocs(q);
        const schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        displayResults(schools);
    } catch (error) {
        console.error('搜尋失敗:', error);
        showToast('搜尋失敗', 'error');
    }
});

// 關鍵字搜尋
document.getElementById('searchByKeyword')?.addEventListener('click', async () => {
    const keyword = document.getElementById('keywordInput').value.trim();
    
    if (!keyword) {
        showToast('請輸入關鍵字', 'error');
        return;
    }
    
    try {
        // 由於 Firestore 不支援全文搜尋，這裡使用簡單的開頭匹配
        const q = query(
            collection(db, 'schools'),
            where('name', '>=', keyword),
            where('name', '<=', keyword + '\uf8ff'),
            limit(50)
        );
        
        const snapshot = await getDocs(q);
        const schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        displayResults(schools);
    } catch (error) {
        console.error('搜尋失敗:', error);
        showToast('搜尋失敗', 'error');
    }
});

// Enter 鍵觸發搜尋
document.getElementById('keywordInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('searchByKeyword').click();
    }
});

// 初始化
initCitySelect();
