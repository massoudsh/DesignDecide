import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "طرح‌یار — کوپایلوت هوشمند طراحی داخلی",
  description:
    "کوپایلوت هوشمند طراحی داخلی، قیمت‌گذاری و تأمین برای فضاهای ایرانی",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
