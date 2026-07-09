<template>
  <div class="container">
    <el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog" width="600px">
      <ConfigForm
          ref="dialogFormRef"
          v-model:model="state.ruleForm"
          :form-config="formData"
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

<script setup name="systemConfigCategoryDialog">
import {reactive, ref, nextTick, computed} from 'vue';
import {ElMessage} from 'element-plus';
import {configCategoryApi} from '/@/api/configCategory';
import ConfigForm from '/@/components/form/index.vue';

const props = defineProps({
  row: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const emit = defineEmits(['refresh']);

const api = configCategoryApi();

const dialogFormRef = ref();
const state = reactive({
  ruleForm: {
    name: '', // 分类名称
  },
  dialog: {
    isShowDialog: false,
    type: '',
    title: '',
    submitTxt: '',
  },
});
const formData = computed(() => [
  {
    label: '分类名称',
    prop: 'name',
    type: 'input',
    span: 24,
    attrs: {
      placeholder: '请输入分类名称',
      clearable: true,
    },
    rules: [
      {required: true, message: '请输入分类名称', trigger: 'blur'},
    ],
  },
]);
// 打开弹窗
const openDialog = async (type, row) => {
  state.ruleForm = {
    name: '',
  };
  if (type === 'edit') {
    const data = await detail(row.id);
    Object.keys(state.ruleForm).forEach((key) => {
      if (data.hasOwnProperty(key)) {
        state.ruleForm[key] = data[key];
      }
    });
    state.dialog.title = '修改分类';
    state.dialog.submitTxt = '修 改';
  } else {
    state.dialog.title = '新增分类';
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
