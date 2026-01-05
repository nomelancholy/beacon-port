-- 1. 신규 유저 가입 시 실행될 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    if new.raw_app_meta_data is not null then
        if new.raw_app_meta_data ? 'provider' AND new.raw_app_meta_data ->> 'provider' = 'email' then
            INSERT INTO public.profiles (id, email, nickname, provider)
            VALUES (
                new.id,                                          -- auth.users의 UUID
                new.email,                                       -- 이메일
                'Anonymous',            -- 가입시 제공되는 이름
                new.raw_app_meta_data->>'provider'                    -- 가입 경로 (google, github 등)
            );
        end if;
    end if;


  RETURN new;
END;
$$ LANGUAGE plpgsql security definer; -- security definer 권한으로 설정하여 권한 문제 방지

-- 2. auth.users 테이블에 INSERT가 발생한 직후 함수 호출하는 트리거 설정
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();