<template>
    <div class="notification-page layout-padding">
        <div class="notification-page-panel layout-padding-view">
            <Table
                ref="tableRef"
                v-bind="state.tableData"
                class="notification-table"
                @pageChange="onTablePageChange"
                @sortHeader="onSortHeader"
            >
                <template #tools>
                    <div class="table-tool">
                        <AuthButton auth="notification.send" :loading="state.sendLoading" @click="onOpenSend"/>
                    </div>
                </template>
                <template #operation="{row}">
                    <div class="flex items-center">
                        <template v-if="canRevoke(row)">
                            <el-popconfirm
                                v-if="revokeRequiresConfirm"
                                title="确定撤回这条通知吗？"
                                @confirm="onRevoke(row)"
                            >
                                <template #reference>
                                    <AuthButton auth="notification.revoke"/>
                                </template>
                            </el-popconfirm>
                            <AuthButton v-else auth="notification.revoke" @click="onRevoke(row)"/>
                        </template>
                    </div>
                </template>
            </Table>
        </div>

        <el-dialog
            v-model="state.sendVisible"
            title="发送通知"
            width="640px"
            :close-on-click-modal="false"
            @closed="onSendClosed"
        >
            <el-form ref="sendFormRef" :model="state.sendForm" :rules="state.sendRules" label-width="92px">
                <el-form-item label="通知标题" prop="title">
                    <el-input v-model="state.sendForm.title" maxlength="50" show-word-limit placeholder="请输入通知标题" />
                </el-form-item>
                <el-form-item label="通知内容" prop="content">
                    <el-input
                        v-model="state.sendForm.content"
                        type="textarea"
                        :rows="5"
                        maxlength="500"
                        show-word-limit
                        placeholder="请输入通知内容"
                    />
                </el-form-item>
                <el-form-item label="推送范围" prop="isToAll">
                    <el-radio-group v-model="state.sendForm.isToAll">
                        <el-radio :value="notificationIsToAllEnum.specified">指定范围</el-radio>
                        <el-radio :value="notificationIsToAllEnum.all">全部用户</el-radio>
                    </el-radio-group>
                </el-form-item>
                <template v-if="state.sendForm.isToAll === notificationIsToAllEnum.specified">
                    <el-form-item label="通知类型" prop="type">
                        <el-radio-group v-model="state.sendForm.type" @change="onNoticeTypeChange">
                            <el-radio :value="notificationTypeEnum.user">按用户</el-radio>
                            <el-radio :value="notificationTypeEnum.department">按部门</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item v-if="state.sendForm.type === notificationTypeEnum.user" label="接收用户" prop="userIds">
                        <div class="recipient-selector" @click="onOpenUserSelect">
                            <el-tag
                                v-for="user in state.selectedUsers"
                                :key="user.id"
                                size="small"
                                closable
                                @click.stop
                                @close="onRemoveUser(user.id)"
                            >
                                {{ user.nickname || user.fullName || user.username || user.id }}
                            </el-tag>
                            <span class="recipient-placeholder" v-if="state.selectedUsers.length === 0">请选择接收用户</span>
                            <el-icon class="recipient-arrow"><ele-ArrowDown /></el-icon>
                        </div>
                    </el-form-item>
                    <el-form-item v-else label="接收部门" prop="departmentIds">
                        <el-tree-select
                            v-model="state.sendForm.departmentIds"
                            :data="state.departmentTree"
                            multiple
                            show-checkbox
                            check-strictly
                            :render-after-expand="false"
                            :loading="state.departmentLoading"
                            placeholder="请选择接收部门"
                            class="w100"
                        />
                    </el-form-item>
                </template>
            </el-form>
            <template #footer>
                <el-button @click="state.sendVisible = false">取消</el-button>
                <el-button type="primary" :loading="state.sendLoading" @click="onSubmitSend">发送</el-button>
            </template>
        </el-dialog>

        <UserSelectDialog ref="userSelectDialogRef" selection-mode="multi" @confirm="onUserSelectConfirm" />
    </div>
</template>

<script setup name="systemNotification">
import {computed, defineAsyncComponent, h, nextTick, onMounted, reactive, ref, watch} from 'vue';
import {ElMessage} from 'element-plus';
import {storeToRefs} from 'pinia';
import {useRoute} from 'vue-router';
import {departmentApi} from '/@/api/department';
import {
    notificationIsToAllDict,
    notificationIsToAllEnum,
    notificationStatusDict,
    notificationStatusEnum,
    notificationTypeDict,
    notificationTypeEnum,
} from '/@/dict/notification';
import {getDict} from '/@/utils/dict.js';
import {useNotification} from '/@/stores/notification';
import {useUserInfo} from '/@/stores/userInfo';

//引入组件
import AuthButton from '/@/components/authButton/index.vue';
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const UserSelectDialog = defineAsyncComponent(() => import('/@/views/role/component/userSelectDialog.vue'));

//定义变量内容
const departmentApiService = departmentApi();
const sendFormRef = ref();
const userSelectDialogRef = ref();
const notificationStore = useNotification();
const userInfoStore = useUserInfo();
const route = useRoute();
const {userInfos} = storeToRefs(userInfoStore);
const {managementList, managementTotal, managementLoading, managementPage, managementPageSize} = storeToRefs(notificationStore);
const currentUserId = computed(() => Number(userInfos.value?.id || 0));
const revokeRequiresConfirm = computed(() => {
    const config = (route.meta?.authBtnList || []).find((item) => item.authValue === 'notification.revoke');
    return Number(config?.isConfirm) === 1;
});
const state = reactive({
    sendVisible: false,
    sendLoading: false,
    departmentLoading: false,
    departmentTree: [],
    selectedUsers: [],
    sendForm: buildSendForm(),
    sendRules: {
        title: [{required: true, message: '请输入通知标题', trigger: 'blur'}],
        content: [{required: true, message: '请输入通知内容', trigger: 'blur'}],
    },
    tableData: {
        data: [],
        header: [
            {key: 'id', colWidth: '90', title: 'ID', type: 'text', isCheck: true},
            {key: 'title', colWidth: '180', title: '标题', type: 'text', isCheck: true},
            {key: 'content', colWidth: '', title: '内容', type: 'text', isCheck: true},
            {
                key: 'status',
                colWidth: '90',
                title: '状态',
                isCheck: true,
                render: (scope) => h('el-tag', {
                    type: scope.row?.status === notificationStatusEnum.normal ? 'success' : 'info',
                    size: 'small',
                }, getDict(notificationStatusDict, scope.row?.status)),
            },
            {
                key: 'type',
                colWidth: '100',
                title: '类型',
                isCheck: true,
                render: (scope) => getDict(notificationTypeDict, scope.row?.type),
            },
            {
                key: 'isToAll',
                colWidth: '100',
                title: '范围',
                isCheck: true,
                render: (scope) => getDict(notificationIsToAllDict, scope.row?.isToAll),
            },
            {key: 'recipientCount', colWidth: '100', title: '接收人数', type: 'text', isCheck: true},
            {key: 'createdAt', colWidth: '180', title: '创建时间', type: 'text', isCheck: true},
            {key: 'updatedAt', colWidth: '180', title: '更新时间', type: 'text', isCheck: true},
        ],
        config: {
            total: 0,
            loading: false,
            isBorder: true,
            isSerialNo: false,
            isSelection: false,
            isOperate: true,
            isPrintTool: false,
            isExcelTool: false,
            isRefresh: true,
            fixed: 'right',
            operationWith: 160,
            notPage: false,
        },
        param: {
            page: 1,
            pageSize: 10,
        },
    },
});

//创建发送表单
function buildSendForm() {
    return {
        title: '',
        content: '',
        type: notificationTypeEnum.user,
        isToAll: notificationIsToAllEnum.specified,
        userIds: [],
        departmentIds: [],
    };
}

//同步已发送通知列表
watch(managementList, (value) => {
    state.tableData.data = value;
}, {immediate: true, deep: true});
watch(managementTotal, (value) => {
    state.tableData.config.total = value;
}, {immediate: true});
watch(managementLoading, (value) => {
    state.tableData.config.loading = value;
}, {immediate: true});
watch([managementPage, managementPageSize], ([currentPage, currentPageSize]) => {
    state.tableData.param.page = currentPage;
    state.tableData.param.pageSize = currentPageSize;
});

//获取已发送通知列表
const getTableData = async (param) => {
    try {
        await notificationStore.getSentList({
            page: param.page,
            pageSize: param.pageSize,
        });
    } catch (error) {
        ElMessage.error(error?.message || '获取已发送通知列表失败');
    }
};

//页码改变
const onTablePageChange = (pageData) => {
    state.tableData.param.page = pageData.page;
    state.tableData.param.pageSize = pageData.pageSize;
    getTableData(state.tableData.param);
};

//表头排序改变
const onSortHeader = (data) => {
    state.tableData.header = data;
};

//打开发送弹窗
const onOpenSend = async () => {
    state.sendForm = buildSendForm();
    state.selectedUsers = [];
    state.sendVisible = true;
    await loadDepartmentTree();
    await nextTick();
    sendFormRef.value?.clearValidate();
};

//关闭发送弹窗
const onSendClosed = () => {
    state.selectedUsers = [];
    state.sendForm = buildSendForm();
};

//通知类型改变
const onNoticeTypeChange = () => {
    state.sendForm.userIds = [];
    state.sendForm.departmentIds = [];
    state.selectedUsers = [];
};

//打开用户选择
const onOpenUserSelect = () => {
    userSelectDialogRef.value.openDialog(state.sendForm.userIds);
};

//用户选择确认
const onUserSelectConfirm = (users) => {
    state.selectedUsers = users;
    state.sendForm.userIds = users.map((item) => item.id);
};

//移除用户
const onRemoveUser = (id) => {
    state.selectedUsers = state.selectedUsers.filter((item) => item.id !== id);
    state.sendForm.userIds = state.selectedUsers.map((item) => item.id);
};

//加载部门树
const loadDepartmentTree = async () => {
    if (state.departmentTree.length > 0 || state.departmentLoading) return;
    state.departmentLoading = true;
    try {
        const response = await departmentApiService.list({page: 1, pageSize: 9999, notPage: true});
        state.departmentTree = buildDepartmentTree(response?.data?.list || []);
    } catch (error) {
        ElMessage.error(error?.message || '获取部门列表失败');
    } finally {
        state.departmentLoading = false;
    }
};

//构建部门树
function buildDepartmentTree(list) {
    return (list || [])
        .filter((item) => item.status === 1)
        .map((item) => {
            const children = buildDepartmentTree(item.children || []);
            return {
                label: item.name,
                value: item.id,
                ...(children.length ? {children} : {}),
            };
        });
}

//提交发送
const onSubmitSend = async () => {
    const valid = await sendFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    if (
        state.sendForm.isToAll === notificationIsToAllEnum.specified &&
        state.sendForm.type === notificationTypeEnum.user &&
        state.sendForm.userIds.length === 0
    ) {
        ElMessage.warning('请选择接收用户');
        return;
    }
    if (
        state.sendForm.isToAll === notificationIsToAllEnum.specified &&
        state.sendForm.type === notificationTypeEnum.department &&
        state.sendForm.departmentIds.length === 0
    ) {
        ElMessage.warning('请选择接收部门');
        return;
    }

    state.sendLoading = true;
    try {
        const response = await notificationStore.push({
            title: state.sendForm.title,
            content: state.sendForm.content,
            type: state.sendForm.type,
            isToAll: state.sendForm.isToAll,
            userIds: state.sendForm.type === notificationTypeEnum.user ? state.sendForm.userIds : [],
            departmentIds: state.sendForm.type === notificationTypeEnum.department ? state.sendForm.departmentIds : [],
        });
        ElMessage.success(`通知发送成功，共推送${response?.recipients || 0}人`);
        state.sendVisible = false;
        await getTableData(state.tableData.param);
    } catch (error) {
        ElMessage.error(error?.message || '发送通知失败');
    } finally {
        state.sendLoading = false;
    }
};


//是否可撤回
const canRevoke = (row) => row?.status === notificationStatusEnum.normal && Number(row?.fromUserId) === currentUserId.value;

//撤回通知
const onRevoke = async (row) => {
    try {
        await notificationStore.revoke(row.id);
        ElMessage.success('通知已撤回');
    } catch (error) {
        ElMessage.error(error?.message || '撤回通知失败');
    }
};

//页面加载时
onMounted(async () => {
    await notificationStore.init();
    await getTableData(state.tableData.param);
});
</script>

<style scoped lang="scss">
.notification-page {
    .notification-page-panel {
        display: flex;
        flex-direction: column;
    }
    .notification-table {
        flex: 1;
        min-height: 0;
        padding: 15px;
        box-sizing: border-box;
        overflow: hidden;
    }
    .recipient-selector {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        width: 100%;
        min-height: 32px;
        padding: 3px 30px 3px 10px;
        border: 1px solid var(--el-border-color);
        border-radius: var(--el-border-radius-base);
        background: var(--el-fill-color-blank);
        cursor: pointer;
        position: relative;
        box-sizing: border-box;
        &:hover {
            border-color: var(--el-color-primary);
        }
    }
    .recipient-placeholder {
        color: var(--el-text-color-placeholder);
        font-size: 14px;
    }
    .recipient-arrow {
        position: absolute;
        right: 10px;
        color: var(--el-text-color-placeholder);
    }
}
</style>
