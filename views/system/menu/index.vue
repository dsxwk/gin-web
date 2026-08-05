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
            <AuthButton auth="sys.menu.add" @click="onOpenAddMenu('add')"/>
          </div>
        </template>
        <template #operation="{row}">
          <div class="flex items-center" v-auths="['sys.menu.edit','sys.menu.add','sys.menu.del']">
            <AuthButton auth="sys.menu.edit" @click="onOpenEditMenu('edit', row)"/>
            <AuthButton auth="sys.menu.addChildren" @click="onOpenAddMenu('add', row)"/>
            <el-popconfirm title="确定删除吗？" @confirm="onTableDelRow(row)">
              <template #reference>
                <AuthButton auth="sys.menu.del"/>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <template #dialog>
          <MenuDialog ref="menuDialogRef" @refresh="getTableData(state.tableData.param)" :menu-data="state.tableData.data"/>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup name="systemMenu">
import {defineAsyncComponent, h, onMounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import {menuApi} from '/@/api/menu';
import SvgIcon from '/@/components/svgIcon/index.vue';
import {i18n} from '/@/static/i18n';
import {getDict} from '/@/utils/dict.js';
import {isHideDict} from '/@/dict/menu';
import {initBackEndControlRoutes} from '/@/router/backEnd.js';
import {withTableLoading} from '/@/utils/commonFunction';

// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const MenuDialog = defineAsyncComponent(() => import('/@/views/system/menu/component/dialog.vue'));
import AuthButton from '/@/components/authButton/index.vue';

const api = menuApi();
// 定义变量内容
const tableRef = ref();
const menuDialogRef = ref();
const state = reactive({
  tableData: {
    // 列表数据（必传）
    data: [],
    // 表头内容（必传，注意格式）
    header: [
      {key: 'id', colWidth: '200', title: 'ID', type: 'text', isCheck: true},
      {key: 'pid', colWidth: '90', title: '父级id', type: 'text', isCheck: true},
      {
        key: 'type', colWidth: '80', title: '类型', isCheck: true,
        render: (scope) => (scope.row?.type === 2 ? '功能' : '菜单'),
      },
      {
        key: 'meta.title', colWidth: '140', title: '名称', isCheck: true,
        render: (scope) => {
          // 功能节点取按钮label；菜单节点优先transKey其次title
          if (scope.row?.type === 2) {
            const al = scope.row?.menuAction; return al?.transKey ? i18n.global.t(al.transKey) : (al?.label || scope.row?.name || '');
          }
          const tk = scope.row?.meta?.transKey;
          return i18n.global.t(tk || scope.row?.meta?.title || '');
        },
        search: {type: 'input', prop: 'meta.title', isSearch: true},
      },
      {
        key: 'sort', colWidth: '90', title: '排序', isCheck: true,
      },
      {
        key: 'meta.icon', colWidth: '100', title: '菜单图标', isCheck: true,
        render: (scope) => {
          if (!scope.row?.meta?.icon) return '';
          return h(SvgIcon, {
            name: scope.row?.meta?.icon,
          });
        },
      },
      {
        key: 'meta.path', colWidth: '120', title: '路由路径', isCheck: true,
        render: (scope) => scope.row?.meta?.path || '',
        search: {type: 'input', prop: 'meta.path', isSearch: true},
      },
      {key: 'name', colWidth: '150', title: '路由|权限标识', type: 'text', isCheck: true, search: {type: 'input', isSearch: true}},
      {
        key: 'meta.redirect', colWidth: '120', title: '重定向', isCheck: true,
        render: (scope) => scope.row?.meta?.redirect || '',
      },
      {
        key: 'isLink', colWidth: '90', title: '是否外链', isCheck: true,
        render: (scope) => (scope.row?.meta?.isLink ? '是' : '否'),
      },
      {
        key: 'meta.component', colWidth: '140', title: '组件路径', isCheck: true,
        render: (scope) => scope.row?.meta?.component || '',
      },
      {
        key: 'meta.isLink', colWidth: '120', title: '链接地址', isCheck: true,
        render: (scope) => scope.row?.meta?.isLink || '',
      },
      {
        key: 'meta.isHide', colWidth: '90', title: '是否隐藏', isCheck: true,
        render: (scope) => {
          if (scope.row?.type === 2) return '';
          return getDict(isHideDict, scope.row?.meta?.isHide);
        },
        search: {type: 'select', prop: 'meta.isHide', options: [{label: '隐藏', value: 1}, {label: '不隐藏', value: 2}], isSearch: true},
      },
      {key: 'roleMenus', colWidth: '120', title: '角色', isCheck: true,
        render: (scope) => {
          return scope.row?.roleMenus?.length > 0 ? scope.row?.roleMenus.map(item => item.name).join(',') : '';
        }
      },
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
      operationWith: 220, // 固定操作列宽度
      notPage: true, // 是否不分页
    },
    // 搜索参数、搜索时传给后台的值,`getTableData` 中使用）
    param: {},
    // 打印标题
    printName: 'ginBaseAdmin 表格打印演示',
  },
});
// 打开新增弹窗（row 存在时预置为其子级）
const onOpenAddMenu = (type, row) => {
  menuDialogRef.value.openDialog(type, row);
};
// 打开编辑弹窗
const onOpenEditMenu = (type, row) => {
  menuDialogRef.value.openDialog(type, row);
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
  await initBackEndControlRoutes();
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

    // 树形菜单展开后行数较多，容器高度固定且 overflow:hidden，会裁剪下方内容。
    // 让表格容器占满剩余高度并纵向滚动，保证展开后能滚动查看全部行。
    :deep(.table-container) {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
  }
}
</style>