<template>
  <div>
    <page-content
      :searchFormItems="searchFormItems"
      :tableColumns="tableColumns"
      :exportUrl="exportUrl"
      :url="tableUrl"
      ref="pageContentRef"
    >
      <template #operate="{ row }">
        <el-space wrap> </el-space>
      </template>
    </page-content>

    <my-dialog
      :title="dialogTile"
      :loading="dialogLoading"
      ref="dialogRef"
      show-footer-btn
      @on-save=""
      @on-close="handleCloseDialog"
    >
      <pd-form v-model="formData" :formItems="formItems" ref="formRef">
      </pd-form>
    </my-dialog>
  </div>
</template>

<script>
export default {
  name: "##index##",
}
</script>

<script setup>
import MyDialog from "@/components/MyDialog";
import { useDialog } from "@/hooks/web/useDialog";
import { usePageForm } from "./hooks/usePageForm";
import { usePageContent } from "./hooks/usePageContent";

const {
  searchFormItems,
  tableColumns,
  exportUrl,
  tableUrl,
  refreshTableData,
  pageContentRef,
} = usePageContent();
const { formItems, formData, formRef, validate } = usePageForm();

const {
  elRef: dialogRef,
  dialogTile,
  dialogLoading,
  handleOpenDialog,
  handleCloseDialog,
  changeDialogTitle,
} = useDialog();
</script>

<style lang="scss" scoped></style>
