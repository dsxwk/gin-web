<template>
	<div class="system-menu-dialog-container">
		<el-dialog :title="state.dialog.title" v-if="state.dialog.isShowDialog" v-model="state.dialog.isShowDialog" width="769px">
      <ConfigForm
          ref="dialogFormRef"
          v-model:model="state.ruleForm"
          :form-config="formData"
          :rules="rules"
          :form-props="{
            labelWidth: '90px',
            size: 'default'
          }"
      >
      </ConfigForm>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup name="systemMenuDialog">
import {computed, markRaw, nextTick, onMounted, reactive, ref} from 'vue';
import {i18n} from '/@/static/i18n';
import {ElMessage} from 'element-plus';
import {menuApi} from '/@/api/menu';
import {initBackEndControlRoutes} from '/@/router/backEnd.js';
import ConfigForm from '/@/components/form/index.vue';
import CascaderLabel from '/@/components/form/CascaderLabel.vue';
import {
  menuTypeDict,
  isAffixDict,
  isHideDict,
  isIframeDict,
  isKeepAliveDict,
  isLinkDict,
  actionTypeDict,
  btnTypeDict,
  btnStyleDict,
  btnSizeDict,
  isConfirmDict,
} from '/@/dict/menu';

const props = defineProps({
  // 统一权限树数据（菜单 + 功能），用于「上级」级联
  menuData: {
    type: Array,
    default: () => []
  }
});

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

const api = menuApi();

// 定义变量内容
const dialogFormRef = ref();
const state = reactive({
  roles: [],
  currentId: 0, // 编辑中的节点 id
  ruleForm: buildEmptyForm(),
  menuData: [], // 上级级联数据（含 title 展示名）
  dialog: {
    isShowDialog: false,
    type: '',
    title: '',
    submitTxt: '',
  },
});

// 空表单（新增/重置）
function buildEmptyForm() {
  return {
    superior: [], // 上级（级联路径）
    type: 1, // 节点类型 1=菜单 2=功能
    name: '', // 菜单：路由 name（功能提交时自动取权限标识）
    sort: 0, // 排序
    status: 1, // 状态 1=启用 2=禁用
    roles: [], // 角色（→ roleMenus）
    // 菜单(type=1)字段
    meta: {
      title: '', // 菜单名称（i18n key）
      transKey: '', // 翻译键（非必传）
      icon: '', // 菜单图标
      path: '', // 路由路径
      redirect: '', // 路由重定向
      component: '', // 组件路径
      isHide: 2, // 是否隐藏 1=隐藏 2=不隐藏
      isKeepAlive: 1, // 是否缓存 1=缓存 2=不缓存
      isAffix: 2, // 是否固定 1=固定 2=不固定
      isLink: '', // 外链/内嵌链接地址
      isIframe: 2, // 是否内嵌 1=是 2=否
    },
    isLink: 2, // 是否外链 1=是 2=否（由链接地址派生）
    // 功能(type=2)字段
    action: {
      label: '', // 功能名称
      transKey: '', // 翻译键（非必传）
      authValue: '', // 权限标识
      type: 2, // 按钮位置 1=header 2=operation
      btnType: 'btn', // 按钮类型
      btnStyle: 'primary', // 按钮样式
      btnSize: 'default', // 按钮尺寸
      isConfirm: 2, // 是否确认 1=是 2=否
      isLink: 2, // 是否为链接 1=是 2=否
    },
  };
}

// 是否内嵌下拉改变：内嵌时视为外链
const onSelectIframeChange = () => {
  state.ruleForm.isLink = state.ruleForm.meta.isIframe === 1 ? 1 : 2;
};

// 表单配置：按 type 切换「菜单/功能」字段的显示（字段集合恒定，仅切换 hidden）
const formData = computed(() => {
  const isMenu = state.ruleForm.type === 1;
  const isAction = state.ruleForm.type === 2;
  return [
    // 公共字段
    {
      label: '类型',
      prop: 'type',
      type: 'select',
      col: 12,
      options: menuTypeDict,
      attrs: {placeholder: '请选择类型', class: 'w100'},
      rules: [{required: true, message: '请选择类型', trigger: 'change'}],
    },
    {
      label: '角色', prop: 'roles', type: 'select', col: 12,
      options: () => Array.isArray(state?.roles) ? state.roles.map(role => ({label: role.name, value: role.id})) : [],
      attrs: {placeholder: '请选择角色', multiple: true, clearable: true, class: 'w100'},
    },
    {
      label: '上级',
      prop: 'superior',
      type: 'cascader',
      col: 12,
      options: () => state.menuData,
      props: {
        checkStrictly: true,
        value: 'id',
        label: 'title',
      },
      attrs: {
        placeholder: '请选择上级（不选=顶级）',
        clearable: true,
        class: 'w100',
      },
      slotDefault: markRaw(CascaderLabel),
    },
    // 菜单(type=1)字段
    {
      label: '菜单名称', prop: 'meta.title', type: 'input', col: 12, hidden: !isMenu,
      attrs: {placeholder: '格式：message.router.xxx', clearable: true},
      rules: [{required: true, message: '请输入菜单名称', trigger: 'blur'}],
    },
    {
      label: '翻译键',
      prop: 'meta.transKey',
      type: 'input',
      col: 12,
      hidden: !isMenu,
      attrs: {placeholder: '非必填，空则使用菜单名称', clearable: true, class: 'w100'},
    },
    {
      label: '路由名称', prop: 'name', type: 'input', col: 12, hidden: !isMenu,
      attrs: {placeholder: '路由中的 name 值', clearable: true},
      rules: [{required: true, message: '请输入路由名称', trigger: 'blur'}],
    },
    {
      label: '路由路径', prop: 'meta.path', type: 'input', col: 12, hidden: !isMenu,
      attrs: {placeholder: '路由中的 path 值', clearable: true},
      rules: [{required: true, message: '请输入路由路径', trigger: 'blur'}],
    },
    {
      label: '重定向', prop: 'meta.redirect', type: 'input', col: 12, hidden: !isMenu,
      attrs: {placeholder: '请输入路由重定向', clearable: true},
    },
    {
      label: '菜单图标', prop: 'meta.icon', type: 'icon', col: 12, hidden: !isMenu,
      attrs: {placeholder: '请选择菜单图标'},
    },
    {
      label: '组件路径', prop: 'meta.component', type: 'input', col: 12, hidden: !isMenu,
      attrs: {placeholder: '请输入组件路径', clearable: true},
      rules: [{required: true, message: '请输入组件路径', trigger: 'blur'}],
    },
    {
      label: '链接地址', prop: 'meta.isLink', type: 'input', col: 12, hidden: !isMenu,
      attrs: () => ({
        placeholder: '外链/内嵌时链接地址（http://xxx.com）',
        clearable: true,
        disabled: state.ruleForm.isLink !== 1 && state.ruleForm.meta.isIframe !== 1,
      }),
    },
    {
      label: '是否隐藏', prop: 'meta.isHide', type: 'radio', col: 12, hidden: !isMenu,
      options: isHideDict,
    },
    {
      label: '页面缓存', prop: 'meta.isKeepAlive', type: 'radio', col: 12, hidden: !isMenu,
      options: isKeepAliveDict,
    },
    {
      label: '是否固定', prop: 'meta.isAffix', type: 'radio', col: 12, hidden: !isMenu,
      options: isAffixDict,
    },
    {
      label: '是否外链', prop: 'isLink', type: 'radio', col: 12, hidden: !isMenu,
      attrs: {disabled: state.ruleForm.meta.isIframe === 1},
      options: isLinkDict,
    },
    {
      label: '是否内嵌', prop: 'meta.isIframe', type: 'radio', col: 12, hidden: !isMenu,
      events: {change: onSelectIframeChange},
      options: isIframeDict,
    },
    // 功能(type=2)字段
    {
      label: '功能名称', prop: 'action.label', type: 'input', col: 12, hidden: !isAction,
      attrs: {placeholder: '请输入功能名称', clearable: true},
      rules: [{required: true, message: '请输入功能名称', trigger: 'blur'}],
    },
    {
      label: '翻译键',
      prop: 'action.transKey',
      type: 'input',
      col: 12,
      hidden: !isAction,
      attrs: {placeholder: '非必填，空则使用功能名称', clearable: true, class: 'w100'},
    },
    {
      label: '权限标识', prop: 'action.authValue', type: 'input', col: 12, hidden: !isAction,
      attrs: {placeholder: '如 sys.menu.add', clearable: true},
      rules: [{required: true, message: '请输入权限标识', trigger: 'blur'}],
    },
    {
      label: '按钮位置', prop: 'action.type', type: 'select', col: 12, hidden: !isAction,
      options: actionTypeDict,
      attrs: {placeholder: '请选择按钮位置', clearable: true, class: 'w100'},
    },
    {
      label: '按钮类型', prop: 'action.btnType', type: 'select', col: 12, hidden: !isAction,
      options: btnTypeDict,
      attrs: {placeholder: '请选择按钮类型', clearable: true, class: 'w100'},
    },
    {
      label: '按钮样式', prop: 'action.btnStyle', type: 'select', col: 12, hidden: !isAction,
      options: btnStyleDict,
      attrs: {placeholder: '请选择按钮样式', clearable: true, class: 'w100'},
    },
    {
      label: '按钮尺寸', prop: 'action.btnSize', type: 'select', col: 12, hidden: !isAction,
      options: btnSizeDict,
      attrs: {placeholder: '请选择按钮尺寸', clearable: true, class: 'w100'},
    },
    {
      label: '是否确认', prop: 'action.isConfirm', type: 'select', col: 12, hidden: !isAction,
      options: isConfirmDict,
      attrs: {placeholder: '请选择是否确认', clearable: true, class: 'w100'},
    },
    {
      label: '是否为链接', prop: 'action.isLink', type: 'radio', col: 12, hidden: !isAction,
      options: isLinkDict,
    },
    {
      label: '排序', prop: 'sort', type: 'inputNumber', col: 12,
      attrs: {controlsPosition: 'right', class: 'w100'},
    },
  ];
});

const rules = {};

// 由统一权限树构建级联树（含展示名 title，兼容菜单/功能），并可排除某节点子树
const buildMenuTree = (list, excludeId) => {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item.id !== excludeId)
    .map((item) => {
      const title = item.type === 2
        ? (item.menuAction?.label || item.name || '')
        : (i18n.global.t(item.meta?.title || '') || item.name || '');
      const node = {...item, title};
      const children = buildMenuTree(item.children, excludeId);
      if (children.length) node.children = children;
      else delete node.children;
      return node;
    });
};

// 递归查找从根到目标节点的 id 路径
function findMenuPathById(data, targetId, pathArr = []) {
  for (const item of data) {
    const newPathArr = [...pathArr, item.id];
    if (item.id === targetId) return newPathArr;
    if (item.children && item.children.length) {
      const found = findMenuPathById(item.children, targetId, newPathArr);
      if (Array.isArray(found) && found.length) return found;
    }
  }
  return [];
}

// 在统一权限树中按 id 查找节点
function findNodeById(list, id) {
  for (const item of (Array.isArray(list) ? list : [])) {
    if (item.id === id) return item;
    const found = item.children && findNodeById(item.children, id);
    if (found) return found;
  }
  return null;
}

// 功能所属页面菜单 id：从上级路径向上取最近的菜单(type=1)祖先
// 功能可嵌套在功能之下，其承载页面是最近的那个菜单节点
function findOwnerMenuId(superiorPath) {
  for (let i = (superiorPath?.length || 0) - 1; i >= 0; i--) {
    const node = findNodeById(props.menuData, superiorPath[i]);
    if (node && node.type === 1) return node.id;
  }
  return 0;
}

// 打开弹窗
const openDialog = async (type, row) => {
  if (!state.roles || state.roles.length === 0) {
    await getRoles();
  }
  const excludeId = type === 'edit' ? row?.id : undefined;
  // 每次打开都基于最新树构建级联（编辑时排除自身子树，避免选自己/子孙为父级）
  state.menuData = buildMenuTree(props.menuData, excludeId);

  state.ruleForm = buildEmptyForm();
  state.currentId = 0;

  if (type === 'edit') {
    if (!row?.id) {
      ElMessage.error('数据无效');
      return;
    }
    try {
      const data = await detail(row.id);
      state.currentId = row.id;
      state.ruleForm.type = data.type ?? 1;
      state.ruleForm.name = data.name ?? '';
      state.ruleForm.sort = data.sort ?? 0;
      state.ruleForm.status = data.status ?? 1;
      // 角色（roleMenus）回填为 roleId 数组
      state.ruleForm.roles = Array.isArray(data.roleMenus)
        ? data.roleMenus.map((r) => r.roleId ?? r.id).filter((v) => v != null)
        : [];
      // 上级级联路径
      state.ruleForm.superior = data.pid ? findMenuPathById(state.menuData, data.pid) : [];

      if (data.type === 2) {
        const a = (Array.isArray(data.menuActions) ? data.menuActions[0] : data.menuAction) || {};
        state.ruleForm.action = {
          label: a.label ?? '',
          transKey: a.transKey ?? '',
          authValue: a.authValue ?? data.name ?? '',
          type: a.type ?? 2,
          btnType: a.btnType ?? 'btn',
          btnStyle: a.btnStyle ?? 'primary',
          btnSize: a.btnSize ?? 'default',
          isConfirm: a.isConfirm ?? 2,
          isLink: a.isLink ?? 2,
        };
      } else {
        const m = data.meta || {};
        state.ruleForm.meta = {
          title: m.title ?? '',
          transKey: m.transKey ?? '',
          icon: m.icon ?? '',
          path: m.path ?? '',
          redirect: m.redirect ?? '',
          component: m.component ?? '',
          isHide: m.isHide ?? 2,
          isKeepAlive: m.isKeepAlive ?? 1,
          isAffix: m.isAffix ?? 2,
          isLink: m.isLink ?? '',
          isIframe: m.isIframe ?? 2,
        };
        state.ruleForm.isLink = state.ruleForm.meta.isLink ? 1 : 2;
      }
      state.dialog.title = '修改';
      state.dialog.submitTxt = '修 改';
    } catch (e) {
      ElMessage.error('获取详情失败');
      return;
    }
  } else {
    // 新增：可从父行预置上级
    if (row?.id) state.ruleForm.superior = findMenuPathById(state.menuData, row.id);
    state.dialog.title = '新增';
    state.dialog.submitTxt = '新 增';
  }
  state.dialog.type = type;
  state.dialog.isShowDialog = true;
  await nextTick(() => {
    dialogFormRef.value && dialogFormRef.value.resetFields();
  });
};

// 关闭弹窗
const closeDialog = () => {
  state.dialog.isShowDialog = false;
};
const onCancel = () => {
  closeDialog();
};

// 提交（统一走 /menu）
const onSubmit = async () => {
  dialogFormRef.value.validate(async (valid) => {
    if (!valid) return;

    const form = state.ruleForm;
    const submitData = {
      type: form.type,
      sort: parseInt(form.sort) || 0,
      status: form.status ?? 1,
    };

    // 上级 pid（级联最后一级；空=顶级）
    submitData.pid = form.superior && form.superior.length ? form.superior[form.superior.length - 1] : 0;
    // 当前节点 id：新增时为 0（由后端回填），编辑时取自身 id；供 roleMenus / menuActions 关联
    const currentMenuId = state.dialog.type === 'edit' ? state.currentId : 0;
    submitData.roleMenus = (form.roles || []).map((roleId) => {
      const role = state.roles.find((r) => r.id === roleId);
      return {roleId, menuId: currentMenuId, name: role ? role.name : ''};
    });

    if (form.type === 2) {
      // 功能：name 取权限标识，按钮属性放 menuAction（后端改为一对一）
      submitData.name = form.action.authValue;
      // 顶层 menuId：功能所属的页面菜单（最近的菜单祖先），供后端关联 menu_action
      submitData.menuId = findOwnerMenuId(form.superior);
      submitData.menuAction = {
        menuId: currentMenuId,
        label: form.action.label,
        transKey: form.action.transKey || '',
        authValue: form.action.authValue,
        type: form.action.type,
        btnType: form.action.btnType,
        btnStyle: form.action.btnStyle,
        btnSize: form.action.btnSize,
        isConfirm: form.action.isConfirm === 1 ? 1 : 2,
        isLink: form.action.isLink === 1 ? 1 : 2,
      };
    } else {
      // 菜单：属性放 meta
      submitData.name = form.name;
      submitData.isLink = form.isLink === 1 ? 1 : 2;
      submitData.meta = {
        title: form.meta.title,
        transKey: form.meta.transKey || '',
        icon: form.meta.icon,
        path: form.meta.path,
        redirect: form.meta.redirect,
        component: form.meta.component,
        isHide: form.meta.isHide === 1 ? 1 : 2,
        isKeepAlive: form.meta.isKeepAlive === 1 ? 1 : 2,
        isAffix: form.meta.isAffix === 1 ? 1 : 2,
        isLink: form.meta.isLink,
        isIframe: form.meta.isIframe === 1 ? 1 : 2,
      };
    }

    let msg = '';
    if (state.dialog.type === 'add') {
      await api.create(submitData);
      msg = '创建成功';
    } else {
      submitData.id = state.currentId;
      await api.update(submitData);
      msg = '更新成功';
    }
    ElMessage.success(msg);
    closeDialog();
    emit('refresh');
    await initBackEndControlRoutes();
  });
};

// 获取角色
const getRoles = async () => {
  const data = await api.roleList({page: 1, pageSize: 10, notPage: false});
  state.roles = data.data?.list || [];
};
// 详情（菜单/功能统一 /menu/:id）
const detail = async (id) => {
  const res = await api.detail({id});
  return res.data;
};
// 页面加载时
onMounted(() => {
  getRoles();
  state.menuData = buildMenuTree(props.menuData);
});
// 暴露变量
defineExpose({
  openDialog,
});
</script>
