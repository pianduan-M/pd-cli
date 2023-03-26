export const usePageForm = () => {
  const formData = ref({})
  const formRef = ref()

  const formItems = [
    {
      component: "input",
      label: "name",
      prop: "name",
      rules: [
        {
          required: true,
          message: "请输入名称",
          trigger: "blur",
        },
      ],
    },
   
  ]

  const validate = () => {
    return formRef.value.validate()
  }

  return {
    formItems,
    formData,
    formRef,
    validate,
  }
}
