// 新增評價
import { auth, db } from './firebase-config.js';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

// 載入學校名稱
async function loadSchoolName() {
    if (!schoolId) {
        showToast('找不到學校', 'error');
        setTimeout(() => history.back(), 1500);
        return;
    }
    
    try {
        const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
        if (schoolDoc.exists()) {
            document.getElementById('reviewSchoolName').textContent = schoolDoc.data().name;
        }
    } catch (error) {
        console.error('載入失敗:', error);
    }
}

// 星級評分互動
document.querySelectorAll('.star-rating').forEach(ratingGroup => {
    const stars = ratingGroup.querySelectorAll('i');
    const inputName = ratingGroup.dataset.rating;
    const hiddenInput = document.querySelector(`input[name="${inputName}"]`);
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const value = index + 1;
            hiddenInput.value = value;
            
            // 更新星星顯示
            stars.forEach((s, i) => {
                if (i < value) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
        
        star.addEventListener('mouseenter', () => {
            const value = index + 1;
            stars.forEach((s, i) => {
                if (i < value) {
                    s.classList.add('active');
                }
            });
        });
    });
    
    ratingGroup.addEventListener('mouseleave', () => {
        const currentValue = parseInt(hiddenInput.value) || 0;
        stars.forEach((s, i) => {
            if (i >= currentValue) {
                s.classList.remove('active');
            }
        });
    });
});

// 檢查評價有效性
function checkValidity() {
    const hasAttended = document.querySelector('input[name="hasAttended"]:checked')?.value;
    const hasUsed = document.querySelector('input[name="hasUsed"]:checked')?.value;
    const warning = document.getElementById('validityWarning');
    
    if (hasAttended === 'no' && hasUsed === 'no') {
        warning.style.display = 'flex';
        return false;
    } else {
        warning.style.display = 'none';
        return true;
    }
}

document.querySelectorAll('input[name="hasAttended"], input[name="hasUsed"]').forEach(radio => {
    radio.addEventListener('change', checkValidity);
});

// 提交評價
document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
        showToast('請先登入', 'error');
        return;
    }
    
    // 檢查是否已評價過
    try {
        const existingReviewQuery = query(
            collection(db, 'reviews'),
            where('userId', '==', auth.currentUser.uid),
            where('schoolId', '==', schoolId)
        );
        
        const existingReviews = await getDocs(existingReviewQuery);
        
        if (!existingReviews.empty) {
            const lastReview = existingReviews.docs[0].data();
            const lastReviewDate = new Date(lastReview.createdAt.seconds * 1000);
            const now = new Date();
            const daysDiff = (now - lastReviewDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 90) {
                showToast('您在3個月內已評價過此學校', 'error');
                return;
            }
        }
        
        // 收集表單資料
        const formData = new FormData(e.target);
        const hasAttended = formData.get('hasAttended') === 'yes';
        const hasUsed = formData.get('hasUsed') === 'yes';
        const lastVisit = formData.get('lastVisit');
        
        const ratings = {
            cleanliness: parseInt(formData.get('cleanliness')),
            floor: parseInt(formData.get('floor')),
            toilet: parseInt(formData.get('toilet')),
            sink: parseInt(formData.get('sink')),
            flush: parseInt(formData.get('flush')),
            smell: parseInt(formData.get('smell')),
            safety: parseInt(formData.get('safety')),
            quantity: parseInt(formData.get('quantity'))
        };
        
        // 驗證所有評分都已填寫
        if (Object.values(ratings).some(v => isNaN(v) || v < 1 || v > 5)) {
            showToast('請完成所有星級評分', 'error');
            return;
        }
        
        const comment = formData.get('comment');
        const suggestion = formData.get('suggestion');
        
        // 計算權重
        let weight = 1;
        switch (lastVisit) {
            case '1month':
            case '3months':
                weight = 1.0;
                break;
            case '6months':
                weight = 0.6;
                break;
            case 'over6months':
                weight = 0.3;
                break;
        }
        
        // 計算總評分
        const avgRating = Object.values(ratings).reduce((a, b) => a + b, 0) / 8;
        
        // 新增評價
        const reviewData = {
            userId: auth.currentUser.uid,
            schoolId: schoolId,
            hasAttended,
            hasUsed,
            lastVisit,
            ...ratings,
            rating: avgRating,
            weight,
            isValid: hasAttended || hasUsed,
            comment,
            suggestion,
            likes: 0,
            dislikes: 0,
            likedBy: [],
            dislikedBy: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'reviews'), reviewData);
        
        // 更新學校評分
        await updateSchoolRating();
        
        showToast('評價提交成功！', 'success');
        setTimeout(() => {
            window.location.href = `school-detail.html?id=${schoolId}`;
        }, 1500);
    } catch (error) {
        console.error('提交失敗:', error);
        showToast('提交失敗', 'error');
    }
});

// 更新學校評分
async function updateSchoolRating() {
    try {
        const reviewsQuery = query(
            collection(db, 'reviews'),
            where('schoolId', '==', schoolId),
            where('isValid', '==', true)
        );
        
        const snapshot = await getDocs(reviewsQuery);
        const reviews = snapshot.docs.map(doc => doc.data());
        
        if (reviews.length === 0) return;
        
        // 計算加權平均
        let totalWeight = 0;
        let totalWeightedRating = 0;
        let ratingItems = {
            cleanliness: 0,
            floor: 0,
            toilet: 0,
            sink: 0,
            flush: 0,
            smell: 0,
            safety: 0,
            quantity: 0
        };
        
        reviews.forEach(review => {
            const weight = review.weight || 1;
            totalWeight += weight;
            totalWeightedRating += review.rating * weight;
            
            Object.keys(ratingItems).forEach(key => {
                ratingItems[key] += review[key] * weight;
            });
        });
        
        const avgRating = totalWeightedRating / totalWeight;
        Object.keys(ratingItems).forEach(key => {
            ratingItems[key] /= totalWeight;
        });
        
        // 計算學生比例
        const studentReviews = reviews.filter(r => r.hasAttended && r.hasUsed).length;
        const studentRatio = Math.round((studentReviews / reviews.length) * 100);
        
        // 更新學校文件
        await updateDoc(doc(db, 'schools', schoolId), {
            rating: avgRating,
            ...ratingItems,
            reviewCount: reviews.length,
            studentRatio,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('更新學校評分失敗:', error);
    }
}

// 載入頁面
loadSchoolName();
