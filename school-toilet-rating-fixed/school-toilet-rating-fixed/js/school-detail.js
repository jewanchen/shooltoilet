// 學校詳情頁面
import { auth, db } from './firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const urlParams = new URLSearchParams(window.location.search);
const schoolId = urlParams.get('id');

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

// 載入學校詳情
async function loadSchoolDetail() {
    if (!schoolId) {
        showToast('找不到學校', 'error');
        setTimeout(() => history.back(), 1500);
        return;
    }
    
    try {
        const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
        
        if (!schoolDoc.exists()) {
            showToast('學校不存在', 'error');
            setTimeout(() => history.back(), 1500);
            return;
        }
        
        const school = schoolDoc.data();
        
        // 更新頁面資訊
        document.getElementById('schoolName').textContent = school.name;
        document.getElementById('schoolNameDetail').textContent = school.name;
        document.getElementById('schoolLocation').textContent = `${school.city} ${school.district || ''} · ${school.type}`;
        
        // 評分資訊
        const rating = school.rating || 0;
        const reviewCount = school.reviewCount || 0;
        
        document.getElementById('overallScore').textContent = rating.toFixed(1);
        document.getElementById('overallStars').innerHTML = generateStars(rating);
        document.getElementById('ratingCount').textContent = `${reviewCount} 則評價`;
        
        // 評分細項
        const ratingItems = ['cleanliness', 'floor', 'toilet', 'sink', 'flush', 'smell', 'safety', 'quantity'];
        ratingItems.forEach(item => {
            const value = school[item] || 0;
            document.getElementById(item).textContent = value.toFixed(1);
            const fill = document.querySelector(`[data-item="${item}"]`);
            if (fill) {
                fill.style.width = `${(value / 5) * 100}%`;
            }
        });
        
        // 學生比例
        const studentRatio = school.studentRatio || 0;
        document.getElementById('studentRatio').style.width = `${studentRatio}%`;
        document.getElementById('studentRatio').querySelector('span').textContent = `在校生 ${studentRatio}%`;
        document.getElementById('nonStudentRatio').style.width = `${100 - studentRatio}%`;
        document.getElementById('nonStudentRatio').querySelector('span').textContent = `非在校生 ${100 - studentRatio}%`;
        
        // 載入評論
        await loadReviews();
        await loadSuggestions();
        
        // 檢查關注狀態
        if (auth.currentUser) {
            await checkFollowStatus();
        }
    } catch (error) {
        console.error('載入失敗:', error);
        showToast('載入失敗', 'error');
    }
}

// 載入評論
async function loadReviews() {
    try {
        const reviewsQuery = query(
            collection(db, 'reviews'),
            where('schoolId', '==', schoolId),
            where('isValid', '==', true)
        );
        
        const snapshot = await getDocs(reviewsQuery);
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 排序
        const sortBy = document.getElementById('reviewSort')?.value || 'likes';
        if (sortBy === 'likes') {
            reviews.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        } else {
            reviews.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        }
        
        const reviewsList = document.getElementById('reviewsList');
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p class="empty-message">尚無評論</p>';
            return;
        }
        
        const html = reviews.map(review => {
            const date = new Date(review.createdAt.seconds * 1000).toLocaleDateString('zh-TW');
            const isStudent = review.hasAttended && review.hasUsed;
            
            return `
                <div class="review-item" data-id="${review.id}">
                    <div class="review-header">
                        <div class="review-user">
                            <span>${review.userName || '匿名使用者'}</span>
                            ${isStudent ? '<span class="user-badge">在校生</span>' : '<span class="user-badge" style="background: #64748b;">非在校生</span>'}
                        </div>
                        <span class="review-date">${date}</span>
                    </div>
                    <div class="review-content">${review.comment || '無文字評論'}</div>
                    <div class="review-actions">
                        <button class="action-btn like-btn ${review.likedBy?.includes(auth.currentUser?.uid) ? 'active' : ''}" data-id="${review.id}">
                            <i class="fas fa-thumbs-up"></i> ${review.likes || 0}
                        </button>
                        <button class="action-btn dislike-btn ${review.dislikedBy?.includes(auth.currentUser?.uid) ? 'active' : ''}" data-id="${review.id}">
                            <i class="fas fa-thumbs-down"></i> ${review.dislikes || 0}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        reviewsList.innerHTML = html;
        
        // 綁定按讚事件
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', () => handleLike(btn.dataset.id, true));
        });
        
        document.querySelectorAll('.dislike-btn').forEach(btn => {
            btn.addEventListener('click', () => handleLike(btn.dataset.id, false));
        });
    } catch (error) {
        console.error('載入評論失敗:', error);
    }
}

// 載入建議
async function loadSuggestions() {
    try {
        const reviewsQuery = query(
            collection(db, 'reviews'),
            where('schoolId', '==', schoolId),
            where('isValid', '==', true)
        );
        
        const snapshot = await getDocs(reviewsQuery);
        const suggestions = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(review => review.suggestion && review.suggestion.trim() !== '');
        
        suggestions.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        
        const suggestionsList = document.getElementById('suggestionsList');
        
        if (suggestions.length === 0) {
            suggestionsList.innerHTML = '<p class="empty-message">尚無建議</p>';
            return;
        }
        
        const html = suggestions.map(item => {
            const date = new Date(item.createdAt.seconds * 1000).toLocaleDateString('zh-TW');
            
            return `
                <div class="suggestion-item">
                    <div class="review-header">
                        <div class="review-user">
                            <span>${item.userName || '匿名使用者'}</span>
                        </div>
                        <span class="review-date">${date}</span>
                    </div>
                    <div class="review-content">${item.suggestion}</div>
                    <div class="review-actions">
                        <button class="action-btn like-btn ${item.likedBy?.includes(auth.currentUser?.uid) ? 'active' : ''}" data-id="${item.id}">
                            <i class="fas fa-thumbs-up"></i> ${item.likes || 0}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        suggestionsList.innerHTML = html;
    } catch (error) {
        console.error('載入建議失敗:', error);
    }
}

// 按讚/倒讚
async function handleLike(reviewId, isLike) {
    if (!auth.currentUser) {
        showToast('請先登入', 'error');
        return;
    }
    
    try {
        const reviewRef = doc(db, 'reviews', reviewId);
        const reviewDoc = await getDoc(reviewRef);
        const reviewData = reviewDoc.data();
        
        const likedBy = reviewData.likedBy || [];
        const dislikedBy = reviewData.dislikedBy || [];
        const userId = auth.currentUser.uid;
        
        if (isLike) {
            if (likedBy.includes(userId)) {
                // 取消按讚
                await updateDoc(reviewRef, {
                    likes: (reviewData.likes || 0) - 1,
                    likedBy: arrayRemove(userId)
                });
            } else {
                // 按讚
                await updateDoc(reviewRef, {
                    likes: (reviewData.likes || 0) + 1,
                    likedBy: arrayUnion(userId),
                    ...(dislikedBy.includes(userId) && {
                        dislikes: (reviewData.dislikes || 0) - 1,
                        dislikedBy: arrayRemove(userId)
                    })
                });
            }
        } else {
            if (dislikedBy.includes(userId)) {
                // 取消倒讚
                await updateDoc(reviewRef, {
                    dislikes: (reviewData.dislikes || 0) - 1,
                    dislikedBy: arrayRemove(userId)
                });
            } else {
                // 倒讚
                await updateDoc(reviewRef, {
                    dislikes: (reviewData.dislikes || 0) + 1,
                    dislikedBy: arrayUnion(userId),
                    ...(likedBy.includes(userId) && {
                        likes: (reviewData.likes || 0) - 1,
                        likedBy: arrayRemove(userId)
                    })
                });
            }
        }
        
        await loadReviews();
    } catch (error) {
        console.error('操作失敗:', error);
        showToast('操作失敗', 'error');
    }
}

// 檢查關注狀態
async function checkFollowStatus() {
    try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        const followedSchools = userData?.followedSchools || [];
        
        const followBtn = document.getElementById('followBtn');
        if (followedSchools.includes(schoolId)) {
            followBtn.innerHTML = '<i class="fas fa-star"></i>';
            followBtn.classList.add('active');
        } else {
            followBtn.innerHTML = '<i class="far fa-star"></i>';
            followBtn.classList.remove('active');
        }
    } catch (error) {
        console.error('檢查關注狀態失敗:', error);
    }
}

// 關注/取消關注
document.getElementById('followBtn')?.addEventListener('click', async () => {
    if (!auth.currentUser) {
        showToast('請先登入', 'error');
        return;
    }
    
    try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const followedSchools = userData?.followedSchools || [];
        
        if (followedSchools.includes(schoolId)) {
            await updateDoc(userRef, {
                followedSchools: arrayRemove(schoolId)
            });
            showToast('已取消關注', 'success');
        } else {
            await updateDoc(userRef, {
                followedSchools: arrayUnion(schoolId)
            });
            showToast('已關注', 'success');
        }
        
        await checkFollowStatus();
    } catch (error) {
        console.error('操作失敗:', error);
        showToast('操作失敗', 'error');
    }
});

// 新增評價
document.getElementById('addReviewBtn')?.addEventListener('click', () => {
    window.location.href = `add-review.html?id=${schoolId}`;
});

// 排序變更
document.getElementById('reviewSort')?.addEventListener('change', loadReviews);

// 載入頁面
loadSchoolDetail();
