// checkQuotaAndUse.js
import { supabase } from './supabase-client.js';

export async function checkQuotaAndUse(userId) {
  console.log("📌 checkQuotaAndUse 호출됨, userId:", userId);
  // 1. 사용자별 한도 조회
  const { data: quota, error: quotaError } = await supabase
    .from('user_quotas')
    .select('monthly_limit, last_reset') // 250529 last reset 조회 추가함
    .eq('user_id', userId)
    .single();

  console.log("📊 quota 조회 결과:", quota);       // ✅ 추가
  console.log("⚠️ quotaError:", quotaError);       // ✅ 추가

  if (quotaError || !quota) {
    console.error('❌ user_quotas 조회 오류:', quotaError?.message);
    throw new Error('사용량 정보를 불러올 수 없습니다.');
  }

  // 2. [250529 추가] 매월 1일 기준 자동 초기화 로직
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartISO = monthStart.toISOString();

  if (!quota.last_reset || new Date(quota.last_reset) < monthStart) {
    console.log("🔄 last_reset 자동 갱신");
    await supabase
      .from('user_quotas')
      .update({ last_reset: monthStartISO })
      .eq('user_id', userId);
  }

  // 2. 이번 달 사용 기록 개수 조회
  const { count: usedCount, error: countError } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('used_at', monthStartISO);

  if (countError) {
    console.error('❌ usage_logs 조회 오류:', countError.message);
    throw new Error('사용 기록 조회 실패');
  }

  // 3. 사용 가능 여부 판단
  const remaining = quota.monthly_limit - usedCount;
  const allowed = remaining > 0;

  return {
    allowed,
    remaining,
    usedCount
  };
}
