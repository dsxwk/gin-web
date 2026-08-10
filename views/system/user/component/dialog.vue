<template>
  <div class="system-menu-dialog-container">
    <el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog" width="800px">
      <ConfigForm
          ref="dialogFormRef"
          v-model:model="state.ruleForm"
          :form-config="getFormData()"
          :rules="rules"
          :form-props="{
            labelWidth: '80px',
            size: 'default'
          }"
      >
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
<script setup name="systemUserDialog">
import {nextTick, reactive, ref, watch} from 'vue';
import {userApi} from '/@/api/user';
import {departmentApi} from '/@/api/department';
import {ElMessage} from 'element-plus';
import ConfigForm from '/@/components/form/index.vue';
import {genderDict, statusDict} from '/@/dict/user';

const props = defineProps({
  row: {
    type: Object,
    required: true,
    default: () => ({})
  }
});
const emit = defineEmits(['refresh']);
const dialogFormRef = ref();
const api = userApi();
const deptApi = departmentApi();

const state = reactive({
  roles: [],
  departments: [], // 部门列表
  ruleForm: {
    fullName: '',
    avatar: '',
    username: '',
    email: '',
    password: '',
    nickname: '',
    gender: 1,
    age: 0,
    status: 1,
    userRoles: [],
    mainDept: null,   // 主部门 departmentId
    userDepts: [],    // 用户部门 departmentId 数组
  },
  dialog: {
    isShowDialog: false,
    type: 'add',
    title: '',
    submitTxt: ''
  }
});

// 监听主部门变化，同步到用户部门
watch(() => state.ruleForm.mainDept, (newVal, oldVal) => {
  // userDepts 可能为 null，统一转为数组
  const raw = state.ruleForm.userDepts;
  const userDepts = Array.isArray(raw) ? [...raw] : [];
  if (!newVal) {
    // 主部门被清除，仅移除旧的主部门，不改变用户选择的其他部门
    if (oldVal && userDepts.includes(oldVal)) {
      const idx = userDepts.indexOf(oldVal);
      userDepts.splice(idx, 1);
    }
    state.ruleForm.userDepts = userDepts;
    return;
  }
  // 主部门有值时，确保用户部门包含主部门
  // 移除旧的主部门
  if (oldVal && userDepts.includes(oldVal)) {
    const idx = userDepts.indexOf(oldVal);
    userDepts.splice(idx, 1);
  }
  // 添加新的主部门到最前面
  if (!userDepts.includes(newVal)) {
    userDepts.unshift(newVal);
  }
  state.ruleForm.userDepts = userDepts;
});

// 监听用户部门变化，防止移除主部门
watch(() => state.ruleForm.userDepts, (newVal, oldVal) => {
  const mainDept = state.ruleForm.mainDept;
  if (!mainDept) return;
  // 转为数组，防止 null/undefined
  const arr = Array.isArray(newVal) ? newVal : [];
  // 如果主部门被移除，自动加回
  if (!arr.includes(mainDept)) {
    // 有主部门时不允许清空
    if (arr.length === 0) {
      state.ruleForm.userDepts = [mainDept];
      return;
    }
    state.ruleForm.userDepts = [mainDept, ...arr];
  }
});

const getFormData = () => {
  // 构建部门级联数据（与菜单上级选择相同模式）
  const buildDeptCascader = (list) => {
    if (!Array.isArray(list) || !list.length) return [];
    return list.map(d => ({
      value: d.id,
      label: d.name,
      children: d.children?.length ? buildDeptCascader(d.children) : undefined,
    }));
  };
  const deptCascaderData = buildDeptCascader(state.departments || []);
  return [
    {
      label: '用户名',
      prop: 'username',
      type: 'input',
      attrs: {
        placeholder: '请输入用户名',
        clearable: true
      },
      rules: [
        {
          required: true,
          message: '请输入用户名',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '姓名',
      prop: 'fullName',
      type: 'input',
      attrs: {
        placeholder: '请输入姓名',
        clearable: true
      },
      rules: [
        {
          required: true,
          message: '请输入姓名',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '性别',
      prop: 'gender',
      type: 'radio',
      options: genderDict
    },
    {
      label: '头像',
      prop: 'avatar',
      type: 'input',
      attrs: {
        placeholder: '请输入头像地址',
        clearable: true
      }
    },
    {
      label: '主部门',
      prop: 'mainDept',
      type: 'cascader',
      options: deptCascaderData,
      attrs: {
        placeholder: '请选择主部门',
        clearable: true,
        filterable: true,
        class: 'w100',
        props: { checkStrictly: true, emitPath: false, value: 'value', label: 'label' },
      },
      rules: [
        {
          required: true,
          message: '请选择主部门',
          trigger: 'change'
        }
      ]
    },
    {
      label: '用户部门',
      prop: 'userDepts',
      type: 'cascader',
      options: deptCascaderData,
      attrs: {
        placeholder: '请选择用户部门',
        clearable: true,
        filterable: true,
        class: 'w100',
        props: { multiple: true, checkStrictly: true, emitPath: false, value: 'value', label: 'label' },
      },
      rules: [
        {
          required: true,
          message: '请选择用户部门',
          trigger: 'change'
        }
      ]
    },
    {
      label: '用户角色',
      prop: 'userRoles',
      type: 'select',
      options: Array.isArray(state?.roles) ? state.roles.map(role => ({label: role.name, value: role.id})) : [],
      attrs: {
        multiple: true,
        clearable: true,
        placeholder: '请选择角色',
        class: 'w100'
      }
    },
    {
      label: '邮箱',
      prop: 'email',
      type: 'input',
      attrs: {
        placeholder: '请输入邮箱',
        clearable: true
      }
    },
    {
      label: '密码',
      prop: 'password',
      type: 'input',
      hidden: state.dialog.type !== 'add',
      attrs: {
        placeholder: '请输入密码',
        clearable: true
      },
      rules: [
        {
          required: true,
          message: '请输入密码',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '昵称',
      prop: 'nickname',
      type: 'input',
      attrs: {
        placeholder: '请输入昵称',
        clearable: true
      },
      rules: [
        {
          required: true,
          message: '请输入昵称',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '年龄',
      prop: 'age',
      type: 'input',
      attrs: {
        type: 'number',
        placeholder: '请输入年龄',
        clearable: true
      }
    },
    {
      label: '状态',
      prop: 'status',
      type: 'radio',
      options: statusDict
    },
  ];
};
const rules = {};

const loadDepartments = async () => {
  try {
    const res = await deptApi.list({page: 1, pageSize: 9999, notPage: true});
    state.departments = res?.data?.list || [];
  } catch (_) {}
};

const openDialog = async (type, row) => {
  // 加载角色和部门数据
  await Promise.all([getRoles(), loadDepartments()]);
  state.ruleForm = {
    fullName: '',
    avatar: '',
    username: '',
    email: '',
    password: '',
    nickname: '',
    gender: 1,
    age: 0,
    status: 1,
    userRoles: [],
    mainDept: null,
    userDepts: [],
  };
  if (type === 'edit') {
    try {
      const data = await detail(row.id);
      Object.keys(state.ruleForm).forEach((key) => {
        if (data.hasOwnProperty(key)) {
          state.ruleForm[key] = data[key];
        }
      });
      // 解析部门数据
      if (data.mainDept?.departmentId) {
        state.ruleForm.mainDept = data.mainDept.departmentId;
      }
      if (Array.isArray(data.userDepts)) {
        state.ruleForm.userDepts = data.userDepts.map(d => d.departmentId);
      } else {
        state.ruleForm.userDepts = [];
      }
    } catch (e) {
      ElMessage.error('获取用户详情失败');
      return;
    }
    delete state.ruleForm['password'];
    state.dialog.title = '修改用户';
    state.dialog.submitTxt = '修 改';
  } else {
    state.dialog.title = '新增用户';
    state.dialog.submitTxt = '新 增';
  }
  state.dialog.type = type;
  state.dialog.isShowDialog = true;
  await nextTick(() => {
    dialogFormRef.value && dialogFormRef.value.resetFields();
  });
};

const closeDialog = () => {
  state.dialog.isShowDialog = false;
};

const onCancel = () => {
  closeDialog();
};

const onSubmit = async () => {
  const submitData = { ...state.ruleForm };
  submitData.age = parseInt(submitData.age) || 0;

  // 格式化主部门
  if (submitData.mainDept) {
    submitData.mainDept = { departmentId: submitData.mainDept };
  } else {
    delete submitData.mainDept;
  }

  // 格式化用户部门
  if (Array.isArray(submitData.userDepts) && submitData.userDepts.length) {
    submitData.userDepts = submitData.userDepts.map(deptId => ({ departmentId: deptId }));
  } else {
    submitData.userDepts = [];
  }

  submitData.userRoles = submitData.userRoles?.map(roleId => {
    const role = state.roles.find(r => r.id === roleId);
    return {
      userId: props.row.id ?? 0,
      roleId: roleId,
      name: role ? role.name : ''
    };
  }) ?? [];

  dialogFormRef.value.validate(async (valid) => {
    if (!valid) return;

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

const getRoles = async () => {
  const data = await api.roleList({page: 1, pageSize: 10, notPage: true});
  state.roles = data.data?.list || [];
};
// 详情
const detail = async (id) => {
  const res = await api.detail({id: id});
  const data = res.data;
  data.userRoles = data.userRoles?.map(role => role.roleId) || [];
  return data;
};

defineExpose({openDialog});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}



</style>
