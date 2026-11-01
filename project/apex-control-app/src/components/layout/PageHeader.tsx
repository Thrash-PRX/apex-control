import type { ReactNode } from 'react';
export function PageHeader({eyebrow = 'KEYBOARD SETTINGS',title,description,actions,badge}:{eyebrow?:string;title:string;description:string;actions?:ReactNode;badge?:ReactNode}) {
  return <div className="page-heading"><div><p className="overview-eyebrow">{eyebrow}</p><div className="page-heading-title"><h1>{title}</h1>{badge}</div><p className="page-description">{description}</p></div>{actions && <div className="page-heading-actions">{actions}</div>}</div>;
}
export function LocalBadge() { return <span className="editor-badge">Local draft</span>; }
