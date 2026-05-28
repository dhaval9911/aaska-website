'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex w-full items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-left transition hover:bg-red-100 active:scale-[.99]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
          />
        </svg>
      </span>
      <div className="flex-1">
        <p className="font-semibold text-red-600">Sign out</p>
        <p className="text-xs text-red-400">You will be signed out of your account</p>
      </div>
    </button>
  );
}
