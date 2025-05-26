console.log("[auth.js loaded ✅]");

import { supabase } from './supabase-client.js'

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

let isLoginMode = true

// 현재 사용자 상태
let currentUser = null

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

// 모달 열기
function openAuthModal() {
  authModal.style.display = 'flex'
  setAuthMode(true) // 기본은 로그인 모드
}

// 모달 닫기
function closeAuthModal() {
  authModal.style.display = 'none'
  authForm.reset()
}

// 인증 모드 변경 (로그인/회원가입)
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

// 로그인
async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    currentUser = data.user
    showUserLoggedIn(data.user)
    closeAuthModal()
    showMessage('로그인되었습니다!', 'success')
    
  } catch (error) {
    showMessage(`로그인 실패: ${error.message}`, 'error')
  }
}

// 회원가입
async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error

    showMessage('회원가입 완료! 이메일을 확인해 주세요.', 'success')
    setAuthMode(true) // 로그인 모드로 전환

  } catch (error) {
    showMessage(`회원가입 실패: ${error.message}`, 'error')
  }
}

// 로그아웃
async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    currentUser = null
    showUserLoggedOut()
    showMessage('로그아웃되었습니다.', 'success')
    
  } catch (error) {
    showMessage(`로그아웃 실패: ${error.message}`, 'error')
  }
}

// 메시지 표시
function showMessage(message, type) {
  const messageEl = document.createElement('div')
  messageEl.className = `message message-${type}`
  messageEl.textContent = message
  
  document.body.appendChild(messageEl)
  
  setTimeout(() => {
    messageEl.remove()
  }, 3000)
}

// DOMContentLoaded 안으로 옮겨서 모든 요소가 렌더링된 이후 실행되게 처리
document.addEventListener('DOMContentLoaded', () => {
  loginBtn?.addEventListener('click', openAuthModal)
  logoutBtn?.addEventListener('click', signOut)
  closeModal?.addEventListener('click', closeAuthModal)
  signupBtn?.addEventListener('click', () => {
    openAuthModal()
    setAuthMode(false)
  })

  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal()
  })

  switchAuthMode?.addEventListener('click', (e) => {
    if (e.target.classList.contains('auth-link')) {
      setAuthMode(!isLoginMode)
    }
  })

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


// Supabase 인증 상태 변경 감지
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    currentUser = session.user
    showUserLoggedIn(session.user)

    // ✅ 로그인한 유저의 profile이 이미 존재하는지 확인
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    // ✅ 존재하지 않으면 profile을 생성
    if (!existingProfile && !error) {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: session.user.id,
        role: 'free' // 기본 역할 설정
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


// 현재 사용자 반환 함수 (다른 파일에서 사용 가능)
export function getCurrentUser() {
  return currentUser
}
