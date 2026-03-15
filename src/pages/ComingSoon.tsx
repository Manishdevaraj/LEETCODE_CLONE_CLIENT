export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-zinc-400">This feature is coming soon.</p>
      </div>
    </div>
  );
}
