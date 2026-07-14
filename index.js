/**
 * @param {import('@@@/share/types').FormComponentPropsType} 表单参数配置
 * @returns {JSX.Element}
 */
export default function DatePicker({ column, parentField, idx, searchInfo, vm }) {
  // eslint-disable-next-line no-unused-vars
  const h = vm.$createElement;

  let { showCondition } = column;
  const conditionOptions = column.condition || [];
  const sourceObj = parentField ? searchInfo[parentField].value[idx] : searchInfo[column.field];

  const conditionVal = sourceObj.conditionVal;
  /**
   * @type {{props:import('@@@/share/types').PropsType}}
   */
  let props = { props: column.props };
  if (conditionVal && conditionOptions.length > 0) {
    const _val = conditionOptions.find(({ value }) => value === conditionVal) || { props: {} };
    props = { props: { ..._val?.props, ...column.props } };
  }

  // 修复"最近一个月"快捷选项中的重复调用问题
  const createPickerHandler = (getTextOffset) => {
    return (_picker) => {
      const [start, end] = getTextOffset;
      sourceObj.value = [start, end];
      _picker.$emit('pick', [start, end]);
    };
  };

  const pickerOptions = {
    shortcuts: [
      {
        text: '今天',
        onClick(_picker) {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();
          end.setHours(23, 59, 59, 999);
          sourceObj.value = [start, end];
          _picker.$emit('pick', [start, end]);
        }
      },
      {
        text: '最近一周',
        onClick(_picker) {
          const start = new Date();
          const end = new Date();
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          start.setTime(start.getTime() - 604800000);
          sourceObj.value = [start, end];
          _picker.$emit('pick', [start, end]);
        }
      },
      {
        text: '最近一个月',
        onClick: createPickerHandler(getDateOffset(-1))
      },
      {
        text: '最近三个月',
        onClick: createPickerHandler(getDateOffset(-3))
      },
      {
        text: '最近半年',
        onClick: createPickerHandler(getDateOffset(-6))
      },
      {
        text: '最近一年',
        onClick: createPickerHandler(getDateOffset(-12))
      },
      {
        text: '未来一周',
        onClick(_picker) {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setTime(start.getTime() + 604799999);
          sourceObj.value = [start, end];
          _picker.$emit('pick', [start, end]);
        }
      },
      {
        text: '未来一个月',
        onClick: createPickerHandler(getDateOffset(1))
      },
      {
        text: '未来三个月',
        onClick: createPickerHandler(getDateOffset(3))
      },
      {
        text: '未来半年',
        onClick: createPickerHandler(getDateOffset(6))
      },
      {
        text: '未来一年',
        onClick: createPickerHandler(getDateOffset(12))
      }
    ]
  };

  // conditionOptions 只存在一个时，默认隐藏
  if (showCondition == null) {
    showCondition = conditionOptions.length > 1;
  }

  const isBetween = sourceObj.conditionVal === 'between';
  const isRange = isBetween || ['datetimerange', 'daterange'].includes(column.props?.type);
  const valueFormat = column.format ?? (isRange ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd');
  const defaultTime = isRange ? ['00:00:00', '23:59:59'] : undefined;

  const getDefaultType = () => {
    if (column.props?.type) return column.props.type;
    return isBetween ? 'daterange' : 'date';
  };

  return (
    <div class="flex">
      {!!conditionOptions.length && showCondition && (
        <el-select
          value={sourceObj.conditionVal}
          prop={column.field}
          style={{ width: '100px', marginRight: '-2px', maxWidth: '100px' }}
          onChange={(val) => {
            sourceObj.conditionVal = val;
            sourceObj.value = val === 'between' ? [] : '';

            // 解决切换时 el-date-picker 弹窗位置问题
            sourceObj.show = false;
            vm.$nextTick(() => {
              sourceObj.show = true;
            });
          }}
        >
          {conditionOptions.map((option) => (
            <el-option key={String(option.value)} value={option.value} label={option.label} />
          ))}
        </el-select>
      )}

      {sourceObj.show ? (
        <el-date-picker
          type={getDefaultType()}
          value={sourceObj.value}
          on-input={(val) => {
            sourceObj.value = val;
          }}
          align="left"
          unlink-panels
          editable={column.props?.editable ?? true}
          default-time={column.props?.defaultTime || defaultTime}
          value-format={valueFormat}
          placeholder={column.placeholder || '请选择日期'}
          start-placeholder={column.startPlaceholder || '开始日期'}
          end-placeholder={column.endPlaceholder || '结束日期'}
          picker-options={isRange ? pickerOptions : null}
          {...props}
        />
      ) : null}
    </div>
  );
}

function getDateOffset(months) {
  const isFuture = months > 0;
  const start = new Date();
  isFuture ? start.setHours(0, 0, 0, 0) : start.setHours(23, 59, 59, 999);
  const end = new Date(start);
  isFuture ? end.setHours(23, 59, 59, 999) : end.setHours(0, 0, 0, 0);
  const currentDay = end.getDate();

  // 增加/减少月份
  end.setMonth(end.getMonth() + months);

  if (end.getDate() !== currentDay) {
    end.setDate(0); // 回退到目标月份的最后一天
  }
  return isFuture ? [start, end] : [end, start];
}
