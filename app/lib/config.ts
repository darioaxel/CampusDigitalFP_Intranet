// Interfaces de navegación

interface NavItem {
  href: string
  label: string
  requiresAuth?: boolean
  icon?: string
  children?: NavItem[]
}

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
  name: 'Campus Digital FP',
  url: 'https://intranet.campusdigitalfp.com',
  ogImage: 'https://shadcn-vue.com/og.jpg',
  description:
    'Intranet de Campus Digital FP',
  links: {
    instagram: 'https://instagram.com/campusditalfp',
    tiktok: 'https://www.tiktok.com/@campusdigitalfp',
    linkedin: 'https://www.linkedin.com/company/campusdigitalfp/',
    youtube: 'https://www.youtube.com/@campusdigitalfp', 
  },
  navItems: [
    {
      href: '/nosotros',
      label: 'Nosotr@s',
      icon: 'lucide:users',
      requiresAuth: false,
    },
    {
      href: '/rocodromo',
      label: 'Rocódromo',
      icon: 'lucide:mountain',
      requiresAuth: false,
    },
    {
      href: '/musica',
      label: 'Música',
      icon: 'lucide:music',
      requiresAuth: false,
    },
    {
      href: '/contacto',
      label: 'Contacto',
      icon: 'lucide:mail',
      requiresAuth: false,
    },
    {
      href: '/blog',
      label: 'Blog',
      icon: 'lucide:newspaper',
      requiresAuth: false,
    },
    {
      href: '/socios',
      label: 'Socios',
      icon: 'lucide:users',
      requiresAuth: false,
      // El padre SIEMPRE visible, solo los hijos requieren auth
      children: [
        {
          href: '/socios/',
          label: 'Mi Área',
          icon: 'lucide:user',
          requiresAuth: true,
        },
        {
          href: '/socios/documentos',
          label: 'Documentación',
          icon: 'lucide:file-text',
          requiresAuth: true,
        },
        {
          href: '/socios/registro',
          label: 'Hazte Socio',
          icon: 'lucide:user-plus',
          // Este NO requiere auth (público)
        },
      ],
      },
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
      title: 'Secretaría',
      roles: ['ROOT', 'PROFESOR', 'JEFATURA'],
      items: [
        {
          title: "Solicitudes",
          url: "#",
          icon: "lucide:receipt",
          isActive: true,
          items: [
            { title: "Permisos", url: "#" },            
          ],
        },
        {
          title: "Módulos",
          url: "#",
          icon: "lucide:list-todo",
          isActive: true,
          items: [
            { title: "Gestionar tareas", url: "/socios/tareas" },
            { title: "Crear tarea", url: "/socios/tarea/nueva" },
          ],
        },        
      ]
    },
    {
      title: 'Docencia',
      roles: ['ROOT', 'PROFESOR'],
      items: [
        {
          title: "Horario",
          url: "#",
          icon: "lucide:receipt",
          isActive: true,
          items: [
            { title: "Permisos", url: "#" },            
          ],
        },
        {
          title: "Módulos",
          url: "#",
          icon: "lucide:receipt",
          isActive: true,
          items: [
            { title: "Permisos", url: "#" },            
          ],
        },
               
      ]
    },
    {
      title: 'Administración',      
      roles: ['ADMIN', 'ROOT'],
      items: [
        {
          title: "Cuentas asociación",
          url: "#",
          icon: "lucide:bot",
          items: [
            { title: "Lista Morosos", url: "#" },
            { title: "Ingresos - Gastos", url: "#" },
            { title: "Cargar Facturas", url: "#" },
          ],
        },
        {
          title: "Tesorería",
          url: "#",
          icon: "lucide:settings-2",
          items: [
            { title: "Validación Pagos", url: "#" },
            { title: "Creación de Recibos", url: "#" },           
          ],
        },
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