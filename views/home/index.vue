<template>
  <div class="dashboard-container layout-pd">

    <!-- 系统资源 -->
    <el-row :gutter="16">
      <el-col :span="24">
        <el-card>
          <template #header>系统资源</template>
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12" :md="6" v-for="res in systemResources" :key="res.label">
              <div class="resource-item">
                <div class="resource-header">
                  <span class="resource-label">{{ res.label }}</span>
                  <span class="resource-value" :class="{ 'resource-warning': res.warning }">{{ res.used }}{{ res.unit }}</span>
                </div>
                <el-progress
                  :percentage="res.percent"
                  :color="res.progressColor"
                  :stroke-width="12"
                  :show-text="false"
                />
                <div class="resource-meta">
                  <span>总计 {{ res.total }}{{ res.unit }}</span>
                  <span>可用 {{ res.free }}{{ res.unit }}</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 网站信息 -->
    <el-row class="mt16">
      <el-col :span="24">
        <el-card>
          <div class="website-info-title">网站信息</div>
          <el-table :data="websiteInfo" border style="width: 100%;" class="website-info-table">
            <el-table-column prop="label" label="属性" width="150"></el-table-column>
            <el-table-column prop="value" label="内容"></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计卡片第一行 -->
    <el-row :gutter="16" class="mt16">
      <el-col :xs="24" :sm="12" :md="6" v-for="card in statCards.slice(0, 4)" :key="card.title">
        <el-card class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-card-left">
              <div class="stat-card-title">{{ card.title }}</div>
              <div class="stat-card-value">
                <span class="stat-card-num" v-if="!card.loading">{{ card.value }}</span>
                <el-skeleton animated :loading="!!card.loading" v-else>
                  <template #template>
                    <el-skeleton-item variant="text" style="width:60px;height:28px;" />
                  </template>
                </el-skeleton>
              </div>
              <div class="stat-card-desc">
                <span :class="trendClass(card.trend)">{{ trendArrow(card.trend) }}{{ card.desc }}</span>
              </div>
            </div>
            <div class="stat-card-right">
              <div class="stat-card-icon" :style="{ background: card.bgColor }">
                <el-icon :size="28" :color="card.color">
                  <component :is="card.icon" />
                </el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 统计卡片第二行 -->
    <el-row :gutter="16" class="mt16">
      <el-col :xs="24" :sm="12" :md="6" v-for="card in statCards.slice(4, 8)" :key="card.title">
        <el-card class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-card-left">
              <div class="stat-card-title">{{ card.title }}</div>
              <div class="stat-card-value">
                <span class="stat-card-num" v-if="!card.loading">{{ card.value }}</span>
                <el-skeleton animated :loading="!!card.loading" v-else>
                  <template #template>
                    <el-skeleton-item variant="text" style="width:60px;height:28px;" />
                  </template>
                </el-skeleton>
              </div>
              <div class="stat-card-desc">
                <span :class="trendClass(card.trend)">{{ trendArrow(card.trend) }}{{ card.desc }}</span>
              </div>
            </div>
            <div class="stat-card-right">
              <div class="stat-card-icon" :style="{ background: card.bgColor }">
                <el-icon :size="28" :color="card.color">
                  <component :is="card.icon" />
                </el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 今日统计概览 -->
    <el-row :gutter="16" class="mt16">
      <el-col :xs="12" :sm="6" v-for="item in todayStats" :key="item.label">
        <el-card class="today-stat-card">
          <div class="today-stat-inner">
            <span class="today-stat-label">{{ item.label }}</span>
            <span class="today-stat-value" :style="{ color: item.color }">{{ item.value }}</span>
            <span class="today-stat-sub">{{ item.sub }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 请求量趋势 + 状态码分布 -->
    <el-row :gutter="16" class="mt16 dash-equal-row">
      <el-col :xs="24" :md="16">
        <el-card class="chart-card">
          <div class="chart-card-header">
            <span>今日每小时请求量</span>
          </div>
          <div class="chart-wrapper">
            <v-chart v-if="hourlyChartOption" :option="hourlyChartOption" autoresize style="width:100%;height:100%;" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card class="chart-card">
          <div class="chart-card-header">
            <span>状态码分布</span>
          </div>
          <div class="chart-wrapper">
            <v-chart v-if="statusChartOption" :option="statusChartOption" autoresize style="width:100%;height:100%;" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 请求方法分布 + 耗时分布 -->
    <el-row :gutter="16" class="mt16 dash-equal-row">
      <el-col :xs="24" :md="12">
        <el-card class="chart-card">
          <div class="chart-card-header">
            <span>请求方法分布</span>
          </div>
          <div class="chart-wrapper">
            <v-chart v-if="methodChartOption" :option="methodChartOption" autoresize style="width:100%;height:100%;" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card class="chart-card">
          <div class="chart-card-header">
            <span>耗时分布</span>
          </div>
          <div class="chart-wrapper">
            <v-chart v-if="costChartOption" :option="costChartOption" autoresize style="width:100%;height:100%;" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新操作日志 -->
    <el-row :gutter="16" class="mt16">
      <el-col :span="24">
        <el-card class="log-card">
          <template #header>
            <div class="chart-card-header">
              <span>最新操作日志</span>
              <router-link to="/operator-log" class="log-more-link">
                <el-button type="primary" link size="small">查看更多</el-button>
              </router-link>
            </div>
          </template>
          <el-table :data="recentLogs" border stripe size="small" style="width:100%;" max-height="280">
            <el-table-column prop="username" label="用户" width="120"></el-table-column>
            <el-table-column prop="method" label="方法" width="100"></el-table-column>
            <el-table-column prop="uri" label="请求地址" :show-overflow-tooltip="true"></el-table-column>
            <el-table-column prop="statusCode" label="状态码" width="70"></el-table-column>
            <el-table-column prop="costMs" label="耗时" width="65">
              <template #default="scope">
                <el-tag :type="scope.row.costMs > 200 ? 'warning' : 'success'" size="small">
                  {{ scope.row.costMs }}ms
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="140"></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { formatDateTime } from '/@/utils/formatTime.js';
import { operatorLogApi } from '/@/api/operatorLog';
import { dashboardApi } from '/@/api/dashboard';
import {
  User, Setting, Menu, Document, Clock, Collection, Tools, Upload,
  TrendCharts, Notebook, DataAnalysis, List
} from '@element-plus/icons-vue';

const statCards = ref([
  { title: '用户数', value: '1,286', desc: '较昨日 +12', trend: 1, icon: User, color: '#409EFF', bgColor: '#ecf5ff' },
  { title: '角色数', value: '18', desc: '较昨日 +0', trend: 0, icon: Setting, color: '#67C23A', bgColor: '#f0f9eb' },
  { title: '菜单数', value: '56', desc: '较昨日 +3', trend: 1, icon: Menu, color: '#E6A23C', bgColor: '#fdf6ec' },
  { title: '文章数', value: '342', desc: '较昨日 +8', trend: 1, icon: Document, color: '#F56C6C', bgColor: '#fef0f0' },
  { title: '今日日志', value: '2,410', desc: '较昨日 +15%', trend: 1, icon: Clock, color: '#909399', bgColor: '#f4f4f5' },
  { title: '字典项', value: '128', desc: '较昨日 +0', trend: 0, icon: Collection, color: '#409EFF', bgColor: '#ecf5ff' },
  { title: '系统配置', value: '24', desc: '较昨日 -1', trend: -1, icon: Tools, color: '#E6A23C', bgColor: '#fdf6ec' },
  { title: '导入记录', value: '--', desc: '加载中...', trend: 0, icon: Upload, color: '#67C23A', bgColor: '#f0f9eb' },
]);

function trendArrow(trend) {
  if (trend === 1) return '\u2191 ';
  if (trend === -1) return '\u2193 ';
  return '\u2192 ';
}

function trendClass(trend) {
  if (trend === 1) return 'trend-up';
  if (trend === -1) return 'trend-down';
  return 'trend-flat';
}

const websiteInfo = [
  { label: '网站名称', value: 'Gin-Admin后台管理系统' },
  { label: '当前版本', value: 'v' + __NEXT_VERSION__ },
  { label: '管理员', value: '大师兄' },
  { label: '联系方式', value: 'dsx.email@qq.com' },
  { label: '运行环境', value: process.env.NODE_ENV },
  { label: '构建时间', value: formatDateTime(__BUILD_TIME__, 'YYYY-MM-DD HH:mm:ss') }
];

const todayStats = ref([
  { label: '今日PV', value: '--', sub: '加载中...', color: '#409EFF' },
  { label: '今日UV', value: '--', sub: '加载中...', color: '#67C23A' },
  { label: '平均响应', value: '--', sub: '加载中...', color: '#E6A23C' },
  { label: '峰值时段', value: '--', sub: '加载中...', color: '#F56C6C' },
]);

const recentLogs = ref([]);

// 获取最新操作日志
const api = operatorLogApi();
const dashApi = dashboardApi();
const fetchRecentLogs = async () => {
  try {
    const response = await api.list({ page: 1, pageSize: 7 });
    const list = response?.data?.list || [];
    recentLogs.value = list.map((item) => ({
      username: item?.user?.fullName || '-',
      method: item?.method || '-',
      uri: item?.uri || '-',
      statusCode: item?.statusCode || 0,
      costMs: item?.costMs || 0,
      createdAt: item?.createdAt || '-',
    }));
  } catch (e) {
    console.warn('获取操作日志失败', e);
  }
};

// 获取仪表盘统计数据
const fetchDashboardStats = async () => {
  try {
    const response = await dashApi.statistics();
    const data = response?.data;
    if (!data) return;

    const summary = data.summary || {};
    // 更新今日统计概览
    if (summary) {
      const pvSign = (summary.pvChange || 0) >= 0 ? '+' : '';
      const uvSign = (summary.uvChange || 0) >= 0 ? '+' : '';
      const costSign = (summary.costChange || 0) >= 0 ? '+' : '';
      todayStats.value = [
        { label: '今日PV', value: String(summary.todayPv || 0), sub: '较昨日 ' + pvSign + (summary.pvChange || 0) + '%', color: '#409EFF' },
        { label: '今日UV', value: String(summary.todayUv || 0), sub: '较昨日 ' + uvSign + (summary.uvChange || 0) + '%', color: '#67C23A' },
        { label: '平均响应', value: Number(summary.avgCost || 0).toFixed(1) + 'ms', sub: '较昨日 ' + costSign + Number(summary.costChange || 0).toFixed(1) + 'ms', color: '#E6A23C' },
        { label: '峰值时段', value: (summary.peakHour || 0) + ':00', sub: 'QPS ' + Number(summary.peakQps || 0).toFixed(1), color: '#F56C6C' },
      ];
    }

    // 更新每小时请求量图表
    const hourly = data.hourlyStats || [];
    if (hourly.length > 0) {
      const hours = hourly.map(h => h.hour !== undefined ? String(h.hour).padStart(2,'0') + ':00' : h.time || '');
      const counts = hourly.map(h => h.count || 0);
      hourlyChartOption.value = buildHourlyOption(hours, counts);
    }

    // 更新状态码分布图表
    const statusCodes = data.statusCodeStats || [];
    if (statusCodes.length > 0) {
      const pieData = statusCodes.map(s => ({
        value: s.count || 0,
        name: String(s.statusCode || s.code || ''),
        itemStyle: { color: statusColor(String(s.statusCode || s.code || '')) },
      }));
      statusChartOption.value = buildStatusOption(pieData);
    }

    // 更新请求方法分布图表
    const methods = data.methodStats || [];
    if (methods.length > 0) {
      const methodColors = { GET: '#409EFF', POST: '#67C23A', PUT: '#E6A23C', DELETE: '#F56C6C', PATCH: '#909399' };
      const barData = methods.map(m => ({
        value: m.count || 0,
        itemStyle: { color: methodColors[m.method] || '#909399' },
      }));
      methodChartOption.value = buildMethodOption(methods.map(m => m.method || ''), barData);
    }

    // 更新耗时分布图表
    const cost = data.costDist || {};
    if (cost && Object.values(cost).some(v => v > 0)) {
      costChartOption.value = buildCostOption([
        cost.lt50 || 0, cost.bt50100 || 0, cost.bt100200 || 0, cost.bt200500 || 0, cost.gt500 || 0,
      ]);
    }
  } catch (e) {
    console.warn('获取仪表盘统计失败', e);
  }
};

// 获取系统资源
const fetchSystemResource = async () => {
  try {
    const response = await dashApi.systemResource();
    const data = response?.data;
    if (!data) return;

    const cpu = data.cpu || {};
    const mem = data.memory || {};
    const disk = data.disk || {};
    const net = data.net || {};

    const parseNum = (s) => parseFloat(String(s).replace(/[^0-9.]/g, '')) || 0;
    const memUsed = parseNum(mem.used);
    const memTotal = parseNum(mem.total);
    const diskUsed = parseNum(disk.used);
    const diskTotal = parseNum(disk.total);
    systemResources.value = [
      { label: 'CPU使用率', used: (cpu.usage || 0).toFixed(1), unit: '%', total: String(cpu.total || 100), free: (cpu.available || 0).toFixed(1), percent: Math.round(cpu.usage || 0), progressColor: '#409EFF', warning: (cpu.usage || 0) > 80 },
      { label: '内存使用', used: String(mem.used || '--'), unit: '', total: String(mem.total || '--'), free: String(mem.available || '--'), percent: memTotal > 0 ? Math.round(memUsed / memTotal * 100) : 0, progressColor: '#67C23A', warning: memTotal > 0 && memUsed / memTotal > 0.85 },
      { label: '磁盘使用', used: String(disk.used || '--'), unit: '', total: String(disk.total || '--'), free: String(disk.available || '--'), percent: diskTotal > 0 ? Math.round(diskUsed / diskTotal * 100) : 0, progressColor: '#E6A23C', warning: false },
      { label: '带宽占用', used: String(net.used || '--'), unit: '', total: String(net.total || '--'), free: String(net.available || '--'), percent: 0, progressColor: '#F56C6C', warning: false },
    ];
  } catch (e) {
    console.warn('获取系统资源失败', e);
  }
};

// 获取卡片统计数据
const fetchCards = async () => {
  try {
    const response = await dashApi.cards();
    const data = response?.data;
    if (!data) return;
    const bgColorMap = { '用户数': '#ecf5ff', '角色数': '#f0f9eb', '菜单数': '#fdf6ec', '文章数': '#fef0f0', '今日日志': '#f4f4f5', '字典项': '#ecf5ff', '系统配置': '#fdf6ec', '导入记录': '#f0f9eb' };
    const colorMap = { '用户数': '#409EFF', '角色数': '#67C23A', '菜单数': '#E6A23C', '文章数': '#F56C6C', '今日日志': '#909399', '字典项': '#409EFF', '系统配置': '#E6A23C', '导入记录': '#67C23A' };
    const iconKeyMap = { '用户数': User, '角色数': Setting, '菜单数': Menu, '文章数': Document, '今日日志': Clock, '字典项': Collection, '系统配置': Tools, '导入记录': Upload };
    const trendVal = { up: 1, down: -1, flat: 0 };
    const list = Array.isArray(data) ? data : (data.list || []);
    statCards.value = list.map((item) => ({
      title: item.title || '',
      value: String(item.count ?? '--'),
      desc: '较昨日 ' + (item.changePercent != null ? (item.changePercent >= 0 ? '+' : '') + Number(item.changePercent).toFixed(1) + '%' : '无变化'),
      trend: trendVal[item.trend] ?? 0,
      icon: iconKeyMap[item.title] || Document,
      color: colorMap[item.title] || '#909399',
      bgColor: bgColorMap[item.title] || '#f4f4f5',
    }));
  } catch (e) {
    console.warn('获取卡片数据失败', e);
  }
};

onMounted(() => {
  fetchCards();
  fetchRecentLogs();
  fetchDashboardStats();
  fetchSystemResource();
});

// 系统资源
const systemResources = ref([
  { label: 'CPU使用率', used: '--', unit: '%', total: '--', free: '--', percent: 0, progressColor: '#409EFF', warning: false },
  { label: '内存使用', used: '--', unit: 'GB', total: '--', free: '--', percent: 0, progressColor: '#67C23A', warning: false },
  { label: '磁盘使用', used: '--', unit: 'GB', total: '--', free: '--', percent: 0, progressColor: '#E6A23C', warning: false },
  { label: '带宽占用', used: '--', unit: 'Mbps', total: '--', free: '--', percent: 0, progressColor: '#F56C6C', warning: true },
]);

// 状态码颜色映射
function statusColor(code) {
  const map = { '200': '#67C23A', '201': '#409EFF', '204': '#409EFF', '301': '#E6A23C', '302': '#E6A23C', '400': '#F56C6C', '401': '#F56C6C', '403': '#909399', '404': '#909399', '500': '#303133', '502': '#303133' };
  return map[code] || '#909399';
}

function buildHourlyOption(hours, counts) {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%' },
    xAxis: { type: 'category', boundaryGap: false, data: hours },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [{ name: '请求量', type: 'line', smooth: true, data: counts, itemStyle: { color: '#409EFF' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(64,158,255,0.35)' }, { offset: 1, color: 'rgba(64,158,255,0.02)' }] } } }],
  };
}

function buildStatusOption(pieData) {
  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{ name: '状态码', type: 'pie', radius: ['45%', '70%'], center: ['55%', '55%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } }, data: pieData }],
  };
}

function buildMethodOption(methods, barData) {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%' },
    xAxis: { type: 'category', data: methods },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [{ name: '请求数', type: 'bar', data: barData, barWidth: '50%' }],
  };
}

function buildCostOption(counts) {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['请求量', '平均耗时(ms)'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '18%', top: '10%' },
    xAxis: { type: 'category', data: ['<50ms', '50-100ms', '100-200ms', '200-500ms', '>500ms'] },
    yAxis: [{ type: 'value', name: '请求量', splitLine: { lineStyle: { type: 'dashed' } } }, { type: 'value', name: 'ms' }],
    series: [
      { name: '请求量', type: 'bar', yAxisIndex: 0, data: counts.map((v, i) => ({ value: v, itemStyle: { color: ['#409EFF','#67C23A','#E6A23C','#F56C6C','#909399'][i] } })), barWidth: '40%' },
      { name: '平均耗时(ms)', type: 'line', yAxisIndex: 1, smooth: true, data: [28, 72, 142, 310, 680], itemStyle: { color: '#F56C6C' } },
    ],
  };
}

// 图表

// 今日每小时请求量
const hourlyChartOption = ref({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%' },
  xAxis: { type: 'category', boundaryGap: false, data: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'] },
  yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
  series: [{
    name: '请求量', type: 'line', smooth: true,
    data: [45, 32, 28, 56, 320, 480, 520, 610, 580, 390, 210, 120],
    itemStyle: { color: '#409EFF' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(64,158,255,0.35)' },
          { offset: 1, color: 'rgba(64,158,255,0.02)' }
        ]
      }
    },
  }],
});

// 状态码分布
const statusChartOption = ref({
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    name: '状态码', type: 'pie', radius: ['45%', '70%'], center: ['55%', '55%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
    data: [
      { value: 4520, name: '200', itemStyle: { color: '#67C23A' } },
      { value: 380, name: '201', itemStyle: { color: '#409EFF' } },
      { value: 120, name: '301', itemStyle: { color: '#E6A23C' } },
      { value: 45, name: '400', itemStyle: { color: '#F56C6C' } },
      { value: 28, name: '403', itemStyle: { color: '#909399' } },
      { value: 12, name: '500', itemStyle: { color: '#303133' } },
    ],
  }],
});

// 请求方法分布
const methodChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%' },
  xAxis: { type: 'category', data: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
  yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
  series: [{
    name: '请求数', type: 'bar',
    data: [
      { value: 3200, itemStyle: { color: '#409EFF' } },
      { value: 1800, itemStyle: { color: '#67C23A' } },
      { value: 850, itemStyle: { color: '#E6A23C' } },
      { value: 420, itemStyle: { color: '#F56C6C' } },
      { value: 130, itemStyle: { color: '#909399' } },
    ],
    barWidth: '50%',
  }],
});

// 耗时分布
const costChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['请求量', '平均耗时(ms)'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '18%', top: '10%' },
  xAxis: { type: 'category', data: ['<50ms', '50-100ms', '100-200ms', '200-500ms', '>500ms'] },
  yAxis: [
    { type: 'value', name: '请求量', splitLine: { lineStyle: { type: 'dashed' } } },
    { type: 'value', name: 'ms' },
  ],
  series: [
    {
      name: '请求量', type: 'bar', yAxisIndex: 0,
      data: [
        { value: 2400, itemStyle: { color: '#409EFF' } },
        { value: 1560, itemStyle: { color: '#67C23A' } },
        { value: 890, itemStyle: { color: '#E6A23C' } },
        { value: 320, itemStyle: { color: '#F56C6C' } },
        { value: 85, itemStyle: { color: '#909399' } },
      ],
      barWidth: '40%',
    },
    {
      name: '平均耗时(ms)', type: 'line', yAxisIndex: 1, smooth: true,
      data: [28, 72, 142, 310, 680],
      itemStyle: { color: '#F56C6C' },
    },
  ],
});
</script>

<style scoped>
.dashboard-container {
  padding: 32px 16px 0;
  min-height: 100vh;
  background: #f5f6fa;
}

.mt20 { margin-top: 20px; }
.mt16 { margin-top: 16px; }

/* 网站信息 */
.website-info-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.website-info-table {
  margin-top: 8px;
  border-radius: 6px;
  overflow: hidden;
}

/* 统计卡片 */
.stat-card :deep(.el-card__body) {
  padding: 18px 20px;
}

.stat-card-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card-left {
  flex: 1;
}

.stat-card-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 6px;
}

.stat-card-num {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-card-desc {
  font-size: 12px;
  margin-top: 4px;
}

.trend-up { color: #F56C6C; }
.trend-down { color: #67C23A; }
.trend-flat { color: #909399; }

.stat-card-right {
  flex-shrink: 0;
  margin-left: 12px;
}

.stat-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 今日统计概览 */
.today-stat-card :deep(.el-card__body) {
  padding: 16px 18px;
}

.today-stat-inner {
  display: flex;
  flex-direction: column;
}

.today-stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.today-stat-value {
  font-size: 26px;
  font-weight: bold;
}

.today-stat-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 图表通用 */
.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-wrapper {
  flex: 1;
  min-height: 280px;
  height: 280px;
  width: 100%;
}

/* 日志卡片 */
.log-more-link {
  text-decoration: none;
}

/* 系统资源 */
.resource-item {
  padding: 8px 0;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.resource-label {
  font-size: 14px;
  color: #606266;
}

.resource-value {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.resource-warning {
  color: #F56C6C;
}

.resource-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>

<style>
.dash-equal-row .el-card {
  height: 100%;
}

.dash-equal-row .el-card__body {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dash-equal-row .log-card .el-card__body {
  height: auto;
  display: block;
}
</style>
