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
          @search="onSearch"
      >
        <template #tools>
          <div class="table-tool">
            <el-button v-auth="'sys.config.add'" size="default" type="primary" @click="onOpenAdd('add')">
              <el-icon>
                <ele-FolderAdd/>
              </el-icon>
              新增配置
            </el-button>
          </div>
        </template>
        <template #operation="{row}">
          <div class="flex items-center">
            <el-button v-auth="'sys.config.edit'" type="primary" size="small" @click="onOpenEdit('edit', row)">编辑</el-button>
            <el-popconfirm title="确定删除吗？" @confirm="onTableDelRow(row)">
              <template #reference>
                <el-button v-auth="'sys.config.del'" size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <template #dialog>
          <ConfigDialog
              ref="configDialogRef"
              @refresh="getTableData(state.tableData.param)"
              :row="listRow"
              :category-data="state.categoryOptions"
          />
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup name="systemConfig">
import {defineAsyncComponent, onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {systemConfigApi} from '/@/api/systemConfig';
import {configCategoryApi} from '/@/api/configCategory';
import {configTypeDict} from '/@/dict/systemConfig';
import {getDict} from '/@/utils/dict.js';
import {withTableLoading} from '/@/utils/commonFunction';

// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const ConfigDialog = defineAsyncComponent(() => import('/@/views/system/config/component/dialog.vue'));

const api = systemConfigApi();
const categoryApi = configCategoryApi();
// 定义变量内容
const tableRef = ref();
const configDialogRef = ref();
const listRow = ref();
const state = reactive({
  categoryOptions: [], // 配置分类下拉（不分页聚合去重）
  tableData: {
    // 列表数据（必传）
    data: [],
    // 表头内容（必传，注意格式）
    header: [
      {key: 'id', colWidth: '90', title: 'ID', type: 'text', isCheck: true},
      {key: 'key', colWidth: '140', title: '标识', type: 'text', isCheck: true, search: {type: 'input', isSearch: true}},
      {key: 'name', colWidth: '140', title: '名称', type: 'text', isCheck: true},
      {
        key: 'type', colWidth: '100', title: '类型', type: 'text', isCheck: true,
        search: {type: 'select', options: configTypeDict, isSearch: true},
        render: (scope) => getDict(configTypeDict, scope.row?.type),
      },
      {
        key: 'configCategory.name', colWidth: '120', title: '配置分类', type: 'text', isCheck: true,
        render: (scope) => scope.row?.configCategory?.name || '',
      },
      {key: 'defaultValue', colWidth: '', title: '默认值', type: 'text', isCheck: true},
      {key: 'optionValue', colWidth: '', title: '可选值', type: 'text', isCheck: true},
      {key: 'createdAt', colWidth: '120', title: '创建时间', type: 'text', isCheck: true},
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
      notPage: false, // 是否不分页
    },
    // 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
    param: {
      page: 1,
      pageSize: 10,
    },
    // 打印标题
    printName: '系统配置列表',
  },
});
// 打开新增弹窗
const onOpenAdd = (type) => {
  configDialogRef.value.openDialog(type);
};
// 打开编辑弹窗
const onOpenEdit = (type, row) => {
  listRow.value = row;
  configDialogRef.value.openDialog(type, row);
};
// 初始化列表数据
const getTableData = (param) => withTableLoading(state.tableData.config, async () => {
  let response = await api.list(param);
  state.tableData.data = response?.data?.list;
  state.tableData.config.total = response?.data?.total;
});
// 加载配置分类下拉：调用配置分类列表接口（不分页）
const loadCategoryOptions = async () => {
  const res = await categoryApi.list({page: 1, pageSize: 100, notPage: true});
  const list = res?.data?.list || [];
  state.categoryOptions = list.map((item) => ({label: item.name, value: item.id}));
};
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
// 分页改变时回调
const onTablePageChange = (page) => {
  state.tableData.param.page = page.page;
  state.tableData.param.pageSize = page.pageSize;
  getTableData(state.tableData.param);
};
// 删除当前项回调
const onTableDelRow = async (row) => {
  await api.delete({id: row.id});
  ElMessage.success(`删除成功！`);
  await getTableData(state.tableData.param);
};
// 拖动显示列排序回调
const onSortHeader = (data) => {
  state.tableData.header = data;
};
// 页面加载时
onMounted(() => {
  getTableData(state.tableData.param);
  loadCategoryOptions();
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
