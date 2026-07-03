<template>
  <div class="system-menu-dialog-container">
    <el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog"
               width="769px">
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
<script setup name="articleDialog">
import {nextTick, onMounted, reactive, ref} from 'vue';
import {storeToRefs} from 'pinia';
import {useRoutesList} from '/@/stores/routesList';
import {i18n} from '/@/static/i18n';
import {articleApi} from '/@/api/article';
import {isPublishDict} from '/@/dict/article/index.js';
import {ElMessage} from 'element-plus';
import ConfigForm from '/@/components/form/index.vue';

const props = defineProps({
  row: {
    type: Object,
    required: true,
    default: () => ({})
  }
});
const emit = defineEmits(['refresh']);
const dialogFormRef = ref();
const stores = useRoutesList();
const {routesList} = storeToRefs(stores);
const api = articleApi();

const state = reactive({
  roles: [],
  selectedRoleIds: [],
  ruleForm: {
    title: '',
    user: {
      fullName: '',
    },
    category: {
      name: '',
    },
    content: '',
    tag: [],
    isPublish: 0,
  },
  dialog: {
    isShowDialog: false,
    type: 'add',
    title: '',
    submitTxt: ''
  }
});

const getFormData = () => {
  return [
    {
      label: '标题',
      prop: 'title',
      type: 'input',
      span: 24,
      attrs: {
        placeholder: '请输入标题',
        clearable: true
      },
      rules: [
        {
          required: true,
          message: '请输入用标题',
          trigger: 'blur'
        }
      ]
    },
    {
      label: '标签',
      prop: 'tag',
      type: 'select',
      span: 24,
      options: () => {
        return (Array.isArray(state.ruleForm.tag) ? state.ruleForm.tag : []).map((v) => ({ label: v, value: v }));
      },
      attrs: {
        placeholder: '输入内容后回车添加标签',
        clearable: true,
        class: 'w100',
        multiple: true,
        filterable: true,
        allowCreate: true,
        defaultFirstOption: true,
      }
    },
    {
      label: '是否发布',
      prop: 'isPublish',
      type: 'select',
      span: 24,
      options: isPublishDict,
      attrs: {
        placeholder: '请选择是否发布',
        clearable: true,
        class: 'w100',
      }
    },
    {
      label: '内容',
      prop: 'content',
      type: 'editor',
      span: 24,
      attrs: {
        style: {
          'font-size': '16px',
          'line-height': '1.6',
          color: '#bbb',
        },
        disabled: false,
        placeholder: '请输入内容',
        MENU_CONF: {
          uploadImage: {
            // 上传图片接口
            // server: '/api/upload',
            // form-data fieldName ，默认值 'wangeditor-uploaded-image'
            // fieldName: 'your-custom-name',
            //
            // // 单个文件的最大体积限制，默认为 2M
            // maxFileSize: 1 * 1024 * 1024, // 1M
            //
            // // 最多可上传几个文件，默认为 100
            // maxNumberOfFiles: 10,
            //
            // // 选择文件时的类型限制，默认为 ['image/*'] 。如不想限制，则设置为 []
            // allowedFileTypes: ['image/*'],
            //
            // // 自定义上传参数，例如传递验证的 token 等。参数会被添加到 formData 中，一起上传到服务端。
            // meta: {
            //   token: 'xxx',
            //   otherKey: 'yyy',
            // },
            //
            // // 将 meta 拼接到 url 参数中，默认 false
            // metaWithUrl: false,
            //
            // // 自定义增加 http  header
            // headers: {
            //   Accept: 'text/x-json',
            //   otherKey: 'xxx',
            // },
            //
            // // 跨域是否传递 cookie ，默认为 false
            // withCredentials: true,
            //
            // // 超时时间，默认为 10 秒
            // timeout: 5 * 1000, // 5 秒
          }
        },
        clearable: true
      },
      rules: [
        {
          required: true,
          message: '请输入内容',
          trigger: 'blur'
        }
      ]
    },
  ];
};
const rules = {};
const getData = (routes) => {
  const arr = [];
  routes.forEach((val) => {
    val['title'] = i18n.global.t(val.meta?.title);
    arr.push({...val});
    if (val.children) getData(val.children);
  });
  return arr;
};

const openDialog = async (type, row) => {
  state.ruleForm = {
    title: '',
    user: {
      fullName: '',
    },
    category: {
      name: '',
    },
    content: '',
    tag: [],
    isPublish: 0,
  };
  if (type === 'edit') {
    const data = await detail(row.id);
    Object.keys(state.ruleForm).forEach((key) => {
      if (data.hasOwnProperty(key)) {
        state.ruleForm[key] = data[key];
      }
    });
    state.ruleForm.tag = Array.isArray(data.tag) ? data.tag : [];
    state.dialog.title = '修改文章';
    state.dialog.submitTxt = '修 改';
  } else {
    state.selectedRoleIds = [];
    state.dialog.title = '新增文章';
    state.dialog.submitTxt = '新 增';
  }
  state.dialog.type = type;
  state.dialog.isShowDialog = true;
  // 清空表单，此项需加表单验证才能使用
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
  dialogFormRef.value.validate(async (valid) => {
    if (!valid) return;

    const submitData = { ...state.ruleForm };
    submitData.tag = Array.isArray(submitData.tag) ? submitData.tag : [];

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
onMounted(() => {
  state.menuData = getData(routesList.value);
});

defineExpose({openDialog});
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
