/** Coquille visuelle commune aux pages d'authentification. */
export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="mb-8 text-center text-3xl text-soul-brown">{title}</h1>
      <div className="card p-8">{children}</div>
    </div>
  );
}
