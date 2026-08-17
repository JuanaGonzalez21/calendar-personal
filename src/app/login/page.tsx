"use client";

import { useActionState } from "react";
import { login, type EstadoLogin } from "./actions";

export default function LoginPage() {
  const [estado, formAction, pendiente] = useActionState<EstadoLogin, FormData>(
    login,
    null,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            Mi día
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100">
            Entrar
          </h1>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm text-neutral-400"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue="juana.gonzalez.dev@gmail.com"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-lime-400"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm text-neutral-400"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-lime-400"
              placeholder="••••••••"
            />
          </div>

          {estado?.error && (
            <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {estado.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="w-full rounded-full bg-lime-400 px-4 py-3 font-medium text-neutral-950 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pendiente ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
