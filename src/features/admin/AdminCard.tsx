import type { ReactNode } from "react";

type AdminCardProps = {
  children: ReactNode;
};

export function AdminCard({ children }: AdminCardProps) {
  return (
    <div className="admin-card">
      {children}
    </div>
  );
}
