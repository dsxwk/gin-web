import createService from '/@/utils/service.js';

/**
 * 配置分类
 *
 * @method list 配置分类列表（分页/不分页）
 * @method create 创建配置分类
 * @method update 更新配置分类
 * @method detail 配置分类详情
 * @method delete 删除配置分类
 */
export function configCategoryApi() {
    return createService(
        {
            list: {
                name: '配置分类列表',
                url: '/config-category',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            create: {
                name: '创建配置分类',
                url: '/config-category',
                method: 'post',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            update: {
                name: '更新配置分类',
                url: '/config-category/:id',
                method: 'put',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            detail: {
                name: '配置分类详情',
                url: '/config-category/:id',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            delete: {
                name: '删除配置分类',
                url: '/config-category/:id',
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
