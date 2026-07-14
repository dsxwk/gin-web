import {nextTick} from 'vue';
import {useRequestOldRoutes} from '/@/stores/requestOldRoutes';
import pinia from '/@/stores/index';
import {Session} from '/@/utils/storage';
import {NextLoading} from '/@/utils/loading';
import {dynamicRoutes, notFoundAndNoPower} from '/@/router/route';
import {formatTwoStageRoutes, formatFlatteningRoutes, router} from '/@/router/index';
import {useRoutesList} from '/@/stores/routesList';
import {useTagsViewRoutes} from '/@/stores/tagsViewRoutes';
import {menuApi} from '/@/api/menu';

const api = menuApi();
/**
 * 获取目录下的 .vue、.tsx 全部文件
 * @method import.meta.glob
 * @link 参考：https://cn.vitejs.dev/guide/features.html#json
 */
const layouModules = import.meta.glob('../layouts/routerView/*.{vue,tsx}');
const viewsModules = import.meta.glob('../views/**/*.{vue,tsx}');
const dynamicViewsModules = Object.assign({}, { ...layouModules }, { ...viewsModules });

/**
 * 后端控制路由：初始化方法，防止刷新时路由丢失
 * @method NextLoading 界面 loading 动画开始执行
 * @method useUserInfo().setUserInfos() 触发初始化用户信息 pinia
 * @method useRequestOldRoutes().setRequestOldRoutes() 存储接口原始路由（未处理component），根据需求选择使用
 * @method setAddRoute 添加动态路由
 * @method setFilterMenuAndCacheTagsViewRoutes 设置路由到 pinia routesList 中（已处理成多级嵌套路由）及缓存多级嵌套数组处理后的一维数组
 */
export async function initBackEndControlRoutes() {
    // 界面 loading 动画开始执行
    if (window.nextLoading === undefined) NextLoading.start();
    // 无 token 停止执行下一步
    if (!Session.get('token')) return false;
    // 获取路由菜单数据
    const res = await getBackEndControlRoutes();
    // 无登录权限时，添加判断
    // https://gitee.com/lyt-top/vue-next-admin/issues/I64HVO
    if (res.data.length <= 0) return Promise.resolve(true);
    // 存储接口原始路由（未处理component），根据需求选择使用
    useRequestOldRoutes().setRequestOldRoutes(JSON.parse(JSON.stringify(res.data)));
    // 统一权限树 -> 路由树：剔除功能节点(type=2)、将 meta 内的 path/redirect/component 提到顶层
    const routeTree = formatBackEndRoutes(res.data);
    // 处理路由（component），替换 dynamicRoutes（/@/router/route）第一个顶级 children 的路由
    dynamicRoutes[0].children = await backEndComponent(routeTree);
    // 添加动态路由
    await setAddRoute();
    // 设置路由到 pinia routesList 中（已处理成多级嵌套路由）及缓存多级嵌套数组处理后的一维数组
    setFilterMenuAndCacheTagsViewRoutes();
}

/**
 * 设置路由到 pinia routesList 中（已处理成多级嵌套路由）及缓存多级嵌套数组处理后的一维数组
 * @description 用于左侧菜单、横向菜单的显示
 * @description 用于 tagsView、菜单搜索中：未过滤隐藏的(isHide)
 */
export async function setFilterMenuAndCacheTagsViewRoutes() {
    const storesRoutesList = useRoutesList(pinia);
    storesRoutesList.setRoutesList(dynamicRoutes[0].children);
    setCacheTagsViewRoutes();
}

/**
 * 缓存多级嵌套数组处理后的一维数组
 * @description 用于 tagsView、菜单搜索中：未过滤隐藏的(isHide)
 */
export function setCacheTagsViewRoutes() {
    const storesTagsView = useTagsViewRoutes(pinia);
    storesTagsView.setTagsViewRoutes(formatTwoStageRoutes(formatFlatteningRoutes(dynamicRoutes))[0].children);
}

/**
 * 处理路由格式及添加捕获所有路由或 404 Not found 路由
 * @description 替换 dynamicRoutes（/@/router/route）第一个顶级 children 的路由
 * @returns 返回替换后的路由数组
 */
export function setFilterRouteEnd() {
    let filterRouteEnd = formatTwoStageRoutes(formatFlatteningRoutes(dynamicRoutes));
    // notFoundAndNoPower 防止 404、401 不在 layout 布局中，不设置的话，404、401 界面将全屏显示
    // 关联问题 No match found for location with path 'xxx'
    filterRouteEnd[0].children = [...filterRouteEnd[0].children, ...notFoundAndNoPower];
    return filterRouteEnd;
}

/**
 * 添加动态路由
 * @method router.addRoute
 * @description 此处循环为 dynamicRoutes（/@/router/route）第一个顶级 children 的路由一维数组，非多级嵌套
 * @link 参考：https://next.router.vuejs.org/zh/api/#addroute
 */
export async function setAddRoute() {
    await setFilterRouteEnd().forEach((route) => {
        router.addRoute(route);
    });
}

/**
 * 请求后端路由菜单接口
 * @description isRequestRoutes 为 true，则开启后端控制路由
 * @returns 返回后端路由菜单数据
 */
export async function getBackEndControlRoutes() {
    // 模拟 admin 与 test
    const userInfo = Session.get("userInfo");
    if (!userInfo) {
        Session.clear();
        window.location.reload();
    }
    const roles = userInfo?.userRoles?.map((item) => item.roleId);
    return await api.roleMenu({roleId: roles.join(',')});
}

/**
 * 统一权限树 -> Vue Router 路由树
 * @description 后端返回的是「菜单(type=1) + 功能(type=2)」统一权限树，且 path/redirect/component 位于 meta 内。
 *              路由只需要菜单节点：剔除功能节点（其下的菜单子节点上提到父级），并把 meta 内的字段提到顶层，
 *              以满足 formatTwoStageRoutes 对 v.path / v.name / v.component 的要求。
 * @param routes 后端返回的统一权限树
 * @returns 只含菜单节点、字段已提层的路由树
 */
export function formatBackEndRoutes(routes, parentIsFunction = false) {
    const result = [];
    (Array.isArray(routes) ? routes : []).forEach((item) => {
        const isFunction = item.type === 2;
        // 先递归处理子节点（功能节点会在递归中被剔除、其菜单子节点被上提），并告知子节点其父级是否为功能
        const children = formatBackEndRoutes(item.children, isFunction);
        // 功能节点(type=2)不是路由，跳过自身，仅保留其下的菜单子节点
        if (isFunction) {
            result.push(...children);
            return;
        }
        // 菜单节点：把其下的功能节点(type=2)收集为 authBtnList，供 v-auth 按钮权限使用
        const meta = {...(item.meta || {})};
        meta.authBtnList = collectAuthBtns(item.children);
        // 父级是功能的菜单：仍注册为可访问路由，但不在左侧菜单栏展示（由对应功能页内部打开）
        // isHide 约定 1=隐藏、2=不隐藏（formatTwoStageRoutes 会将其转为布尔）
        if (parentIsFunction) meta.isHide = 1;
        result.push({
            ...item,
            path: item.path ?? meta.path,
            name: item.name,
            redirect: item.redirect ?? meta.redirect,
            component: item.component ?? meta.component,
            meta,
            children: children.length ? children : undefined,
        });
    });
    return result;
}

/**
 * 收集菜单节点下的功能(type=2)按钮权限
 * @description 仅收集当前菜单直接/间接挂载的功能节点；遇到子菜单(type=1)则停止下探（子菜单是独立页面，有自己的 authBtnList）。
 * @param list 当前节点的 children
 * @returns 形如 [{authValue, ...}] 的按钮权限列表，authValue 供 v-auth 指令匹配
 */
function collectAuthBtns(list) {
    const btns = [];
    (Array.isArray(list) ? list : []).forEach((n) => {
        if (n.type !== 2) return;
        const action = Array.isArray(n.menuActions) ? n.menuActions[0] : n.menuAction || null;
        const authValue = action?.authValue || n.name;
        if (authValue) btns.push({...(action || {}), authValue});
        // 仅继续下探功能子节点，遇到子菜单则不再纳入本菜单
        btns.push(...collectAuthBtns((n.children || []).filter((c) => c.type === 2)));
    });
    return btns;
}

/**
 * 后端路由 component 转换
 * @param routes 后端返回的路由表数组
 * @returns 返回处理成函数后的 component
 */
export function backEndComponent(routes) {
    if (!routes) return;
    return routes.map((item) => {
        if (item.component) item.component = dynamicImport(dynamicViewsModules, item.component);
        item.children && backEndComponent(item.children);
        return item;
    });
}

/**
 * 后端路由 component 转换函数
 * @param dynamicViewsModules 获取目录下的 .vue、.tsx 全部文件
 * @param component 当前要处理项 component
 * @returns 返回处理成函数后的 component
 */
export function dynamicImport(dynamicViewsModules, component) {
    const keys = Object.keys(dynamicViewsModules);
    const matchKeys = keys.filter((key) => {
        const k = key.replace(/..\/views|../, '');
        return k.startsWith(`${component}`) || k.startsWith(`/${component}`);
    });
    if (matchKeys?.length === 1) {
        const matchKey = matchKeys[0];
        return dynamicViewsModules[matchKey];
    }
    if (matchKeys?.length > 1) {
        return false;
    }
}