export const APP_PAGES = ['dashboard','display','lighting','actuation','rapid-trigger','socd','key-mapping','profiles','settings'] as const;
export type AppPage = typeof APP_PAGES[number];
export function pageFromHash(hash:string):AppPage {
  const page=hash.replace(/^#\/?/,'');
  return APP_PAGES.includes(page as AppPage)?page as AppPage:'dashboard';
}
