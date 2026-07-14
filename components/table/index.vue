<template>
	<div class="table-container layout-pd">
    <TableSearch ref="tableSearchRef" :search="searchList" :custom-search="customSearch" @search="onSearch" class="table-search-box" />
    <div class="flex items-center table-toolbar" style="justify-content: space-between;">
      <div class="table-tools-bar" v-if="slots.tools">
        <slot name="tools"></slot>
      </div>
      <div class="table-header-right-tool">
        <SvgIcon v-if="config.isPrintTool" name="iconfont icon-dayin" :size="19" title="打印" @click="onPrintTable" />
        <SvgIcon v-if="config.isExcelTool" name="iconfont icon-yunxiazai_o" :size="22" title="导出" @click="onImportTable" />
        <SvgIcon v-if="config.isRefresh" name="iconfont icon-shuaxin" :size="22" title="刷新" @click="onRefreshTable" />
        <el-popover
            placement="top-end"
            trigger="click"
            transition="el-zoom-in-top"
            popper-class="table-tool-popper"
            :width="600"
            :persistent="false"
            @show="onSetTable"
        >
          <template #reference>
            <SvgIcon name="iconfont icon-quanjushezhi_o" :size="22" title="设置" />
          </template>
          <template #default>
            <div class="tool-box">
            <div class="tool-box-left">
              <el-tooltip content="拖动进行排序" placement="top-start">
                <SvgIcon name="fa fa-question-circle-o" :size="17" class="ml11" color="#909399" />
              </el-tooltip>
              <el-checkbox
                  v-model="state.checkListAll"
                  :indeterminate="state.checkListIndeterminate"
                  class="ml10 mr1"
                  label="列显示"
                  @change="onCheckAllChange"
              />
              <el-checkbox v-model="getConfig.isSerialNo" class="ml12 mr1" label="序号" />
              <el-checkbox v-model="getConfig.isSelection" class="ml12 mr1" label="多选" />
            </div>
            <div class="tool-box-right">
              <el-checkbox
                  v-model="state.checkSearchAll"
                  :indeterminate="state.checkSearchIndeterminate"
                  @change="onCheckSearchAllChange"
              >
                筛选项
              </el-checkbox>
            </div>
          </div>
            <div class="tool-content">
              <div class="tool-column">
                <el-scrollbar>
                  <div ref="toolSetRef" class="tool-sortable">
                    <template v-for="v in props.header" :key="v?.key">
                      <div class="tool-sortable-item" :data-key="v?.key" v-if="v">
                        <i class="fa fa-arrows-alt handle cursor-pointer"></i>
                        <el-checkbox v-model="v.isCheck" size="default" class="ml12 mr8" :label="v.title" @change="onCheckChange" />
                      </div>
                    </template>
                  </div>
                </el-scrollbar>
              </div>
              <div class="tool-divider"></div>
              <div class="tool-column">
                <el-scrollbar>
                  <div ref="toolSearchSetRef" class="tool-sortable">
                    <template v-for="v in props.header" :key="v?.key">
                      <div class="tool-sortable-item" :data-key="v?.key" v-if="v && v.search">
                        <i class="fa fa-arrows-alt handle cursor-pointer"></i>
                        <el-checkbox v-model="v.search.isSearch" size="default" class="ml12 mr8" :label="v.search.label || v.title" @change="onSearchCheckChange" />
                      </div>
                    </template>
                  </div>
                </el-scrollbar>
              </div>
            </div>
          </template>
        </el-popover>
      </div>
    </div>
		<el-table
			:data="data"
			:border="setBorder"
			v-bind="$attrs"
			row-key="id"
			stripe
			style="width: 100%"
			v-loading="config.loading"
			@selection-change="onSelectionChange"
		>
			<el-table-column type="selection" :reserve-selection="true" width="40" align="center" v-if="config.isSelection" />
			<el-table-column type="index" label="序号" width="60" v-if="config.isSerialNo" />
			<el-table-column
				v-for="(item, index) in setHeader"
				:key="index"
				show-overflow-tooltip
				:prop="item.key"
				:width="item.colWidth"
				:label="item.title"
			>
				<template v-slot="scope">
					<template v-if="item.type === 'image'">
						<el-image
              v-if="scope.row[item.key]"
							:style="{ width: `${item.width}px`, height: `${item.height}px` }"
							:src="scope.row[item.key]"
							:zoom-rate="1.2"
							:preview-src-list="[scope.row[item.key]]"
							preview-teleported
							fit="cover"
						/>
					</template>
          <template v-else-if="item.render">
            <component
                :is="item.render"
                v-bind="scope"
                v-if="item.render"
            >
            </component>
          </template>
				<template v-else>
					{{ scope.row[item.key] }}
				</template>
			</template>
			</el-table-column>
			<el-table-column label="操作" :width="config.operationWith" v-if="config.isOperate" :fixed="config.fixed">
				<template v-slot="scope">
          <slot name="operation" :row="scope.row" v-if="slots.operation">
            <el-popconfirm title="确定删除吗？" @confirm="onDelRow(scope.row)">
              <template #reference>
                <el-button text type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </slot>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无数据" />
			</template>
		</el-table>
		<div class="table-footer mt15" v-if="!config.notPage">
			<el-pagination
				v-model:current-page="state.page.page"
				v-model:page-size="state.page.pageSize"
				:pager-count="5"
				:page-sizes="[10, 50, 100, 200, 500, 1000]"
				:total="config.total"
				layout="total, sizes, prev, pager, next, jumper"
				background
				@size-change="onHandleSizeChange"
				@current-change="onHandleCurrentChange"
			>
			</el-pagination>
		</div>
    <div class="table-dialog" v-if="slots.dialog">
      <slot name="dialog"></slot>
    </div>
	</div>
</template>

<script setup name="netxTable">
import {reactive, computed, nextTick, ref, useSlots, watch} from 'vue';
import { ElMessage } from 'element-plus';
import printJs from 'print-js';
import table2excel from 'js-table2excel';
import Sortable from 'sortablejs';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import '/@/theme/tableTool.scss';
import TableSearch from './component/search.vue';

const slots = useSlots();
// 定义父组件传过来的值
const props = defineProps({
	// 列表内容
	data: {
		type: Array,
		default: () => [],
	},
	// 表头内容
	header: {
		type: Array,
		default: () => [],
	},
	// 配置项
	config: {
		type: Object,
		default: () => {},
	},
	// 打印标题
	printName: {
		type: String,
		default: () => '',
	},
	// 自定义搜索，默认与构建出来的搜索合并
	customSearch: {
		type: Object,
		default: () => null,
	},
});

// 从header中提取搜索配置
const searchList = computed(() => {
	return props.header
		.filter(item => item && item.search)
		.map(item => {
			const search = item.search;
			return {
				label: search.label || item.title,
				prop: search.prop || item.key,
				placeholder: search.placeholder || `请输入${search.label || item.title}`,
				required: search.required || false,
				type: search.type || 'input',
				options: search.options || [],
				rangeProp: search.rangeProp || [],
				// 搜索格式化相关配置
				operator: search.operator || '=',
				column: search.column || '',
				rangeOperator: search.rangeOperator || ['>=', '<='],
				isSearch: search.isSearch !== undefined ? search.isSearch : true,
				_searchKey: item.key,
				showShortcuts: search.showShortcuts,
			};
		});
});

// 定义子组件向父组件传值/事件
const emit = defineEmits(['delRow', 'pageChange', 'sortHeader', 'search']);

// 定义变量内容
const toolSetRef = ref();
const toolSearchSetRef = ref();
const tableSearchRef = ref();
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
const state = reactive({
	page: {
		page: 1,
		pageSize: 10,
	},
	selectList: [],
	checkListAll: true,
	checkListIndeterminate: false,
	checkSearchAll: false,
	checkSearchIndeterminate: false,
});
// 设置边框显示/隐藏
const setBorder = computed(() => {
	return !!props.config.isBorder;
});
// 获取父组件 配置项（必传）
const getConfig = computed(() => {
	return props.config;
});
// 设置 tool header 数据
const setHeader = computed(() => {
	return props.header.filter((v) => v && v.isCheck);
});
// tool 列显示全选改变时
const onCheckAllChange = (val) => {
	if (val) props.header.forEach((v) => { if (v) v.isCheck = true; });
	else props.header.forEach((v) => { if (v) v.isCheck = false; });
	state.checkListIndeterminate = false;
};
// tool 列显示当前项改变时
const onCheckChange = () => {
	syncCheckListState();
};
// tool 筛选项全选改变时
const onCheckSearchAllChange = (val) => {
	props.header.forEach((v) => {
		if (v && v.search) {
			v.search.isSearch = val;
		}
	});
	state.checkSearchIndeterminate = false;
};
// tool 筛选项当前项改变时
const onSearchCheckChange = () => {
	syncCheckSearchState();
};
// 同步列显示全选/半选状态
const syncCheckListState = () => {
	const list = props.header.filter((v) => v);
	const checked = list.filter((v) => v.isCheck).length;
	state.checkListAll = list.length > 0 && checked === list.length;
	state.checkListIndeterminate = checked > 0 && checked < list.length;
};
// 同步筛选项全选/半选状态
const syncCheckSearchState = () => {
	const searchHeader = props.header.filter((v) => v && v.search);
	const searchChecked = searchHeader.filter((v) => v.search.isSearch !== false).length;
	state.checkSearchAll = searchHeader.length > 0 && searchChecked === searchHeader.length;
	state.checkSearchIndeterminate = searchChecked > 0 && searchChecked < searchHeader.length;
};
// 初始化/header 变化时同步全选状态
watch(
	() => props.header,
	() => {
		syncCheckListState();
		syncCheckSearchState();
	},
	{ immediate: true, deep: true }
);
// 表格多选改变时，用于导出
const onSelectionChange = (val) => {
	state.selectList = val;
};
// 删除当前项
const onDelRow = (row) => {
	emit('delRow', row);
};
// 搜索
const onSearch = (params) => {
	emit('search', params);
};
// 分页改变
const onHandleSizeChange = (val) => {
	state.page.pageSize = val;
	emit('pageChange', state.page);
};
// 分页改变
const onHandleCurrentChange = (val) => {
	state.page.page = val;
	emit('pageChange', state.page);
};
// 搜索时，分页还原成默认
const pageReset = () => {
	state.page.page = 1;
	state.page.pageSize = 10;
	emit('pageChange', state.page);
};
// 打印
const onPrintTable = () => {
	// https://printjs.crabbly.com/#documentation
	// 自定义打印
	let tableTh = '';
	let tableTrTd = '';
	let tableTd = {};
	// 表头
	props.header.forEach((v) => {
		if (v) tableTh += `<th class="table-th">${v.title}</th>`;
	});
	// 表格内容
	props.data.forEach((val, key) => {
		if (!tableTd[key]) tableTd[key] = [];
		props.header.forEach((v) => {
			if (!v) return;
			if (v.type === 'text') {
				tableTd[key].push(`<td class="table-th table-center">${val[v.key]}</td>`);
			} else if (v.type === 'image') {
				tableTd[key].push(`<td class="table-th table-center"><img src="${val[v.key]}" style="width:${v.width}px;height:${v.height}px;"/></td>`);
			}
		});
		tableTrTd += `<tr>${tableTd[key].join('')}</tr>`;
	});
	// 打印
	printJs({
		printable: `<div style=display:flex;flex-direction:column;text-align:center><h3>${props.printName}</h3></div><table border=1 cellspacing=0><tr>${tableTh}${tableTrTd}</table>`,
		type: 'raw-html',
		css: ['//at.alicdn.com/t/c/font_2298093_rnp72ifj3ba.css', '//unpkg.com/element-plus/dist/index.css'],
		style: `@media print{.mb15{margin-bottom:15px;}.el-button--small i.iconfont{font-size: 12px !important;margin-right: 5px;}}; .table-th{word-break: break-all;white-space: pre-wrap;}.table-center{text-align: center;}`,
	});
};
// 导出
const onImportTable = () => {
	if (state.selectList.length <= 0) return ElMessage.warning('请先选择要导出的数据');
	table2excel(props.header, state.selectList, `${themeConfig.value.globalTitle} ${new Date().toLocaleString()}`);
};
// 刷新
const onRefreshTable = () => {
	emit('pageChange', state.page);
};
// 设置
const onSetTable = () => {
	nextTick(() => {
		Sortable.create(toolSetRef.value, {
			handle: '.handle',
			dataIdAttr: 'data-key',
			animation: 150,
			onEnd: (evt) => {
				const headerList = [];
				evt.to.querySelectorAll('[data-key]').forEach((val) => {
					props.header.forEach((v) => {
						if (v && v.key === val.getAttribute('data-key')) headerList.push({ ...v });
					});
				});
				emit('sortHeader', headerList);
			},
		});
		if (toolSearchSetRef.value) {
			Sortable.create(toolSearchSetRef.value, {
				handle: '.handle',
				dataIdAttr: 'data-key',
				animation: 150,
				onEnd: (evt) => {
					const searchKeys = [];
					evt.to.querySelectorAll('[data-key]').forEach((val) => {
						searchKeys.push(val.getAttribute('data-key'));
					});
					const newHeader = [];
					const searchItems = [];
					props.header.forEach((v) => {
						if (v && v.search) {
							searchItems.push(v);
						} else if (v) {
							newHeader.push(v);
						}
					});
					searchKeys.forEach((key) => {
						const item = searchItems.find((v) => v.key === key);
						if (item) newHeader.push(item);
					});
					props.header.splice(0, props.header.length, ...newHeader);
				},
			});
		}
	});
};

// 暴露变量
defineExpose({
	pageReset,
	// 获取当前搜索条件（__search 对象）
	getSearch: () => tableSearchRef.value?.getSearch(),
	// 校验当前搜索项是否有问题
	validateCurrentSearch: () => tableSearchRef.value?.validateCurrentSearch(),
});
</script>

<style scoped lang="scss">
.table-container {
	display: flex;
	flex-direction: column;
  .table-search-box {
    :deep(.el-col) {
      margin-bottom: 0;
    }
  }
  .table-toolbar {
    margin-bottom: 10px;
  }
  .table-tools-bar {
    flex: 1;
  }
  .table-header-right-tool {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    i {
      margin-right: 10px;
      cursor: pointer;
      color: var(--el-text-color-regular);
      &:last-of-type {
        margin-right: 0;
      }
    }
  }
  .table-search-wrapper {
    flex-shrink: 0;
  }
	.el-table {
		flex: 1;
	}
	.table-footer {
		display: flex;
	}
}
</style>
