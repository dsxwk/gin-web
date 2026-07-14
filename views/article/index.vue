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
            <AuthButton auth="article.add" @click="onOpenAdd('add')"/>
          </div>
        </template>
        <template #operation="{row}">
          <div class="flex items-center">
            <AuthButton auth="article.edit" @click="onOpenEdit('edit', row)"/>
            <el-popconfirm title="确定删除吗？" @confirm="onTableDelRow(row)">
              <template #reference>
                <AuthButton auth="article.del"/>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <template #dialog>
          <TableDialog ref="tableDialogRef" @refresh="getTableData(state.tableData.param)" :row="listRow"/>
        </template>
      </Table>
    </div>
  </div>
</template>
<script setup name="article">
import {defineAsyncComponent, reactive, ref, onMounted} from 'vue';
import {ElMessage} from 'element-plus';
import {articleApi} from '/@/api/article';
import {isPublishDict} from '/@/dict/article/index.js';
import {getDict} from '/@/utils/dict.js';
import {withTableLoading} from '/@/utils/commonFunction';

// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const TableDialog = defineAsyncComponent(() => import('/@/views/article/component/dialog.vue'));
import AuthButton from '/@/components/authButton/index.vue';

const api = articleApi();
// 定义变量内容
const tableRef = ref();
const tableDialogRef = ref();
const listRow = ref();
const state = reactive({
  tableData: {
    // 列表数据（必传）
    data: [],
    // 表头内容（必传，注意格式）
    header: [
      {key: 'id', colWidth: '', title: 'ID', type: 'text', isCheck: true},
      {key: 'user.fullName', colWidth: '100', title: '创建人', type: 'text', isCheck: true,
        render: (scope) => {
          return scope.row?.user?.fullName;
        }
      },
      {key: 'title', colWidth: '100', title: '标题', type: 'text', isCheck: true, search: {type: 'input', isSearch: true}},
      {key: 'content', colWidth: '100', title: '内容', type: 'text', isCheck: true},
      {key: 'category.name', colWidth: '100', title: '分类', type: 'text', isCheck: true,
        render: (scope) => {
          return scope.row?.category?.name;
        }
      },
      {key: 'tag', colWidth: '100', title: '标签', type: 'text', isCheck: true,
        render: (scope) => {
          return scope.row?.tag?.join(',') || '';
        }
      },
      {key: 'isPublish', colWidth: '100', title: '是否发布', type: 'text', isCheck: true,
        render: (scope) => {
          return getDict(isPublishDict, scope.row?.isPublish);
        }
      },
      {key: 'createdAt', colWidth: '120', title: '创建时间', type: 'text', isCheck: true, search: {type: 'date', isSearch: true}},
      {key: 'updatedAt', colWidth: '120', title: '更新时间', type: 'text', isCheck: true},
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
      operationWith: 200, // 固定操作列宽度
      notPage: true, // 是否不分页
    },
    // 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
    param: {
      page: 1,
      pageSize: 10,
    },
    // 打印标题
    printName: 'ginBaseAdmin 表格打印演示',
    selectList: [], // 选中列
  },
});
const onOpenAdd = (type) => {
  tableDialogRef.value.openDialog(type);
};
const onOpenEdit = (type, row) => {
  listRow.value = row;
  tableDialogRef.value.openDialog(type, row);
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
      state.tableData.param[key] = value;
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