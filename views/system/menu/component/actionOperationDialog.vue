<template>
  <div class="system-menu-dialog-container">
    <el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog"
               width="769px">
      <ConfigForm
          ref="dialogFormRef"
          v-model:model="state.ruleForm"
          :form-config="formData"
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
<script setup name="systemMenuActionOperationDialog">
import {computed, markRaw, nextTick, onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import ConfigForm from "/@/components/form/index.vue";
import {actionTypeDict, btnSizeDict, btnStyleDict, btnTypeDict, isConfirmDict} from '/@/dict/menu';
import {menuApi} from '/@/api/menu';
import CascaderLabel from "/@/components/form/CascaderLabel.vue";

const api = menuApi();
const props = defineProps({
  menuId: {
    type: Number,
    required: true,
    default: 0
  },
  row: {
    type: Object,
    default: () => ({})
  }
});
const state = reactive({
  roles: [],
  selectedRoleIds: [],
  ruleForm: {
    pid: 0, // 父级id
    superior: [], // 父级
    menuId: "", // 菜单id
    type: "", // 类型 1=header 2=operation
    btnType: "", // 按钮类型 text|btn
    btnStyle: "", // 按钮样式
    btnSize: "", // 按钮尺寸
    isConfirm: 2, // 是否确认
    label: "", // 功能名称
    authValue: "", // 权限标识
    isLink: false, // 是否为链接 1=是 2=否
    sort: 0, // 排序
    roleActions: [], // 角色功能
    status: 1, // 状态 1=启用 2=禁用
  },
  superiorData: [], // 父级选项
  dialog: {
    isShowDialog: false,
    type: '',
    title: '',
    submitTxt: '',
  },
});

const formData = computed(() => [
  {
    label: "菜单id",
    prop: "menuId",
    type: "input",
    attrs: {
      disabled: true,
      placeholder: "请输入菜单id",
      clearable: true
    },
    rules: [
      {
        required: true,
        message: "请输入菜单id",
        trigger: "blur"
      },
    ],
  },
  {
    label: "功能名称",
    prop: "label",
    type: "input",
    attrs: {
      placeholder: "请输入功能名称",
      clearable: true
    },
    rules: [
      {
        required: true,
        message: "请输入功能名称",
        trigger: "blur"
      },
    ],
  },
  {
    label: "权限标识",
    prop: "authValue",
    type: "input",
    attrs: {
      placeholder: "请输入权限标识",
      clearable: true
    },
    rules: [
      {
        required: true,
        message: "请输入权限标识",
        trigger: "blur"
      },
    ],
  },
  {
    label: '上级功能',
    prop: 'superior',
    type: 'cascader',
    options: () => state.superiorData,
    props: {
      checkStrictly: true,
      value: 'id',
      label: 'label',
    },
    attrs: {
      placeholder: '请选择上级功能',
      clearable: true,
      class: 'w100',
    },
    slotDefault: markRaw(CascaderLabel),
  },
  {
    label: "类型",
    prop: "type",
    type: "select",
    options: actionTypeDict,
    attrs: {
      placeholder: "请选择类型",
      clearable: true
    },
    rules: [
      {
        required: true,
        message: "请选择类型",
        trigger: "blur"
      }
    ]
  },
  {
    label: "按钮类型",
    prop: "btnType",
    type: "select",
    col: 12,
    options: btnTypeDict,
    attrs: {
      placeholder: '请选择按钮类型',
      clearable: true,
      class: 'w100'
    },
    rules: [
      {
        required: true,
        message: "请输入按钮类型",
        trigger: "blur"
      },
    ],
  },
  {
    label: "按钮样式",
    prop: "btnStyle",
    type: "select",
    col: 12,
    options: btnStyleDict,
    attrs: {
      placeholder: '请选择按钮样式',
      clearable: true,
      class: 'w100'
    },
    rules: [
      {
        required: true,
        message: "请输入按钮样式",
        trigger: "blur"
      },
    ],
  },
  {
    label: "按钮尺寸",
    prop: "btnSize",
    type: "select",
    col: 12,
    options: btnSizeDict,
    attrs: {
      placeholder: '请选择按钮尺寸',
      clearable: true,
      class: 'w100'
    },
    rules: [
      {
        required: true,
        message: "请输入按钮尺寸",
        trigger: "blur"
      },
    ],
  },
  {
    label: "是否确认",
    prop: "isConfirm",
    type: "select",
    col: 12,
    options: isConfirmDict,
    attrs: {
      placeholder: '请选择是否确认',
      clearable: true,
      class: 'w100'
    },
    rules: [
      {
        required: true,
        message: "请输入是否确认",
        trigger: "blur"
      },
    ],
  },
  {
    label: "是否为链接",
    prop: "isLink",
    type: "switch",
    labelWidth: "120px",
    attrs: {
      placeholder: "请选择是否为链接",
      clearable: true
    },
    rules: [
      {
        required: true,
        message: "请选择是否为链接",
        trigger: "blur"
      },
    ],
  },
  {
    label: '角色功能',
    prop: 'roleActions',
    type: 'select',
    col: 12,
    options: () => {
      return Array.isArray(state?.roles) ? state.roles.map(role => ({label: role.name, value: role.id})) : [];
    },
    attrs: {
      placeholder: '请选择角色',
      multiple: true,
      clearable: true,
      class: 'w100'
    },
  },
  {
    label: "排序",
    prop: "sort",
    type: "inputNumber",
    attrs: {
      type: "number",
      placeholder: "请输入排序",
      clearable: true
    },
    rules: [],
  }
]);

const rules = {};
// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 定义变量内容
const dialogFormRef = ref();
// 打开弹窗
const openDialog = async (type, row) => {
  try {
    // 检查menuId是否存在
    if (!props.menuId) {
      state.superiorData = [];
    } else {
      const actionRes = await api.actionList({menuId: props.menuId});
      const actionData = actionRes.data?.list || [];
      state.superiorData = Array.isArray(actionData) ? actionData
        .filter(item => type !== 'edit' || item.id !== row?.id)
        .map(item => ({
          id: item.id,
          label: item.label,
          title: item.label
        })) : []; // 父级选项
    }
  } catch (e) {
    state.superiorData = [];
    ElMessage.error('获取功能列表失败');
  }

  state.ruleForm = {
    pid: 0, // 父级id
    superior: [], // 父级
    menuId: props.menuId, // 菜单id
    type: "", // 类型 1=header 2=operation
    btnType: "", // 按钮类型 text|btn
    btnStyle: "", // 按钮样式
    btnSize: "", // 按钮尺寸
    isConfirm: 2, // 是否确认
    label: "", // 功能名称
    authValue: "", // 权限标识
    isLink: false, // 是否为链接 1=是 2=否
    sort: 0, // 排序
    roleActions: [],
  };
  if (type === 'edit') {
    if (!row?.id) {
      ElMessage.error('功能数据无效');
      return;
    }
    try {
      const data = await detail(row.id);
      Object.keys(state.ruleForm).forEach((key) => {
        if (data.hasOwnProperty(key)) {
          state.ruleForm[key] = data[key];
        }
      });
      state.ruleForm.superior = (data.pid && data.pid !== props.menuId) ? [data.pid] : [];
      // 设置角色 ID 数组用于 select 默认选中
      state.selectedRoleIds = state.ruleForm.roleActions?.map(item => item.roleId) || [];
      state.dialog.title = '修改功能';
      state.dialog.submitTxt = '修 改';
    } catch (e) {
      ElMessage.error('获取功能详情失败');
      return;
    }
  } else {
    state.selectedRoleIds = [];
    state.dialog.title = '新增功能';
    state.dialog.submitTxt = '新 增';
  }
  state.dialog.type = type;
  state.dialog.isShowDialog = true;
  // 清空表单，此项需加表单验证才能使用
  await nextTick(() => {
    dialogFormRef.value && dialogFormRef.value.resetFields();
  });
};
// 关闭弹窗
const closeDialog = () => {
  state.selectedRoleIds = [];
  state.dialog.isShowDialog = false;
};
// 取消
const onCancel = () => {
  closeDialog();
};
// 提交
const onSubmit = async () => {
  const submitData = { ...state.ruleForm };

  submitData.roleActions = submitData.roleActions?.map(roleId => {
    const role = state.roles.find(r => r.id === roleId);
    return {
      roleId: roleId,
      menuId: props.menuId ?? 0,
      name: role ? role.name : ''
    };
  }) ?? [];

  if (submitData.superior && submitData.superior.length > 0) {
    submitData.pid = submitData.superior[0];
  } else {
    // 未选上级功能时，功能直接挂在当前菜单下（功能为 type=2 的 menu 节点，父级由 menu.pid 表达）
    submitData.pid = props.menuId || 0;
  }

  submitData.sort = parseInt(submitData.sort) || 0;

  submitData.isLink = submitData.isLink === true ? 1 : 2;

  dialogFormRef.value.validate(async (valid) => {
    if (!valid) return;

    let msg = '';
    if (state.dialog.type === 'add') {
      await api.createAction(submitData);
      msg = '创建成功';
    } else {
      submitData.menuId = props.menuId;
      submitData.id = props.row.id;
      submitData.actionId = props.row.id;
      await api.updateAction(submitData);
      msg = '更新成功';
    }
    ElMessage.success(msg);
    closeDialog();
    emit('refresh');
  });
};
// 功能详情
const detail = async (id) => {
  const res = await api.actionDetail({id: id, menuId: props.menuId});
  const data = res.data;
  data.roleActions = Array.isArray(data.roleActions) ? data.roleActions.map(role => role.roleId) : [];
  data.isLink = data.isLink === 1;
  return data;
};
// 获取角色
const getRoles = async () => {
  const data = await api.roleList({page: 1, pageSize: 10, notPage: false});
  state.roles = data.data?.list || [];
};
// 页面加载时
onMounted(() => {
  getRoles();
});
// 暴露变量
defineExpose({
  openDialog,
});
</script>