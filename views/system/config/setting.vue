<template>
  <div class="system-config-container layout-padding">
    <div class="system-config-padding layout-padding-view layout-padding-auto" v-loading="state.loading">
      <el-tabs v-if="state.categories.length" v-model="state.activeTab" class="config-tabs">
        <el-tab-pane
            v-for="cat in state.categories"
            :key="cat.id"
            :label="cat.name"
            :name="String(cat.id)"
        >
          <el-form :model="state.form" label-width="120px" class="config-form">
            <el-form-item
                v-for="item in cat.items"
                :key="item.id"
                :label="item.name"
            >
              <!-- 1 输入框 -->
              <el-input
                  v-if="item.type === 1"
                  v-model="state.form[item._field]"
                  :placeholder="`请输入${item.name}`"
                  clearable
                  class="w100"
              />
              <!-- 2 单选 -->
              <el-radio-group v-else-if="item.type === 2" v-model="state.form[item._field]">
                <el-radio v-for="opt in optionsOf(item)" :key="opt" :value="opt">{{ opt }}</el-radio>
              </el-radio-group>
              <!-- 3 复选 -->
              <el-checkbox-group v-else-if="item.type === 3" v-model="state.form[item._field]">
                <el-checkbox v-for="opt in optionsOf(item)" :key="opt" :value="opt">{{ opt }}</el-checkbox>
              </el-checkbox-group>
              <!-- 4 下拉菜单 -->
              <el-select
                  v-else-if="item.type === 4"
                  v-model="state.form[item._field]"
                  :placeholder="`请选择${item.name}`"
                  clearable
                  class="w100"
              >
                <el-option v-for="opt in optionsOf(item)" :key="opt" :label="opt" :value="opt" />
              </el-select>
              <!-- 5 文本域 -->
              <el-input
                  v-else-if="item.type === 5"
                  v-model="state.form[item._field]"
                  type="textarea"
                  :rows="3"
                  :placeholder="`请输入${item.name}`"
                  class="w100"
              />
              <!-- 6 附件 -->
              <div v-else-if="item.type === 6" class="config-attach">
                <el-input v-model="state.form[item._field]" placeholder="请输入附件地址" clearable class="w100" />
                <el-image
                    v-if="state.form[item._field]"
                    :src="state.form[item._field]"
                    :preview-src-list="[state.form[item._field]]"
                    fit="cover"
                    preview-teleported
                    class="config-attach-preview"
                />
              </div>
              <!-- 兜底 -->
              <el-input v-else v-model="state.form[item._field]" clearable class="w100" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <div class="config-footer" v-if="state.categories.length">
        <el-button type="primary" @click="onSave">保 存</el-button>
      </div>
      <el-empty v-if="!state.loading && !state.categories.length" description="暂无配置" />
    </div>
  </div>
</template>

<script setup name="systemConfigSetting">
import {reactive, onMounted} from 'vue';
import {ElMessage} from 'element-plus';
import {systemConfigApi} from '/@/api/systemConfig';

const api = systemConfigApi();

const state = reactive({
  loading: false,
  activeTab: '',
  categories: [], // [{ id, name, items: [] }]
  form: {}, // { [item.name]: value }
});

// 可选值（optionValue）按逗号拆成选项数组
const optionsOf = (item) => {
  return String(item.optionValue || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
};

// 依据 type 解析默认值：复选框转数组，其余保持字符串
const parseValue = (item) => {
  if (item.type === 3) {
    return item.defaultValue
        ? String(item.defaultValue).split(',').map((s) => s.trim()).filter(Boolean)
        : [];
  }
  return item.defaultValue ?? '';
};

// 按 configCategoryId 分组构建 tab 数据，并初始化表单回显值
const buildCategories = (list) => {
  const map = new Map();
  const form = {};
  (Array.isArray(list) ? list : []).forEach((item) => {
    const field = item.key || `cfg_${item.id}`;
    item._field = field;
    form[field] = parseValue(item);
    const catId = item.configCategoryId;
    if (!map.has(catId)) {
      map.set(catId, {
        id: catId,
        name: (item.configCategory?.name || `分类${catId}`).trim(),
        items: [],
      });
    }
    map.get(catId).items.push(item);
  });
  state.form = form;
  return Array.from(map.values());
};

// 获取配置列表（不分页）
const getData = async () => {
  state.loading = true;
  try {
    const res = await api.list({page: 1, pageSize: 100, notPage: true});
    const list = res?.data?.list || [];
    state.categories = buildCategories(list);
    if (state.categories.length) state.activeTab = String(state.categories[0].id);
  } finally {
    state.loading = false;
  }
};

// 保存：仅提交当前 tab 分类的数据，复选框数组回拼为逗号字符串
const onSave = async () => {
  const cat = state.categories.find((c) => String(c.id) === state.activeTab);
  if (!cat) return;
  const list = cat.items.map((item) => {
    let value = state.form[item._field];
    if (Array.isArray(value)) value = value.join(',');
    return {id: item.id, key: item.key, defaultValue: value ?? ''};
  });
  await api.save({list});
  ElMessage.success('保存成功');
  await getData();
};

onMounted(() => {
  getData();
});
</script>

<style scoped lang="scss">
.system-config-container {
  .system-config-padding {
    padding: 15px;

    .config-form {
      max-width: 720px;
    }

    .config-attach {
      width: 100%;

      .config-attach-preview {
        margin-top: 8px;
        width: 100px;
        height: 100px;
        border-radius: 4px;
      }
    }

    .config-footer {
      margin-top: 20px;
      padding-left: 120px;
    }
  }
}
</style>
