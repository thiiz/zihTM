"use client";
import { RoundedButton } from "@/components/RoundedButton";
import { invoke } from "@tauri-apps/api/core";
import Image from "next/image";
import { useCallback, useState } from "react";

export default function Home() {
  const [greeted, setGreeted] = useState<string | null>(null);
  const [jsResult, setJsResult] = useState<string | null>(null);

  // Chama factorial no Rust
  const greet = useCallback((): void => {
    const start = performance.now();
    invoke<string>("greet", { n: 30 })
      .then((s) => {
        const end = performance.now();
        setGreeted(`${s} (Rust time: ${(end - start).toFixed(2)} ms)`);
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, []);

  // Fatorial em JS (bem mais lento com números grandes)
  const factorialJS = useCallback((n: number): string => {
    let result = 1n; // BigInt para não estourar
    for (let i = 1n; i <= BigInt(n); i++) {
      result *= i;
    }
    return result.toString();
  }, []);

  const runFactorialJS = useCallback(() => {
    const n = 30;
    const start = performance.now();
    const result = factorialJS(n);
    const end = performance.now();
    setJsResult(`O fatorial de ${n} é ${result} (JS time: ${(end - start).toFixed(2)} ms)`);
  }, [factorialJS]);

  return (
    <div className="grid grid-rows-[30px_1fr_30px] items-center justify-items-center min-h-screen p-8 pb-30 gap-16 sm:p-30 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <div className="flex flex-col gap-2 items-start">
          <RoundedButton onClick={greet} title="Calcular fatorial no Rust" />
          <p className="break-words w-md">{greeted ?? "Clique para rodar no Rust"}</p>

          <RoundedButton onClick={runFactorialJS} title="Calcular fatorial no JS" />
          <p className="break-words w-md">{jsResult ?? "Clique para rodar no JS"}</p>
        </div>
      </main>
    </div>
  );
}
