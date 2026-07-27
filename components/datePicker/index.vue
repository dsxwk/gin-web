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
  modelValue: { type: [String, Array], default: null },
  type: { type: String, default: 'date', validator: (val) => ['date', 'daterange', 'datetime', 'datetimerange'].includes(val) },
  placeholder: { type: String, default: '请选择日期' },
  startPlaceholder: { type: String, default: '开始日期' },
  endPlaceholder: { type: String, default: '结束日期' },
  valueFormat: { type: String, default: '' },
  defaultTime: { type: Array, default: () => [] },
  showShortcuts: { type: Boolean, default: true },
  disabledDate: { type: Function, default: null },
  size: { type: String, default: 'default' },
});

const emit = defineEmits(['update:modelValue', 'change']);

const innerValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    console.log('[DatePicker] innerValue updated:', val);
    emit('update:modelValue', val); emit('change', val);
  },
});

const isRange = computed(() => ['daterange', 'datetimerange'].includes(props.type));
const isDateTime = computed(() => ['datetime', 'datetimerange'].includes(props.type));

const computedValueFormat = computed(() => {
  if (props.valueFormat) return props.valueFormat;
  if (isDateTime.value) return 'YYYY-MM-DD HH:mm:ss';
  return 'YYYY-MM-DD';
});

const computedDefaultTime = computed(() => {
  if (props.defaultTime.length > 0) return props.defaultTime;
  if (isRange.value && isDateTime.value) return ['00:00:00', '23:59:59'];
  return [];
});

// Carbon风格日期偏移
const dateOffset = (amount, unit) => {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), dt = now.getDate();
  switch (unit) {
    case 'day': case 'days': return new Date(y, m, dt + amount);
    case 'month': case 'months': {
      let tm = m + amount;
      let ty = y + Math.floor(tm / 12);
      tm = tm % 12;
      if (tm < 0) { tm += 12; }
      const maxDay = new Date(ty, tm + 1, 0).getDate();
      return new Date(ty, tm, Math.min(dt, maxDay));
    }
    case 'year': case 'years': {
      const ty2 = y + amount;
      const maxDay2 = new Date(ty2, m + 1, 0).getDate();
      return new Date(ty2, m, Math.min(dt, maxDay2));
    }
  }
  return new Date(now);
};

const fmtDate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dt = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dt;
};

// 构建范围快捷选项，返回字符串数组匹配value-format
const makeRange = (sa, su, ea, eu) => {
  const s = dateOffset(sa, su);
  const e = dateOffset(ea, eu);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return [s, e];
};

const dateShortcuts = computed(() => {
  if (!isRange.value) return [];
  return [
    { text: '今天', value: () => makeRange(0, 'days', 0, 'days') },
    { text: '最近一周', value: () => makeRange(-7, 'days', 0, 'days') },
    { text: '最近一个月', value: () => makeRange(-1, 'months', 0, 'days') },
    { text: '最近三个月', value: () => makeRange(-3, 'months', 0, 'days') },
    { text: '最近半年', value: () => makeRange(-6, 'months', 0, 'days') },
    { text: '最近一年', value: () => makeRange(-1, 'years', 0, 'days') },
    { text: '未来一周', value: () => makeRange(0, 'days', 7, 'days') },
    { text: '未来一个月', value: () => makeRange(0, 'days', 1, 'months') },
    { text: '未来三个月', value: () => makeRange(0, 'days', 3, 'months') },
    { text: '未来半年', value: () => makeRange(0, 'days', 6, 'months') },
    { text: '未来一年', value: () => makeRange(0, 'days', 1, 'years') },
  ];
});
</script>
