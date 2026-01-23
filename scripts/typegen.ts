import { config } from "dotenv";
import { execSync } from "child_process";

// .env 파일 로드
config();

// 환경 변수 확인
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!accessToken) {
  console.error("Error: SUPABASE_ACCESS_TOKEN is not set in .env file");
  process.exit(1);
}

const projectId = process.env.SUPABASE_PROJECT_ID;
if (!projectId) {
  console.error("Error: SUPABASE_PROJECT_ID is not set in .env file");
  process.exit(1);
}

// supabase 명령어 실행
try {
  execSync(
    `supabase gen types typescript --project-id ${projectId} > database.types.ts`,
    {
      stdio: "inherit",
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: accessToken,
      },
    }
  );
  console.log("✓ Type generation completed successfully");
} catch (error) {
  console.error("Error generating types:", error);
  process.exit(1);
}
