<template>
  <div class="role-user-select-dialog-container">
    <el-dialog
      :title="state.dialog.title"
      v-if="state.dialog.isShowDialog"
      v-model="state.dialog.isShowDialog"
      width="820px"
      @close="onCancel"
    >
      <!-- 已选择用户栏 -->
      <div class="selected-users-bar">
        <span class="selected-label">
          已选 <el-tag size="small" type="primary" round>{{ selectedUserMap.size }}</el-tag> 项
        </span>
        <template v-if="selectedUserMap.size">
          <el-tag
            v-for="user in selectedUserMap.values()"
            :key="user.id"
            closable
            size="small"
            :disable-transitions="false"
            @close="onRemoveSelected(user)"
          >
            {{ user.nickname || user.username }}
          </el-tag>
          <el-button link type="primary" size="small" @click="onClearAll">清空</el-button>
        </template>
      </div>
      <!-- 用户表格组件（自带搜索、分页），点击行切换选中 -->
      <Table
        ref="userTableRef"
        v-bind="state.tableData"
        :row-style="rowStyle"
        @row-click="onRowClick"
        @pageChange="onPageChange"
        @search="onSearch"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onCancel" size="default">取 消</el-button>
          <el-button type="primary" @click="onConfirm" size="default">
            确 认（{{ selectedUserMap.size }}）
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="systemRoleUserSelectDialog">
import {defineAsyncComponent, h, reactive, ref, nextTick, resolveComponent} from 'vue';
import {userApi} from '/@/api/user';
const ElCheckbox = resolveComponent('el-checkbox');
const ElRadio = resolveComponent('el-radio');

const props = defineProps({
  // 选择模式：multi-多选（默认），single-单选
  selectionMode: {
    type: String,
    default: 'multi',
  },
});

const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));

const emit = defineEmits(['confirm']);
const api = userApi();
const userTableRef = ref();

// 所有已选中用户的集合（key=userId, value=userObj），跨分页持久化
const selectedUserMap = reactive(new Map());

// 行样式：选中行高亮
const rowStyle = ({ row }) => {
  if (selectedUserMap.has(row.id)) {
    return { backgroundColor: 'var(--el-color-primary-light-8)', cursor: 'pointer' };
  }
  return { cursor: 'pointer' };
};

const state = reactive({
  dialog: {
    isShowDialog: false,
    title: '选择用户',
  },
  tableData: {
    data: [],
    header: [
      {
        key: '_select',
        colWidth: '50',
        title: '',
        type: 'text',
        isCheck: true,
        render: (scope) => {
          const isSelected = selectedUserMap.has(scope.row.id);
          if (props.selectionMode === 'single') {
            return h(ElRadio, {
              modelValue: isSelected ? scope.row.id : undefined,
              label: scope.row.id,
              size: 'default',
              onClick: (e) => e.stopPropagation(),
              onChange: (val) => {
                if (val) {
                  selectedUserMap.clear();
                  selectedUserMap.set(scope.row.id, { ...scope.row });
                  forceTableUpdate();
                }
              },
            });
          } else {
            return h(ElCheckbox, {
              modelValue: isSelected,
              size: 'default',
              onClick: (e) => e.stopPropagation(),
              'onUpdate:modelValue': (val) => {
                if (val) {
                  selectedUserMap.set(scope.row.id, { ...scope.row });
                } else {
                  selectedUserMap.delete(scope.row.id);
                }
                forceTableUpdate();
              },
            });
          }
        },
      },
      {
        key: 'id',
        colWidth: '80',
        title: 'ID',
        type: 'text',
        isCheck: true,
      },
      {
        key: 'username',
        colWidth: '',
        title: '用户名',
        type: 'text',
        isCheck: true,
        search: {
          type: 'input',
          isSearch: true,
        },
      },
      {
        key: 'nickname',
        colWidth: '',
        title: '昵称',
        type: 'text',
        isCheck: true,
        search: {
          type: 'input',
          isSearch: true,
        },
      },
      {
        key: 'email',
        colWidth: '',
        title: '邮箱',
        type: 'text',
        isCheck: true,
      },
      {
        key: 'status',
        colWidth: '80',
        title: '状态',
        isCheck: true,
        render: (scope) => {
          const status = scope.row?.status;
          
          return h('el-tag', {
            type: status === 1 ? 'success' : 'danger',
            size: 'small',
          }, status === 1 ? '启用' : '禁用');
        },
        search: {
          type: 'select',
          options: [
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ],
          isSearch: true,
        },
      },
    ],
    config: {
      total: 0,
      loading: false,
      isBorder: true,
      isSerialNo: false,
      isSelection: false,
      isOperate: false,
      isPrintTool: false,
      isExcelTool: false,
      isRefresh: false,
      notPage: false,
    },
    param: {
      page: 1,
      pageSize: 10,
    },
  },
});

// 强制 Table 组件刷新（选中变化后更新行样式）
const forceTableUpdate = () => {
  state.tableData.param = { ...state.tableData.param };
};

// 加载用户列表
const loadUserList = async (params) => {
  state.tableData.config.loading = true;
  try {
    const res = await api.list(params);
    state.tableData.data = res?.data?.list || [];
    state.tableData.config.total = res?.data?.total || 0;
    await nextTick();
  } finally {
    state.tableData.config.loading = false;
  }
};

// 行点击：切换选中
const onRowClick = (row) => {
  if (selectedUserMap.has(row.id)) {
    selectedUserMap.delete(row.id);
  } else {
    if (props.selectionMode === 'single') {
      selectedUserMap.clear();
    }
    selectedUserMap.set(row.id, { ...row });
  }
  forceTableUpdate();
};

// 搜索回调
const onSearch = (searchParams) => {
  const merged = { ...state.tableData.param };
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      merged[key] = value;
    } else {
      delete merged[key];
    }
  });
  merged.page = 1;
  merged.pageSize = state.tableData.param.pageSize;
  state.tableData.param = merged;
  loadUserList(merged);
};

// 分页变化
const onPageChange = (page) => {
  state.tableData.param.page = page.page;
  state.tableData.param.pageSize = page.pageSize;
  loadUserList(state.tableData.param);
};

// 移除已选用户
const onRemoveSelected = (user) => {
  selectedUserMap.delete(user.id);
  forceTableUpdate();
};

// 清空所有已选
const onClearAll = () => {
  selectedUserMap.clear();
  forceTableUpdate();
};

// 打开弹窗
const openDialog = (selectedUserIds = []) => {
  selectedUserMap.clear();
  if (selectedUserIds.length) {
    selectedUserIds.forEach((id) => selectedUserMap.set(id, { id, username: '加载中...', nickname: '加载中...' }));
  }
  state.tableData.param = { page: 1, pageSize: 10 };
  state.dialog.isShowDialog = true;
  nextTick(async () => {
    await loadUserList(state.tableData.param);
    // 编辑回显补齐详情
    if (selectedUserIds.length) {
      try {
        const res = await api.list({ page: 1, pageSize: 9999, notPage: true });
        const allUsers = res?.data?.list || [];
        selectedUserIds.forEach((id) => {
          const matched = allUsers.find((u) => u.id === id);
          if (matched) selectedUserMap.set(id, { ...matched });
        });
        forceTableUpdate();
      } catch (_) {}
    }
  });
};

// 确认
const onConfirm = () => {
  const selectedUsers = [...selectedUserMap.values()];
  emit('confirm', selectedUsers);
  state.dialog.isShowDialog = false;
};

// 取消
const onCancel = () => {
  state.dialog.isShowDialog = false;
};

defineExpose({openDialog});
</script>

<style scoped>
.selected-users-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  min-height: 36px;
}
.selected-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>