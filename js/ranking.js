// 排行榜功能
import { db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// 台灣縣市
const taiwanCities = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'];

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
        return '<i class="far fa-star"></i>'.repeat(5);
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

// 創建排行榜項目
function createRankingItem(school, rank) {
    let rankClass = '';
    if (rank === 1) rankClass = 'top1';
    else if (rank === 2) rankClass = 'top2';
    else if (rank === 3) rankClass = 'top3';
    
    return `
        <a href="school-detail.html?id=${school.id}" class="ranking-item">
            <div class="ranking-number ${rankClass}">${rank}</div>
            <div class="ranking-info">
                <h4>${school.name}</h4>
                <p>${school.city} ${school.district || ''}</p>
            </div>
            <div class="school-rating">
                <div class="rating-score">${(school.rating || 0).toFixed(1)}</div>
                <div class="rating-stars">${generateStars(school.rating)}</div>
            </div>
        </a>
    `;
}

// 載入某個學制的排行榜
async function loadTypeRanking(type, limitNum = 5) {
    try {
        const q = query(
            collection(db, 'schools'),
            where('type', '==', type),
            where('reviewCount', '>', 0),
            orderBy('rating', 'desc'),
            firestoreLimit(limitNum)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('載入失敗:', error);
        return [];
    }
}

// 載入全國排行
async function loadNationalRanking() {
    try {
        // 大學
        const universities = await loadTypeRanking('大學', 5);
        const universityContainer = document.getElementById('universityRanking');
        if (universities.length > 0) {
            universityContainer.innerHTML = universities.map((school, index) => 
                createRankingItem(school, index + 1)
            ).join('');
        } else {
            universityContainer.innerHTML = '<p class="empty-message">尚無評價資料</p>';
        }
        
        // 高中
        const highSchools = await loadTypeRanking('高中', 5);
        const highSchoolContainer = document.getElementById('highSchoolRanking');
        if (highSchools.length > 0) {
            highSchoolContainer.innerHTML = highSchools.map((school, index) => 
                createRankingItem(school, index + 1)
            ).join('');
        } else {
            highSchoolContainer.innerHTML = '<p class="empty-message">尚無評價資料</p>';
        }
        
        // 國中
        const middleSchools = await loadTypeRanking('國中', 5);
        const middleSchoolContainer = document.getElementById('middleSchoolRanking');
        if (middleSchools.length > 0) {
            middleSchoolContainer.innerHTML = middleSchools.map((school, index) => 
                createRankingItem(school, index + 1)
            ).join('');
        } else {
            middleSchoolContainer.innerHTML = '<p class="empty-message">尚無評價資料</p>';
        }
        
        // 國小
        const elementarySchools = await loadTypeRanking('國小', 5);
        const elementaryContainer = document.getElementById('elementaryRanking');
        if (elementarySchools.length > 0) {
            elementaryContainer.innerHTML = elementarySchools.map((school, index) => 
                createRankingItem(school, index + 1)
            ).join('');
        } else {
            elementaryContainer.innerHTML = '<p class="empty-message">尚無評價資料</p>';
        }
    } catch (error) {
        console.error('載入排行榜失敗:', error);
        showToast('載入失敗', 'error');
    }
}

// 標籤切換
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.ranking-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tab + 'Ranking').classList.add('active');
    });
});

// 初始化縣市選單
function initCitySelect() {
    const citySelect = document.getElementById('rankingCity');
    taiwanCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// 自訂搜尋
document.getElementById('searchRanking')?.addEventListener('click', async () => {
    const city = document.getElementById('rankingCity').value;
    const type = document.getElementById('rankingType').value;
    
    try {
        let q = query(
            collection(db, 'schools'),
            where('reviewCount', '>', 0),
            orderBy('rating', 'desc'),
            firestoreLimit(50)
        );
        
        const snapshot = await getDocs(q);
        let schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 過濾
        if (city) {
            schools = schools.filter(s => s.city === city);
        }
        if (type) {
            schools = schools.filter(s => s.type === type);
        }
        
        schools = schools.slice(0, 20);
        
        const resultsContainer = document.getElementById('customRankingResults');
        
        if (schools.length === 0) {
            resultsContainer.innerHTML = '<p class="empty-message">找不到符合條件的學校</p>';
            return;
        }
        
        const html = schools.map((school, index) => 
            createRankingItem(school, index + 1)
        ).join('');
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        console.error('搜尋失敗:', error);
        showToast('搜尋失敗', 'error');
    }
});

// 查看更多按鈕
document.querySelectorAll('.btn-link').forEach(btn => {
    btn.addEventListener('click', async () => {
        const type = btn.dataset.type;
        const schools = await loadTypeRanking(type, 50);
        
        const modal = document.getElementById('fullRankingModal');
        document.getElementById('fullRankingTitle').textContent = `${type} Top 50`;
        
        const html = schools.map((school, index) => 
            createRankingItem(school, index + 1)
        ).join('');
        
        document.getElementById('fullRankingList').innerHTML = html;
        modal.classList.add('active');
    });
});

// 關閉模態框
document.getElementById('closeFullRanking')?.addEventListener('click', () => {
    document.getElementById('fullRankingModal').classList.remove('active');
});

document.getElementById('fullRankingModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'fullRankingModal') {
        e.target.classList.remove('active');
    }
});

// 初始化
initCitySelect();
loadNationalRanking();
