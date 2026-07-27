import createService from '/@/utils/service.js';

/**
 * 操作日志
 *
 * @method list 操作日志列表
 * @method detail 操作日志详情
 * @method delete 删除操作日志
 * @method batchDelete 批量删除操作日志
 */
export function operatorLogApi() {
    return createService(
        {
            list: {
                name: '操作日志列表',
                url: '/operator-log',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            detail: {
                name: '操作日志详情',
                url: '/operator-log/:id',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            delete: {
                name: '删除操作日志',
                url: '/operator-log/:id',
                method: 'delete',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            batchDelete: {
                name: '批量删除操作日志',
                url: '/operator-log/batch-delete',
                method: 'post',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
        }
    );
}
