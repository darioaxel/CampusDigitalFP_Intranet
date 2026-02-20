export {}
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    role: 'ADMIN' | 'ROOT' | 'PROFESOR' | 'EXPERTO' | 'JEFE_DEPT'  
    isActive: boolean
    firstName?: string | null
    lastName?: string | null
    picture?: string | null
  }

  interface UserSession {
    user?: User
    loggedInAt?: string
  }
}