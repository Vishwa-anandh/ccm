import React from "react";
import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <AlertCircle size={48} strokeWidth={2} />
      </div>
      <h1 className="text-6xl font-bold text-slate-800 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-slate-700 mb-4">Page Not Found</h2>
      <p className="text-slate-500 max-w-md mb-8">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 bg-[#D92D20] hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-600/20"
      >
        <Home size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
}
