
import {
  Graph,
  DashBoard,
  Flag,
  Sun,
  Pages,
  User
} from "@/components/svg";
import { Folder } from "lucide-react";


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
    icon: User,
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
  },
  {
    title: "Proyectos",
    icon: Folder,
    child: [
      {
        title: 'Fuentes',
        href: "/dashboard/admin/financing-sources",
      },
      {
        title: 'Proyectos',
        href: "/dashboard/admin/projects",
      },
    ]
  },
  {
    title: "Centros",
    icon: DashBoard,
    child: [
      {
        title: 'Áreas',
        href: "/dashboard/centros/areas",
      },
      {
        title: 'Gestionar Centros',
        href: "/dashboard/centros/manage",
      },
      {
        title: 'Instructores',
        href: "/dashboard/centros/instructores",
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