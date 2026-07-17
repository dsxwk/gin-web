import createService from '/@/utils/service.js';

/**
 * 导入记录
 *
 * @method list 导入记录列表
 * @method delete 删除导入记录
 */
export function importRecordsApi() {
    return createService(
        {
            list: {
                name: '导入记录列表',
                url: '/import-records',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            delete: {
                name: '删除导入记录',
                url: '/import-records/:id',
                method: 'delete',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
        }
    );
}