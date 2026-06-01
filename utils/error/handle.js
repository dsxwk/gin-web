// import {ElNotification} from 'element-plus';
import pnotify from '/@/utils/pnotify/alert.js';
import pnotifyConfirm from '/@/utils/pnotify/confirm.js';
import { Session } from '/@/utils/storage';
import { ElMessage } from 'element-plus';

const recentErrors = new Map();

// 3秒内相同错误只提示一次
const ERROR_EXPIRE = 3000;

function canShowError(code, msg) {
    const key = `${code}-${msg}`;
    const now = Date.now();

    const lastTime = recentErrors.get(key);

    if (lastTime && now - lastTime < ERROR_EXPIRE) {
        return false;
    }

    recentErrors.set(key, now);

    setTimeout(() => {
        recentErrors.delete(key);
    }, ERROR_EXPIRE);

    return true;
}

const errorHandler = (error) => {
    if (!error) {
        return false;
    }

    const errorMap = {
        InternalError: 'Javascript引擎内部错误',
        ReferenceError: '未找到对象',
        TypeError: '使用了错误的类型或对象',
        RangeError: '使用内置对象时，参数超范围',
        SyntaxError: '语法错误',
        EvalError: '错误的使用了Eval',
        URIError: 'URI错误',

        400: '请求错误',
        401: '请求未授权',
        403: '禁止访问',
        404: '请求未找到',
        500: '系统错误'
    };

    const code = error?.code || error?.status || error?.name || 'unknown';

    const msg =
        error?.msg ||
        error?.message ||
        error?.statusText ||
        '未知错误';

    if (!canShowError(code, msg)) {
        return false;
    }

    const title =
        errorMap[code] ||
        errorMap[error?.name] ||
        '错误';

    pnotify.error(msg, title);

    if (Number(code) === 401) {
        Session.clear();

        pnotifyConfirm.notice(
            msg,
            '登录已过期，点击确定跳转登录页'
        )
            .then(() => {
                window.location.href = '/';
            })
            .catch(() => {
                ElMessage.info('已取消');

                setTimeout(() => {
                    window.location.reload();
                }, 100);
            });
    }

    // ElNotification({
    //     title: errorName,
    //     message: typeof error === 'string' ? error : error?.msg,
    //     type: "error",
    //     duration: 3000
    // });

    return true;
};

export default errorHandler;