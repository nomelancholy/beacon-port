import type { Route } from "./+types/terms";
import { Link } from "react-router";
import { PolicyLayout, PolicySection, policyContact } from "../components/policy-layout";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "서비스 이용약관 | Beacon Port" },
    { name: "description", content: "Beacon Port 이력서 작성·공유 서비스의 이용 조건, 회원의 권리·의무 및 콘텐츠 관리에 관한 약관입니다." },
    { tagName: "link", rel: "canonical", href: "https://beacon-port.vercel.app/terms" },
  ];
}

export default function Terms() {
  return (
    <PolicyLayout current="terms" title="서비스 이용약관"
      description="이 약관은 TakeKnowledge가 운영하는 Beacon Port와 이용자 사이의 서비스 이용 조건 및 권리·의무를 정합니다.">
      <PolicySection id="service" title="1. 서비스와 적용 범위">
        <p>Beacon Port는 온라인 이력서 작성·수정·저장, 공개 링크를 통한 공유 및 인쇄 기능을 제공합니다. 현재 제공하는 이력서 기능은 무료이며, 채용·취업의 성사나 이력서 열람 횟수를 보장하는 서비스는 아닙니다.</p>
        <p>회원은 가입·로그인 및 서비스 이용 전에 이 약관과 <Link to="/privacy" className="text-sky-300 underline">개인정보처리방침</Link>을 확인해주세요. 이 약관이 개인정보 수집·이용이나 공개에 필요한 별도 동의를 대신하지는 않습니다.</p>
      </PolicySection>

      <PolicySection id="account" title="2. 가입과 계정 관리">
        <p>이메일 또는 지원하는 Google·GitHub 계정으로 가입·로그인할 수 있습니다. 이용자는 본인에게 사용 권한이 있는 계정을 이용하고, 정확한 정보를 등록하며 변경 시 수정해야 합니다.</p>
        <p>계정의 비밀번호와 로그인 수단은 이용자가 안전하게 관리해야 합니다. 다른 사람의 계정을 도용하거나 본인 확인을 방해해서는 안 됩니다. 무단 사용이 의심되면 즉시 운영자에게 알려주세요. 서비스는 만 14세 이상 이용자를 대상으로 제공합니다.</p>
      </PolicySection>

      <PolicySection id="content" title="3. 이력서와 업로드 자료의 권리">
        <p>이용자가 작성·업로드한 이력서, 사진 등 콘텐츠의 권리는 이용자 또는 정당한 권리자에게 있습니다. 운영자는 서비스의 저장·표시·공유·인쇄 및 운영에 필요한 범위에서 콘텐츠를 처리할 수 있습니다. 서비스 운영을 위한 처리는 콘텐츠의 소유권 이전을 의미하지 않습니다.</p>
        <p>이용자는 콘텐츠를 등록·공개할 권한이 있어야 하며, 내용의 정확성과 적법성을 확인해야 합니다. 타인의 연락처·사진·개인정보, 회사의 영업비밀이나 공개 권한이 없는 자료를 무단으로 등록해서는 안 됩니다.</p>
      </PolicySection>

      <PolicySection id="publication" title="4. 공개 설정과 외부 공유">
        <p>새 이력서는 기본적으로 비공개이며, 공개 여부는 이용자가 선택합니다. 공개 이력서는 링크에 접근한 사람이 열람·저장·인쇄할 수 있습니다. 공개 전 민감한 정보와 연락처 등 포함 내용을 확인해주세요.</p>
        <p>비공개 전환이나 삭제 이후에도 제3자가 확보한 사본과 외부 검색·캐시에는 내용이 남을 수 있습니다. 업로드한 사진은 공개 URL 방식으로 제공되어, 주소를 아는 사람은 이력서 공개 여부와 관계없이 접근할 수 있습니다. 사진 파일 삭제는 별도로 요청할 수 있습니다.</p>
      </PolicySection>

      <PolicySection id="prohibited" title="5. 금지 행위와 이용 제한">
        <ul className="list-disc space-y-2 pl-5">
          <li>타인 사칭, 허위 경력을 이용한 기망, 계정 도용 및 타인의 권리 침해</li>
          <li>불법 정보, 악성 코드, 스팸 또는 공개 권한이 없는 개인정보·기밀 자료의 등록</li>
          <li>인증·접근 제한 우회, 다른 이용자 정보의 무단 수집 또는 서비스에 과도한 부하를 주는 행위</li>
          <li>서비스나 콘텐츠를 법령에 위반되는 목적으로 이용하는 행위</li>
        </ul>
        <p>위반이 확인되거나 보안·권리 보호를 위해 필요한 경우 운영자는 합리적인 범위에서 게시물 공개를 제한하거나 서비스 이용을 제한할 수 있습니다. 긴급한 보안 대응이나 법령상 제한이 있는 경우를 제외하고 사유와 이의 제기 방법을 안내합니다. 이의는 문의 이메일로 접수할 수 있습니다.</p>
      </PolicySection>

      <PolicySection id="changes" title="6. 서비스 변경·중단과 데이터 관리">
        <p>유지보수, 장애 대응, 외부 인증·호스팅 제공자의 사정 등으로 서비스가 변경되거나 일시 중단될 수 있습니다. 예정된 중요한 변경이나 종료는 서비스 내 안내 등 가능한 방법으로 사전에 알리고, 갑작스러운 장애는 확인 후 안내합니다.</p>
        <p>이용자는 필요한 이력서 사본을 인쇄·PDF 저장 등으로 별도 보관할 수 있습니다. 향후 유료 기능을 제공하는 경우 가격과 결제·환불 조건을 별도로 안내하고 필요한 동의 절차를 진행합니다.</p>
      </PolicySection>

      <PolicySection id="withdrawal" title="7. 이용 종료와 삭제 요청">
        <p>이용자는 언제든 이용을 중단하고 서비스에서 이력서를 삭제할 수 있습니다. 회원 탈퇴, 계정 정보 삭제 및 업로드 사진의 완전한 삭제는 <a className="break-all text-sky-300 underline" href={`mailto:${policyContact}`}>{policyContact}</a>로 요청해주세요. 운영자는 본인 확인 후 필요한 조치를 진행합니다.</p>
        <p>Google·GitHub 설정에서 연결을 취소하는 것과 Beacon Port의 계정·콘텐츠 삭제는 서로 다른 절차입니다. 저장 정보의 보관·삭제와 법령상 보관이 필요한 경우는 개인정보처리방침에 따릅니다.</p>
      </PolicySection>

      <PolicySection id="liability" title="8. 책임과 분쟁 처리">
        <p>운영자와 이용자는 자신의 귀책 사유로 상대방에게 발생시킨 손해에 대해 관련 법령에 따라 책임을 부담합니다. 이 약관은 운영자의 고의·중대한 과실에 대한 책임이나 이용자에게 법령상 보장된 권리를 제한하지 않습니다.</p>
        <p>이용자가 등록한 정보의 정확성이나 외부 사이트·채용 결과는 운영자가 보장하지 않습니다. 문제가 발생하면 운영자와 이용자는 우선 성실히 협의하며, 해결되지 않은 분쟁은 대한민국 법령과 관련 법령이 정한 관할에 따릅니다.</p>
      </PolicySection>

      <PolicySection id="updates" title="9. 약관 변경 및 연락처">
        <p>약관을 변경하는 경우 변경 내용·사유와 적용일을 서비스에서 미리 안내합니다. 이용자의 권리에 중요한 영향을 주는 변경은 충분한 확인 기간을 두고 알리며, 별도 동의가 필요한 경우 해당 절차를 진행합니다.</p>
        <p>운영자: TakeKnowledge<br />서비스: Beacon Port · 온라인 이력서 작성·공유<br />문의: <a className="text-sky-300 underline" href={`mailto:${policyContact}`}>{policyContact}</a></p>
      </PolicySection>
    </PolicyLayout>
  );
}
