import React from "react";

type Props = {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function Card({ title, actions, children }: Props) {
  return (
    <section className="grid-card flex flex-col gap-3">
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3">
          {title && <h3 className="section-title">{title}</h3>}
          {actions}
        </header>
      )}
      <div className="text-slate-200 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
