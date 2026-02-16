import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 light-theme:bg-white text-white light-theme:text-gray-900 px-4 transition-colors duration-300">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 light-theme:text-red-600 mb-4 transition-colors duration-300">404</h1>
        <h2 className="text-xl font-semibold mb-2 transition-colors duration-300">Series Not Found</h2>
        <p className="text-sm text-gray-400 light-theme:text-gray-600 mb-8 transition-colors duration-300">
          The series you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-red-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
