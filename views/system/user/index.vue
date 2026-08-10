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
            <AuthButton auth="sys.user.add" @click="onOpenAddUser('add')"/>
            <AuthButton auth="sys.user.import" @click="onOpenImport"/>
            <AuthButton auth="sys.user.batchDel" @click="batchDelete"/>
          </div>
        </template>
        <template #operation="{row}">
          <div class="flex items-center">
            <AuthButton auth="sys.user.edit" :disabled="row.id === 1" @click="onOpenEditUser('edit', row)"/>
            <AuthButton auth="sys.user.password" :disabled="row.id === 1" @click="onOpenPassword(row)"/>
            <el-popconfirm title="确定删除吗？" @confirm="onTableDelRow(row)">
              <template #reference>
                <AuthButton auth="sys.user.del" :disabled="row.id === 1"/>
              </template>
            </el-popconfirm>
          </div>
        </template>
        <template #dialog>
          <UserDialog ref="userDialogRef" @refresh="getTableData(state.tableData.param)" :row="listRow"/>
          <UserImportDialog ref="userImportDialogRef" @refresh="getTableData(state.tableData.param)"/>
          <el-dialog title="修改密码" v-model="state.passwordDialog.isShow" width="400px">
            <el-form ref="passwordFormRef" :model="state.passwordDialog.form" :rules="state.passwordDialog.rules" label-width="80px">
              <el-form-item label="新密码" prop="password">
                <el-input v-model="state.passwordDialog.form.password" type="password" placeholder="请输入新密码" show-password />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="state.passwordDialog.isShow = false" size="default">取 消</el-button>
              <el-button type="primary" @click="onSubmitPassword" size="default">确 定</el-button>
            </template>
          </el-dialog>
        </template>
      </Table>
    </div>
  </div>
</template>
<script setup name="systemUser">
import {defineAsyncComponent, reactive, ref, onMounted, h} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {userApi} from '/@/api/user';
import {genderDict, statusDict} from '/@/dict/user/index.js';
import {getDict} from '/@/utils/dict.js';
import {withTableLoading} from '/@/utils/commonFunction';

// 引入组件
const Table = defineAsyncComponent(() => import('/@/components/table/index.vue'));
const UserDialog = defineAsyncComponent(() => import('/@/views/system/user/component/dialog.vue'));
const UserImportDialog = defineAsyncComponent(() => import('/@/views/system/user/component/importDialog.vue'));
import AuthButton from '/@/components/authButton/index.vue';

const api = userApi();
// 定义变量内容
const tableRef = ref();
const userDialogRef = ref();
const userImportDialogRef = ref();
const passwordFormRef = ref();
const passwordRow = ref({});
const listRow = ref();
const state = reactive({
  tableData: {
    // 列表数据（必传）
    data: [],
    // 表头内容（必传，注意格式）
    header: [
      {key: 'id', colWidth: '', title: 'ID', type: 'text', isCheck: true},
      {key: 'fullName', colWidth: '100', title: '姓名', type: 'text', isCheck: true, search: {type: 'input', required: true, isSearch: true}},
      {key: 'avatar', colWidth: '100', title: '头像', type: 'image', isCheck: true},
      {key: 'username', colWidth: '100', title: '用户名', type: 'text', isCheck: true, search: {type: 'input', isSearch: true}},
      {key: 'email', colWidth: '100', title: '邮箱', type: 'text', isCheck: true},
      {key: 'password', colWidth: '100', title: '密码', type: 'text', isCheck: true},
      {key: 'nickname', colWidth: '100', title: '昵称', type: 'text', isCheck: true},
      {
        key: 'gender', colWidth: '100', title: '性别', type: 'text', isCheck: true,
        render: (scope) => {
          return getDict(genderDict, scope.row?.gender);
        },
        search: {type: 'select', options: genderDict, isSearch: true},
      },
      {key: 'age', colWidth: '100', width: '70', height: '40', title: '年龄', type: 'text', isCheck: true},
      {key: 'status', colWidth: '100', width: '70', height: '40', title: '状态', isCheck: true,
        render: (scope) => {
          return getDict(statusDict, scope.row?.status);
        }
      },
      {key: 'userRoles', colWidth: '100', width: '70', height: '40', title: '用户角色', isCheck: true,
        render: (scope) => {
          return scope.row?.userRoles?.length > 0 ? scope.row?.userRoles.map(item => item.name).join(',') : '';
        }
      },
      {key: 'mainDept', colWidth: '120', title: '主部门', isCheck: true,
        render: (scope) => scope.row?.mainDept?.department?.name || scope.row?.mainDeptName || '',
      },
      {key: 'userDepts', colWidth: '150', title: '用户部门', isCheck: true,
        render: (scope) => {
          const depts = scope.row?.userDepts || [];
          if (depts.length === 0) return '';
          return depts.map((d) => d.department?.name || d.departmentName || '').filter(Boolean).join(',');
        },
      },
      {key: 'createdAt', colWidth: '120', title: '创建时间', type: 'text', isCheck: true, search: {type: 'daterange', rangeProp: ['createdAtStart', 'createdAtEnd'], isSearch: true}},
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
    printName: 'ginBaseAdmin 表格打印演示',
    selectList: [], // 选中列
  },
  passwordDialog: {
    isShow: false,
    form: {
      password: '',
    },
    rules: {
      password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },
      ],
    },
  },
});
const onOpenAddUser = (type) => {
  userDialogRef.value.openDialog(type);
};
const onOpenEditUser = (type, row) => {
  listRow.value = row;
  userDialogRef.value.openDialog(type, row);
};
// 打开导入弹窗
const onOpenImport = () => {
  userImportDialogRef.value.openDialog();
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
// 打开修改密码弹窗
const onOpenPassword = (row) => {
  passwordRow.value = row;
  state.passwordDialog.form.password = '';
  state.passwordDialog.isShow = true;
};
// 提交修改密码
const onSubmitPassword = async () => {
  if (!passwordFormRef.value) return;
  try {
    await passwordFormRef.value.validate();
  } catch {
    return;
  }
  try {
    await api.password({ id: passwordRow.value.id, password: state.passwordDialog.form.password });
    ElMessage.success('密码修改成功');
    state.passwordDialog.isShow = false;
  } catch (e) {
    ElMessage.error('密码修改失败');
  }
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