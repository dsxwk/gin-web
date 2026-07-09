import createService from '/@/utils/service.js';

/**
 * 系统配置
 *
 * @method list 系统配置列表（分页/不分页）
 * @method create 创建配置
 * @method update 更新配置
 * @method detail 配置详情
 * @method delete 删除配置
 * @method save 批量保存配置值（tab 设置页）
 */
export function systemConfigApi() {
    return createService(
        {
            list: {
                name: '系统配置列表',
                url: '/system-config',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            create: {
                name: '创建配置',
                url: '/system-config',
                method: 'post',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            update: {
                name: '更新配置',
                url: '/system-config/:id',
                method: 'put',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            detail: {
                name: '配置详情',
                url: '/system-config/:id',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            delete: {
                name: '删除配置',
                url: '/system-config/:id',
                method: 'delete',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            save: {
                name: '保存系统配置',
                url: '/system-config',
                method: 'put',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            }
        }
    );
}
