export function Footer() {
  return (
    <footer className="flex h-(--footer-height) w-full items-center border-t border-gray-700 bg-gray-900 no-print">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-x-4 gap-y-0.5 text-center text-xs text-gray-400 md:flex-row">
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
