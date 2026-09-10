import api from "../../api";

const get = async (path, params) => {
  const { data } = await api.get(`/azure/overview/${path}`, { params });
  return data;
};

export const getFilterOptions = () => get("filter-options");
export const getKpis = (params) => get("kpis", params);
export const getTrend = (params) => get("trend", params);
export const getApplications = (params) => get("applications", params);
export const getServices = (params) => get("services", params);
export const getResourceGroups = (params) => get("resource-groups", params);
export const getTags = (params) => get("tags", params);
export const getResources = (params) => get("resources", params);
export const getDaily = (params) => get("daily", params);
