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

const fmt = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
};

const getDateOffset = (months) => {
  const now = new Date();
  const isFuture = months > 0;
  const ty = now.getFullYear();
  const tm = now.getMonth();
  const td = now.getDate();
  const todayStart = new Date(ty, tm, td, 0, 0, 0, 0);
  const todayEnd = new Date(ty, tm, td, 23, 59, 59, 999);
  let targetYear = ty;
  let targetMonth = tm + months;
  targetYear += Math.floor(targetMonth / 12);
  targetMonth = targetMonth % 12;
  if (targetMonth < 0) { targetMonth += 12; }
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(td, daysInMonth);
  const targetDate = new Date(targetYear, targetMonth, targetDay,
    isFuture ? 23 : 0, isFuture ? 59 : 0, isFuture ? 59 : 0, isFuture ? 999 : 0);
  return isFuture ? [todayStart, targetDate] : [targetDate, todayEnd];
};


const dateShortcuts = computed(() => {
  if (!isRange.value) return [];
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const todayStart = new Date(y, m, d, 0, 0, 0, 0);
  const todayEnd = new Date(y, m, d, 23, 59, 59, 999);
  return [
    { text: "今天", value: [fmt(todayStart), fmt(todayEnd)] },
    { text: "最近一周", value: () => {
      const s = new Date(y, m, d - 6, 0, 0, 0, 0);
      return [fmt(s), fmt(todayEnd)];
    }},
    { text: "最近一个月", value: () => { const [s, e] = getDateOffset(-1); return [fmt(s), fmt(e)]; } },
    { text: "最近三个月", value: () => { const [s, e] = getDateOffset(-3); return [fmt(s), fmt(e)]; } },
    { text: "最近半年", value: () => { const [s, e] = getDateOffset(-6); return [fmt(s), fmt(e)]; } },
    { text: "最近一年", value: () => { const [s, e] = getDateOffset(-12); return [fmt(s), fmt(e)]; } },
    { text: "未来一周", value: () => {
      const e2 = new Date(y, m, d + 6, 23, 59, 59, 999);
      return [fmt(todayStart), fmt(e2)];
    }},
    { text: "未来一个月", value: () => { const [s, e] = getDateOffset(1); return [fmt(s), fmt(e)]; } },
    { text: "未来三个月", value: () => { const [s, e] = getDateOffset(3); return [fmt(s), fmt(e)]; } },
    { text: "未来半年", value: () => { const [s, e] = getDateOffset(6); return [fmt(s), fmt(e)]; } },
    { text: "未来一年", value: () => { const [s, e] = getDateOffset(12); return [fmt(s), fmt(e)]; } },
  ];
});
</script>