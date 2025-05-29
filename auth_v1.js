// ✅ [auth_v1.js] - Supabase 기반 로그인/회원가입/로그아웃/페이스북 로그인 최적화 (Postgres 트리거 기반)

import { supabase } from './supabase-client.js';

let currentUser = null;
let isLoginMode = true;

const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userEmail = document.getElementById('userEmail');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const switchAuthMode = document.getElementById('switchAuthMode');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const closeModal = document.getElementById('closeModal');
const uploadCard = document.querySelector('.upload-card');
const signupBtn = document.getElementById('signupBtn');
const facebookLoginBtn = document.getElementById('facebookLoginBtn');

function showUserLoggedIn(user) {
  loginBtn.style.display = 'none';
  signupBtn.style.display = 'none';
  userInfo.style.display = 'flex';
  userEmail.textContent = user.email;
  uploadCard.style.opacity = '1';
  uploadCard.style.pointerEvents = 'auto';
}

function showUserLoggedOut() {
  loginBtn.style.display = 'flex';
  signupBtn.style.display = 'flex';
  userInfo.style.display = 'none';
  uploadCard.style.opacity = '0.5';
  uploadCard.style.pointerEvents = 'none';
}

async function initAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    currentUser = user;
    showUserLoggedIn(user);
  } else {
    showUserLoggedOut();
  }
}

function openAuthModal() {
  authModal.style.display = 'flex';
  setAuthMode(true);
}

function closeAuthModal() {
  authModal.style.display = 'none';
  authForm.reset();
}

function setAuthMode(loginMode) {
  isLoginMode = loginMode;
  if (isLoginMode) {
    authTitle.textContent = '로그인';
    authSubmitBtn.textContent = '로그인';
    switchAuthMode.innerHTML = '계정이 없으신가요? <span class="auth-link">회원가입</span>';
  } else {
    authTitle.textContent = '회원가입';
    authSubmitBtn.textContent = '회원가입';
    switchAuthMode.innerHTML = '이미 계정이 있으신가요? <span class="auth-link">로그인</span>';
  }
}

async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    showUserLoggedIn(data.user);
    closeAuthModal();
    showMessage('로그인되었습니다!', 'success');
  } catch (error) {
    showMessage(`로그인 실패: ${error.message}`, 'error');
  }
}

async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    showMessage('이메일을 발송했습니다. 이메일을 인증하면 회원가입이 완료됩니다.', 'success');
    setAuthMode(true);
  } catch (error) {
    showMessage(`회원가입 실패: ${error.message}`, 'error');
  }
}

async function signOut() {
  console.log('🚪 signOut 함수 시작');

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('⏰ signOut 응답 없음')), 5000)
  );

  try {
    const { error } = await Promise.race([
      supabase.auth.signOut(),
      timeout
    ]);

    if (error) throw error;

    currentUser = null;
    showUserLoggedOut();
    showMessage('로그아웃되었습니다.', 'success');
    console.log('✅ signOut 완료됨');
  } catch (error) {
    console.error('🚨 로그아웃 실패:', error.message);
    showMessage('네트워크 지연 또는 로그아웃 실패: 세션 초기화합니다.', 'error');
    await supabase.auth.setSession(null);
    currentUser = null;
    showUserLoggedOut();
  }
}

function showMessage(message, type) {
  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type}`;
  messageEl.textContent = message;
  document.body.appendChild(messageEl);
  setTimeout(() => messageEl.remove(), 5000);
}

async function signInWithFacebook() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
  if (error) {
    showMessage(`Facebook 로그인 실패: ${error.message}`, 'error');
  }
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    currentUser = session.user;
    showUserLoggedIn(session.user);
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
    showUserLoggedOut();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('📌 DOMContentLoaded 이벤트 실행됨');

  loginBtn?.addEventListener('click', openAuthModal);
  signupBtn?.addEventListener('click', () => {
    openAuthModal();
    setAuthMode(false);
  });
  logoutBtn?.addEventListener('click', signOut);
  closeModal?.addEventListener('click', closeAuthModal);

  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!email || !password) {
      showMessage('이메일과 비밀번호를 입력해주세요.', 'error');
      return;
    }
    if (isLoginMode) {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  });

  facebookLoginBtn?.addEventListener('click', signInWithFacebook);
  initAuth();
});

export function getCurrentUser() {
  return currentUser;
}

export { signInWithFacebook };