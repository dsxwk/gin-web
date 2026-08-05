<template>
  <el-button
      v-if="hasPermission"
      :type="btnType"
      :size="btnSize"
      :plain="btnStyle === 'default'"
      :disabled="disabled"
      :loading="loading"
      :key="auth"
      @click="handleClick"
  >
    <el-icon v-if="iconName">
      <SvgIcon :name="iconName"/>
    </el-icon>
    {{ label }}
  </el-button>
</template>

<script setup name="authButton">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { i18n } from '/@/static/i18n';
import SvgIcon from '/@/components/svgIcon/index.vue';

const props = defineProps({
  auth: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click']);

const route = useRoute();

const getBtnConfig = () => {
  const btnList = route.meta?.authBtnList || [];
  return btnList.find((item) => item.authValue === props.auth);
};

const config = computed(() => getBtnConfig());

const hasPermission = computed(() => {
  const btnList = route.meta?.authBtnList || [];
  return btnList.some((item) => item.authValue === props.auth);
});

const label = computed(() => {
  const cfg = config.value;
  if (!cfg) return '';
  return i18n.global.t(cfg.transKey || cfg.label || '');
});

const btnType = computed(() => {
  const style = config.value?.btnStyle || 'primary';
  if (style === 'danger') return 'danger';
  if (style === 'success') return 'success';
  if (style === 'warning') return 'warning';
  if (style === 'info') return 'info';
  return 'primary';
});

const btnSize = computed(() => {
  const size = config.value?.btnSize || 'default';
  if (size === 'small') return 'small';
  if (size === 'large') return 'large';
  return 'default';
});

const btnStyle = computed(() => config.value?.btnStyle || 'primary');

const iconName = computed(() => config.value?.icon || '');

const handleClick = () => {
  if (props.disabled || props.loading) return;
  emit('click');
};
</script>
