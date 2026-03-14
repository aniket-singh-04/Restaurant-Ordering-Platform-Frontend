import type { ReactNode } from "react";
import Footer from "../../../../components/Footer/Footer";
import Header from "../../../../components/Header/Header";

export default function MenuPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Header />

      <main className="w-full px-4">
        <div className="sm:px-6 lg:px-8 space-y-8">{children}</div>
      </main>

      <Footer />
    </>
  );
}
