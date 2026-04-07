import bcrypt from 'bcryptjs'

export const hash = (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}