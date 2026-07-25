"use client";

import { useActionState } from "react";
import { adminLogin } from "../actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, {});

  return (
    <form action={action} className="bg-paper border border-rule p-6">
      <div className="mb-4">
        <label className="label" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          className="field"
          autoComplete="username"
          required
          autoFocus
        />
      </div>

      <div className="mb-5">
        <label className="label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          className="field"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-alert mb-4" role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-solid w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
