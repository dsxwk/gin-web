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
        <template #roleMenus>
          <div class="role-menu-tree">
            <el-tree
                ref="menuTreeRef"
                :data="state.menuTree"
                show-checkbox
                node-key="id"
                :props="{ children: 'children' }"
                default-expand-all
            >
              <template #default="{ data }">
                <span>{{ getMenuTitle(data) }}</span>
              </template>
            </el-tree>
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
const api = roleApi();
const menuApiSvc = menuApi();

const state = reactive({
  ruleForm: {
    name: '',
    desc: '',
    status: 1,
  },
  menuTree: [], // 菜单树（不分页）
  dialog: {
    isShowDialog: false,
    type: 'add',
    title: '',
    submitTxt: ''
  }
});

// 菜单节点标题（meta.title 为 i18n key）
const getMenuTitle = (data) => i18n.global.t(data?.meta?.title || '');
// 获取菜单树（不分页）
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
      label: '菜单权限',
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
  };
  // 加载菜单树（不分页）
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
      // 默认选中角色已存在的菜单（父子联动：仅勾选叶子，父级由 el-tree 自动推算）
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
  });
};

const closeDialog = () => {
  state.dialog.isShowDialog = false;
};

const onCancel = () => {
  closeDialog();
};

const onSubmit = async () => {
  dialogFormRef.value.validate(async (valid) => {
    if (!valid) return;

    const submitData = { ...state.ruleForm };
    // 勾选的菜单转为 [{roleId, menuId}]；父子联动下需带上半选的父级，保证侧边栏能渲染整棵菜单
    const checkedKeys = menuTreeRef.value ? menuTreeRef.value.getCheckedKeys() : [];
    const halfCheckedKeys = menuTreeRef.value ? menuTreeRef.value.getHalfCheckedKeys() : [];
    const roleId = state.dialog.type === 'edit' ? props.row.id : 0;
    submitData.roleMenus = [...checkedKeys, ...halfCheckedKeys].map((menuId) => ({ roleId, menuId }));

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
  max-height: 280px;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 6px 10px;
}
</style>
