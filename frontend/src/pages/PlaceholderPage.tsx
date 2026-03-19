interface PlaceholderPageProps {
  name: string;
}

export function PlaceholderPage({ name }: PlaceholderPageProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2">
      <h1 className="text-xl font-semibold text-slate-400">{name}</h1>
      <p className="text-sm text-slate-400">This page is under construction.</p>
    </div>
  );
}
