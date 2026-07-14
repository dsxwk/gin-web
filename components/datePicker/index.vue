<template>
  <el-date-picker
    v-model="innerValue"
    :type="type"
    :placeholder="placeholder"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :value-format="computedValueFormat"
    :default-time="computedDefaultTime.length > 0 ? computedDefaultTime : undefined"
    :shortcuts="showShortcuts === false ? false : dateShortcuts"
    :disabled-date="disabledDate"
    :size="size"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: null
  },
  type: {
    type: String,
    default: 'date',
    validator: (val) => ['date', 'daterange', 'datetime', 'datetimerange'].includes(val)
  },
  placeholder: {
    type: String,
    default: '请选择日期'
  },
  startPlaceholder: {
    type: String,
    default: '开始日期'
  },
  endPlaceholder: {
    type: String,
    default: '结束日期'
  },
  valueFormat: {
    type: String,
    default: ''
  },
  defaultTime: {
    type: Array,
    default: () => []
  },
  showShortcuts: {
    type: Boolean,
    default: true
  },
  disabledDate: {
    type: Function,
    default: null
  },
  size: {
    type: String,
    default: 'default'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const innerValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val);
    emit('change', val);
  }
});

const isRange = computed(() => ['daterange', 'datetimerange'].includes(props.type));
const isDateTime = computed(() => ['datetime', 'datetimerange'].includes(props.type));

const computedValueFormat = computed(() => {
  if (props.valueFormat) return props.valueFormat;
  if (isDateTime.value) return 'yyyy-MM-dd HH:mm:ss';
  return 'yyyy-MM-dd';
});

const computedDefaultTime = computed(() => {
  if (props.defaultTime.length > 0) return props.defaultTime;
  if (isRange.value && isDateTime.value) return ['00:00:00', '23:59:59'];
  return [];
});

const getDateOffset = (months) => {
  const isFuture = months > 0;
  const start = new Date();
  isFuture ? start.setHours(0, 0, 0, 0) : start.setHours(23, 59, 59, 999);
  const end = new Date(start);
  isFuture ? end.setHours(23, 59, 59, 999) : end.setHours(0, 0, 0, 0);
  const currentDay = end.getDate();

  end.setMonth(end.getMonth() + months);

  if (end.getDate() !== currentDay) {
    end.setDate(0);
  }
  return isFuture ? [start, end] : [end, start];
};

const formatDate = (date, format) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (format.includes('HH')) {
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }
  return `${y}-${m}-${d}`;
};

const dateShortcuts = computed(() => {
  if (!isRange.value) return [];

  const currentFormat = computedValueFormat.value;

  return [
    {
      text: '今天',
      value: () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '最近一周',
      value: () => {
        const start = new Date();
        const end = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        start.setTime(start.getTime() - 604800000);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '最近一个月',
      value: () => {
        const [start, end] = getDateOffset(-1);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '最近三个月',
      value: () => {
        const [start, end] = getDateOffset(-3);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '最近半年',
      value: () => {
        const [start, end] = getDateOffset(-6);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '最近一年',
      value: () => {
        const [start, end] = getDateOffset(-12);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '未来一周',
      value: () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setTime(start.getTime() + 604799999);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '未来一个月',
      value: () => {
        const [start, end] = getDateOffset(1);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '未来三个月',
      value: () => {
        const [start, end] = getDateOffset(3);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '未来半年',
      value: () => {
        const [start, end] = getDateOffset(6);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    },
    {
      text: '未来一年',
      value: () => {
        const [start, end] = getDateOffset(12);
        return [formatDate(start, currentFormat), formatDate(end, currentFormat)];
      }
    }
  ];
});
</script>