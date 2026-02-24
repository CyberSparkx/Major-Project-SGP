import "./globals.css";
import Sidebar from "./components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100dvh",
            background: "linear-gradient(135deg, #07337a, #03183c)",
            color: "white",
          }}
        >
          {/* Wrapper only to apply glow */}
          <div className="sidebar-glow">
            <Sidebar />
          </div>

          <main style={{ flex: 1, padding: "40px" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}