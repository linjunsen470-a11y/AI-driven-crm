const MOCK_CURRENT_USER = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "演示销售用户",
} as const

export function getMockCurrentUser() {
  return MOCK_CURRENT_USER
}
