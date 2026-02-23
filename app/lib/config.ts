interface NavItem {
  href: string
  label: string
  requiresAuth?: boolean
  icon?: string
  children?: NavItem[]
}

// Define interfaces
interface NavSubItem {
  title: string
  url: string
}

interface NavMainItem {
  title: string
  url: string
  icon?: string // formato 'lucide:icon-name'
  isActive?: boolean
  items?: NavSubItem[]
}

export interface NavSection {
  title: string
  roles?: string[] 
  items: NavMainItem[]
}

export const siteConfig = {
  name: 'Campus Digital FP - Intranet',
  url: 'https://intranet.campusdigitalfp.com',
  ogImage: 'https://shadcn-vue.com/og.jpg',
  description:
    'Intranet del Campus Digital FP.',
  links: {
    instagram: 'https://instagram.com/campusdigitalfp',
  },
  navItems: [
    {
      href: '/',
      label: 'Documentación',
      icon: 'lucide:book-open',
      requiresAuth: false,
    }
  ] as NavItem[],
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Campus Digital FP",
      logo: "lucide:GalleryVerticalEnd",
      plan: "Enterprise",
    }
  ],
  navSections: [
    {
      title: 'Profesor',
      roles: ['ROOT', 'USER', 'ADMIN'],
      items: [
        {
          title: "Mis Horarios",
          url: "/profesor/horarios",
          icon: "lucide:receipt",
          isActive: true,
          items: [
            { title: "Mi Horario", url: "/usuario/horarios" },
            { title: "Crear Horario", url: "/usuario/crear-horario" },
            { title: "Calendarios", url: "/usuario/calendarios" },            
          ],
        },  
        {
          title: "Permisos/Libre Disposición",
          url: "/usuario",
          icon: "lucide:book-open",
          items: [
            { title: "Días Libre Disposición", url: "/usuario/solicitudes/libre-disposicion" },
            { title: "Permisos y bajas", url: "/usuario/solicitudes/permisos-bajas" },
          ],
        },              
        {
          title: "Documentación",
          url: "#",
          icon: "lucide:book-open",
          items: [
            { title: "Calidad", url: "#" },
            { title: "Otros", url: "#" },
          ],
        },
      ]
    },
    {
      title: 'Administración',      
      roles: ['ADMIN', 'ROOT'],
      items: [
        {
          title: "Usuarios",
          url: "/usuario",
          icon: "lucide:user-check",
          items: [
            { title: "Lista de usuarios", url: "/usuarios/listado" },
            { title: "Horarios Profesores", url: "/profesores/horario" },            
          ],
        },
        {
          title: "Calendarios",
          url: "/admin/calendarios",
          icon: "lucide:calendar-days",
          items: [
            { title: "Gestionar Calendarios", url: "/admin/calendarios" },
          ],
        }        
      ]
    },
  ] as NavSection[],
  navSecondary: [
    {
      title: "Página Inicio",
      url: "/",
      icon: "lucide:home"
    },
  ]
}


export const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b',
}