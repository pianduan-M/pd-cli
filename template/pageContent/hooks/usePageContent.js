export const usePageContent = () => {
  const pageContentRef = ref();

  const searchFormItems = [
    {
      component: "select",
      label: "name",
      prop: "name",
    },
  ];

  const tableColumns = [
    {
      type: "selection",
    },
    {
      label: "name",
      prop: "name",
    },

    {
      label: "操作",
      slot: "operate",
    },
  ];

  const exportUrl = "";

  const tableUrl = {
    list: "",
  };

  const refreshTableData = () => {
    const handler = pageContentRef.value.onSearch;
    handler && handler();
  };

  return {
    searchFormItems,
    tableColumns,
    exportUrl,
    tableUrl,
    refreshTableData,
    pageContentRef,
  };
};
