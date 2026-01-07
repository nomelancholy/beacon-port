import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../database.types";

// Create a single supabase client for interacting with your database
// Only create client in browser environment to avoid SSR errors
function createClient() {
  // 클라이언트 사이드에서만 실행
  if (typeof window === "undefined") {
    // 서버 사이드에서는 더미 객체 반환 (실제로는 사용되지 않음)
    // SkillInput 컴포넌트에서 직접 클라이언트를 생성하므로 여기서는 null 반환
    return null as any;
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // 환경 변수가 없어도 에러를 던지지 않고 null 반환
    // 실제 사용 시 SkillInput 컴포넌트에서 체크함
    return null as any;
  }

  return createBrowserClient<Database>(url, anonKey);
}

// 모듈 로드 시 즉시 실행되지 않도록 함수로 감싸기
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

function getClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

export default getClient();
