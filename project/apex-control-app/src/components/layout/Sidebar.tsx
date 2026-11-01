import {FolderOpen,Gauge,Keyboard,LayoutDashboard,Monitor,Palette,Settings,SlidersHorizontal,Zap} from 'lucide-react';
import {useAppStore} from '../../stores/app-store';
const items=[{page:'dashboard',label:'Overview',icon:LayoutDashboard},{page:'key-mapping',label:'Key mapping',icon:Keyboard},{page:'actuation',label:'Actuation',icon:Gauge},{page:'rapid-trigger',label:'Rapid Trigger',icon:Zap},{page:'socd',label:'SOCD',icon:SlidersHorizontal},{page:'lighting',label:'Lighting',icon:Palette},{page:'display',label:'OLED Studio',icon:Monitor},{page:'profiles',label:'Profile drafts',icon:FolderOpen},{page:'settings',label:'Settings',icon:Settings}] as const;
export function Sidebar(){
 const active=useAppStore(s=>s.activePage),navigate=useAppStore(s=>s.setActivePage);
 return <aside className="hub-rail"><nav aria-label="Main navigation">{items.map(({page,label,icon:Icon})=><button key={page} className={`hub-rail-button ${active===page?'active':''}`} aria-label={label} aria-current={active===page?'page':undefined} onClick={()=>navigate(page)} title={label}><Icon size={20}/><span className="hub-rail-tooltip">{label}</span></button>)}</nav></aside>;
}
