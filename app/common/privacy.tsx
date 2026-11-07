import type { Route } from "./+types/privacy";
import { PolicyLayout, PolicySection, policyContact } from "../components/policy-layout";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "개인정보처리방침 | Beacon Port" },
    { name: "description", content: "Beacon Port의 개인정보 수집·이용, Google·GitHub 로그인, 공개 이력서, 보관 및 삭제에 관한 안내입니다." },
    { tagName: "link", rel: "canonical", href: "https://beacon-port.vercel.app/privacy" },
  ];
}

export default function Privacy() {
  return (
    <PolicyLayout current="privacy" title="개인정보처리방침"
      description="Beacon Port는 온라인 이력서를 작성·관리하고 공유하는 서비스입니다. 운영자 TakeKnowledge는 다음과 같이 개인정보를 처리합니다.">
      <PolicySection id="purpose" title="1. 개인정보를 이용하는 목적">
        <p>회원 가입과 본인 계정 확인, 로그인 유지, 이력서 작성·저장·수정·공유, 문의 응대, 부정 이용 방지와 서비스 보안을 위해 개인정보를 이용합니다. 이용 목적을 변경하는 경우 관련 법령에 따라 필요한 안내와 절차를 진행합니다.</p>
      </PolicySection>

      <PolicySection id="collection" title="2. 수집하는 정보와 수집 방법">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong className="text-white">회원 정보:</strong> 이메일, 회원 식별자, 닉네임, 가입·수정 시각 및 로그인 제공자 정보를 처리합니다. 이메일 가입 시 입력한 비밀번호는 인증 서비스인 Supabase를 통해 처리되며 평문으로 보관하지 않습니다.</li>
          <li><strong className="text-white">Google 로그인:</strong> 사용자가 승인한 범위의 Google 계정 식별자, 이메일, 이름, 프로필 사진 등 기본 프로필 정보를 인증과 계정 생성에 이용합니다. Google 비밀번호, Gmail 메일 내용, 주소록이나 Google Drive 파일을 제공받지 않습니다.</li>
          <li><strong className="text-white">GitHub 로그인:</strong> GitHub 계정 식별자, 사용자 이름, 이메일과 프로필 사진 등 승인된 기본 계정 정보를 인증에 이용합니다. 이력서 서비스가 GitHub 저장소 내용에 접근하는 기능은 제공하지 않습니다.</li>
          <li><strong className="text-white">이력서 정보:</strong> 이용자가 입력한 제목·이름과 선택하여 입력한 직무, 사진, 이메일, 전화번호, 주소, 소개, 외부 링크, 경력, 프로젝트, 학력, 자격증, 어학 성적, 활동 및 기술 스택 정보를 저장합니다. 불필요한 정보는 입력하지 않을 수 있습니다.</li>
          <li><strong className="text-white">이용·문의 정보:</strong> 서비스 요청 과정에서 IP 주소, 접속 시각, 요청 주소, 브라우저·기기 정보와 오류·보안 기록이 호스팅·인증 인프라에서 처리될 수 있습니다. 이메일 문의 시 발신 주소와 문의 내용을 처리합니다.</li>
        </ul>
        <p>정보는 이용자의 입력·업로드, 소셜 로그인 제공자가 승인 범위 내에서 전달하는 정보 및 서비스 이용 중 생성되는 요청을 통해 수집됩니다. 로그인과 저장에 필요한 정보를 제공하지 않으면 해당 기능을 이용하기 어렵습니다.</p>
      </PolicySection>

      <PolicySection id="sharing" title="3. 이력서 공개와 사진의 공개 범위">
        <p>새 이력서는 기본적으로 비공개입니다. 이용자가 공개로 전환하면 해당 링크에 접근하는 누구나 이력서에 포함된 정보를 열람할 수 있습니다. 공개 전 연락처·주소 등 포함된 내용을 확인해주세요. 열람자가 저장·인쇄·공유하거나 외부 검색 서비스에 수집한 사본은 이후 비공개 전환이나 삭제만으로 회수되지 않을 수 있습니다.</p>
        <p className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4 text-amber-100"><strong>사진 공개 안내:</strong> 업로드한 사진은 공개 URL로 제공됩니다. 사진 주소를 아는 사람은 이력서 공개 여부와 관계없이 사진에 접근할 수 있습니다. 이력서를 비공개로 바꾸거나 삭제해도 기존 사진 파일이 자동으로 모두 삭제되지는 않습니다. 사진 파일의 완전한 삭제가 필요하면 아래 문의처로 요청해주세요.</p>
        <p>운영자는 개인정보를 판매하거나 광고 목적으로 제공하지 않습니다. 이용자가 선택한 공개·공유, 서비스 운영에 필요한 처리위탁 또는 법령상 근거가 있는 경우에 한해 해당 목적에 필요한 정보를 처리합니다.</p>
      </PolicySection>

      <PolicySection id="google-data" title="4. Google 사용자 정보의 이용">
        <p>Google에서 받은 정보는 로그인, 회원 식별과 프로필 표시·관리에 사용합니다. 광고 타기팅, 개인정보 판매 또는 AI 모델 학습에 사용하지 않습니다. 운영상 지원·보안 또는 법적 의무 이행에 필요한 경우를 제외하고 담당자가 임의로 열람하지 않습니다.</p>
        <p>Google 사용자 정보의 이용·전달에는 <a className="text-sky-300 underline" href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>의 Limited Use 요건을 적용합니다. Google 계정의 연결된 앱 관리 화면에서 서비스 접근을 취소할 수 있습니다. 연결 취소만으로 이미 저장된 이력서나 회원 정보가 삭제되지는 않으므로, 삭제가 필요하면 별도로 요청해주세요.</p>
      </PolicySection>

      <PolicySection id="retention" title="5. 보관 기간과 삭제">
        <ul className="list-disc space-y-2 pl-5">
          <li>회원 정보는 계정 유지에 필요한 기간 동안 보관하며, 탈퇴·삭제 요청에 대한 본인 확인과 처리가 완료되면 삭제합니다.</li>
          <li>이력서 본문과 상세 항목은 이용자가 서비스에서 해당 이력서를 삭제하거나 계정 삭제가 처리될 때까지 보관합니다. 삭제한 이력서의 본문과 연결된 상세 항목은 운영 데이터베이스에서 삭제됩니다.</li>
          <li>사진 파일은 이력서와 별도로 저장됩니다. 교체하거나 이력서를 삭제한 사진도 파일 자체는 남을 수 있으며, 계정·사진 삭제 요청 시 함께 정리합니다.</li>
          <li>문의 내용은 문의 처리와 후속 대응이 끝날 때까지 보관합니다. 분쟁 또는 법령상 보관 의무가 있는 정보는 필요한 범위와 기간에 한해 별도로 보관합니다.</li>
          <li>인프라 백업·보안 로그는 제공자의 보관·삭제 주기에 따라 잔존할 수 있습니다. 운영 데이터 삭제가 백업에서의 즉시 삭제를 의미하지는 않습니다.</li>
        </ul>
        <p>삭제할 전자 정보는 복구가 어렵도록 제거하고, 출력물이 있는 경우 파쇄 등 적절한 방법으로 폐기합니다. 현재 회원 탈퇴와 사진 파일 완전 삭제는 문의 이메일을 통해 요청할 수 있습니다.</p>
      </PolicySection>

      <PolicySection id="processors" title="6. 외부 서비스 이용 및 국외 처리">
        <p>서비스 제공을 위해 아래 인프라와 인증 제공자를 이용합니다. 가입·로그인, 저장·열람 및 파일 업로드 시 암호화된 네트워크를 통해 필요한 정보가 전송됩니다.</p>
        <div className="overflow-x-auto rounded-lg border border-gray-600">
          <table className="w-full min-w-[480px] text-left text-sm leading-6">
            <caption className="sr-only">개인정보 처리에 이용하는 외부 서비스와 처리 지역</caption>
            <thead className="bg-gray-900/60 text-white"><tr><th scope="col" className="p-3">제공자</th><th scope="col" className="p-3">목적·정보</th><th scope="col" className="p-3">처리 지역</th></tr></thead>
            <tbody className="divide-y divide-gray-600">
              <tr><th scope="row" className="p-3 font-medium">Supabase, Inc.</th><td className="p-3">회원 인증, 계정·이력서 데이터베이스, 사진 저장</td><td className="p-3">주 저장 지역: 프랑스 파리(eu-west-3). 제공자는 미국 소재이며 운영·지원 과정의 국외 처리가 발생할 수 있습니다.</td></tr>
              <tr><th scope="row" className="p-3 font-medium">Vercel Inc.</th><td className="p-3">웹 호스팅, 서버 요청 처리, 접속·오류·보안 로그. 요청에 포함된 회원·이력서 정보 처리</td><td className="p-3">미국 및 글로벌 서비스 인프라</td></tr>
              <tr><th scope="row" className="p-3 font-medium">Google LLC / GitHub, Inc.</th><td className="p-3">이용자가 선택한 소셜 로그인과 계정 정보 전달. Google Fonts 사용 시 글꼴 요청 정보 처리</td><td className="p-3">미국 등 각 제공자의 글로벌 인프라</td></tr>
            </tbody>
          </table>
        </div>
        <p>Supabase의 계정·이력서·사진은 서비스 이용 및 삭제 처리에 필요한 기간 동안 보관하며, 호스팅 요청·보안 로그와 제공자 백업의 보관 기간은 각 제공자의 정책과 서비스 설정에 따릅니다. 국외 처리가 필요한 기능의 이용을 원하지 않는 경우 이용을 중단하고 정보 삭제를 요청할 수 있습니다. 인증·저장·호스팅 처리를 거부하면 해당 서비스 기능을 제공하기 어렵습니다.</p>
        <p>관련 안내: <a className="text-sky-300 underline" href="https://supabase.com/privacy">Supabase 개인정보 안내</a> · <a className="text-sky-300 underline" href="https://vercel.com/legal/privacy-notice">Vercel 개인정보 안내</a> · <a className="text-sky-300 underline" href="https://policies.google.com/privacy">Google 개인정보 안내</a> · <a className="text-sky-300 underline" href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub 개인정보 안내</a></p>
      </PolicySection>

      <PolicySection id="cookies" title="7. 쿠키와 안전성 확보">
        <p>로그인 세션 유지와 인증 요청 확인을 위한 쿠키를 사용합니다. 브라우저 설정으로 쿠키를 삭제·차단할 수 있지만 로그인 유지 등 일부 기능이 작동하지 않을 수 있습니다. 현재 앱에는 광고 타기팅이나 별도의 방문자 분석 도구를 연동하지 않았습니다.</p>
        <p>암호화된 전송, 인증을 통한 계정 확인, 이력서 소유자·공개 여부에 따른 접근 제한 등으로 정보를 보호합니다. 이용자는 계정 접근 정보를 안전하게 관리하고, 공용 기기에서 로그아웃해주세요.</p>
      </PolicySection>

      <PolicySection id="rights" title="8. 이용자의 권리와 문의">
        <p>이용자는 서비스에서 닉네임과 이력서를 수정하거나 이력서를 삭제할 수 있습니다. 개인정보 열람·정정·삭제, 계정 탈퇴, 처리정지 및 동의 철회는 <a className="break-all text-sky-300 underline" href={`mailto:${policyContact}`}>{policyContact}</a>로 요청할 수 있습니다. 대리인을 통한 요청은 정당한 대리 권한 확인 후 처리합니다.</p>
        <p>운영자는 본인 여부와 요청 범위를 확인한 후 지체 없이 처리하고, 법령에 따른 제한이 있는 경우 그 사유를 안내합니다. 본인 확인을 위해 필요한 최소한의 정보를 요청할 수 있습니다.</p>
        <p>서비스는 만 14세 미만 아동을 대상으로 하지 않습니다. 법정대리인 동의가 필요한 아동의 정보가 처리된 사실을 알게 된 경우, 확인과 필요한 조치를 위해 문의해주세요.</p>
      </PolicySection>

      <PolicySection id="contact" title="9. 담당자 및 방침 변경">
        <p>개인정보 보호 문의 담당: TakeKnowledge<br />이메일: <a className="text-sky-300 underline" href={`mailto:${policyContact}`}>{policyContact}</a></p>
        <p>이 방침의 내용이나 처리 방식이 변경되면 변경 사항과 시행일을 서비스에 안내합니다. 추가 동의 등 별도 절차가 필요한 경우 해당 절차를 진행합니다.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
