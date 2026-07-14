import request from '/@/utils/request.js';
import {Session, Local} from '/@/utils/storage';

export default function createService(module, headers = {}) {
    const themeConfig = Local.get('themeConfig');
    let lang = themeConfig?.globalI18n ?? 'zh-Cn'
    if (lang.startsWith('en')) {
        lang = 'en-US';
    }
    headers['Accept-Language'] = lang;
    const service = {};
    let hds = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers,
    }

    Object.entries(module).forEach(([key, value]) => {
        service[key] = async function (params) {
            // 每次请求都动态获取 token
            let dynamicHeaders = {...hds};
            if (value.token !== undefined && value.token.value) {
                dynamicHeaders[value?.token.name] = Session.get('token');
            }

            const {url, method} = value;
            const config = {
                method,
                headers: dynamicHeaders,
            };
            if (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') {
                config.body = JSON.stringify(params);
            }

            let finalUrl = url;
            // 替换 URL 中的参数
            const matches = url.match(/:(\w+)/g);
            if (matches) {
                matches.forEach((match) => {
                    // 去除 ":"
                    const paramKey = match.slice(1);
                    if (params && params[paramKey] !== undefined) {
                        finalUrl = finalUrl.replace(match, params[paramKey]);
                        delete params[paramKey];
                    }
                });
            }

            // GET / DELETE 时把剩余 params 拼成查询参数（路径参数已在上面被移除）
            const upperMethod = method.toUpperCase();
            if ((upperMethod === 'GET' || upperMethod === 'DELETE') && params) {
                let queryParams = new URLSearchParams();
                Object.entries(params).forEach(([paramKey, paramValue]) => {
                    // 跳过空值，避免拼接出无意义的查询项
                    if (paramValue === undefined || paramValue === null || paramValue === '') return;
                    // 对象/数组（如 __search）序列化为 JSON 字符串放入 url
                    const value = typeof paramValue === 'object' ? JSON.stringify(paramValue) : paramValue;
                    queryParams.append(paramKey, value);
                });

                const queryString = queryParams.toString();
                if (queryString) {
                    const delimiter = finalUrl.includes('?') ? '&' : '?';
                    finalUrl += delimiter + queryString;
                }
            }

            return request(finalUrl, config);
        };
    });

    return service;
}

const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
};