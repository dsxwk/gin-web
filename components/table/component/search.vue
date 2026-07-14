<template>
  <div class="table-search-container" ref="containerRef" v-show="filteredSearch.length > 0">
    <el-form ref="tableSearchRef" :model="state.form" size="default" :label-position="labelPosition" :label-width="labelWidth" class="table-form">
      <el-row>
        <el-col :span="colSpan" class="mb20" v-for="(val, key) in filteredSearch" :key="key" v-show="key === 0 || state.isToggle">
          <template v-if="val.type !== ''">
            <el-form-item
                :label="val.label"
                :prop="(val.type === 'daterange' || val.type === 'datetimerange') && val.rangeProp ? val.rangeProp.join('_') : val.prop"
                :rules="[{ required: val.required, message: `${val.label}不能为空`, trigger: val.type === 'input' ? 'blur' : 'change' }]"
            >
              <el-input v-model="state.form[val.prop]" :placeholder="val.placeholder" clearable v-if="val.type === 'input'" style="width: 100%" />
              <DatePicker
                  v-model="state.form[val.prop]"
                  :type="val.type"
                  :placeholder="val.placeholder"
                  :show-shortcuts="val.showShortcuts"
                  style="width: 100%"
                  v-else-if="val.type === 'date' || val.type === 'datetime'"
              />
              <DatePicker
                  v-model="state.form[val.rangeProp ? val.rangeProp.join('_') : val.prop]"
                  :type="val.type"
                  :start-placeholder="'开始日期'"
                  :end-placeholder="'结束日期'"
                  :show-shortcuts="val.showShortcuts"
                  v-else-if="val.type === 'daterange' || val.type === 'datetimerange'"
                  style="width: 100%"
              />
              <el-select v-model="state.form[val.prop]" :placeholder="val.placeholder" v-else-if="val.type === 'select'" style="width: 100%">
                <el-option v-for="item in val.options" :key="item.value" :label="item.label" :value="item.value"> </el-option>
              </el-select>
            </el-form-item>
          </template>
        </el-col>
        <el-col :span="colSpan" class="mb20">
          <el-form-item class="table-form-btn" :label-width="filteredSearch.length <= 1 ? '10px' : '100px'">
            <template #label v-if="filteredSearch.length > 1">
              <div class="table-form-btn-toggle ml10" @click="state.isToggle = !state.isToggle">
                <span>{{ state.isToggle ? '收筛选' : '展筛选' }}</span>
                <SvgIcon :name="state.isToggle ? 'ele-ArrowUp' : 'ele-ArrowDown'" />
              </div>
            </template>
            <div class="table-form-btn-group">
              <el-button size="default" type="primary" @click="onSearch(tableSearchRef)">查询 </el-button>
              <el-button size="default" type="info" class="ml10" @click="onReset(tableSearchRef)"> 重置 </el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup name="tableSearch">
import { reactive, ref, onMounted, onUnmounted, computed } from 'vue';
import { buildSearchFromForm, validateSearch } from '/@/utils/tableSearch.js';
import DatePicker from '/@/components/datePicker/index.vue';

// 定义父组件传过来的值
const props = defineProps({
  // 搜索表单
  search: {
    type: Array,
    default: () => [],
  },
  // 自定义搜索，默认与构建出来的搜索合并
  customSearch: {
    type: Object,
    default: () => null,
  },
  // 首层逻辑，默认 and
  searchLogic: {
    type: String,
    default: () => 'and',
  },
});

// 过滤后的搜索项（只显示 isSearch 为 true 的项）
const filteredSearch = computed(() => {
  return props.search.filter(item => item.isSearch !== false);
});

// 定义子组件向父组件传值/事件
const emit = defineEmits(['search']);

// 定义变量内容
const tableSearchRef = ref();
const containerRef = ref();
const containerWidth = ref(1920);
const state = reactive({
  form: {},
  isToggle: true,
});

// 基于容器自身宽度计算每列占用的栅格数（el-col 的响应式断点基于视口宽度，dialog 内不准确）
const colSpan = computed(() => {
  const w = containerWidth.value;
  if (w < 540) return 24; // 1 个/行
  if (w < 900) return 12; // 2 个/行
  if (w < 1200) return 8; // 3 个/行
  if (w < 1500) return 6; // 4 个/行
  return 4; // 6 个/行
});
// 容器非常窄时标签置顶，保证输入框宽度充足
const labelPosition = computed(() => (containerWidth.value < 540 ? 'top' : 'right'));
const labelWidth = computed(() => (labelPosition.value === 'top' ? 'auto' : '100px'));
// 容器尺寸变化监听
let resizeObserver = null;
const updateContainerWidth = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth;
  }
};

// 构建当前搜索条件（__search 对象）
const getSearch = () => {
  return buildSearchFromForm(state.form, props.search, {
    custom: props.customSearch,
    logic: props.searchLogic,
  });
};
// 校验当前搜索项是否有问题
const validateCurrentSearch = () => {
  return validateSearch(getSearch());
};
// 查询
const onSearch = (formEl) => {
  if (!formEl) return;
  formEl.validate((valid) => {
    if (valid) {
      emit('search', { __search: getSearch() });
    } else {
      return false;
    }
  });
};
// 重置
const onReset = (formEl) => {
  if (!formEl) return;
  formEl.resetFields();
  emit('search', { __search: undefined });
};
// 初始化 form 字段，取自父组件 search.prop
const initFormField = () => {
  if (props.search.length <= 0) return false;
  // props.search.forEach((v) => (state.form[v.prop] = ''));
  props.search.forEach((v) => {
    if ((v.type === 'daterange' || v.type === 'datetimerange') && v.rangeProp) {
      state.form[v.rangeProp.join('_')] = null;
    } else {
      state.form[v.prop] = '';
    }
  });
};
// 页面加载时
onMounted(() => {
  initFormField();
  updateContainerWidth();
  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    resizeObserver = new ResizeObserver(() => updateContainerWidth());
    resizeObserver.observe(containerRef.value);
  }
});
// 卸载时移除监听
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

// 暴露方法：获取/校验当前搜索
defineExpose({
  getSearch,
  validateCurrentSearch,
});
</script>

<style scoped lang="scss">
.table-search-container {
  display: flex;
  .table-form {
    flex: 1;
    width: 100%;
    :deep(.el-form-item__content) {
      .el-input,
      .el-select,
      .el-date-editor {
        width: 100% !important;
      }
    }
    .table-form-btn-toggle {
      white-space: nowrap;
      user-select: none;
      display: flex;
      align-items: center;
      color: var(--el-color-primary);
    }
    .table-form-btn-group {
      display: flex;
      flex-wrap: nowrap;
      white-space: nowrap;
    }
  }
}
</style>