// 首頁功能
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// 生成星星評分顯示
function generateStars(rating) {
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

// 創建學校卡片
function createSchoolCard(school) {
    const rating = school.rating || 0;
    const reviewCount = school.reviewCount || 0;
    
    return `
        <a href="school-detail.html?id=${school.id}" class="school-card">
            <div class="school-card-header">
                <div>
                    <div class="school-name">${school.name}</div>
                    <div class="school-location">${school.city} ${school.district || ''}</div>
                </div>
                <div class="school-rating">
                    <div class="rating-score">${rating.toFixed(1)}</div>
                    <div class="rating-stars">${generateStars(rating)}</div>
                    <div class="rating-count">${reviewCount} 則評價</div>
                </div>
            </div>
        </a>
    `;
}

// 載入使用者的學校清單
async function loadUserSchools(userId) {
    try {
        // 獲取使用者設定
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        
        // 目前就讀學校
        const currentSchoolContainer = document.getElementById('currentSchool');
        if (userData?.currentSchool) {
            const schoolDoc = await getDoc(doc(db, 'schools', userData.currentSchool));
            if (schoolDoc.exists()) {
                currentSchoolContainer.innerHTML = createSchoolCard({
                    id: schoolDoc.id,
                    ...schoolDoc.data()
                });
            }
        } else {
            currentSchoolContainer.innerHTML = '<p class="empty-message">尚未設定目前就讀學校<br><a href="settings.html">前往設定</a></p>';
        }
        
        // 關注的學校
        const followedSchoolsContainer = document.getElementById('followedSchools');
        if (userData?.followedSchools && userData.followedSchools.length > 0) {
            const schoolsHtml = [];
            for (const schoolId of userData.followedSchools) {
                const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
                if (schoolDoc.exists()) {
                    schoolsHtml.push(createSchoolCard({
                        id: schoolDoc.id,
                        ...schoolDoc.data()
                    }));
                }
            }
            followedSchoolsContainer.innerHTML = schoolsHtml.join('');
        } else {
            followedSchoolsContainer.innerHTML = '<p class="empty-message">尚未關注任何學校</p>';
        }
        
        // 評價過的學校
        const ratedSchoolsContainer = document.getElementById('ratedSchools');
        const reviewsQuery = query(
            collection(db, 'reviews'),
            where('userId', '==', userId)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        if (!reviewsSnapshot.empty) {
            const schoolIds = [...new Set(reviewsSnapshot.docs.map(doc => doc.data().schoolId))];
            const schoolsHtml = [];
            for (const schoolId of schoolIds) {
                const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
                if (schoolDoc.exists()) {
                    schoolsHtml.push(createSchoolCard({
                        id: schoolDoc.id,
                        ...schoolDoc.data()
                    }));
                }
            }
            ratedSchoolsContainer.innerHTML = schoolsHtml.join('');
        } else {
            ratedSchoolsContainer.innerHTML = '<p class="empty-message">尚未評價任何學校</p>';
        }
    } catch (error) {
        console.error('載入學校清單失敗:', error);
        showToast('載入失敗', 'error');
    }
}

// 使用者選單
const userMenuBtn = document.getElementById('userMenuBtn');
const userMenu = document.getElementById('userMenu');
const closeUserMenu = document.getElementById('closeUserMenu');

userMenuBtn?.addEventListener('click', () => {
    userMenu.classList.add('active');
});

closeUserMenu?.addEventListener('click', () => {
    userMenu.classList.remove('active');
});

userMenu?.addEventListener('click', (e) => {
    if (e.target === userMenu) {
        userMenu.classList.remove('active');
    }
});

// 登出
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showToast('已登出', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        showToast('登出失敗', 'error');
    }
});

// 認證狀態監聽
onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
        // 更新使用者資訊
        document.getElementById('userName').textContent = user.displayName || '使用者';
        document.getElementById('userEmail').textContent = user.email;
        
        // 載入學校清單
        await loadUserSchools(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});
