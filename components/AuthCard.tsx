/** Coquille visuelle commune aux pages d'authentification. */
export function AuthCard({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`mx-auto flex flex-col px-4 py-16 ${wide ? "max-w-3xl" : "max-w-md"}`}>
      <h1 className="mb-8 text-center text-3xl text-soul-brown">{title}</h1>
      <div className="card p-8">{children}</div>
    </div>
  );
}
