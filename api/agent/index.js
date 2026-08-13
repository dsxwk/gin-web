import createService from '/@/utils/service.js';

/**
 * AI助手
 *
 * @method ask AI对话
 * @method history 会话历史
 * @method sessions 会话列表
 */
export function agentApi() {
    return createService(
        {
            ask: {
                name: 'AI对话',
                url: '/agent/ask',
                method: 'post',
                params: {},
                loading: false,
                token: {
                    name: 'token',
                    value: true
                }
            },
            history: {
                name: '会话历史',
                url: '/agent/history',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            },
            sessions: {
                name: '会话列表',
                url: '/agent/sessions',
                method: 'get',
                params: {},
                token: {
                    name: 'token',
                    value: true
                }
            }
        }
    );
}
