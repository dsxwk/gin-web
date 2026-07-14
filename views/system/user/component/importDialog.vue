<template>
  <div class="user-import-dialog">
    <el-dialog
        title="用户导入"
        v-if="state.isShowDialog"
        v-model="state.isShowDialog"
        width="1000px"
    >
      <div class="import-toolbar">
        <el-button size="default" v-auth="'sys.user.import'" type="info" plain @click="openRecords">
          <el-icon>
            <ele-Document/>
          </el-icon>
          导入记录
        </el-button>
        <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="onFileChange"
        >
          <el-button size="default" v-auth="'sys.user.import'" type="primary">
            <el-icon>
              <ele-Upload/>
            </el-icon>
            选择Excel文件
          </el-button>
        </el-upload>
        <el-button size="default" v-auth="'sys.user.import'" type="success" plain @click="downloadTemplate">
          <el-icon>
            <ele-Download/>
          </el-icon>
          下载模板
        </el-button>
      </div>

      <el-table :data="state.rows" border max-height="420" style="width: 100%">
        <el-table-column type="index" label="序号" width="100" align="center"/>
        <el-table-column
            v-for="col in columns"
            :key="col.key"
            :label="col.label"
            :min-width="col.width || 120"
        >
          <template #default="{row}">
            <template v-if="row._editing">
              <el-select v-if="col.type === 'select'" v-model="row[col.key]" size="small" class="w100">
                <el-option v-for="o in col.dict" :key="o.value" :label="o.label" :value="o.value"/>
              </el-select>
              <el-input-number
                  v-else-if="col.type === 'number'"
                  v-model="row[col.key]"
                  :min="0"
                  size="small"
                  controls-position="right"
                  class="w100"
              />
              <el-input v-else v-model="row[col.key]" size="small"/>
            </template>
            <template v-else>
              <span v-if="col.type === 'select'">{{ getDict(col.dict, row[col.key]) }}</span>
              <span v-else>{{ row[col.key] }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right" align="center">
          <template #default="{row, $index}">
            <template v-if="row._editing">
              <el-button v-auth="'sys.user.import'" size="small" type="success" @click="onRowSave(row)">保存</el-button>
              <el-button v-auth="'sys.user.import'" size="small" @click="onRowCancel(row)">取消</el-button>
            </template>
            <template v-else>
              <el-button v-auth="'sys.user.import'" size="small" type="primary" @click="onRowEdit(row)">编辑</el-button>
              <el-button v-auth="'sys.user.import'" size="small" type="danger" @click="onRowDelete($index)">删除</el-button>
            </template>
          </template>
        </el-table-column>
        <template #empty>暂无数据,请先选择Excel文件</template>
      </el-table>

      <template #footer>
        <span class="dialog-footer">
          <el-button v-auth="'sys.user.import'" size="default" @click="onCancel">取 消</el-button>
          <el-button v-auth="'sys.user.import'" size="default" type="primary" :loading="state.submitting" @click="onSubmit">导 入</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog title="导入记录" v-model="state.recordsVisible" width="900px" append-to-body>
      <el-table :data="state.records" border max-height="420" style="width: 100%">
        <el-table-column type="index" label="序号" width="80" align="center"/>
        <el-table-column prop="fileName" label="文件名" min-width="180"/>
        <el-table-column prop="total" label="总数" width="90" align="center"/>
        <el-table-column prop="success" label="成功" width="90" align="center"/>
        <el-table-column prop="fail" label="失败" width="90" align="center"/>
        <el-table-column prop="operator" label="创建人" width="120"/>
        <el-table-column prop="createdAt" label="导入时间" min-width="170"/>
        <template #empty>暂无导入记录(接口待接入)</template>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="systemUserImportDialog">
import {reactive} from 'vue';
import {ElMessage} from 'element-plus';
import * as XLSX from 'xlsx';
import {userApi} from '/@/api/user';
import {genderDict, statusDict} from '/@/dict/user';
import {getDict} from '/@/utils/dict.js';
import AuthButton from '/@/components/authButton/index.vue';

const emit = defineEmits(['refresh']);
const api = userApi();

// 列定义：key 提交字段，label Excel 表头/展示名
const columns = [
  {key: 'username', label: '用户名', type: 'input', width: 120},
  {key: 'password', label: '密码', type: 'input', width: 120},
  {key: 'fullName', label: '姓名', type: 'input', width: 100},
  {key: 'nickname', label: '昵称', type: 'input', width: 100},
  {key: 'email', label: '邮箱', type: 'input', width: 180},
  {key: 'gender', label: '性别', type: 'select', dict: genderDict, width: 90, default: 1},
  {key: 'age', label: '年龄', type: 'number', width: 100},
  {key: 'status', label: '状态', type: 'select', dict: statusDict, width: 90, default: 1},
];

const state = reactive({
  isShowDialog: false,
  submitting: false,
  rows: [],
  recordsVisible: false,
  records: [],
});

// 中文/数字统一转换为字典 value
const toDictValue = (dict, raw, def) => {
  const s = String(raw ?? '').trim();
  if (s === '') return def;
  const byLabel = dict.find((d) => d.label === s);
  if (byLabel) return byLabel.value;
  const byValue = dict.find((d) => String(d.value) === s);
  if (byValue) return byValue.value;
  return def;
};

// 单行 Excel 数据映射为提交对象
const mapRow = (raw) => {
  const obj = {};
  columns.forEach((col) => {
    const v = raw[col.label];
    if (col.type === 'select') {
      obj[col.key] = toDictValue(col.dict, v, col.default);
    } else if (col.type === 'number') {
      obj[col.key] = v === '' || v === null || v === undefined ? 0 : Number(v) || 0;
    } else {
      obj[col.key] = v === null || v === undefined ? '' : String(v).trim();
    }
  });
  obj._editing = false;
  return obj;
};

// 跳过全空行
const hasAnyValue = (row) => columns.some((col) => {
  if (col.type === 'select') return false;
  return String(row[col.key] ?? '').trim() !== '';
});

// 选择文件后解析
const onFileChange = (uploadFile) => {
  const file = uploadFile.raw;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, {type: 'array'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, {defval: ''});
      state.rows = json.map(mapRow).filter(hasAnyValue);
      if (!state.rows.length) ElMessage.warning('未解析到有效数据，请检查是否使用了下载的模板');
    } catch (err) {
      ElMessage.error('文件解析失败，请使用下载的模板');
    }
  };
  reader.readAsArrayBuffer(file);
};

// 下载模板：public/templates 下静态文件，兼容不同 base
const downloadTemplate = () => {
  let base = import.meta.env.BASE_URL || '/';
  if (base.startsWith('.')) base = base.slice(1);
  if (!base.endsWith('/')) base += '/';
  const a = document.createElement('a');
  a.href = `${base}templates/user_import_template.xlsx`;
  a.download = '用户导入模板.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// 行内编辑
const onRowEdit = (row) => {
  row._backup = {...row};
  row._editing = true;
};
const onRowSave = (row) => {
  row._editing = false;
  delete row._backup;
};
const onRowCancel = (row) => {
  const backup = row._backup;
  delete row._backup;
  Object.assign(row, backup);
  row._editing = false;
};
const onRowDelete = (index) => {
  state.rows.splice(index, 1);
};

// 打开弹窗
const openDialog = () => {
  state.rows = [];
  state.submitting = false;
  state.isShowDialog = true;
};

// 打开导入记录（接口待接入，先占位）
const openRecords = () => {
  state.records = [];
  state.recordsVisible = true;
};
const closeDialog = () => {
  state.isShowDialog = false;
};
const onCancel = () => {
  closeDialog();
};

// 提交导入
const onSubmit = async () => {
  if (!state.rows.length) return ElMessage.warning('请先选择文件并解析数据');
  const data = state.rows.map((r) => {
    const {_editing, _backup, ...rest} = r;
    return rest;
  });
  state.submitting = true;
  try {
    await api.import({data});
    ElMessage.success('导入成功');
    closeDialog();
    emit('refresh');
  } finally {
    state.submitting = false;
  }
};

defineExpose({openDialog});
</script>

<style scoped lang="scss">
.import-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
}

:deep(.w100) {
  width: 100%;
}
</style>
