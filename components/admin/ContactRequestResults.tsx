import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";

export interface ContactRequestRow {
  id: string;
  created_at: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string | null;
  message: string;
  newsletter_consent: boolean;
  send_status: string;
  practitioner: { name: string } | null;
}

function statusLabel(status: string) {
  if (status === "sent") return "Envoyé";
  if (status === "failed") return "Échec";
  return "En attente";
}

export function ContactRequestResults({
  rows,
  forceMobile = false,
}: {
  rows: ContactRequestRow[];
  forceMobile?: boolean;
}) {
  if (!rows.length) {
    return <p className="mt-5 rounded-2xl bg-white p-6">Aucune demande.</p>;
  }

  return (
    <>
      <ul className={`mt-5 grid gap-3 ${forceMobile ? "" : "lg:hidden"}`}>
        {rows.map((row) => (
          <li key={row.id} className="card min-w-0 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-xs text-soul-bronze">
                {formatDate(row.created_at, "fr")}
              </p>
              <span className="shrink-0 rounded-full bg-soul-violet/10 px-2.5 py-1 text-xs font-semibold text-soul-violet">
                {statusLabel(row.send_status)}
              </span>
            </div>

            <dl className="mt-4 grid min-w-0 gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-soul-bronze">
                  Praticien
                </dt>
                <dd className="mt-0.5 text-soul-brown">{row.practitioner?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-soul-bronze">
                  Contact
                </dt>
                <dd className="mt-0.5 min-w-0">
                  <Link className="font-medium text-soul-brown underline" href={`/admin/demandes-contact/${row.id}`}>
                    {row.visitor_name}
                  </Link>
                  <a className="block break-all text-soul-violet underline" href={`mailto:${row.visitor_email}`}>
                    {row.visitor_email}
                  </a>
                  {row.visitor_phone ? (
                    <a className="mt-0.5 block text-soul-violet underline" href={`tel:${row.visitor_phone}`}>
                      {row.visitor_phone}
                    </a>
                  ) : (
                    <span className="block">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-soul-bronze">
                  Message
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-soul-ink/80">
                  {row.message}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-soul-bronze">
                  Newsletter
                </dt>
                <dd className="mt-0.5">{row.newsletter_consent ? "Oui" : "Non"}</dd>
              </div>
            </dl>

          </li>
        ))}
      </ul>

      <div className={`mt-5 overflow-hidden rounded-2xl bg-white ${forceMobile ? "hidden" : "hidden lg:block"}`}>
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[26%]" />
            <col className="w-[28%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b">
              <th className="p-3">Date</th>
              <th className="p-3">Praticien</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Message</th>
              <th className="p-3">Suivi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b align-top">
                <td className="whitespace-nowrap p-3">{formatDate(row.created_at, "fr")}</td>
                <td className="p-3">{row.practitioner?.name}</td>
                <td className="p-3">
                  <Link className="underline" href={`/admin/demandes-contact/${row.id}`}>{row.visitor_name}</Link>
                  <a className="mt-1 block break-all text-xs underline" href={`mailto:${row.visitor_email}`}>{row.visitor_email}</a>
                  <span className="mt-1 block whitespace-nowrap text-xs text-soul-bronze">{row.visitor_phone || "—"}</span>
                </td>
                <td className="p-3">
                  <details className="group">
                    <summary className="cursor-pointer list-none font-medium text-soul-violet underline [&::-webkit-details-marker]:hidden">
                      Voir le message
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap rounded-xl bg-soul-sand/35 p-3 text-soul-ink/85">
                      {row.message}
                    </p>
                    <Link
                      className="mt-2 inline-block text-xs text-soul-brown underline"
                      href={`/admin/demandes-contact/${row.id}`}
                    >
                      Ouvrir la fiche complète
                    </Link>
                  </details>
                </td>
                <td className="p-3">
                  <span className="inline-flex rounded-full bg-soul-violet/10 px-2.5 py-1 text-xs font-semibold text-soul-violet">
                    {statusLabel(row.send_status)}
                  </span>
                  <span className="mt-2 block text-xs text-soul-bronze">
                    Newsletter : {row.newsletter_consent ? "Oui" : "Non"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
