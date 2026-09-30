//通知类型
export const notificationTypeDict = [
    {label: '用户', value: 1},
    {label: '部门', value: 2},
];

//推送范围
export const notificationIsToAllDict = [
    {label: '全部用户', value: 1},
    {label: '指定范围', value: 2},
];

//通知状态
export const notificationStatusDict = [
    {label: '正常', value: 1},
    {label: '撤回', value: 2},
];

//已读状态
export const notificationReadDict = [
    {label: '已读', value: 1},
    {label: '未读', value: 2},
];

//通知类型枚举
export const notificationTypeEnum = {
    user: 1,
    department: 2,
};

//推送范围枚举
export const notificationIsToAllEnum = {
    all: 1,
    specified: 2,
};

//通知状态枚举
export const notificationStatusEnum = {
    normal: 1,
    revoked: 2,
};

//已读状态枚举
export const notificationReadEnum = {
    read: 1,
    unread: 2,
};
