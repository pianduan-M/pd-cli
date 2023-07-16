export const usePageContent = () => {
	const pageContentRef = ref();
	const searchFormItems = [{label: '',component: '',prop: '',}]
	const tableColumns = [{label:'',prop:'',}]
	const exportUrl = '';
	const tableUrl={list:''}
	const refreshTableData = () => {const handler = pageContentRef.value.onSearch;handler && handler();};
	const handleExportTable = async () => {
	const list = pageContentRef.value?.getTableSelectionList() || [];
	//if (!list.length) {
	//try {
	//await confirm('您当前没有勾选警报列表，将全部导出，是否继续');
	// } catch (error){
	//     return;
	//   }
	// }
	const onExportClick = pageContentRef.value?.onExportClick;
	if (!onExportClick) return;
	const params = {};
	if (list.length) {
	params.ids = list.map((item) => item.id).join(',');
	}
	onExportClick(params);
	};
	return {searchFormItems,tableColumns,exportUrl,tableUrl,refreshTableData,pageContentRef,};
}
