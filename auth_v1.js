// ✅ [auth.js] - Supabase 기반 이메일/페이스북 로그인 및 프로필 자동 생성 처리

console.log("[auth.js loaded ✅]");

import { supabase } from './supabase-client.js'

console.log('🔍 Supabase import 후 상태:')
console.log('- supabase 객체:', supabase)
console.log('- supabase.auth:', supabase?.auth)
console.log('- supabase.auth.signOut:', typeof supabase?.auth?.signOut)

// DOM 요소들
const authModal = document.getElementById('authModal')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const userInfo = document.getElementById('userInfo')
const userEmail = document.getElementById('userEmail')
const authForm = document.getElementById('authForm')
const authTitle = document.getElementById('authTitle')
const authSubmitBtn = document.getElementById('authSubmitBtn')
const switchAuthMode = document.getElementById('switchAuthMode')
const authEmail = document.getElementById('authEmail')
const authPassword = document.getElementById('authPassword')
const closeModal = document.getElementById('closeModal')
const uploadCard = document.querySelector('.upload-card')
const signupBtn = document.getElementById('signupBtn')
const facebookLoginBtn = document.getElementById('facebookLoginBtn')

let isLoginMode = true
let currentUser = null

// 로그인 상태 UI
function showUserLoggedIn(user) {
  loginBtn.style.display = 'none'
  signupBtn.style.display = 'none'
  userInfo.style.display = 'flex'
  userEmail.textContent = user.email
  uploadCard.style.opacity = '1'
  uploadCard.style.pointerEvents = 'auto'
}

// 로그아웃 상태 UI
function showUserLoggedOut() {
  loginBtn.style.display = 'flex'
  signupBtn.style.display = 'flex'
  userInfo.style.display = 'none'
  uploadCard.style.opacity = '0.5'
  uploadCard.style.pointerEvents = 'none'
}

// 초기 인증 상태 확인
async function initAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    currentUser = user
    showUserLoggedIn(user)
  } else {
    showUserLoggedOut()
  }
}

function openAuthModal() {
  authModal.style.display = 'flex'
  setAuthMode(true)
}

function closeAuthModal() {
  authModal.style.display = 'none'
  authForm.reset()
}

function setAuthMode(loginMode) {
  isLoginMode = loginMode
  if (isLoginMode) {
    authTitle.textContent = '로그인'
    authSubmitBtn.textContent = '로그인'
    switchAuthMode.innerHTML = '계정이 없으신가요? <span class="auth-link">회원가입</span>'
  } else {
    authTitle.textContent = '회원가입'
    authSubmitBtn.textContent = '회원가입'
    switchAuthMode.innerHTML = '이미 계정이 있으신가요? <span class="auth-link">로그인</span>'
  }
}

async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    currentUser = data.user
    showUserLoggedIn(data.user)
    closeAuthModal()
    showMessage('로그인되었습니다!', 'success')
  } catch (error) {
    showMessage(`로그인 실패: ${error.message}`, 'error')
  }
}

async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    showMessage('회원가입 완료! 이메일을 확인해 주세요.', 'success')
    setAuthMode(true)
  } catch (error) {
    showMessage(`회원가입 실패: ${error.message}`, 'error')
  }
}

async function signOut() {
  console.log('🚪 signOut 함수 시작')
  
  // Supabase 객체 상태 확인
  console.log('🔍 supabase 존재:', !!supabase)
  if (supabase) {
    console.log('🔍 supabase.auth 존재:', !!supabase.auth)
    console.log('🔍 supabase.auth.signOut 존재:', typeof supabase.auth.signOut)
  }
  
  try {
    console.log('⏳ supabase.auth.signOut() 호출 중...')
    
    const result = await supabase.auth.signOut()
    
    console.log('📋 signOut 결과 전체:', result)
    console.log('❌ 에러 여부:', result.error)
    
    if (result.error) {
      console.error('❌ Supabase signOut 에러:', result.error)
      throw result.error
    }
    
    console.log('✅ Supabase signOut 성공')
    console.log('🔄 currentUser 업데이트 중...')
    currentUser = null
    
    console.log('🔄 UI 업데이트 중...')
    showUserLoggedOut()
    
    console.log('💬 성공 메시지 표시 중...')
    showMessage('로그아웃되었습니다.', 'success')
    
    console.log('✅ signOut 완료!')
    
  } catch (error) {
    console.error('💥 signOut 예외 발생!')
    console.error('💥 에러 타입:', typeof error)
    console.error('💥 에러 객체:', error)
    console.error('💥 에러 메시지:', error?.message)
    console.error('💥 에러 스택:', error?.stack)
    
    showMessage(`로그아웃 실패: ${error.message}`, 'error')
  }
}

function showMessage(message, type) {
  const messageEl = document.createElement('div')
  messageEl.className = `message message-${type}`
  messageEl.textContent = message
  document.body.appendChild(messageEl)
  setTimeout(() => messageEl.remove(), 3000)
}

// Facebook 로그인
async function signInWithFacebook() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
  if (error) {
    showMessage(`Facebook 로그인 실패: ${error.message}`, 'error');
  }
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    currentUser = session.user
    showUserLoggedIn(session.user)

    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!existingProfile && !error) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: session.user.id,
        role: 'free'
      })
      if (insertError) {
        console.error('프로필 삽입 실패:', insertError.message)
      } else {
        console.log('✅ 프로필 생성 완료')
      }
    }
  } else if (event === 'SIGNED_OUT') {
    currentUser = null
    showUserLoggedOut()
  }
})

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOMContentLoaded 이벤트 실행됨')
  console.log('🔘 DOM 요소들 확인:')
  console.log('- loginBtn:', !!loginBtn)
  console.log('- signupBtn:', !!signupBtn)
  console.log('- logoutBtn:', !!logoutBtn)
  console.log('- authModal:', !!authModal)
  console.log('- authForm:', !!authForm)
  loginBtn?.addEventListener('click', openAuthModal)
  signupBtn?.addEventListener('click', () => {
    openAuthModal()
    setAuthMode(false)
  })
  closeModal?.addEventListener('click', closeAuthModal)
  logoutBtn?.addEventListener('click', signOut)

  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal()
  })

  switchAuthMode?.addEventListener('click', (e) => {
    if (e.target.classList.contains('auth-link')) {
      setAuthMode(!isLoginMode)
    }
  })

  facebookLoginBtn?.addEventListener('click', signInWithFacebook)

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = authEmail.value.trim()
    const password = authPassword.value
    if (!email || !password) {
      showMessage('이메일과 비밀번호를 입력해주세요.', 'error')
      return
    }
    if (isLoginMode) {
      await signIn(email, password)
    } else {
      await signUp(email, password)
    }
  })

  initAuth()
})

export function getCurrentUser() {
  return currentUser
}

export { signInWithFacebook }
