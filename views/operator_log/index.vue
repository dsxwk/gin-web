<template>
  <div class="table-demo-container layout-padding">
    <div class="table-demo-padding layout-padding-view layout-padding-auto">
      <Table
          ref="tableRef"
          v-bind="state.tableData"
          class="table-demo"
          @delRow="onTableDelRow"
          @pageChange="onTablePageChange"
          @sortHeader="onSortHeader"
          @selection-change="onSelectionChange"
          @search="onSearch"
      >
        <template #tools>
          <div class="table-tool">
            <AuthButton auth="sys.operatorLog.batchDel" @click="batchDelete"/>
          </div>
        </template>
        <template #operation="{row}">
          <div class="flex items-center">
            <AuthButton auth="sys.operatorLog.detail" @click="onOpenDetail(row)"/>
            <el-popconfirm title="确定删除吗？" @confirm="onTableDelRow(row)">
              <template #reference>
                <AuthButton auth="sys.operatorLog.del"/>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </Table>
    </div>
    <DetailDialog ref="detailDialogRef" />
  </div>
</template>
<script setup name="systemOperatorLog">
import {defineAsyncComponent, reactive, ref, onMounted} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {operatorLogApi} from '/@/api/operatorLog';
import {withTableLoading} from '/@/utils/commonFunction';

// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
import AuthButton from '/@/components/authButton/index.vue';
const DetailDialog = defineAsyncComponent(() => import('/@/views/operator_log/component/detailDialog.vue'));

const api = operatorLogApi();
// 定义变量内容
const tableRef = ref();
const detailDialogRef = ref();
const state = reactive({
  tableData: {
    // 列表数据（必传）
    data: [],
    // 表头内容（必传，注意格式）
    header: [
      {key: 'id', colWidth: '', title: 'ID', type: 'text', isCheck: true},
      {key: 'user.fullName', colWidth: '100', title: '操作人', type: 'text', isCheck: true,
        render: (scope) => {
          return scope.row?.user?.fullName;
        }
      },
      {key: 'uri', colWidth: '150', title: '请求地址', type: 'text', isCheck: true, search: {type: 'input', isSearch: true}},
      {key: 'method', colWidth: '100', title: '请求方法', type: 'text', isCheck: true,
        render: (scope) => {
          return scope.row?.method || '-';
        }
      },
      {key: 'statusCode', colWidth: '80', title: '状态码', type: 'text', isCheck: true},
      {key: 'ip', colWidth: '130', title: 'IP地址', type: 'text', isCheck: true},
      {key: 'userAgent', colWidth: '100', title: '用户代理', type: 'text', isCheck: true},
      {key: 'costMs', colWidth: '100', title: '耗时(ms)', type: 'text', isCheck: true},
      {key: 'createdAt', colWidth: '120', title: '操作时间', type: 'text', isCheck: true, search: {type: 'daterange', rangeProp: ['createdAtStart', 'createdAtEnd'], isSearch: true}},
    ],
    // 配置项（必传）
    config: {
      total: 0, // 列表总数
      loading: true, // loading 加载
      isBorder: true, // 是否显示表格边框
      isSerialNo: false, // 是否显示表格序号
      isSelection: true, // 是否显示表格多选
      isOperate: true, // 是否显示表格操作栏
      isPrintTool: true, // 是否显示打印工具
      isExcelTool: true, // 是否显示导出Excel工具
      isRefresh: true, // 是否显示刷新
      fixed: 'right', // 固定操作列
      operationWith: 180, // 固定操作列宽度
    },
    // 搜索参数（不用传，用于分页、搜索时传给后台的值，getTableData 中使用）
    param: {
      page: 1,
      pageSize: 10,
    },
    // 打印标题
    printName: '操作日志',
    selectList: [], // 选中列
  },
});
// 打开详情页
const onOpenDetail = (row) => {
  detailDialogRef.value.openDialog(row);
};
// 初始化列表数据
const getTableData = (param) => withTableLoading(state.tableData.config, async () => {
  let response = await api.list(param);
  state.tableData.data = response?.data?.list;
  state.tableData.config.total = response?.data?.total;
});
// 搜索点击时表单回调
const onSearch = (data) => {
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'createdAtStart_createdAtEnd') {
        state.tableData.param.createdAt = value;
      } else {
        state.tableData.param[key] = value;
      }
    } else {
      delete state.tableData.param[key];
    }
  });
  tableRef.value.pageReset();
};
// 删除当前项回调
const onTableDelRow = async (row) => {
  await api.delete({id: row.id});
  ElMessage.success(`删除成功！`);
  state.tableData.data = state.tableData.data.filter((item) => item.id !== row.id);
};
// 分页改变时回调
const onTablePageChange = (page) => {
  state.tableData.param.page = page.page;
  state.tableData.param.pageSize = page.pageSize;
  getTableData(state.tableData.param);
};
// 表格多选改变时，用于导出
const onSelectionChange = (val) => {
  state.tableData.selectList = val.map(item => item.id);
};
// 批量删除
const batchDelete = async () => {
  if (state.tableData.selectList.length === 0) return ElMessage.info('请选择数据');
  ElMessageBox.confirm('确认删除?', '批量删除', {
    confirmButtonType: 'primary',
    cancelButtonType: 'default',
    buttonSize: 'default',
  }).then(
      async () => {
        await api.batchDelete({ids: state.tableData.selectList});
        ElMessage.success(`批量删除成功！`);
        state.tableData.selectList = [];
        await getTableData(state.tableData.param);
      }
  ).catch(
      () => {
        ElMessage.info('已取消');
      }
  );
};
// 拖动显示列排序回调
const onSortHeader = (data) => {
  state.tableData.header = data;
};
// 页面加载时
onMounted(() => {
  getTableData(state.tableData.param);
});
</script>
<style scoped lang="scss">
.table-demo-container {
  .table-demo-padding {
    padding: 15px;

    .table-demo {
      flex: 1;
      overflow: hidden;
    }
  }
}
</style>
