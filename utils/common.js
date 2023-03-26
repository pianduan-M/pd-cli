export const firstToLowerCase = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toLowerCase() + str.slice(1);
};
