<template>
  <div class="role-user-dialog-container">
    <el-dialog title="用户列表" v-if="state.isShowDialog" v-model="state.isShowDialog" width="769px">
      <el-table :data="state.userList" border stripe max-height="400">
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column label="用户名" min-width="120">
          <template #default="{ row }">
            {{ row.user?.username || row.username || ('已删除-' + row.userId) }}
          </template>
        </el-table-column>
        <el-table-column label="昵称" min-width="120">
          <template #default="{ row }">
            {{ row.user?.nickname || row.nickname || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="绑定时间" min-width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="systemRoleUserDialog">
import {reactive} from 'vue';

const state = reactive({
  isShowDialog: false,
  userList: [],
});

const openDialog = (userRoles) => {
  state.userList = Array.isArray(userRoles) ? userRoles : [];
  state.isShowDialog = true;
};

defineExpose({openDialog});
</script>
