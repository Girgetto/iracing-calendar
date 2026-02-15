export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gray-950/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
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
