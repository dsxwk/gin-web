<template>
  <div class="container">
    <el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog" width="769px">
      <ConfigForm
          ref="dialogFormRef"
          v-model:model="state.ruleForm"
          :form-config="formData"
          :rules="rules"
          :form-props="{
            labelWidth: '90px',
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

<script setup name="systemConfigDialog">
import {reactive, ref, nextTick, computed} from 'vue';
import {ElMessage} from 'element-plus';
import {systemConfigApi} from '/@/api/systemConfig';
import {configTypeDict} from '/@/dict/systemConfig';
import ConfigForm from '/@/components/form/index.vue';

const props = defineProps({
  row: {
    type: Object,
    required: true,
    default: () => ({})
  },
  categoryData: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['refresh']);

const api = systemConfigApi();

const dialogFormRef = ref();
const state = reactive({
  ruleForm: {
    key: '',            // 标识（唯一）
    name: '',           // 名称
    type: 1,            // 类型 1=输入框 2=单选 3=复选 4=下拉菜单 5=文本域 6=附件
    configCategoryId: undefined, // 配置分类
    optionValue: '',    // 可选值（多个用逗号分隔）
    defaultValue: '',   // 默认值
  },
  dialog: {
    isShowDialog: false,
    type: '',
    title: '',
    submitTxt: '',
  },
});
// 需要配置可选值的类型：单选/复选/下拉菜单
const needOptionValue = computed(() => [2, 3, 4].includes(state.ruleForm.type));
const formData = computed(() => [
  {
    label: '标识',
    prop: 'key',
    type: 'input',
    span: 12,
    attrs: {
      placeholder: '请输入标识',
      clearable: true,
    },
    rules: [
      {required: true, message: '请输入标识', trigger: 'blur'},
    ],
  },
  {
    label: '名称',
    prop: 'name',
    type: 'input',
    span: 12,
    attrs: {
      placeholder: '请输入名称',
      clearable: true,
    },
    rules: [
      {required: true, message: '请输入名称', trigger: 'blur'},
    ],
  },
  {
    label: '类型',
    prop: 'type',
    type: 'select',
    span: 12,
    options: configTypeDict,
    attrs: {
      placeholder: '请选择类型',
      clearable: true,
      class: 'w100',
    },
    rules: [
      {required: true, message: '请选择类型', trigger: 'change'},
    ],
  },
  {
    label: '配置分类',
    prop: 'configCategoryId',
    type: 'select',
    span: 12,
    options: () => props.categoryData,
    attrs: {
      placeholder: '请选择配置分类',
      clearable: true,
      class: 'w100',
    },
    rules: [
      {required: true, message: '请选择配置分类', trigger: 'change'},
    ],
  },
  {
    label: '可选值',
    prop: 'optionValue',
    type: 'input',
    span: 24,
    hidden: !needOptionValue.value,
    attrs: {
      placeholder: '多个选项用英文逗号分隔，如：选项1,选项2',
      clearable: true,
      class: 'w100',
    },
  },
  {
    label: '默认值',
    prop: 'defaultValue',
    type: 'textarea',
    span: 24,
    attrs: {
      placeholder: '请输入默认值，复选默认值多个用英文逗号分隔',
      clearable: true,
      class: 'w100',
      rows: 3,
    },
  },
]);
const rules = {};
// 打开弹窗
const openDialog = async (type, row) => {
  state.ruleForm = {
    key: '',
    name: '',
    type: 1,
    configCategoryId: undefined,
    optionValue: '',
    defaultValue: '',
  };
  if (type === 'edit') {
    const data = await detail(row.id);
    Object.keys(state.ruleForm).forEach((key) => {
      if (data.hasOwnProperty(key)) {
        state.ruleForm[key] = data[key];
      }
    });
    state.dialog.title = '修改配置';
    state.dialog.submitTxt = '修 改';
  } else {
    state.dialog.title = '新增配置';
    state.dialog.submitTxt = '新 增';
  }
  state.dialog.type = type;
  state.dialog.isShowDialog = true;
  // 清空表单校验
  await nextTick(() => {
    dialogFormRef.value && dialogFormRef.value.resetFields();
  });
};
// 关闭弹窗
const closeDialog = () => {
  state.dialog.isShowDialog = false;
};
// 取消
const onCancel = () => {
  closeDialog();
};
// 提交
const onSubmit = async () => {
  dialogFormRef.value.validate(async (valid) => {
    if (!valid) return;

    const submitData = {...state.ruleForm};
    // 非需要可选值的类型，清空 optionValue
    if (!needOptionValue.value) submitData.optionValue = '';

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
defineExpose({openDialog});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
