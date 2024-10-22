import "@chaibuilder/sdk/styles";
import "./chaibuilder.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="darks">
      <body>{children}</body>
    </html>
  );
}
