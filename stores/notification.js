import {defineStore} from 'pinia';
import {notificationSocket} from '/@/utils/websocket/notification';
import {notificationReadEnum, notificationStatusEnum} from '/@/dict/notification';
let initializePromise = null;

export const useNotification = defineStore('notification', {
    state: () => ({
        initialized: false,
        connected: false,
        loading: false,
        loaded: false,
        list: [],
        total: 0,
        unread: 0,
        page: 1,
        pageSize: 10,
        managementList: [],
        managementTotal: 0,
        managementPage: 1,
        managementPageSize: 10,
        managementLoading: false,
        error: '',
    }),
    actions: {
        //初始化通知服务
        async init() {
            this.bindEvents();
            if (initializePromise) return initializePromise;
            initializePromise = (async () => {
                try {
                    await notificationSocket.ready();
                    if (!this.loaded) await this.getList();
                } catch (error) {
                    this.error = error?.message || '通知服务连接失败';
                } finally {
                    initializePromise = null;
                }
            })();
            return initializePromise;
        },
        //绑定通知事件
        bindEvents() {
            if (this.initialized) return;
            this.initialized = true;
            notificationSocket.on('status', (connected) => {
                const enteringConnected = connected && !this.connected;
                this.connected = connected;
                if (enteringConnected && !initializePromise) {
                    this.getList({silent: this.loaded}).catch(() => {});
                }
            });
            notificationSocket.on('notification.created', (notice) => this.addNotice(notice));
            notificationSocket.on('notification.revoked', (notice) => this.removeNotice(notice));
            notificationSocket.on('error', (error) => {
                this.error = error?.message || '通知操作失败';
            });
        },
        //获取通知列表
        async getList(params = {}) {
            const page = params.page ?? this.page;
            const pageSize = params.pageSize ?? this.pageSize;
            if (!params.silent) this.loading = true;

            try {
                const data = await notificationSocket.request('notification.list', {page, pageSize});
                this.list = data?.list || [];
                this.total = data?.total || 0;
                this.unread = data?.unread || 0;
                this.page = data?.page || page;
                this.pageSize = data?.pageSize || pageSize;
                this.loaded = true;
                this.error = '';
                return data;
            } catch (error) {
                this.error = error?.message || '获取通知列表失败';
                throw error;
            } finally {
                this.loading = false;
            }
        },
        //获取当前用户发送的通知列表
        async getSentList(params = {}) {
            const page = params.page ?? this.managementPage;
            const pageSize = params.pageSize ?? this.managementPageSize;
            if (!params.silent) this.managementLoading = true;

            try {
                const data = await notificationSocket.request('notification.list', {page, pageSize, sent: true});
                this.managementList = data?.list || [];
                this.managementTotal = data?.total || 0;
                this.managementPage = data?.page || page;
                this.managementPageSize = data?.pageSize || pageSize;
                this.error = '';
                return data;
            } catch (error) {
                this.error = error?.message || '获取已发送通知列表失败';
                throw error;
            } finally {
                this.managementLoading = false;
            }
        },
        //标记通知已读
        async read(ids = []) {
            const data = await notificationSocket.request('notification.read', {ids});
            if (ids.length) {
                this.list = this.list.map((item) => ids.includes(item.id) ? {...item, isRead: notificationReadEnum.read} : item);
            } else {
                this.list = this.list.map((item) => ({...item, isRead: notificationReadEnum.read}));
            }
            this.unread = Math.max(0, this.unread - (data?.updated || 0));
            return data;
        },
        //发送通知
        async push(payload) {
            return notificationSocket.request('notification.push', payload);
        },
        //撤回通知
        async revoke(id) {
            const data = await notificationSocket.request('notification.revoke', {id});
            this.removeNotice(data);
            this.managementList = this.managementList.map((item) => item.id === data.id ? {...item, status: data.status} : item);
            return data;
        },
        //新增实时通知
        addNotice(notice) {
            if (!notice?.id || notice.status === notificationStatusEnum.revoked) return;
            if (this.list.some((item) => item.id === notice.id)) return;

            this.list = [notice, ...this.list].slice(0, this.pageSize);
            this.total += 1;
            if (notice.isRead === notificationReadEnum.unread) this.unread += 1;
        },
        //移除已撤回通知
        removeNotice(notice) {
            if (!notice?.id) return;
            const target = this.list.find((item) => item.id === notice.id);
            this.list = this.list.filter((item) => item.id !== notice.id);
            this.total = Math.max(0, this.total - (target ? 1 : 0));
            if (target?.isRead === notificationReadEnum.unread) this.unread = Math.max(0, this.unread - 1);
        },
        //断开通知服务
        disconnect() {
            notificationSocket.close();
            this.connected = false;
            this.loaded = false;
            this.list = [];
            this.total = 0;
            this.unread = 0;
            this.managementList = [];
            this.managementTotal = 0;
            this.managementPage = 1;
            this.managementPageSize = 10;
        },
    },
});
