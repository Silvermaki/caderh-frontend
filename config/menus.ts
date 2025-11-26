
import {
  Graph,
  DashBoard,
  Flag,
  Sun,
  Pages
} from "@/components/svg";


export interface MenuItemProps {
  title: string;
  icon: any;
  href?: string;
  child?: MenuItemProps[];
  megaMenu?: MenuItemProps[];
  multi_menu?: MenuItemProps[]
  nested?: MenuItemProps[]
  onClick: () => void;


}

let navs = [
  {
    title: "Estadísticas",
    icon: Graph,
    href: "/dashboard/home",
  },
  {
    title: "Administración",
    icon: DashBoard,
    child: [
      {
        title: 'Usuarios',
        href: "/dashboard/admin/users",
      },
      {
        title: 'Bitácoras',
        href: "/dashboard/admin/logs",
      },
    ]
  }
];

export const menusConfig = {
  mainNav: navs,
  sidebarNav: {
    modern: navs,
    classic: [
      {
        isHeader: true,
        title: "menu",
      },
      ...navs
    ],
  },
};


export type ModernNavType = (typeof menusConfig.sidebarNav.modern)[number]
export type ClassicNavType = (typeof menusConfig.sidebarNav.classic)[number]
export type MainNavType = (typeof menusConfig.mainNav)[number]