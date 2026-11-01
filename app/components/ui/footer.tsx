export function Footer() {
  return (
    <footer className="w-full border-t border-gray-700 bg-gray-900 py-6 no-print">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-gray-400">
            건의 사항 및 문의:{" "}
            <a
              href="mailto:takeknowledge@naver.com"
              className="text-white hover:text-gray-300 underline transition-colors"
            >
              takeknowledge@naver.com
            </a>
          </p>
          <p className="text-sm text-gray-500">
            Copyright© 코디드바이 All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
