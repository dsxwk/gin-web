import {NextLoading} from '/@/utils/loading';
import errorHandler from '/@/utils/error/handle';
import {Session} from '/@/utils/storage.js';

const API_URL = import.meta.env.VITE_API_URL;

// golang 测试地址
// API_URL = 'http://127.0.0.1:8080/api/v1';

export default async function request(path, config = {}) {
    if (config.loading !== false) {
        NextLoading.start();
    }

    try {
        let response = await fetch(API_URL + path, config);

        let res = null;

        try {
            res = await response.json();
        } catch {
            res = {
                code: response.status,
                msg: response.statusText || '服务器响应异常',
                data: null
            };
        }

        // 401刷新token
        if (response.status === 401) {
            try {
                const newToken = await refreshToken();
                const newConfig = {
                    ...config,
                    headers: {
                        ...config.headers,
                        'token': newToken
                    }
                };

                response = await fetch(API_URL + path, newConfig);

                try {
                    res = await response.json();
                } catch {
                    res = {
                        code: response.status,
                        msg: response.statusText || '服务器响应异常',
                        data: null
                    };
                }
            } catch {
                throw {
                    code: 401,
                    msg: '登录已过期'
                };
            }
        }

        // HTTP错误
        if (!response.ok) {
            throw {
                code: response.status,
                msg:
                    res?.msg ||
                    response.statusText ||
                    '请求失败',
                data: res?.data
            };
        }

        // 业务错误
        if (
            res &&
            Object.prototype.hasOwnProperty.call(res, 'code') &&
            res.code !== 0
        ) {
            throw res;
        }

        return res;
    } catch (error) {
        errorHandler(error);

        throw error;
    } finally {
        NextLoading.done();
    }
}

async function refreshToken() {
    const refreshToken = Session.get('refreshToken');

    if (!refreshToken) throw new Error('没有refreshToken');

    const response = await fetch(
        API_URL + '/refresh-token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                token: refreshToken
            }
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error('刷新Token失败');
    }

    if (!response.ok) {
        throw new Error(
            data?.msg ||
            response.statusText ||
            '刷新Token失败'
        );
    }

    if (data.code !== 0) throw new Error(data.msg);

    Session.set('token', data.data.accessToken);
    Session.set('refreshToken', data.data.refreshToken);

    return data.data.accessToken;
}