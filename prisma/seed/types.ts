import { Role } from '../../generated/client'

// ========== DATOS BASE ==========

export interface AddressData {
  addressLine: string
  floorDoor?: string
  postalCode: string
  locality: string
  province: string
}

export interface UserData {
  email: string
  password: string
  role: Role
  firstName: string
  lastName: string
  dni: string
  phone: string
  birthDate: Date
  emailPersonal: string
  address?: AddressData 
}

// ========== DATOS DE ARCHIVOS ==========

export interface FileData {
  name: string
  mime: string
  size: number
  path: string
  checksum: string
}
