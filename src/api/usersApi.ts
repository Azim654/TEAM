import { api } from "./client"
import type { User } from "../types"

interface UserRecord extends User {
  password: string
}

function stripPassword(record: UserRecord): User {
  const { password: _password, ...user } = record
  return user
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const records = await api.get<UserRecord[]>("/users")
    return records.map(stripPassword)
  },

  getById: async (id: string): Promise<User> => {
    const record = await api.get<UserRecord>(`/users/${id}`)
    return stripPassword(record)
  },

  getByIds: async (ids: string[]): Promise<User[]> => {
    const unique = [...new Set(ids)]
    const results = await Promise.all(
      unique.map((id) =>
        api
          .get<UserRecord>(`/users/${id}`)
          .then(stripPassword)
          .catch(() => null)
      )
    )
    return results.filter((u): u is User => u !== null)
  },
}
