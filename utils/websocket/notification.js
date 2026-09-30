import {Session} from '/@/utils/storage';

//通知WebSocket客户端

//通知请求超时时间
const requestTimeout = 12000;
//通知连接重试间隔
const reconnectDelay = 3000;
//通知连接最大重试间隔
const maxReconnectDelay = 30000;

//构建通知WebSocket地址
function buildSocketUrl() {
    const configuredUrl = import.meta.env.VITE_WS_URL;
    const url = configuredUrl
        ? new URL(configuredUrl, window.location.origin)
        : new URL(import.meta.env.VITE_API_URL, window.location.origin);

    if (!configuredUrl) {
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.pathname = '/ws';
        url.search = '';
        url.hash = '';
    }

    const token = Session.get('token');
    if (token) url.searchParams.set('token', token);
    return url.toString();
}

//通知WebSocket客户端
class NotificationSocket {
    constructor() {
        this.socket = null;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.shouldReconnect = false;
        this.listeners = new Map();
        this.pending = new Map();
        this.waiters = [];
        this.lastError = null;
    }

    //连接通知服务
    connect() {
        this.shouldReconnect = true;
        if (!Session.get('token')) {
            this.lastError = new Error('请先登录');
            this.rejectWaiters(this.lastError);
            return false;
        }
        if (this.socket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(this.socket.readyState)) return true;

        let socket;
        try {
            socket = new WebSocket(buildSocketUrl());
        } catch (error) {
            this.lastError = error;
            this.socket = null;
            this.rejectWaiters(error);
            this.emit('error', error);
            this.scheduleReconnect();
            return false;
        }

        this.lastError = null;
        this.socket = socket;
        socket.onopen = () => {
            this.lastError = null;
            this.reconnectAttempts = 0;
            this.resolveWaiters();
            this.emit('status', true);
        };
        socket.onmessage = (event) => this.handleMessage(event);
        socket.onerror = () => {
            this.emit('status', false);
        };
        socket.onclose = () => {
            if (this.socket !== socket) return;
            this.socket = null;
            this.rejectWaiters(new Error('通知服务连接已关闭'));
            this.rejectAllPending(new Error('通知服务连接已关闭'));
            this.emit('status', false);
            this.scheduleReconnect();
        };
        return true;
    }

    //主动关闭通知服务
    close() {
        this.shouldReconnect = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            const socket = this.socket;
            this.socket = null;
            socket.close(1000, 'client close');
        }
        this.lastError = null;
        this.rejectWaiters(new Error('通知服务已关闭'));
        this.rejectAllPending(new Error('通知服务已关闭'));
    }

    //监听通知消息
    on(type, handler) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type).add(handler);
        return () => this.off(type, handler);
    }

    //移除通知监听
    off(type, handler) {
        this.listeners.get(type)?.delete(handler);
    }

    //发送通知请求
    async request(type, data, timeout = requestTimeout) {
        if (!Session.get('token')) throw new Error('请先登录');
        await this.ready(timeout);

        const {promise, item} = this.waitResponse(type, timeout);
        try {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                throw new Error('通知服务连接已关闭');
            }
            this.socket.send(JSON.stringify({type, data}));
        } catch (error) {
            this.removePending(type, item);
            item.reject(error);
        }
        return promise;
    }

    //等待连接建立
    ready(timeout = requestTimeout) {
        if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
        if (!this.connect()) return Promise.reject(this.lastError || new Error('通知服务连接失败'));

        return new Promise((resolve, reject) => {
            const waiter = {
                resolve,
                reject,
                timer: setTimeout(() => {
                    this.waiters = this.waiters.filter((item) => item !== waiter);
                    reject(new Error('通知服务连接超时'));
                }, timeout),
            };
            this.waiters.push(waiter);
        });
    }

    //等待消息响应
    waitResponse(type, timeout = requestTimeout) {
        let item;
        const promise = new Promise((resolve, reject) => {
            item = {
                resolve,
                reject,
                timer: setTimeout(() => {
                    this.removePending(type, item);
                    reject(new Error('通知请求超时'));
                }, timeout),
            };
            const list = this.pending.get(type) || [];
            list.push(item);
            this.pending.set(type, list);
        });
        return {promise, item};
    }

    //处理服务端消息
    handleMessage(event) {
        let message;
        try {
            message = JSON.parse(event.data);
        } catch {
            this.emit('error', new Error('通知消息格式错误'));
            return;
        }

        if (message.type === 'error') {
            const error = new Error(message.data?.message || '通知操作失败');
            error.code = message.data?.code;
            this.rejectAllPending(error);
            this.emit('error', error);
            return;
        }

        this.resolvePending(message.type, message.data);
        this.emit(message.type, message.data);
    }

    //完成等待中的消息
    resolvePending(type, data, reject = false) {
        const list = this.pending.get(type) || [];
        const item = list.shift();
        if (!item) return;

        clearTimeout(item.timer);
        if (list.length) this.pending.set(type, list);
        else this.pending.delete(type);

        if (reject) item.reject(data);
        else item.resolve(data);
    }

    //移除等待中的消息
    removePending(type, target) {
        const list = this.pending.get(type) || [];
        const nextList = list.filter((item) => item !== target);
        if (nextList.length) this.pending.set(type, nextList);
        else this.pending.delete(type);
    }

    //拒绝全部等待消息
    rejectAllPending(error) {
        this.pending.forEach((list) => {
            list.forEach((item) => {
                clearTimeout(item.timer);
                item.reject(error);
            });
        });
        this.pending.clear();
    }

    //触发本地监听
    emit(type, data) {
        this.listeners.get(type)?.forEach((handler) => handler(data));
    }

    //完成连接等待
    resolveWaiters() {
        this.waiters.forEach((item) => {
            clearTimeout(item.timer);
            item.resolve();
        });
        this.waiters = [];
    }

    //拒绝连接等待
    rejectWaiters(error) {
        this.waiters.forEach((item) => {
            clearTimeout(item.timer);
            item.reject(error);
        });
        this.waiters = [];
    }

    //安排断线重连
    scheduleReconnect() {
        if (!this.shouldReconnect || !Session.get('token') || this.reconnectTimer) return;

        const delay = Math.min(reconnectDelay * (this.reconnectAttempts + 1), maxReconnectDelay);
        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }
}

export const notificationSocket = new NotificationSocket();
