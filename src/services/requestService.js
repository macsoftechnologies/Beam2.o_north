import api from "./api";

// Create a new permit request (multipart/form-data)
export const createRequest = async (formData) => {
  const res = await api.post("/requests", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Update an existing permit request (multipart/form-data)
export const updateRequest = async (id, formData) => {
  const res = await api.put(`/requests/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Search/retrieve filtered requests
export const searchRequests = async (payload) => {
  const res = await api.post("/requests/search", payload);
  return res.data;
};

// Delete a permit request (soft-delete)
export const deleteRequest = async (id) => {
  const res = await api.delete(`/requests/${id}`);
  return res.data;
};

// Delete selected permit requests in bulk
export const deleteSelectedRequests = async (payload) => {
  const res = await api.delete("/requests", { data: payload });
  return res.data;
};

// Update the status of requests in bulk
export const updateListStatusRequest = async (payload) => {
  const res = await api.put("/requests/status/change", payload);
  return res.data;
};

// Update safety precautions in bulk
export const updateListReqstSafety = async (payload) => {
  const res = await api.put("/requests/safety/change", payload);
  return res.data;
};

// Update working times/shifts in bulk
export const updateListReqstTime = async (payload) => {
  const res = await api.put("/requests/status/change", payload);
  return res.data;
};

// Upload RAMS file attachments (multipart/form-data)
export const addRamsFiles = async (formData) => {
  const res = await api.post("/requests/files", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Delete a RAMS file attachment
export const deleteRamsFile = async (fileId) => {
  const res = await api.delete(`/requests/files/${fileId}`);
  return res.data;
};

// Get requests logs history for a permit
export const getRequestsLogs = async (id) => {
  const res = await api.get(`/requests/logs/user/${id}`);
  return res.data;
};

// Add note to requests
export const addListReqstNote = async (payload) => {
  const res = await api.post("/requests/notes", payload);
  return res.data;
};

// Get request counts (dashboard / list helper)
export const getRequestCounts = async () => {
  const res = await api.get("/requests/counts");
  return res.data;
};

// Copy permit requests for consecutive dates
export const createByCount = async (payload) => {
  const res = await api.post("/requests/createbycount", payload);
  return res.data;
};
