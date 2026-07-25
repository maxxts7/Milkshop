"use client";

import { useActionState } from "react";
import { changeAdminPassword } from "../../actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeAdminPassword, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="pw-current">
          Current password
        </label>
        <input
          id="pw-current"
          name="current"
          type="password"
          className="field"
          autoComplete="current-password"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="pw-next">
          New password
        </label>
        <input
          id="pw-next"
          name="next"
          type="password"
          className="field"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-ink-muted mt-1.5">At least 8 characters.</p>
      </div>

      {state?.error ? (
        <p className="text-sm text-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-fresh" role="status">
          Password changed.
        </p>
      ) : null}

      <button type="submit" className="btn btn-solid btn-sm" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
