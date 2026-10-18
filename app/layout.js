import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "Smart Route Planner — AI-Powered Indian Highway Navigator",
  description:
    "Find the cheapest routes between Indian cities using Dijkstra, A*, Bellman-Ford and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
