/**
 * 表格搜索参数格式化工具
 *
 * 目标格式（__search）：
 * {
 *   "and": [
 *     { "createdAt": [">=", "2025-01-01"] },
 *     { "createdAt": ["<=", "2026-01-01"] },
 *     { "name": "" },
 *     { "$.meta.icon": ["=", "ele-Collection"] }
 *   ]
 * }
 *
 * 规则：
 * - 首层默认逻辑为 AND，子项默认放在 AND 中；
 * - operator 为 '=' 时使用简写 { prop: value }，其他操作符使用 { prop: [op, value] }；
 * - 支持传入自定义搜索（custom），默认与构建出来的搜索合并；
 * - 提供 validateSearch 用于检查搜索结构是否有问题。
 */

// 支持的操作符
export const SEARCH_OPERATORS = ['=', '!=', '>', '>=', '<', '<=', 'like', 'not like', 'in', 'not in', 'between', 'is null', 'is not null'];

// 判断值是否为空（空值不参与搜索）
export const isEmptySearchValue = (v) => {
	if (v === null || v === undefined) return true;
	if (typeof v === 'string') return v.trim() === '';
	if (Array.isArray(v)) return v.length === 0 || v.every((i) => i === null || i === undefined || i === '');
	return false;
};

/**
 * 将单个搜索项格式化为一个或多个条件对象
 * @param {Object} item 搜索配置 { prop, column, type, operator, rangeOperator }
 * @param {*} value 表单值
 * @returns {Array} 条件对象数组
 */
export const formatSearchItem = (item, value) => {
	if (!item || isEmptySearchValue(value)) return [];
	// column 支持 JSON 路径（如 $.meta.icon），未指定时回退到 prop
	const column = item.column || item.prop;
	if (!column) return [];
	const type = item.type || 'input';

	// 区间类型（daterange、datetimerange 使用 between）
	if (type === 'daterange' || type === 'datetimerange') {
		const [start, end] = value;
		if (!isEmptySearchValue(start) && !isEmptySearchValue(end)) {
			return [{ [column]: ['between', [start, end]] }];
		}
		if (!isEmptySearchValue(start)) {
			return [{ [column]: ['>=', start] }];
		}
		if (!isEmptySearchValue(end)) {
			return [{ [column]: ['<=', end] }];
		}
		return [];
	}

	// 数组值（多选）默认使用 in
	if (Array.isArray(value)) {
		return [{ [column]: [item.operator || 'in', value] }];
	}

	const operator = item.operator || '=';
	// '=' 使用简写形式 { prop: value }
	if (operator === '=') {
		return [{ [column]: value }];
	}
	return [{ [column]: [operator, value] }];
};

/**
 * 根据搜索配置 + 表单值构建条件数组
 * @param {Object} form 表单值 { key: value }
 * @param {Array} searchConfig 搜索配置数组
 * @returns {Array} 条件对象数组
 */
export const buildConditions = (form = {}, searchConfig = []) => {
	const conditions = [];
	(searchConfig || []).forEach((item) => {
		if (!item) return;
		// daterange、datetimerange 的表单值存放在 rangeProp.join('_') 这个 key 上
		const key = (item.type === 'daterange' || item.type === 'datetimerange') && item.rangeProp && item.rangeProp.length ? item.rangeProp.join('_') : item.prop;
		conditions.push(...formatSearchItem(item, form[key]));
	});
	return conditions;
};

/**
 * 合并默认搜索与自定义搜索
 * - 同为数组的 and/or 进行拼接；
 * - 其余键以自定义为准。
 * @param {Object} base 默认搜索
 * @param {Object} custom 自定义搜索
 * @returns {Object}
 */
export const mergeSearch = (base = {}, custom) => {
	if (!custom || typeof custom !== 'object') return base;
	const result = JSON.parse(JSON.stringify(base || {}));
	Object.keys(custom).forEach((key) => {
		if (Array.isArray(result[key]) && Array.isArray(custom[key])) {
			result[key] = result[key].concat(custom[key]);
		} else {
			result[key] = custom[key];
		}
	});
	return result;
};

/**
 * 构建完整的 __search 对象（首层默认 AND）
 * @param {Array} conditions 条件数组
 * @param {Object} options { custom, logic }
 * @returns {Object|undefined} 无任何条件时返回 undefined
 */
export const buildSearch = (conditions = [], options = {}) => {
	const { custom, logic = 'and' } = options;
	let search = {};
	if (Array.isArray(conditions) && conditions.length > 0) {
		search[logic] = conditions;
	}
	if (custom) {
		search = mergeSearch(search, custom);
	}
	return Object.keys(search).length > 0 ? search : undefined;
};

/**
 * 由表单 + 配置一步构建 __search
 * @param {Object} form 表单值
 * @param {Array} searchConfig 搜索配置
 * @param {Object} options { custom, logic }
 * @returns {Object|undefined}
 */
export const buildSearchFromForm = (form, searchConfig, options = {}) => {
	const conditions = buildConditions(form, searchConfig);
	return buildSearch(conditions, options);
};

/**
 * 校验 __search 结构是否合法
 * @param {Object} search __search 对象
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateSearch = (search) => {
	const errors = [];
	const walk = (node, path) => {
		if (node === null || node === undefined) return;
		if (Array.isArray(node)) {
			node.forEach((item, idx) => walk(item, `${path}[${idx}]`));
			return;
		}
		if (typeof node !== 'object') return;
		Object.entries(node).forEach(([key, val]) => {
			if (key === 'and' || key === 'or') {
				if (!Array.isArray(val)) {
					errors.push(`${path}.${key} 必须为数组`);
				} else {
					walk(val, `${path}.${key}`);
				}
				return;
			}
			// 叶子条件：数组形式 [operator, value]
			if (Array.isArray(val)) {
				const [op, v] = val;
				if (!SEARCH_OPERATORS.includes(op)) {
					errors.push(`字段 ${key} 的操作符 "${op}" 不合法`);
				}
				if (val.length >= 2 && v === undefined) {
					errors.push(`字段 ${key} 的值不能为 undefined`);
				}
			}
			// 简写形式 { key: value } 视为合法（等于）
		});
	};
	walk(search, '$');
	return { valid: errors.length === 0, errors };
};
