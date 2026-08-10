<template>
  <div class="system-dept-dialog-container">
    <el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog" width="800px">
      <ConfigForm
          ref="dialogFormRef"
          v-model:model="state.ruleForm"
          :form-config="formData"
          :rules="rules"
          :form-props="{
            labelWidth: '100px',
            size: 'default'
          }"
      >
        <template #deptLeaders>
          <div class="dept-leaders-selector w100" @click="onOpenUserSelect" tabindex="0">
            <div class="dept-leaders-tags" v-if="state.leaderUsers.length">
              <el-tag
                v-for="(user, idx) in state.leaderUsers"
                :key="user.id"
                closable
                size="small"
                :disable-transitions="false"
                @click.stop
                @close.stop="onRemoveLeader(idx)"
              >
                {{ user.nickname || user.username || user.id }}
              </el-tag>
            </div>
            <span v-else class="dept-leaders-placeholder">请选择部门领导</span>
            <el-icon class="dept-leaders-arrow"><ArrowDown /></el-icon>
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
    <!-- 用户选择弹窗 ─ 多选模式 -->
    <UserSelectDialog ref="userSelectDialogRef" selection-mode="multi" @confirm="onUserSelectConfirm"/>
  </div>
</template>

<script setup name="systemDepartmentDialog">
import {computed, nextTick, onMounted, reactive, ref} from 'vue';
import {departmentApi} from '/@/api/department';
import {ElMessage} from 'element-plus';
import ConfigForm from '/@/components/form/index.vue';
import {ArrowDown} from '@element-plus/icons-vue';
import {statusDict} from '/@/dict/department';
import UserSelectDialog from '/@/views/system/role/component/userSelectDialog.vue';

const props = defineProps({
  deptData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['refresh']);

const dialogFormRef = ref();
const userSelectDialogRef = ref();
const api = departmentApi();

const state = reactive({
  currentId: 0,
  deptTree: [], // 上级部门级联数据
  leaderUsers: [], // 当前选中的领导用户
  ruleForm: buildEmptyForm(),
  dialog: {
    isShowDialog: false,
    type: '',
    title: '',
    submitTxt: '',
  },
});

function buildEmptyForm() {
  return {
    superior: [], // 上级部门级联路径
    name: '',
    status: 1,
    sort: 0,
    leaderUserIds: [], // 仅编辑时使用
  };
}

// 表单校验规则
const rules = {
  name: [{required: true, message: '请输入部门名称', trigger: 'blur'}],
};

// 构建部门树（用于上级部门级联选择）
function buildDeptTree(list) {
  if (!Array.isArray(list) || !list.length) return [];
  const map = new Map();
  const tree = [];
  list.forEach(item => {
    map.set(item.id, {...item, label: item.name, value: item.id, children: []});
  });
  list.forEach(item => {
    const node = map.get(item.id);
    if (item.pid && map.has(item.pid)) {
      map.get(item.pid).children.push(node);
    } else {
      tree.push(node);
    }
  });
  // 清理空 children
  const clean = (nodes) => {
    nodes.forEach(n => {
      if (n.children && n.children.length === 0) delete n.children;
      else if (n.children) clean(n.children);
  });
  };
  clean(tree);
  return tree;
}

// 根据 id 在树中查找级联路径
function findDeptPath(tree, id, path = []) {
  for (const node of tree) {
    const currentPath = [...path, node.value];
    if (node.value === id) return currentPath;
    if (node.children) {
      const found = findDeptPath(node.children, id, currentPath);
      if (found) return found;
    }
  }
  return [];
}

// 表单配置
const formData = computed(() => {
  const fields = [
    {
      label: '上级部门',
      prop: 'superior',
      type: 'cascader',
      col: 12,
      options: state.deptTree,
      attrs: {
        placeholder: '请选择上级部门(不选=顶级)',
        clearable: true,
        class: 'w100',
        props: {checkStrictly: false, emitPath: true, value: 'value', label: 'label'},
      },
    },
    {
      label: '部门名称',
      prop: 'name',
      type: 'input',
      col: 12,
      attrs: {placeholder: '请输入部门名称', class: 'w100'},
      rules: [{required: true, message: '请输入部门名称', trigger: 'blur'}],
    },
    {
      label: '状态',
      prop: 'status',
      type: 'select',
      col: 12,
      options: statusDict,
      attrs: {placeholder: '请选择状态', class: 'w100'},
    },
    {
      label: '排序',
      prop: 'sort',
      type: 'inputNumber',
      col: 12,
      attrs: {min: 0, class: 'w100'},
    },
  ];
  // 部门领导
  fields.push({
      label: '部门领导',
      prop: 'deptLeaders',
      slot: 'deptLeaders',
      col: 12,
  });
  return fields;
});

// 加载部门树
const loadDeptTree = async () => {
  try {
    const res = await api.list({page: 1, pageSize: 9999, notPage: true});
    state.deptTree = buildDeptTree(res?.data?.list || []);
  } catch (_) {}
};

// 打开用户选择弹窗
const onOpenUserSelect = () => {
  const existingIds = state.leaderUsers.map(u => u.id);
  userSelectDialogRef.value.openDialog(existingIds);
};

// 用户选择确认
const onUserSelectConfirm = (selectedUsers) => {
  state.leaderUsers = selectedUsers;
};

// 移除领导
const onRemoveLeader = (index) => {
  state.leaderUsers.splice(index, 1);
};

// 打开弹窗
const openDialog = async (type, row) => {
  state.ruleForm = buildEmptyForm();
  state.leaderUsers = [];
  // 加载部门树
  await loadDeptTree();

  if (type === 'edit' && row) {
    state.currentId = row.id;
    try {
      const res = await api.detail({id: row.id});
      const data = res.data;
      // 回显上级
      if (data.pid && data.pid > 0) {
        state.ruleForm.superior = findDeptPath(state.deptTree, data.pid);
      }
      state.ruleForm.name = data.name || '';
      state.ruleForm.status = data.status ?? 1;
      state.ruleForm.sort = data.sort ?? 0;
      // 回显部门领导
      const leaders = data.deptLeaders || [];
      state.leaderUsers = leaders.map(item => item.leader).filter(Boolean);
      state.dialog.title = '修改部门';
      state.dialog.submitTxt = '修 改';
    } catch (e) {
      ElMessage.error('获取部门详情失败');
      return;
    }
  } else {
    // 新增：可预置上级
    if (row?.id) {
      state.ruleForm.superior = findDeptPath(state.deptTree, row.id);
    }
    state.dialog.title = '新增部门';
    state.dialog.submitTxt = '新 增';
  }
  state.dialog.type = type;
  state.dialog.isShowDialog = true;
  await nextTick(() => {
    dialogFormRef.value && dialogFormRef.value.resetFields();
  });
};

// 关闭弹窗
const closeDialog = () => {
  state.dialog.isShowDialog = false;
};

const onCancel = () => {
  closeDialog();
};

// 提交
const onSubmit = async () => {
  dialogFormRef.value.validate(async (valid) => {
    if (!valid) return;

    const form = state.ruleForm;
    // 上级 pid：取级联最后一级；空=顶级
    const pid = form.superior && form.superior.length ? form.superior[form.superior.length - 1] : 0;

    const submitData = {
      pid,
      name: form.name,
      status: form.status,
      sort: parseInt(form.sort) || 0,
    };

    // 传递部门领导
    submitData.deptLeaders = state.leaderUsers.map(user => ({
        departmentId: state.currentId || 0,
        leaderUserId: user.id,
      }));

    let msg = '';
    if (state.dialog.type === 'add') {
      await api.create(submitData);
      msg = '创建成功';
    } else {
      submitData.id = state.currentId;
      await api.update(submitData);
      msg = '更新成功';
    }
    ElMessage.success(msg);
    closeDialog();
    emit('refresh');
  });
};

onMounted(() => {});

defineExpose({openDialog});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
.dept-leaders-selector {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  min-height: 32px;
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
}
.dept-leaders-selector:hover {
  border-color: var(--el-color-primary);
}
.dept-leaders-placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  flex: 1;
}
.dept-leaders-arrow {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.dept-leaders-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow: hidden;
  min-width: 0;
  flex-wrap: wrap;
}
</style>







