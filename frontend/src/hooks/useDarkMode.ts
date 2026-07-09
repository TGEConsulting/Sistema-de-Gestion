import { useEffect, useState } from "react";

function leerPreferenciaInicial(): boolean {
  const guardada = localStorage.getItem("sgc_tema");
  if (guardada) return guardada === "oscuro";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function useDarkMode() {
  const [oscuro, setOscuro] = useState(leerPreferenciaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", oscuro);
    localStorage.setItem("sgc_tema", oscuro ? "oscuro" : "claro");
  }, [oscuro]);

  return { oscuro, toggle: () => setOscuro((v) => !v) };
}
