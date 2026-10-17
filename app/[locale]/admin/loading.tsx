import { getTranslations } from 'next-intl/server';

export default async function AdminLoading() {
  const t = await getTranslations('admin');
  return <div className="card p-6" role="status" aria-busy="true">{t('nav.dashboard')}…</div>;
}
