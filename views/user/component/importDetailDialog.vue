<template>
  <el-dialog title="导入明细" v-model="state.isShow" width="1000px" append-to-body>
    <div class="detail-summary">共 <b>{{ state.dataList.length }}</b> 条明细记录</div>
    <el-table :data="state.dataList" border max-height="420" style="width: 100%">
      <el-table-column type="index" label="序号" width="80" align="center"/>
      <el-table-column
        v-for="col in columns"
        :key="col.key"
        :label="col.label"
        :min-width="col.width || 120"
      >
        <template #default="{row}">
          <template v-if="col.dict">{{ getDict(col.dict, row[col.key]) }}</template>
          <template v-else>{{ row[col.key] }}</template>
        </template>
      </el-table-column>
      <template #empty>暂无明细数据</template>
    </el-table>
    <template #footer>
      <el-button size="default" @click="state.isShow = false">关 闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup name="importDetailDialog">
import {reactive, computed} from 'vue';
import {detailColumns} from '/@/dict/importRecords';
import {getDict} from '/@/utils/dict.js';


const state = reactive({
  isShow: false,
  dataList: [],
  currentType: null,
});

// 根据 type 获取列配置，未知类型则从数据 key 自动生成
const columns = computed(() => {
  const type = state.currentType;
  if (type && detailColumns[type]) {
    return detailColumns[type];
  }
  // 无配置时，从第一条数据的 key 自动生成列
  const first = state.dataList[0];
  if (first) {
    return Object.keys(first).map((k) => ({ key: k, label: k }));
  }
  return [];
});

const openDialog = (type, dataList) => {
  state.currentType = type;
  state.dataList = dataList || [];
  state.isShow = true;
};

defineExpose({ openDialog });
</script>

<style scoped>
.detail-summary {
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
}
</style>