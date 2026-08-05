import createService from '/@/utils/service.js';

/**
 * 仪表盘
 *
 * @method statistics 仪表盘统计
 * @method systemResource 系统资源
 * @method cards 仪表盘卡片
 */
export function dashboardApi() {
    return createService(
        {
            statistics: {
                name: '仪表盘统计',
                url: '/dashboard/statistics',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            systemResource: {
                name: '系统资源',
                url: '/dashboard/system-resource',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            cards: {
                name: '仪表盘卡片',
                url: '/dashboard/cards',
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
