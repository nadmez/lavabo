export async function adminFetch(path, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const hasObjectBody =
    options.body && typeof options.body === "object" && !isFormData;
  const response = await fetch(path, {
    method: options.method || (hasObjectBody ? "POST" : "GET"),
    credentials: "include",
    headers: {
      ...(hasObjectBody ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    body: hasObjectBody ? JSON.stringify(options.body) : options.body,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (!response.ok) {
    const error = new Error(data?.error || "İstek başarısız.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function invalidateStorefrontCatalog(queryClient) {
  await queryClient.invalidateQueries({ queryKey: ["admin-catalog"] });
  await queryClient.invalidateQueries({ queryKey: ["catalog"] });
  await queryClient.invalidateQueries({ queryKey: ["products"] });
}
