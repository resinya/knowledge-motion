import type { Metadata } from 'next';
import { updates } from '@/lib/updates';

export const metadata: Metadata = { title: '版本更新', description: '按日期查看功能与使用体验的更新。' };
const years = [...new Set(updates.map((update) => update.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));

export default function ChangelogPage() {
  return (
    <div className="site-page changelog-page">
      <header className="page-heading"><h1>版本更新</h1><p>每一次变化，都记录在这里。</p></header>
      <div className="updates-content">
        {years.map((year) => (
          <section key={year} aria-labelledby={`year-${year}`} className="updates-year">
            <h2 id={`year-${year}`} className="updates-year-label">{year}<span>年</span></h2>
            <ol className="updates-timeline">
              {updates.filter((update) => update.date.startsWith(`${year}-`)).map((update) => (
                <li key={update.id} className="updates-entry">
                  <div className="updates-date"><time dateTime={update.date}>{Number(update.date.slice(5, 7))}月{Number(update.date.slice(8, 10))}日</time><span className="updates-dot" aria-hidden="true" /></div>
                  <article id={update.id} className="updates-article" aria-label={`${year}年${Number(update.date.slice(5, 7))}月${Number(update.date.slice(8, 10))}日更新`}>
                    {update.sections.map((section) => (
                      <section key={section.title}>
                        <h3>{section.title}</h3><p>{section.description}</p>
                        {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                      </section>
                    ))}
                  </article>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
