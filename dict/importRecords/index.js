import {genderDict, statusDict} from '/@/dict/user';

/**
 * 导入记录类型
 */
export const typeDict = [
    { label: '用户导入', value: 1 },
];

/**
 * 各类型对应的明细列配置
 * key: 数据字段名
 * label: 列标题
 * dict: 可选，用于值转换的字典
 */
export const detailColumns = {
    1: [
        { key: 'username', label: '用户名' },
        { key: 'fullName', label: '姓名' },
        { key: 'nickname', label: '昵称' },
        { key: 'email', label: '邮箱' },
        { key: 'gender', label: '性别', dict: genderDict },
        { key: 'age', label: '年龄' },
        { key: 'status', label: '状态', dict: statusDict },
        { key: 'password', label: '密码' },
    ],
};