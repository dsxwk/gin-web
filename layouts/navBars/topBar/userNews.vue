<template>
    <div class="layout-navbars-breadcrumb-user-news">
        <div class="head-box">
            <div class="head-box-title">
                {{ $t('message.user.newTitle') }}
                <el-tag v-if="unread > 0" size="small" type="danger" effect="plain">{{ unread }}</el-tag>
            </div>
            <div class="head-box-btn" v-if="list.length > 0" @click="onAllReadClick">{{ $t('message.user.newBtn') }}</div>
        </div>
        <div class="content-box" v-loading="loading">
            <template v-if="list.length > 0">
                <div
                    class="content-box-item"
                    :class="{ 'is-unread': item.isRead === notificationReadEnum.unread }"
                    v-for="item in list"
                    :key="item.id"
                    @click="onItemClick(item)"
                >
                    <div class="content-box-title">
                        <span class="content-box-dot" v-if="item.isRead === notificationReadEnum.unread"></span>
                        <span>{{ item.title }}</span>
                    </div>
                    <div class="content-box-msg">{{ item.content }}</div>
                    <div class="content-box-time">{{ item.createdAt }}</div>
                </div>
            </template>
            <el-empty :description="$t('message.user.newDesc')" v-else></el-empty>
        </div>
        <div class="foot-box" @click="onGoToNoticeCenter" v-if="list.length > 0">{{ $t('message.user.newGo') }}</div>
        <UserNewsDetail ref="detailDialogRef" />
    </div>
</template>

<script setup name="layoutBreadcrumbUserNews">
import {defineAsyncComponent, onMounted, ref} from 'vue';
import {storeToRefs} from 'pinia';
import {ElMessage} from 'element-plus';
import {notificationReadEnum} from '/@/dict/notification';
import {useNotification} from '/@/stores/notification';

//引入组件
const UserNewsDetail = defineAsyncComponent(() => import('/@/layouts/navBars/topBar/userNewsDetail.vue'));

//定义变量内容
const detailDialogRef = ref();
const notificationStore = useNotification();
const {list, unread, loading} = storeToRefs(notificationStore);

//全部已读点击
const onAllReadClick = async () => {
    try {
        await notificationStore.read([]);
        ElMessage.success('全部通知已标记为已读');
    } catch (error) {
        ElMessage.error(error?.message || '操作失败');
    }
};

//单条通知点击
const onItemClick = async (item) => {
    if (item.isRead !== notificationReadEnum.unread) return;
    try {
        await notificationStore.read([item.id]);
    } catch (error) {
        ElMessage.error(error?.message || '操作失败');
    }
};

//前往通知中心点击
const onGoToNoticeCenter = () => {
    detailDialogRef.value?.openDialog();
};

//页面加载时
onMounted(() => {
    notificationStore.init();
});
</script>

<style scoped lang="scss">
.layout-navbars-breadcrumb-user-news {
    width: 360px;
    .head-box {
        display: flex;
        border-bottom: 1px solid var(--el-border-color-lighter);
        box-sizing: border-box;
        color: var(--el-text-color-primary);
        justify-content: space-between;
        height: 38px;
        align-items: center;
        .head-box-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
        }
        .head-box-btn {
            color: var(--el-color-primary);
            font-size: 13px;
            cursor: pointer;
            opacity: 0.8;
            &:hover {
                opacity: 1;
            }
        }
    }
    .content-box {
        min-height: 120px;
        max-height: 420px;
        overflow-y: auto;
        font-size: 13px;
        .content-box-item {
            padding: 12px 4px;
            cursor: pointer;
            border-bottom: 1px solid var(--el-border-color-lighter);
            &:last-of-type {
                border-bottom: none;
            }
            &:hover {
                background: var(--el-fill-color-light);
            }
            &.is-unread .content-box-title {
                color: var(--el-text-color-primary);
                font-weight: 600;
            }
            .content-box-title {
                display: flex;
                align-items: center;
                gap: 6px;
                color: var(--el-text-color-regular);
            }
            .content-box-dot {
                width: 7px;
                height: 7px;
                flex: 0 0 auto;
                border-radius: 50%;
                background: var(--el-color-danger);
            }
            .content-box-msg {
                color: var(--el-text-color-secondary);
                margin-top: 5px;
                margin-bottom: 5px;
                line-height: 1.6;
                display: -webkit-box;
                overflow: hidden;
                text-overflow: ellipsis;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            .content-box-time {
                color: var(--el-text-color-secondary);
                font-size: 12px;
            }
        }
    }
    .foot-box {
        height: 35px;
        color: var(--el-color-primary);
        font-size: 13px;
        cursor: pointer;
        opacity: 0.8;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top: 1px solid var(--el-border-color-lighter);
        &:hover {
            opacity: 1;
        }
    }
    :deep(.el-empty__description p) {
        font-size: 13px;
    }
}
</style>
