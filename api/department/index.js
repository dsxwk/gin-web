import createService from '/@/utils/service.js';

/**
 * 部门
 *
 * @method list 部门列表
 */
export function departmentApi() {
    return createService(
        {
            list: {
                name: '部门列表',
                url: '/department',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            create: {
                name: '创建部门',
                url: '/department',
                method: 'post',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            update: {
                name: '更新部门',
                url: '/department/:id',
                method: 'put',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            detail: {
                name: '部门详情',
                url: '/department/:id',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            delete: {
                name: '删除部门',
                url: '/department/:id',
                method: 'delete',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            }
        }
    );
}
