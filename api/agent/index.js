import createService from '/@/utils/service.js';
import {Session, Local} from '/@/utils/storage.js';

/**
 * AI助手
 *
 * @method ask AI对话
 * @method history 会话历史
 * @method sessions 会话列表
 * @method deleteSession 删除会话
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
            },
            deleteSession: {
                name: '删除会话',
                url: '/agent/sessions/:id',
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

const API_URL = import.meta.env.VITE_API_URL;

//流式空闲超时,超过该时间没有任何数据视为连接异常(毫秒)
const STREAM_IDLE_TIMEOUT = 60000;

//获取当前语言
export function getLang() {
    const themeConfig = Local.get('themeConfig');
    let lang = themeConfig?.globalI18n ?? 'zh-Cn';
    if (lang.startsWith('en')) lang = 'en-US';
    return lang;
}

//解析单个SSE事件帧
export function parseEventFrame(raw) {
    let event = 'message';
    const dataLines = [];
    raw.split('\n').forEach((line) => {
        if (!line || line.startsWith(':')) return;
        const index = line.indexOf(':');
        const field = index === -1 ? line : line.slice(0, index);
        let value = index === -1 ? '' : line.slice(index + 1);
        if (value.startsWith(' ')) value = value.slice(1);
        if (field === 'event') event = value;
        else if (field === 'data') dataLines.push(value);
    });
    if (dataLines.length === 0) return null;
    let payload = null;
    try {
        payload = JSON.parse(dataLines.join('\n'));
    } catch {
        payload = null;
    }
    return {event, payload};
}

/**
 * AI助手流式对话
 * 使用fetch读取SSE流并逐块回调,支持AbortController取消与空闲超时
 * @param params 请求参数
 * @param handlers 事件回调
 */
export async function agentStream(params = {}, handlers = {}) {
    const {onMessage, onDone, signal, idleTimeout = STREAM_IDLE_TIMEOUT} = handlers;
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.append(key, value);
    });
    const queryString = query.toString();
    const url = `${API_URL}/agent/stream${queryString ? `?${queryString}` : ''}`;

    //合并外部取消信号与空闲超时
    const controller = new AbortController();
    const abortFromOuter = () => controller.abort();
    if (signal) {
        if (signal.aborted) controller.abort();
        else signal.addEventListener('abort', abortFromOuter, {once: true});
    }

    let idleTimer = null;
    let idleExpired = false;
    const clearIdle = () => {
        if (idleTimer) {
            clearTimeout(idleTimer);
            idleTimer = null;
        }
    };
    //每次收到数据后重置空闲计时
    const resetIdle = () => {
        if (!idleTimeout) return;
        clearIdle();
        idleTimer = setTimeout(() => {
            idleExpired = true;
            controller.abort();
        }, idleTimeout);
    };

    let reader = null;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/event-stream',
                'Accept-Language': getLang(),
                'token': Session.get('token'),
            },
            signal: controller.signal,
        });

        if (!response.ok || !response.body) {
            let message = response.statusText || '流式请求失败';
            try {
                const res = await response.json();
                message = res?.msg || message;
            } catch {
                //忽略非JSON响应
            }
            throw {code: response.status, msg: message};
        }

        //后端未按SSE返回时,读取内容并抛出真实错误
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/event-stream')) {
            let message = '后端未返回流式响应';
            try {
                const text = await response.text();
                if (text) {
                    try {
                        const res = JSON.parse(text);
                        message = res?.msg || text;
                    } catch {
                        message = text;
                    }
                }
            } catch {
                //忽略读取失败
            }
            throw {code: response.status, msg: message};
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        //分发单个事件帧
        let receivedDone = false;
        const dispatch = (frame) => {
            const parsed = parseEventFrame(frame);
            if (!parsed) return;
            const {event, payload} = parsed;
            if (event === 'message') {
                if (payload?.content != null && onMessage) onMessage(payload.content);
            } else if (event === 'done') {
                receivedDone = true;
                if (onDone) onDone(payload || {});
            } else if (event === 'error') {
                throw {code: -1, msg: payload?.message || '流式对话失败'};
            }
        };

        resetIdle();
        while (true) {
            let result;
            try {
                result = await reader.read();
            } catch (e) {
                if (idleExpired) throw {code: -2, msg: 'AI响应超时,请稍后重试'};
                throw e;
            }
            const {done, value} = result;
            if (done) break;
            resetIdle();
            buffer += decoder.decode(value, {stream: true});
            buffer = buffer.replace(/\r\n/g, '\n');
            let separator = buffer.indexOf('\n\n');
            while (separator !== -1) {
                dispatch(buffer.slice(0, separator));
                buffer = buffer.slice(separator + 2);
                separator = buffer.indexOf('\n\n');
            }
        }
        buffer += decoder.decode();
        buffer = buffer.replace(/\r\n/g, '\n');
        if (buffer.trim()) dispatch(buffer);
        //流正常结束前必须收到done事件
        if (!receivedDone) throw {code: -3, msg: '流式连接已中断,请重试'};
    } finally {
        clearIdle();
        if (signal) signal.removeEventListener('abort', abortFromOuter);
        if (reader) reader.cancel().catch(() => {});
    }
}
