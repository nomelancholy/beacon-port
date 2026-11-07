import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="flex h-(--footer-height) w-full items-center border-t border-gray-700 bg-gray-900 no-print">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-x-4 text-center text-xs text-gray-400 md:flex-row md:flex-wrap">
          <nav aria-label="정책 안내" className="flex items-center gap-3">
            <Link to="/privacy" className="font-medium text-white underline underline-offset-2 hover:text-sky-300">개인정보처리방침</Link>
            <Link to="/terms" className="text-gray-200 underline underline-offset-2 hover:text-sky-300">서비스 이용약관</Link>
          </nav>
          <p>
            건의 사항 및 문의:{" "}
            <a
              href="mailto:takeknowledge@naver.com"
              className="text-white hover:text-gray-300 underline transition-colors"
            >
              takeknowledge@naver.com
            </a>
          </p>
          <p>
            Copyright©{" "}
            <a
              href="https://takeknowledge-dev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 underline transition-colors"
            >
              TakeKnowledge
            </a>{" "}
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
