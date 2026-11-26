import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Totalum Flow — Mini-CRM Operativo",
  description:
    "Gestión operativa de clientes, pedidos y tareas con Next.js y Supabase.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900">
        {children}
      </body>
    </html>
  );
}
