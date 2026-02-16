export default function Footer() {
  return (
    <footer className="border-t border-white/10 light-theme:border-gray-200 bg-gray-950/50 light-theme:bg-gray-50 mt-auto transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 light-theme:text-gray-600 transition-colors duration-300">
          <p>
            iRacing Season Calendar — Built with Next.js
          </p>
          <p>
            Data sourced from official iRacing season PDF
          </p>
        </div>
      </div>
    </footer>
  );
}
