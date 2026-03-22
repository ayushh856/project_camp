// this whole object will be passed on to wherever it is required
export const UserRolesEnum = {
    ADMIN: "admin", //if we have a "ADMIN" role, it will be treated as "admin"
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member",
}

// sending whole array of the values such as "admin", "project_admin", "member"
export const AvailableUserRole = Object.values(UserRolesEnum)

// 
export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done"
}

export const AvailableTaskStatus = Object.values(TaskStatusEnum)