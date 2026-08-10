<template>
  <div class="table-demo-container layout-padding">
    <div class="table-demo-padding layout-padding-view layout-padding-auto">
      <Table
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
            <AuthButton auth="sys.dept.add" @click="onOpenAddDept('add')"/>
          </div>
        </template>
        <template #operation="{row}">
          <div class="flex items-center" v-auths="['sys.dept.edit','sys.dept.add','sys.dept.del']">
            <AuthButton auth="sys.dept.edit" @click="onOpenEditDept('edit', row)"/>
            <AuthButton auth="sys.dept.addChildren" @click="onOpenAddDept('add', row)"/>
            <el-popconfirm title="确定删除吗？" @confirm="onTableDelRow(row)">
              <template #reference>
                <AuthButton auth="sys.dept.del"/>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <template #dialog>
          <DeptDialog ref="deptDialogRef" @refresh="getTableData(state.tableData.param)" :dept-data="state.tableData.data"/>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup name="systemDepartment">
import {defineAsyncComponent, onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {departmentApi} from '/@/api/department';
import {getDict} from '/@/utils/dict.js';
import {statusDict} from '/@/dict/department';
import {withTableLoading} from '/@/utils/commonFunction';

// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const DeptDialog = defineAsyncComponent(() => import('/@/views/system/department/component/dialog.vue'));
import AuthButton from '/@/components/authButton/index.vue';

const api = departmentApi();
// 定义变量内容
const tableRef = ref();
const deptDialogRef = ref();
const state = reactive({
  tableData: {
    // 列表数据（必传）
    data: [],
    // 表头内容（必传，注意格式）
    header: [
      {key: 'id', colWidth: '180', title: 'ID', type: 'text', isCheck: true},
      {key: 'pid', colWidth: '90', title: '父级ID', type: 'text', isCheck: true},
      {
        key: 'name', colWidth: '', title: '部门名称', type: 'text', isCheck: true,
        search: {type: 'input', isSearch: true},
      },
      {
        key: 'deptLeaders', colWidth: '200', title: '部门领导', isCheck: true,
        search: {type: 'input', prop: 'deptLeaders.leader.fullName', isSearch: true},
        render: (scope) => {
          const leaders = scope.row?.deptLeaders || [];
          if (leaders.length === 0) return '';
          return leaders.map((item) => item.leader?.fullName || item.leader?.nickname || item.leader?.username || '').filter(Boolean).join(',');
        },
      },
      {
        key: 'status', colWidth: '90', title: '状态', isCheck: true,
        render: (scope) => getDict(statusDict, scope.row?.status),
        search: {type: 'select', options: statusDict, isSearch: true},
      },
      {key: 'sort', colWidth: '90', title: '排序', isCheck: true},
      {key: 'createdAt', colWidth: '180', title: '创建时间', type: 'text', isCheck: true},
      {key: 'updatedAt', colWidth: '180', title: '更新时间', type: 'text', isCheck: true},
    ],
    // 配置项（必传）
    config: {
      total: 0,
      loading: true,
      isBorder: true,
      isSerialNo: false,
      isSelection: true,
      isOperate: true,
      isPrintTool: true,
      isExcelTool: true,
      isRefresh: true,
      fixed: 'right',
      operationWith: 220,
      notPage: true,
    },
    param: {},
    printName: '部门管理表格打印演示',
  },
});

// 打开新增弹窗（row 存在时预置为子级）
const onOpenAddDept = (type, row) => {
  deptDialogRef.value.openDialog(type, row);
};

// 打开编辑弹窗
const onOpenEditDept = (type, row) => {
  deptDialogRef.value.openDialog(type, row);
};

// 初始化列表数据
const getTableData = (param) => withTableLoading(state.tableData.config, async () => {
  param.page = 1;
  param.pageSize = 100;
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
  ElMessage.success('删除成功');
  getTableData(state.tableData.param);
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

    :deep(.table-container) {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
  }
}
</style>







