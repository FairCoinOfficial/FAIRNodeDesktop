import React from "react";

type Props = {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function Card({ title, actions, children }: Props) {
  return (
    <section className="bg-fair-dark-light rounded-xl p-5 flex flex-col gap-4">
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3">
          {title && <h3 className="text-white text-base font-semibold">{title}</h3>}
          {actions}
        </header>
      )}
      <div className="text-white text-sm leading-relaxed">{children}</div>
    </section>
  );
}
