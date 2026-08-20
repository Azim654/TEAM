import { api } from "./client"
import i18n from "../i18n"
import type { User } from "../types"

interface UserRecord extends User {
  password: string
}

interface AuthResult {
  user: User
  token: string
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResult> => {
  const users = await api.get<UserRecord[]>(
    `/users?email=${encodeURIComponent(email)}`
  )
  const found = users.find((u) => u.password === password)
  if (!found) throw new Error(i18n.t("auth.errorInvalidCredentials"))

  const { password: _password, ...user } = found
  return { user, token: `fake-jwt-token-${user.id}` }
  },

  register: async (name: string, email: string, password: string): Promise<AuthResult> => {
    const existing = await api.get<UserRecord[]>(`/users?email=${encodeURIComponent(email)}`)
    if (existing.length > 0) throw new Error(i18n.t("auth.errorEmailTaken"))

    const newUser = await api.post<UserRecord>("/users", {
      name,
      email,
      password,
      avatar: "",
    })

    const { password: _password, ...user } = newUser
    return { user, token: `fake-jwt-token-${user.id}` }
  },

  updateProfile: async (id: string, updates: Partial<User>): Promise<User> => {
    const updated = await api.patch<UserRecord>(`/users/${id}`, updates)
    const { password: _password, ...user } = updated
    return user
  },

  findByEmail: async (email: string): Promise<User | null> => {
    const users = await api.get<UserRecord[]>(`/users?email=${encodeURIComponent(email)}`)
    if (users.length === 0) return null
    const { password: _password, ...user } = users[0]
    return user
  },

  deleteAccount: async (id: string): Promise<void> => {
  await api.delete<null>(`/users/${id}`)
  },
}
