export default {
  jwt: {
    secret: process.env.JWT_SECRET as string || '12345678',
    expiresIn: '1d'
  }
}
