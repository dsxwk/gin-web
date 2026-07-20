<template>
  <div class="system-menu-dialog-container">
    <el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog" width="769px">
      <ConfigForm
          ref="dialogFormRef"
          v-model:model="state.ruleForm"
          :form-config="getFormData"
          :rules="rules"
          :form-props="{
            labelWidth: '80px',
            size: 'default'
          }"
      >
        <template #roleUsers>
          <div class="role-users-selector" @click="onOpenUserSelect" tabindex="0">
            <div class="role-users-tags" v-if="state.ruleForm.userRoles.length">
              <el-tag
                v-for="(user, idx) in visibleUsers"
                :key="user.id"
                closable
                size="small"
                :disable-transitions="false"
                @click.stop
                @close.stop="onRemoveUser(idx)"
              >
                {{ user.nickname || user.username || user.id }}
              </el-tag>
              <el-tag v-if="overflowCount > 0" size="small" type="info" class="role-users-more">
                +{{ overflowCount }}
              </el-tag>
            </div>
            <span v-else class="role-users-placeholder">请选择用户</span>
            <el-icon class="role-users-arrow"><ArrowDown /></el-icon>
          </div>
        </template>
        <template #roleMenus>
          <div class="role-action-toolbar" v-if="state.menuTree.length">
            <el-checkbox v-model="menuCheckAll" :indeterminate="menuCheckIndeterminate" @change="onToggleMenuCheckAll">全选</el-checkbox>
            <el-button link type="primary" @click="onExpandAllMenus(true)">展开</el-button>
            <el-button link type="primary" @click="onExpandAllMenus(false)">收起</el-button>
          </div>
          <div class="role-menu-tree">
            <el-tree
                ref="menuTreeRef"
                :data="state.menuTree"
                show-checkbox
                node-key="id"
                :props="{ children: 'children' }"
                default-expand-all
                @check="syncMenuCheckAll"
            >
              <template #default="{ data }">
                <span class="role-tree-node">
                  <el-tag v-if="data.type === 2" size="small" type="warning" effect="plain">功能</el-tag>
                  <span>{{ getNodeLabel(data) }}</span>
                </span>
              </template>
            </el-tree>
            <el-empty v-if="!state.menuTree.length" description="暂无可配置权限" :image-size="60" />
          </div>
        </template>
      </ConfigForm>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onCancel" size="default">取 消</el-button>
          <el-button type="primary" @click="onSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 用户选择弹窗 -->
    <UserSelectDialog ref="userSelectDialogRef" @confirm="onUserSelectConfirm"/>
  </div>
</template>
<script setup name="systemRoleDialog">
import {computed, nextTick, onMounted, reactive, ref} from 'vue';
import {roleApi} from '/@/api/role';
import {menuApi} from '/@/api/menu';
import {ElMessage} from 'element-plus';
import {i18n} from '/@/static/i18n';
import ConfigForm from '/@/components/form/index.vue';
import {statusDict} from '/@/dict/role';
import {ArrowDown} from '@element-plus/icons-vue';
import UserSelectDialog from '/@/views/system/role/component/userSelectDialog.vue';

const props = defineProps({
  row: {
    type: Object,
    required: true,
    default: () => ({})
  }
});
const emit = defineEmits(['refresh']);
const dialogFormRef = ref();
const menuTreeRef = ref();
const userSelectDialogRef = ref();
const menuCheckAll = ref(false);
const menuCheckIndeterminate = ref(false);
const api = roleApi();
const menuApiSvc = menuApi();

const state = reactive({
  ruleForm: {
    name: '',
    desc: '',
    status: 1,
    userRoles: [],
  },
  menuTree: [], // 统一权限树（菜单 type=1 + 功能 type=2）
  dialog: {
    isShowDialog: false,
    type: 'add',
    title: '',
    submitTxt: ''
  }
});

// 统一权限树节点标题：菜单取 meta.title（i18n key），功能取按钮 label
const getNodeLabel = (data) => {
  if (data?.type === 2) {
    return data?.menuAction?.label || data?.name || '';
  }
  return i18n.global.t(data?.meta?.title || '');
};
// 获取统一权限树（不分页）
const loadMenuTree = async () => {
  const res = await menuApiSvc.list({page: 1, pageSize: 10, notPage: true});
  state.menuTree = res?.data?.list || [];
};
// 收集叶子节点 id（无 children 的节点），父子联动模式下仅用叶子回显，父级由 el-tree 推算
const collectLeafIds = (list, set = new Set()) => {
  (Array.isArray(list) ? list : []).forEach((node) => {
    if (node.children && node.children.length) {
      collectLeafIds(node.children, set);
    } else {
      set.add(node.id);
    }
  });
  return set;
};

// 下拉框最多显示标签数
const MAX_VISIBLE_TAGS = 3;
// 当前可见的用户标签
const visibleUsers = computed(() => state.ruleForm.userRoles.slice(0, MAX_VISIBLE_TAGS));
// 溢出数量
const overflowCount = computed(() => state.ruleForm.userRoles.length);

const getFormData = computed(() => {
  return [
    {
      label: '角色名称',
      prop: 'name',
      type: 'input',
      attrs: {
        placeholder: '请输入角色名称',
        clearable: true
      },
      rules: [
        {
          required: true,
          message: '请输入角色名称',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '描述',
      prop: 'desc',
      type: 'textarea',
      attrs: {
        placeholder: '请输入描述',
        clearable: true
      },
      rules: []
    },
    {
      label: '状态',
      prop: 'status',
      type: 'radio',
      options: statusDict
    },
    {
      label: '用户',
      prop: 'roleUsers',
      slot: 'roleUsers',
      span: 24,
    },
    {
      label: '权限',
      prop: 'roleMenus',
      slot: 'roleMenus',
      span: 24,
    },
  ];
});
const rules = {};

const openDialog = async (type, row) => {
  state.ruleForm = {
    name: '',
    desc: '',
    status: 1,
    userRoles: [],
  };
  menuCheckAll.value = false;
  menuCheckIndeterminate.value = false;
  // 加载统一权限树（不分页）
  await loadMenuTree();
  let checkedMenuIds = [];
  if (type === 'edit') {
    try {
      const data = await detail(row.id);
      Object.keys(state.ruleForm).forEach((key) => {
        if (data.hasOwnProperty(key)) {
          state.ruleForm[key] = data[key];
        }
      });
      // 提取角色关联的用户列表（兼容后端多种返回格式）
      // 从 detail 或列表行数据提取 userRoles，user 是后端关联返回的用户数据
      const rawRoles = data.userRoles || props.row.userRoles;
      if (Array.isArray(rawRoles) && rawRoles.length) {
        state.ruleForm.userRoles = rawRoles.map((ur) => ({
          id: ur.userId,
          username: ur.user?.username || '',
          nickname: ur.user?.nickname || '',
        }));
      } else {
        state.ruleForm.userRoles = [];
      }
      // 默认选中角色已存在的权限（父子联动：仅勾选叶子，父级由 el-tree 自动推算）
      const leafSet = collectLeafIds(state.menuTree);
      const storedMenuIds = Array.isArray(data.roleMenus)
        ? data.roleMenus.map((rm) => rm.menuId ?? rm.menu?.id).filter((v) => v != null)
        : [];
      checkedMenuIds = storedMenuIds.filter((id) => leafSet.has(id));
      state.dialog.title = '修改角色';
      state.dialog.submitTxt = '修 改';
    } catch (e) {
      ElMessage.error('获取角色详情失败');
      return;
    }
  } else {
    state.dialog.title = '新增角色';
    state.dialog.submitTxt = '新 增';
  }
  state.dialog.type = type;
  state.dialog.isShowDialog = true;
  // 清空表单，此项需加表单验证才能使用
  await nextTick(() => {
    dialogFormRef.value && dialogFormRef.value.resetFields();
    menuTreeRef.value && menuTreeRef.value.setCheckedKeys(checkedMenuIds);
    // 回显后同步"全选"勾选/半选状态
    syncMenuCheckAll();
  });
};

const closeDialog = () => {
  state.dialog.isShowDialog = false;
};

const onCancel = () => {
  closeDialog();
};

// 权限：全选 / 取消全选
const onToggleMenuCheckAll = (val) => {
  if (!menuTreeRef.value) return;
  const leafIds = val ? [...collectLeafIds(state.menuTree)] : [];
  menuTreeRef.value.setCheckedKeys(leafIds);
  menuCheckIndeterminate.value = false;
};
// 权限：根据当前勾选同步全选/半选状态
const syncMenuCheckAll = () => {
  const total = collectLeafIds(state.menuTree).size;
  const checked = menuTreeRef.value ? menuTreeRef.value.getCheckedKeys(true).length : 0;
  menuCheckAll.value = total > 0 && checked === total;
  menuCheckIndeterminate.value = checked > 0 && checked < total;
};
// 权限：展开 / 收起全部
const onExpandAllMenus = (expand) => {
  const treeRef = menuTreeRef.value;
  if (!treeRef || !treeRef.store) return;
  Object.values(treeRef.store.nodesMap).forEach((node) => {
    node.expanded = expand;
  });
};

// ---- 用户选择 ----
const onOpenUserSelect = () => {
  const existingIds = state.ruleForm.userRoles.map((u) => u.id);
  userSelectDialogRef.value.openDialog(existingIds);
};

const onUserSelectConfirm = (selectedUsers) => {
  state.ruleForm.userRoles = selectedUsers;
};

const onRemoveUser = (index) => {
  state.ruleForm.userRoles.splice(index, 1);
};

const onSubmit = async () => {
  dialogFormRef.value.validate(async (valid) => {
    if (!valid) return;

    const submitData = { ...state.ruleForm };
    const roleId = state.dialog.type === 'edit' ? props.row.id : 0;
    // 勾选的权限转为 [{roleId, menuId, name}]；父子联动下需带上半选父级，保证侧边栏能渲染整棵菜单
    const checkedKeys = menuTreeRef.value ? menuTreeRef.value.getCheckedKeys() : [];
    const halfCheckedKeys = menuTreeRef.value ? menuTreeRef.value.getHalfCheckedKeys() : [];
    submitData.roleMenus = [...checkedKeys, ...halfCheckedKeys].map((menuId) => ({
      roleId,
      menuId,
      name: state.ruleForm.name,
    }));
    // 选中的用户转为 [{roleId, userId}]
    submitData.userRoles = state.ruleForm.userRoles.map((user) => ({
      roleId,
      userId: user.id,
      name: state.ruleForm.name,
    }));

    let msg = '';
    if (state.dialog.type === 'add') {
      await api.create(submitData);
      msg = '创建成功';
    } else {
      submitData.id = props.row.id;
      await api.update(submitData);
      msg = '更新成功';
    }
    ElMessage.success(msg);
    closeDialog();
    emit('refresh');
  });
};
// 详情
const detail = async (id) => {
  const res = await api.detail({id: id});

  return res.data;
};
onMounted(() => {});

defineExpose({openDialog});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
.role-menu-tree {
  width: 100%;
  max-height: 360px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 6px 10px;
}
.role-action-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
.role-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.role-users-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  height: 32px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
  overflow: hidden;
}
.role-users-selector:hover {
  border-color: var(--el-color-primary);
}
.role-users-placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  flex: 1;
}
.role-users-arrow {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.role-users-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}
.role-users-more {
  flex-shrink: 0;
}
</style>



