// 認證相關功能
import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// 顯示 Toast 通知
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// 驗證密碼格式
function validatePassword(password) {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return minLength && hasUpper && hasLower && hasNumber;
}

// 切換表單顯示
document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
});

document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
});

document.getElementById('backToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('verifyEmail').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
});

// 註冊處理
document.getElementById('registerFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;
    
    // 驗證密碼
    if (!validatePassword(password)) {
        showToast('密碼須至少8個字元，包含大寫、小寫英文及數字', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('兩次輸入的密碼不一致', 'error');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 發送驗證郵件
        await sendEmailVerification(userCredential.user);
        
        // 顯示驗證頁面
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('verifyEmail').classList.add('active');
        document.getElementById('verifyEmailAddress').textContent = email;
        
        showToast('註冊成功！請查看您的郵件進行驗證', 'success');
        
        // 登出用戶，要求驗證後才能登入
        await signOut(auth);
    } catch (error) {
        let message = '註冊失敗';
        if (error.code === 'auth/email-already-in-use') {
            message = '此電子郵件已被使用';
        } else if (error.code === 'auth/invalid-email') {
            message = '電子郵件格式不正確';
        }
        showToast(message, 'error');
    }
});

// 登入處理
document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // 檢查郵件是否已驗證
        if (!userCredential.user.emailVerified) {
            showToast('請先驗證您的電子郵件', 'error');
            await signOut(auth);
            
            document.getElementById('loginForm').classList.remove('active');
            document.getElementById('verifyEmail').classList.add('active');
            document.getElementById('verifyEmailAddress').textContent = email;
            return;
        }
        
        showToast('登入成功！', 'success');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1000);
    } catch (error) {
        let message = '登入失敗';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            message = '電子郵件或密碼錯誤';
        } else if (error.code === 'auth/invalid-email') {
            message = '電子郵件格式不正確';
        }
        showToast(message, 'error');
    }
});

// 重新發送驗證郵件
document.getElementById('resendVerification')?.addEventListener('click', async () => {
    const email = document.getElementById('verifyEmailAddress').textContent;
    try {
        // 暫時登入以發送驗證郵件
        const password = prompt('請輸入您的密碼以重新發送驗證郵件：');
        if (!password) return;
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        
        showToast('驗證郵件已重新發送', 'success');
    } catch (error) {
        showToast('發送失敗，請確認密碼是否正確', 'error');
    }
});

// 忘記密碼（簡單版本）
document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('請聯繫管理員重設密碼');
});

// 檢查認證狀態
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user && user.emailVerified && currentPage === 'index.html') {
        // 已登入且郵件已驗證，重定向到首頁
        window.location.href = 'home.html';
    } else if (!user && currentPage !== 'index.html' && currentPage !== '') {
        // 未登入且不在登入頁面，重定向到登入頁
        window.location.href = 'index.html';
    }
});
