import createService from '/@/utils/service.js';

/**
 * 权限
 */
export function permissionApi() {
    return createService(
        {
            list: {
                name: '权限列表',
                url: '/permission',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
        }
    );
}