import type { ReactNode } from "react";
import Footer from "../../../../components/Footer/Footer";
import Header from "../../../../components/Header/Header";

export default function MenuPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-page">
        <div className="app-container ui-page-stack">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
