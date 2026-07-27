<template>
  <div class="operator-log-detail-dialog-container">
    <el-dialog
      title="操作日志详情"
      v-if="state.isShow"
      v-model="state.isShow"
      width="800px"
      destroy-on-close
    >
      <div v-loading="state.loading">
        <!-- 基本信息 -->
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="ID">{{ state.detail.id }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ state.detail.user?.fullName }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ state.detail.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ state.detail.ip }}</el-descriptions-item>
          <el-descriptions-item label="请求方法">
            <el-tag :type="methodTagType(state.detail.method)" size="small">{{ state.detail.method }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态码">
            <el-tag :type="state.detail.statusCode === 200 ? 'success' : 'danger'" size="small">
              {{ state.detail.statusCode }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求地址" :span="2">{{ state.detail.uri }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ state.detail.costMs }} ms</el-descriptions-item>
          <el-descriptions-item label="语言">{{ state.detail.lang }}</el-descriptions-item>
          <el-descriptions-item label="TraceID">{{ state.detail.traceId }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ state.detail.userId }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ state.detail.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ state.detail.updatedAt }}</el-descriptions-item>
        </el-descriptions>
        <!-- 请求参数 -->
        <el-divider content-position="left">请求参数</el-divider>
        <div class="json-content">{{ formatParams(state.detail.params) }}</div>
      </div>
      <template #footer>
        <el-button @click="state.isShow = false" size="default">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup name="operatorLogDetailDialog">
import {reactive} from 'vue';
import {operatorLogApi} from '/@/api/operatorLog';
import {ElMessage} from 'element-plus';

const api = operatorLogApi();
const state = reactive({
  isShow: false,
  loading: false,
  detail: {},
});
// 请求方法标签颜色
const methodTagType = (method) => {
  const map = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger',
    'PATCH': 'info',
  };
  return map[method] || 'info';
};
// 格式化请求参数
const formatParams = (params) => {
  if (!params) return '-';
  try {
    const obj = {};
    Object.entries(params).forEach(([key, val]) => {
      obj[key] = Array.isArray(val) && val.length === 1 ? val[0] : val;
    });
    return JSON.stringify(obj, null, 2);
  } catch {
    return JSON.stringify(params, null, 2);
  }
};
// 打开弹窗
const openDialog = async (row) => {
  state.detail = {};
  state.loading = true;
  state.isShow = true;
  try {
    let response = await api.detail({id: row.id});
    state.detail = response?.data || {};
  } catch {
    ElMessage.error('获取详情失败');
    state.isShow = false;
  } finally {
    state.loading = false;
  }
};
// 暴露方法
defineExpose({ openDialog });
</script>
<style scoped lang="scss">
.operator-log-detail-dialog-container {
  .json-content {
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    background-color: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
  }
}
</style>
