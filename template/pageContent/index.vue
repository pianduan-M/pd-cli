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
		:title='dialogTitle'
		:show='dialogVisible'
		:showFooter='false'
		@close='handleCloseDialog'
		>
			<pd-form v-model='formData' :formItems='formItems' :colLayout='colLayout' ref='formRef'>  </pd-form>
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

const { formData, formItems, colLayout, formRef } = usePageForm();
</script>

<style lang="scss" scoped></style>
