<template>
  <div class="table-demo-container layout-padding">
    <div class="table-demo-padding layout-padding-view layout-padding-auto">
      <Table
          dev
          ref="tableRef"
          v-bind="state.tableData"
          @delRow="onTableDelRow"
          @sortHeader="onSortHeader"
          @pageChange="onTablePageChange"
          @search="onSearch"
          row-key="id"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <template #tools>
          <div class="table-tool">
            <AuthButton auth="sys.dic.add" @click="onOpenAddDict('add')"/>
          </div>
        </template>
        <template #operation="{row}">
          <div class="flex items-center">
            <AuthButton auth="sys.dic.edit" @click="onOpenEditDict('edit', row)"/>
            <AuthButton auth="sys.dic.addChildren" @click="onOpenAddSubDict(row)"/>
            <el-popconfirm title="确定删除吗？" @confirm="onTableDelRow(row)">
              <template #reference>
                <AuthButton auth="sys.dic.del"/>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <template #dialog>
          <DictDialog ref="dictDialogRef" @refresh="getTableData(state.tableData.param)" :row="listRow" :dictId="dictId" :dict-data="state.tableData.data"/>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup name="systemDict">
import {defineAsyncComponent, h, onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {dictApi} from '/@/api/dict';
import {withTableLoading} from '/@/utils/commonFunction';

// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const DictDialog = defineAsyncComponent(() => import('/@/views/system/dic/component/dialog.vue'));
import AuthButton from '/@/components/authButton/index.vue';

const api = dictApi();
// 扩展字段展示：空对象/空数组不展示，非空对象转为紧凑 JSON
const formatExtend = (val) => {
  if (val == null || val === '') return '';
  if (typeof val === 'object') {
    const isEmpty = Array.isArray(val) ? val.length === 0 : Object.keys(val).length === 0;
    return isEmpty ? '' : JSON.stringify(val);
  }
  return val === '[]' || val === '{}' ? '' : val;
};
// 定义变量内容
const tableRef = ref();
const dictDialogRef = ref();
const dictId = ref();
const listRow = ref();
const state = reactive({
  tableData: {
    // 列表数据（必传）
    data: [],
    // 表头内容（必传，注意格式）
    header: [
      {key: 'id', colWidth: '190', title: 'ID', type: 'text', isCheck: true},
      {key: 'pid', colWidth: '', title: '父级id', type: 'text', isCheck: true},
      {key: 'name', colWidth: '140', title: '标识', type: 'text', isCheck: true, search: {type: 'input', isSearch: true}},
      {key: 'title', colWidth: '140', title: '名称', type: 'text', isCheck: true},
      {key: 'value', colWidth: '', title: '映射值', type: 'text', isCheck: true},
      {key: 'extend', colWidth: '100', title: '扩展字段', type: 'text', isCheck: true, render: (scope) => formatExtend(scope.row?.extend)},
      {key: 'sort', colWidth: '', title: '排序', type: 'text', isCheck: true},
      {key: 'desc', colWidth: '', title: '描述', type: 'text', isCheck: true},
      {key: 'status', colWidth: '', title: '状态', type: 'text', isCheck: true, search: {type: 'select', options: [{label: '启用', value: 1}, {label: '禁用', value: 2}], isSearch: true}},
      {key: 'createdAt', colWidth: '100', title: '创建时间', type: 'text', isCheck: true},
      {key: 'updatedAt', colWidth: '100', title: '更新时间', type: 'text', isCheck: true},
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
      operationWith: 220, // 固定操作列宽度
      notPage: true, // 是否不分页
    },
    // 搜索参数（不用传，用于分页、搜索时传给后台的值，`getTableData` 中使用）
    param: {},
    // 打印标题
    printName: 'ginBaseAdmin 表格打印演示',
  },
});
// 打开新增弹窗
const onOpenAddDict = (type) => {
  dictDialogRef.value.openDialog(type);
};
// 打开新增子集
const onOpenAddSubDict = (row) => {
  listRow.value = row;
  dictDialogRef.value.openDialog('add', row);
};
// 打开编辑弹窗
const onOpenEditDict = (type, row) => {
  listRow.value = row;
  dictDialogRef.value.openDialog(type, row);
};
// 初始化列表数据
const getTableData = (param) => withTableLoading(state.tableData.config, async () => {
  param.page = 1;
  param.pageSize = 10;
  param.notPage = true;
  let response = await api.list(param);
  state.tableData.data = response?.data?.list;
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
  getTableData(state.tableData.param);
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
  state.tableData.data = state.tableData.data.filter((item) => item.id !== row.id);
  await getTableData(state.tableData.param);
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