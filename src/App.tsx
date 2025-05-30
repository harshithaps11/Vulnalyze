import React, { useState } from "react";

type ScanResult = "safe" | "warning" | null;

export default function VulnerabilityScanner(): JSX.Element {
  const [code, setCode] = useState<string>("");
  const [result, setResult] = useState<ScanResult>(null);

  function scanCode(): void {
    if (/eval|Access-Control-Allow-Origin|\bDROP TABLE\b/.test(code)) {
      setResult("warning");
    } else if (code.trim() === "") {
      setResult(null);
    } else {
      setResult("safe");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <header className="mb-10 w-full max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 drop-shadow-md">
          OWASP Vulnerability Scanner
        </h1>
        <p className="text-gray-600 mt-2">
          Paste your code below and hit <span className="font-semibold">Scan</span> to check for common security issues.
        </p>
      </header>

      <textarea
        className="w-full max-w-3xl h-48 p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 resize-none shadow-sm transition"
        placeholder="Paste your JavaScript / HTML / code here..."
        value={code}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
      ></textarea>

      <button
        onClick={scanCode}
        disabled={!code.trim()}
        className={`mt-6 px-8 py-3 rounded-lg font-semibold text-white shadow-md transition
          ${code.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}
        `}
      >
        Scan
      </button>

      {result && (
        <div
          className={`mt-8 max-w-3xl w-full rounded-lg p-6 text-lg font-medium shadow-md
          ${
            result === "safe"
              ? "bg-green-50 border border-green-400 text-green-700"
              : "bg-yellow-50 border border-yellow-400 text-yellow-800"
          }`}
        >
          {result === "safe"
            ? "No obvious security issues detected."
            : "⚠️ Warning: Potential security issues found! Please review your code."}
        </div>
      )}

      <footer className="mt-auto pt-12 text-gray-500 text-sm">
        Powered by{" "}
        <a
          href="https://owasp.org/www-project-top-ten/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-blue-600"
        >
          OWASP Top 10
        </a>
      </footer>
    </div>
  );
}
