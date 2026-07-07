<template>
	<div class="container">
		<el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog" width="769px">
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
        <template #extend>
          <div class="extend-editor">
            <div v-for="(item, idx) in state.extendRows" :key="idx" class="extend-row">
              <el-input v-model="item.key" placeholder="键" class="extend-key" />
              <el-input v-model="item.value" placeholder="值" class="extend-value" />
              <el-button link type="danger" @click="removeExtendRow(idx)">删除</el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addExtendRow">添加</el-button>
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

<script setup name="systemDictDialog">
import {reactive, ref, markRaw, nextTick, computed, watch} from 'vue';
import {ElMessage} from 'element-plus';
import {dictApi} from '/@/api/dict';
import ConfigForm from '/@/components/form/index.vue';
import CascaderLabel from '/@/components/form/CascaderLabel.vue';

const props = defineProps({
  row: {
    type: Object,
    required: true,
    default: () => ({})
  },
  dictData: {
    type: Array,
    default: () => []
  }
});

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

const api = dictApi();

// 定义变量内容
const dialogFormRef = ref();
const state = reactive({
  roles: [],
	// 参数请参考 `/router/route.js` 中的 `dynamicRoutes` 路由字典格式
	ruleForm: {
    dictSuperior: [], // 上级字典
    name: '', // 字典名称(英文)
    title: '', // 字典名称(中文)
    value: '', // 映射值
    sort: 0, // 排序
    extend: {}, // 扩展字段
    desc: "", // 描述
    status: 1, // 状态 1=启用 2=禁用
  },
  extendRows: [], // 扩展字段键值对编辑行
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});
const cascaderLabel = markRaw(CascaderLabel);
// 是否为子级字典（选择了上级字典）：子级时"标识(name)"取父级标识且不可修改
const isChildDict = computed(() => Array.isArray(state.ruleForm.dictSuperior) && state.ruleForm.dictSuperior.length > 0);
const formData = computed(() => [
  {
    label: '标识',
    prop: 'name',
    type: 'input',
    col: 12,
    attrs: {
      placeholder: '请输入字典标识',
      clearable: true,
      disabled: isChildDict.value,
    },
    rules: [
      {
        required: true,
        message: "请输入字典标识",
        trigger: "blur"
      },
    ]
  },
  {
    label: '名称',
    prop: 'title',
    type: 'input',
    col: 12,
    attrs: {
      placeholder: '请输入字典名称',
      clearable: true
    },
    rules: [
      {
        required: true,
        message: "请输入字典名称",
        trigger: "blur"
      },
    ]
  },
  {
    label: '映射值',
    prop: 'value',
    type: 'input',
    col: 12,
    attrs: {
      placeholder: '请输入映射值',
      clearable: true
    },
    rules: []
  },
  {
    label: '上级字典',
    prop: 'dictSuperior',
    type: 'cascader',
    options: () => {
      return props.dictData;
    },
    props: {
      checkStrictly: true,
      value: 'id',
      label: 'title',
    },
    attrs: {
      placeholder: '请选择上级字典',
      clearable: true,
      class: 'w100',
    },
    slotDefault: cascaderLabel,
  },
  {
    label: '状态',
    prop: 'status',
    type: 'select',
    col: 12,
    options: [
      {
        label: "启用",
        value: 1,
      },
      {
        label: "禁用",
        value: 2,
      },
    ],
    attrs: {
      placeholder: '请选择状态',
      clearable: true,
      class: 'w100'
    },
  },
  {
    label: '排序',
    prop: 'sort',
    type: 'input',
    col: 12,
    attrs: {
      placeholder: '请输入排序',
      clearable: true
    },
    rules: []
  },
  {
    label: '扩展字典',
    prop: 'extend',
    slot: 'extend',
    span: 24,
  },
  {
  label: '描述',
    prop: 'desc',
    type: 'textarea',
    col: 24,
    attrs: {
      placeholder: '请输入描述',
      clearable: true,
      class: 'w100',
      rows: 3
    },
  }
]);
const rules = {};
// 递归查找从根到目标节点的 id 路径
function findPathById(data, targetId, pathArr = []) {
  for (const item of data) {
    const newPathArr = [...pathArr, item.id];
    if (item.id === targetId) {
      return newPathArr;
    }
    if (item.children && item.children.length) {
      const found = findPathById(item.children, targetId, newPathArr);
      if (Array.isArray(found) && found.length) return found;
    }
  }
  return [];
}
// 递归按 id 查找节点
function findNodeById(data, targetId) {
  for (const item of data) {
    if (item.id === targetId) return item;
    if (item.children && item.children.length) {
      const found = findNodeById(item.children, targetId);
      if (found) return found;
    }
  }
  return null;
}
// 选择上级字典后，标识(name)默认取父级标识且不可修改；顶级时可自由编辑
watch(() => state.ruleForm.dictSuperior, (val) => {
  if (Array.isArray(val) && val.length > 0) {
    const parentId = val[val.length - 1];
    const parent = findNodeById(props.dictData, parentId);
    if (parent) state.ruleForm.name = parent.name;
  }
});
// 新增一行扩展字段
const addExtendRow = () => {
  state.extendRows.push({ key: '', value: '' });
};
// 删除一行扩展字段
const removeExtendRow = (idx) => {
  state.extendRows.splice(idx, 1);
};
// 将 extend 对象拆解为键值对编辑行
const extendToRows = (extend) => {
  if (extend && typeof extend === 'object' && !Array.isArray(extend)) {
    return Object.entries(extend).map(([key, value]) => ({ key, value }));
  }
  return [];
};
// 打开弹窗
const openDialog = async (type, row) => {
  state.ruleForm = {
    dictSuperior: [], // 上级字典
    name: '', // 标识
    title: '', // 名称
    value: '', // 映射值
    sort: 0, // 排序
    extend: {}, // 扩展字段
    desc: "", // 描述
    status: 1, // 状态 1=启用 2=禁用
  };
  state.extendRows = [];
  if (type === 'edit') {
    const data = await detail(row.id);
    Object.keys(state.ruleForm).forEach((key) => {
      if (data.hasOwnProperty(key)) {
        state.ruleForm[key] = data[key];
      }
    });
    state.extendRows = extendToRows(data.extend);
    // 设置上级字典默认选中
    if (row.pid) {
      state.ruleForm.dictSuperior = findPathById(props.dictData, row.pid);
    } else {
      state.ruleForm.dictSuperior = [];
    }
		state.dialog.title = '修改字典';
		state.dialog.submitTxt = '修 改';
	} else {
		state.dialog.title = '新增字典';
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
	state.dialog.isShowDialog = false;
};
// 取消
const onCancel = () => {
	closeDialog();
};
// 提交
const onSubmit = async () => {
  const submitData = { ...state.ruleForm };

  // 获取上级字典 id（级联值为 id 路径，末位即父级）
  if (submitData.dictSuperior && submitData.dictSuperior.length > 0) {
    submitData.pid = submitData.dictSuperior[submitData.dictSuperior.length - 1];
  } else {
    submitData.pid = 0; // 顶级字典
  }

  submitData.sort = parseInt(submitData.sort) || 0;

  // 将键值对编辑行合并为 extend 对象（过滤空 key）
  submitData.extend = state.extendRows.reduce((acc, item) => {
    const key = (item.key ?? '').toString().trim();
    if (key) acc[key] = item.value;
    return acc;
  }, {});

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
// 详情
const detail = async (id) => {
  const res = await api.detail({id: id});

  return res.data;
};
// 暴露变量
defineExpose({
	openDialog,
});
</script>

<style scoped>
.extend-editor {
  width: 100%;
}
.extend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.extend-key {
  flex: 1;
}
.extend-value {
  flex: 2;
}
</style>
