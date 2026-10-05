/**
 * Admin segment root layout — no auth gate here.
 * Protected pages live under (internal); login is a sibling route.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
