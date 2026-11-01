import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";
import type { ResumePayload } from "./save-resume";

export async function saveResume(
  supabase: SupabaseClient<Database>, userId: string,
  resumeId: string | null, input: ResumePayload,
): Promise<{ success: true; resumeId: string } | { success: false; error: string }> {
  let uploadedPath: string | null = null;
  let canRemoveUpload = true;
  const payload = { ...input, resume: { ...input.resume } };
  try {
    // Check ownership before uploading. The RPC checks again under a row lock.
    if (resumeId) {
      const { data, error } = await supabase.from("resumes").select("user_id").eq("id", resumeId).single();
      if (error || !data || data.user_id !== userId) {
        return { success: false, error: "이력서를 찾을 수 없거나 수정 권한이 없습니다." };
      }
    }
    const photo = payload.resume.photo;
    if (photo?.startsWith("data:")) {
      const match = /^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
      if (!match) return { success: false, error: "지원하지 않는 사진 형식입니다." };
      const buffer = Buffer.from(match[2], "base64");
      if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
        return { success: false, error: "사진 크기는 5MB 이하여야 합니다." };
      }
      const path = `${userId}/${crypto.randomUUID()}.${match[1] === "jpeg" ? "jpg" : match[1]}`;
      const { error } = await supabase.storage.from("photos").upload(path, buffer, {
        contentType: `image/${match[1]}`, cacheControl: "3600", upsert: false,
      });
      if (error) throw error;
      uploadedPath = path;
      payload.resume.photo = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
    } else if (photo) {
      const url = new URL(photo);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid photo URL");
    }

    // One RPC is one database transaction. Never fall back to separate writes.
    // A lost response may follow a successful commit. Keep the upload in that
    // ambiguous case; deleting it could break the photo on a committed resume.
    canRemoveUpload = false;
    const { data, error } = await supabase.rpc("save_resume", { p_resume_id: resumeId, p_payload: payload });
    if (error) {
      canRemoveUpload = /^[0-9A-Z]{5}$/.test(error.code) || error.code.startsWith("PGRST");
      throw error;
    }
    if (!data) throw new Error("Missing saved resume ID");
    return { success: true, resumeId: data };
  } catch (error) {
    // Storage is outside the DB transaction; remove only this attempt's upload.
    if (uploadedPath && canRemoveUpload) {
      try {
        const { error: cleanupError } = await supabase.storage.from("photos").remove([uploadedPath]);
        if (cleanupError) console.error("Resume photo cleanup failed");
      } catch { console.error("Resume photo cleanup failed"); }
    }
    console.error("Resume save failed", error && typeof error === "object" && "code" in error ? error.code : "unknown");
    return { success: false, error: "이력서를 저장하지 못했습니다. 입력 내용을 유지한 채 다시 시도해주세요." };
  }
}
