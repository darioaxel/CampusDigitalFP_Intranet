import { User, Role } from '@prisma/client'
import { prisma } from '../config.js'
import { hash } from '../utils/hash.js'
import { UserData } from '../types.js'

export class UserSeeder {  

  async run(users: UserData[]): Promise<User[]> {
    console.log('👤 Seed de usuarios...\n')
   
    const createdUsers: User[] = []

    for (const u of users) {
      const exists = await prisma.user.findUnique({
        where: { email: u.email },
      })

      if (exists) {
        console.log(`✔  Ya existe: ${u.email} (${u.role})`)
        createdUsers.push(exists)
        continue
      }      

      const user = await prisma.user.create({
        data: {
          email: u.email,
          emailPersonal: u.emailPersonal,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          dni: u.dni,
          birthDate: u.birthDate,
          passwordHash: await hash(u.password),
          role: u.role,
          isActive: true,
          failedLoginAttempts: 0,
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            u.firstName + '+' + u.lastName
          )}&background=random`,
          address: u.address ? { create: u.address } : undefined,          
        },
      })

      console.log(`✔  Creado: ${user.email} (${user.role})`)
      createdUsers.push(user)
    }

    return createdUsers
  }

  private async createPaymentData(userId: string, role: Role): Promise<void> {
    // Solo socios (USER) tienen datos de pago para cuotas
    if (role !== Role.USER) {
      console.log(`   💰  Sin datos de pago (admin/root)`)
      return
    }

    const needsAccount = Math.random() < 0.6 // 60% con cuenta bancaria

    await prisma.userPaymentData.create({
      data: {
        userId,
        paymentMethod: needsAccount ? 'CARGO_BANCARIO' : 'TRANSFERENCIA',
        iban: needsAccount
          ? `ES${Math.floor(Math.random() * 90 + 10)}${Math.floor(Math.random() * 1e20)
              .toString()
              .padStart(20, '0')}`
          : null,
      },
    })

    console.log(`   💰  ${needsAccount ? 'Cuenta bancaria' : 'Transferencia manual'}`)
  }
}