export const usePageForm = () => {
	const formData = ref({});
	const formRef = ref();
	const colLayout = {span: 12,};
	const inputStyle= { width: '240px',};
	const formItems = [
	{label: '', component: 'input',prop: '', inputAttrs: {style: inputStyle,},rules: [{required: true,message: '',}]}]
	const validate = () => formRef.value?.validate();
	const validateField = (props) => formRef.value?.validateField(props);
	const scrollToField = (props) => formRef.value?.scrollToField(props);
	const resetFields = (props) => formRef.value?.resetFields(props);
	const clearValidate = (props) => formRef.value?.clearValidate(props);
	return {formData,formRef,colLayout,formItems,validate}
}
