<template>
    <el-dialog
        v-model="visible"
        title="通知详情"
        width="min(760px, calc(100vw - 32px))"
        append-to-body
        :close-on-click-modal="false"
        @open="onOpen"
    >
        <div class="notification-detail-toolbar">
            <div class="notification-detail-summary">
                <span>共{{ total }}条</span>
                <el-divider direction="vertical" />
                <span>未读<strong>{{ unread }}</strong>条</span>
            </div>
            <el-button
                type="primary"
                plain
                :disabled="unread <= 0 || loading"
                :loading="readingAll"
                @click="onReadAll"
            >
                <el-icon><ele-CircleCheck /></el-icon>
                全部已读
            </el-button>
        </div>
        <div class="notification-detail-list" v-loading="loading">
            <template v-if="list.length > 0">
                <div
                    class="notification-detail-item"
                    :class="{'is-unread': item.isRead === notificationReadEnum.unread}"
                    v-for="item in list"
                    :key="item.id"
                    @click="onReadItem(item)"
                >
                    <div class="notification-detail-item-head">
                        <div class="notification-detail-title">
                            <span class="notification-detail-dot" v-if="item.isRead === notificationReadEnum.unread"></span>
                            <span>{{ item.title || '-' }}</span>
                        </div>
                        <el-tag
                            size="small"
                            :type="item.isRead === notificationReadEnum.read ? 'success' : 'warning'"
                            effect="plain"
                        >
                            {{ getDict(notificationReadDict, item.isRead) }}
                        </el-tag>
                    </div>
                    <div class="notification-detail-content">{{ item.content || '-' }}</div>
                    <div class="notification-detail-meta">
                        <span>{{ item.createdAt || '-' }}</span>
                        <el-button
                            v-if="item.isRead === notificationReadEnum.unread"
                            text
                            type="primary"
                            size="small"
                            :loading="readingId === item.id"
                            @click.stop="onReadItem(item)"
                        >
                            标记已读
                        </el-button>
                    </div>
                </div>
            </template>
            <el-empty v-else description="暂无通知" :image-size="80" />
        </div>
        <div class="notification-detail-pagination" v-if="total > 0">
            <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="currentPageSize"
                :page-sizes="[10, 20, 50]"
                :total="total"
                layout="total, sizes, prev, pager, next"
                background
                @current-change="onPageChange"
                @size-change="onPageSizeChange"
            />
        </div>
    </el-dialog>
</template>

<script setup name="layoutBreadcrumbUserNewsDetail">
import {ref} from 'vue';
import {ElMessage} from 'element-plus';
import {storeToRefs} from 'pinia';
import {notificationReadDict, notificationReadEnum} from '/@/dict/notification';
import {useNotification} from '/@/stores/notification';
import {getDict} from '/@/utils/dict.js';

const notificationStore = useNotification();
const {list, total, unread, loading} = storeToRefs(notificationStore);
const visible = ref(false);
const currentPage = ref(1);
const currentPageSize = ref(10);
const readingId = ref(null);
const readingAll = ref(false);

//打开通知详情
const openDialog = () => {
    visible.value = true;
};

//加载通知详情
const loadList = async () => {
    try {
        await notificationStore.getList({
            page: currentPage.value,
            pageSize: currentPageSize.value,
        });
    } catch (error) {
        ElMessage.error(error?.message || '获取通知列表失败');
    }
};

//弹窗打开时
const onOpen = async () => {
    currentPage.value = 1;
    await loadList();
};

//页码改变
const onPageChange = async (page) => {
    currentPage.value = page;
    await loadList();
};

//每页条数改变
const onPageSizeChange = async (pageSize) => {
    currentPage.value = 1;
    currentPageSize.value = pageSize;
    await loadList();
};

//单条已读
const onReadItem = async (item) => {
    if (item.isRead === notificationReadEnum.read || readingId.value === item.id) return;
    readingId.value = item.id;
    try {
        await notificationStore.read([item.id]);
        ElMessage.success('已标记为已读');
    } catch (error) {
        ElMessage.error(error?.message || '操作失败');
    } finally {
        readingId.value = null;
    }
};

//全部已读
const onReadAll = async () => {
    if (unread.value <= 0 || readingAll.value) return;
    readingAll.value = true;
    try {
        await notificationStore.read([]);
        ElMessage.success('全部通知已标记为已读');
    } catch (error) {
        ElMessage.error(error?.message || '操作失败');
    } finally {
        readingAll.value = false;
    }
};

defineExpose({
    openDialog,
});
</script>

<style scoped lang="scss">
.notification-detail-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.notification-detail-summary {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    strong {
        margin: 0 3px;
        color: var(--el-color-danger);
        font-size: 16px;
    }
}

.notification-detail-list {
    min-height: 220px;
    max-height: 480px;
    overflow-y: auto;
}

.notification-detail-item {
    padding: 14px 4px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: background-color 0.2s;
    &:last-child {
        border-bottom: none;
    }
    &:hover {
        background: var(--el-fill-color-light);
    }
    &.is-unread .notification-detail-title {
        color: var(--el-text-color-primary);
        font-weight: 600;
    }
}

.notification-detail-item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.notification-detail-title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--el-text-color-regular);
    font-size: 14px;
    word-break: break-word;
}

.notification-detail-dot {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--el-color-danger);
}

.notification-detail-content {
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
}

.notification-detail-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 24px;
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.notification-detail-pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 14px;
}

@media (max-width: 768px) {
    .notification-detail-toolbar {
        align-items: flex-start;
        flex-direction: column;
    }
    .notification-detail-pagination {
        overflow-x: auto;
        justify-content: flex-start;
    }
}
</style>
