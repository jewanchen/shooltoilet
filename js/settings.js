// 個人設定功能
import { auth, db, storage } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// 載入使用者設定
async function loadSettings() {
    if (!auth.currentUser) return;
    
    try {
        document.getElementById('userEmail').value = auth.currentUser.email;
        
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // 個人資料
            if (userData.displayName) {
                document.getElementById('userName').value = userData.displayName;
            }
            
            if (userData.photoURL) {
                const avatarPreview = document.getElementById('avatarPreview');
                avatarPreview.innerHTML = `<img src="${userData.photoURL}" alt="頭像">`;
            }
            
            // 教育背景
            if (userData.education) {
                const edu = userData.education;
                
                if (edu.elementary) {
                    document.getElementById('elementary').value = edu.elementary.school || '';
                    document.getElementById('elementaryStart').value = edu.elementary.startYear || '';
                    document.getElementById('elementaryEnd').value = edu.elementary.endYear || '';
                }
                
                if (edu.middle) {
                    document.getElementById('middle').value = edu.middle.school || '';
                    document.getElementById('middleStart').value = edu.middle.startYear || '';
                    document.getElementById('middleEnd').value = edu.middle.endYear || '';
                }
                
                if (edu.high) {
                    document.getElementById('high').value = edu.high.school || '';
                    document.getElementById('highStart').value = edu.high.startYear || '';
                    document.getElementById('highEnd').value = edu.high.endYear || '';
                }
                
                if (edu.university) {
                    document.getElementById('university').value = edu.university.school || '';
                    document.getElementById('universityStart').value = edu.university.startYear || '';
                    document.getElementById('universityEnd').value = edu.university.endYear || '';
                }
            }
            
            // 目前就讀
            if (userData.currentSchool) {
                document.getElementById('currentSchool').value = userData.currentSchool;
            }
            if (userData.currentGrade) {
                document.getElementById('currentGrade').value = userData.currentGrade;
            }
        }
    } catch (error) {
        console.error('載入設定失敗:', error);
        showToast('載入設定失敗', 'error');
    }
}

// 上傳頭像
document.getElementById('avatarInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
        showToast('請選擇圖片文件', 'error');
        return;
    }
    
    // 檢查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('圖片大小不能超過 5MB', 'error');
        return;
    }
    
    try {
        // 上傳到 Storage
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        
        // 更新 Firestore
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            photoURL
        });
        
        // 更新 Auth Profile
        await updateProfile(auth.currentUser, { photoURL });
        
        // 更新預覽
        const avatarPreview = document.getElementById('avatarPreview');
        avatarPreview.innerHTML = `<img src="${photoURL}" alt="頭像">`;
        
        showToast('頭像更新成功', 'success');
    } catch (error) {
        console.error('上傳失敗:', error);
        showToast('上傳失敗', 'error');
    }
});

// 刪除頭像
document.getElementById('removeAvatar')?.addEventListener('click', async () => {
    if (!confirm('確定要刪除頭像嗎？')) return;
    
    try {
        // 刪除 Storage 中的文件
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        try {
            await deleteObject(storageRef);
        } catch (error) {
            // 如果文件不存在，忽略錯誤
        }
        
        // 更新 Firestore
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            photoURL: null
        });
        
        // 更新 Auth Profile
        await updateProfile(auth.currentUser, { photoURL: null });
        
        // 更新預覽
        const avatarPreview = document.getElementById('avatarPreview');
        avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
        
        showToast('頭像已刪除', 'success');
    } catch (error) {
        console.error('刪除失敗:', error);
        showToast('刪除失敗', 'error');
    }
});

// 儲存設定
document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) return;
    
    try {
        const displayName = document.getElementById('userName').value;
        
        // 收集教育背景資料
        const education = {
            elementary: {
                school: document.getElementById('elementary').value,
                startYear: parseInt(document.getElementById('elementaryStart').value) || null,
                endYear: parseInt(document.getElementById('elementaryEnd').value) || null
            },
            middle: {
                school: document.getElementById('middle').value,
                startYear: parseInt(document.getElementById('middleStart').value) || null,
                endYear: parseInt(document.getElementById('middleEnd').value) || null
            },
            high: {
                school: document.getElementById('high').value,
                startYear: parseInt(document.getElementById('highStart').value) || null,
                endYear: parseInt(document.getElementById('highEnd').value) || null
            },
            university: {
                school: document.getElementById('university').value,
                startYear: parseInt(document.getElementById('universityStart').value) || null,
                endYear: parseInt(document.getElementById('universityEnd').value) || null
            }
        };
        
        const currentSchool = document.getElementById('currentSchool').value;
        const currentGrade = document.getElementById('currentGrade').value;
        
        // 更新 Firestore
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            await updateDoc(userRef, {
                displayName,
                education,
                currentSchool,
                currentGrade,
                updatedAt: new Date()
            });
        } else {
            await setDoc(userRef, {
                email: auth.currentUser.email,
                displayName,
                education,
                currentSchool,
                currentGrade,
                followedSchools: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        
        // 更新 Auth Profile
        await updateProfile(auth.currentUser, { displayName });
        
        showToast('設定已儲存', 'success');
        
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);
    } catch (error) {
        console.error('儲存失敗:', error);
        showToast('儲存失敗', 'error');
    }
});

// 載入設定
auth.onAuthStateChanged((user) => {
    if (user) {
        loadSettings();
    } else {
        window.location.href = 'index.html';
    }
});
